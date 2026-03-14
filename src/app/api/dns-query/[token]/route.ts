import { supabase } from "@/lib/supabase";

/**
 * DoH endpoint — RFC 8484
 *
 * The device token (= device UUID) is embedded in the URL path so Apple's
 * DoH client sends it unchanged with every DNS request:
 *
 *   GET  /api/dns-query/<token>?dns=<base64url-encoded-dns-message>
 *   POST /api/dns-query/<token>    body: raw DNS wire format
 *
 * Every DNS query is logged to the dns_logs Supabase table (fire-and-forget).
 * Blocking is enforced via internet_enabled and schedule_start/end on the device.
 */

const UPSTREAM_DOH = "https://cloudflare-dns.com/dns-query";

// ── DNS wire-format helpers ───────────────────────────────────────────────────

function parseDNSQuestion(data: Uint8Array): string | null {
  if (data.length < 13) return null;

  let offset = 12; // skip 12-byte DNS header
  const labels: string[] = [];

  while (offset < data.length) {
    const len = data[offset];
    if (len === 0) break;
    if ((len & 0xc0) === 0xc0) break; // pointer compression — skip

    offset++;
    if (offset + len > data.length) return null;

    labels.push(String.fromCharCode(...data.slice(offset, offset + len)));
    offset += len;
  }

  if (labels.length === 0) return null;

  const domain = labels.join(".");

  // Filter mDNS / reverse-lookup / internal noise
  if (
    domain.endsWith(".local") ||
    domain.endsWith(".arpa") ||
    domain.includes("_dns")
  ) {
    return null;
  }

  return domain;
}

/**
 * Build a valid NXDOMAIN response for the original DNS question.
 * Copies the transaction ID and question section from the request.
 */
function buildNXDOMAIN(question: Uint8Array): Uint8Array {
  // Find end of question section (12-byte header + name labels + QTYPE + QCLASS)
  let qEnd = 12;
  while (qEnd < question.length) {
    const len = question[qEnd];
    if (len === 0) {
      qEnd += 1 + 4; // null byte + QTYPE (2) + QCLASS (2)
      break;
    }
    if ((len & 0xc0) === 0xc0) {
      qEnd += 2 + 4; // pointer (2) + QTYPE (2) + QCLASS (2)
      break;
    }
    qEnd += 1 + len;
  }

  const questionSection = question.slice(
    12,
    Math.min(qEnd, question.length)
  );

  const response = new Uint8Array(12 + questionSection.length);

  // Transaction ID (copy from request)
  response[0] = question[0];
  response[1] = question[1];

  // Flags: QR=1 (response), OPCODE=0, AA=0, TC=0, RD=1; RA=1, RCODE=3 (NXDOMAIN)
  response[2] = 0x81;
  response[3] = 0x83;

  // Counts
  response[4] = 0x00;
  response[5] = 0x01; // QDCOUNT = 1
  response[6] = 0x00;
  response[7] = 0x00; // ANCOUNT = 0
  response[8] = 0x00;
  response[9] = 0x00; // NSCOUNT = 0
  response[10] = 0x00;
  response[11] = 0x00; // ARCOUNT = 0

  response.set(questionSection, 12);
  return response;
}

// ── Schedule check ────────────────────────────────────────────────────────────

/**
 * Returns true if the current time is within the allowed schedule.
 * If no schedule is set (null/empty), access is always permitted.
 */
function isWithinSchedule(
  schedStart: string | null,
  schedEnd: string | null
): boolean {
  if (!schedStart || !schedEnd) return true; // "All Day"

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = schedStart.split(":").map(Number);
  const [endH, endM] = schedEnd.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle schedules that don't cross midnight
  if (startMinutes <= endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  }

  // Schedule crosses midnight (e.g. 22:00–07:00)
  return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
}

// ── Device status lookup ──────────────────────────────────────────────────────

interface DeviceStatus {
  internet_enabled: boolean;
  schedule_start: string | null;
  schedule_end: string | null;
}

/** Returns null if device is not found or the query fails. */
async function getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
  const { data, error } = await supabase
    .from("devices")
    .select("internet_enabled, schedule_start, schedule_end")
    .eq("id", deviceId)
    .single();

  if (error || !data) return null;
  return data as DeviceStatus;
}

// ── Logging (fire-and-forget) ─────────────────────────────────────────────────

async function logQuery(deviceId: string, domain: string, blocked: boolean) {
  await supabase
    .from("dns_logs")
    .insert({
      device_id: deviceId,
      domain,
      blocked,
      timestamp: new Date().toISOString(),
    });
}

async function updateLastConnected(deviceId: string) {
  await supabase
    .from("devices")
    .update({ last_connected: new Date().toISOString() })
    .eq("id", deviceId);
}

// ── Shared processing ─────────────────────────────────────────────────────────

async function processQuery(
  token: string,
  dnsBytes: Uint8Array
): Promise<{ blocked: boolean; responseBytes: ArrayBuffer }> {
  const domain = parseDNSQuestion(dnsBytes);

  // Look up device status to enforce blocking / schedules
  const status = await getDeviceStatus(token);

  let shouldBlock = false;
  if (status) {
    if (!status.internet_enabled) {
      shouldBlock = true;
    } else if (!isWithinSchedule(status.schedule_start, status.schedule_end)) {
      shouldBlock = true;
    }
  }

  // Log and update device (awaited — fire-and-forget is unreliable in serverless)
  if (domain) {
    await Promise.all([
      logQuery(token, domain, shouldBlock),
      updateLastConnected(token),
    ]);
  }

  if (shouldBlock) {
    const nxdomain = buildNXDOMAIN(dnsBytes);
    return { blocked: true, responseBytes: nxdomain.buffer.slice(0) as ArrayBuffer };
  }

  // Forward to Cloudflare
  const upstream = await fetch(UPSTREAM_DOH, {
    method: "POST",
    headers: {
      "Content-Type": "application/dns-message",
      Accept: "application/dns-message",
    },
    body: dnsBytes.buffer.slice(0) as ArrayBuffer,
  });
  const buf = await upstream.arrayBuffer();
  return { blocked: false, responseBytes: buf };
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const dnsParam = searchParams.get("dns");

  if (!dnsParam) {
    return new Response("Missing dns parameter", { status: 400 });
  }

  const dnsBytes = new Uint8Array(Buffer.from(dnsParam, "base64url"));

  try {
    const { responseBytes } = await processQuery(token, dnsBytes);
    return new Response(responseBytes, {
      headers: {
        "Content-Type": "application/dns-message",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.arrayBuffer();
  const dnsBytes = new Uint8Array(body);

  try {
    const { responseBytes } = await processQuery(token, dnsBytes);
    return new Response(responseBytes, {
      headers: {
        "Content-Type": "application/dns-message",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

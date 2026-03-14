import { after } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * DoH endpoint — RFC 8484
 *
 * GET  /api/dns-query/<token>?dns=<base64url-encoded-dns-message>
 * POST /api/dns-query/<token>    body: raw DNS wire format
 *
 * Critical path: parse → check device status → forward to Cloudflare → respond.
 * Logging and last_connected update run AFTER the response is sent via
 * next/server `after()` so they never add latency to the DNS reply.
 */

const UPSTREAM_DOH = "https://cloudflare-dns.com/dns-query";

// ── DNS wire-format parser ────────────────────────────────────────────────────

function parseDNSQuestion(data: Uint8Array): string | null {
  if (data.length < 13) return null;

  let offset = 12;
  const labels: string[] = [];

  while (offset < data.length) {
    const len = data[offset];
    if (len === 0) break;
    if ((len & 0xc0) === 0xc0) break;
    offset++;
    if (offset + len > data.length) return null;
    labels.push(String.fromCharCode(...data.slice(offset, offset + len)));
    offset += len;
  }

  if (labels.length === 0) return null;

  const domain = labels.join(".");
  if (
    domain.endsWith(".local") ||
    domain.endsWith(".arpa") ||
    domain.includes("_dns")
  ) {
    return null;
  }

  return domain;
}

// ── NXDOMAIN response ─────────────────────────────────────────────────────────

function buildNXDOMAIN(question: Uint8Array): Uint8Array {
  let qEnd = 12;
  while (qEnd < question.length) {
    const len = question[qEnd];
    if (len === 0) { qEnd += 1 + 4; break; }
    if ((len & 0xc0) === 0xc0) { qEnd += 2 + 4; break; }
    qEnd += 1 + len;
  }
  const questionSection = question.slice(12, Math.min(qEnd, question.length));
  const response = new Uint8Array(12 + questionSection.length);
  response[0] = question[0]; response[1] = question[1];
  response[2] = 0x81; response[3] = 0x83;
  response[4] = 0x00; response[5] = 0x01;
  response[6] = 0x00; response[7] = 0x00;
  response[8] = 0x00; response[9] = 0x00;
  response[10] = 0x00; response[11] = 0x00;
  response.set(questionSection, 12);
  return response;
}

// ── Schedule check ────────────────────────────────────────────────────────────

function isWithinSchedule(
  schedStart: string | null,
  schedEnd: string | null
): boolean {
  if (!schedStart || !schedEnd) return true;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = schedStart.split(":").map(Number);
  const [eh, em] = schedEnd.split(":").map(Number);
  const startM = sh * 60 + sm;
  const endM = eh * 60 + em;
  if (startM <= endM) return nowM >= startM && nowM <= endM;
  return nowM >= startM || nowM <= endM;
}

// ── Device status ─────────────────────────────────────────────────────────────

interface DeviceStatus {
  internet_enabled: boolean;
  schedule_start: string | null;
  schedule_end: string | null;
}

async function getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
  const { data, error } = await supabase
    .from("devices")
    .select("internet_enabled, schedule_start, schedule_end")
    .eq("id", deviceId)
    .single();
  if (error || !data) return null;
  return data as DeviceStatus;
}

// ── Core handler ──────────────────────────────────────────────────────────────

async function handleDNS(token: string, dnsBytes: Uint8Array): Promise<Response> {
  const domain = parseDNSQuestion(dnsBytes);

  // Check device status (needed to decide block/allow before responding)
  const status = await getDeviceStatus(token);

  let shouldBlock = false;
  if (status) {
    if (!status.internet_enabled) {
      shouldBlock = true;
    } else if (!isWithinSchedule(status.schedule_start, status.schedule_end)) {
      shouldBlock = true;
    }
  }

  // Build the DNS response
  let responseBytes: ArrayBuffer;
  if (shouldBlock) {
    responseBytes = buildNXDOMAIN(dnsBytes).buffer.slice(0) as ArrayBuffer;
  } else {
    const upstream = await fetch(UPSTREAM_DOH, {
      method: "POST",
      headers: {
        "Content-Type": "application/dns-message",
        Accept: "application/dns-message",
      },
      body: dnsBytes.buffer.slice(0) as ArrayBuffer,
    });
    responseBytes = await upstream.arrayBuffer();
  }

  // Log and update last_connected AFTER the response — never blocks DNS latency
  if (domain) {
    after(async () => {
      await Promise.all([
        supabase.from("dns_logs").insert({
          device_id: token,
          domain,
          blocked: shouldBlock,
          timestamp: new Date().toISOString(),
        }),
        supabase
          .from("devices")
          .update({ last_connected: new Date().toISOString() })
          .eq("id", token),
      ]);
    });
  }

  return new Response(responseBytes, {
    headers: {
      "Content-Type": "application/dns-message",
      "Cache-Control": "no-store",
    },
  });
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const dnsParam = new URL(request.url).searchParams.get("dns");
  if (!dnsParam) return new Response("Missing dns parameter", { status: 400 });

  try {
    const dnsBytes = new Uint8Array(Buffer.from(dnsParam, "base64url"));
    return await handleDNS(token, dnsBytes);
  } catch {
    return new Response(null, { status: 502 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const dnsBytes = new Uint8Array(await request.arrayBuffer());
    return await handleDNS(token, dnsBytes);
  } catch {
    return new Response(null, { status: 502 });
  }
}

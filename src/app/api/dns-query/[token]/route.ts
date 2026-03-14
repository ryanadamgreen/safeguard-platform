import { after } from "next/server";
import { supabaseEdge as supabase } from "@/lib/supabase-edge";

/**
 * DoH endpoint — RFC 8484
 * Runs on Edge Runtime to eliminate cold starts (~0ms vs 2-5s for Node.js).
 * Cold starts caused iOS to time out on the DoH validation probe, showing
 * "Unknown" status and falling back to the ServerAddresses DNS (1.1.1.1).
 *
 * GET  /api/dns-query/<token>?dns=<base64url-encoded-dns-message>
 * POST /api/dns-query/<token>    body: raw DNS wire format
 */

export const runtime = "edge";

const UPSTREAM_DOH = "https://cloudflare-dns.com/dns-query";

// ── Base64url decode (no Buffer — Edge compatible) ────────────────────────────

function base64urlDecode(str: string): Uint8Array {
  const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

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
  response.set(questionSection, 12);
  return response;
}

// ── Schedule check ────────────────────────────────────────────────────────────

function isWithinSchedule(schedStart: string | null, schedEnd: string | null): boolean {
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

  const status = await getDeviceStatus(token);

  let shouldBlock = false;
  if (status) {
    if (!status.internet_enabled) {
      shouldBlock = true;
    } else if (!isWithinSchedule(status.schedule_start, status.schedule_end)) {
      shouldBlock = true;
    }
  }

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

  // Log after response — never adds latency to DNS replies
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
    return await handleDNS(token, base64urlDecode(dnsParam));
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

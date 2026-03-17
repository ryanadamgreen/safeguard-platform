import { supabaseEdge as supabase } from "@/lib/supabase-edge";
import { detectApp } from "@/lib/app-domains";

/**
 * DoH endpoint — RFC 8484
 * Runs on Edge Runtime to eliminate cold starts (~0ms vs 2-5s for Node.js).
 *
 * GET  /api/dns-query/<token>?dns=<base64url-encoded-dns-message>
 * POST /api/dns-query/<token>    body: raw DNS wire format
 *
 * Features:
 * - Device-level internet on/off and schedule enforcement
 * - Safe Search enforcement (Google, Bing, YouTube, DuckDuckGo)
 * - Background logging via waitUntil (never delays DNS response)
 */

export const runtime = "edge";

const UPSTREAM_DOH = "https://cloudflare-dns.com/dns-query";

// ── Safe Search: domain → IPv4 redirect ──────────────────────────────────────
// Google's forcesafesearch.google.com resolves to a stable VIP.
// YouTube restricted mode uses the same VIP.
// For Bing and DuckDuckGo we resolve their safe variants via upstream.

const SAFE_SEARCH_IPS: Record<string, [number, number, number, number]> = {
  // Google Safe Search (forcesafesearch.google.com)
  "google.com":     [216, 239, 38, 120],
  "www.google.com": [216, 239, 38, 120],
  "google.co.uk":   [216, 239, 38, 120],
  "www.google.co.uk": [216, 239, 38, 120],
  "google.com.au":  [216, 239, 38, 120],
  "google.ca":      [216, 239, 38, 120],
  "google.de":      [216, 239, 38, 120],
  "google.fr":      [216, 239, 38, 120],
  "google.co.in":   [216, 239, 38, 120],
  "google.co.jp":   [216, 239, 38, 120],
  // YouTube Restricted Mode (restrict.youtube.com)
  "youtube.com":     [216, 239, 38, 120],
  "www.youtube.com": [216, 239, 38, 120],
  "m.youtube.com":   [216, 239, 38, 120],
  "youtu.be":        [216, 239, 38, 120],
};

// For Bing/DDG we redirect the DNS query to the safe hostname via upstream
const SAFE_SEARCH_CNAME: Record<string, string> = {
  "bing.com":          "strict.bing.com",
  "www.bing.com":      "strict.bing.com",
  "duckduckgo.com":    "safe.duckduckgo.com",
  "www.duckduckgo.com": "safe.duckduckgo.com",
};

function getSafeSearchMatch(domain: string): string | null {
  const lower = domain.toLowerCase();
  if (SAFE_SEARCH_IPS[lower] || SAFE_SEARCH_CNAME[lower]) return lower;
  // Check if it's a Google country domain (google.co.*, google.com.*)
  if (/^(www\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(lower)) return lower;
  return null;
}

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

function parseDNSQuestion(data: Uint8Array): { domain: string | null; qtype: number } {
  if (data.length < 13) return { domain: null, qtype: 0 };

  let offset = 12;
  const labels: string[] = [];

  while (offset < data.length) {
    const len = data[offset];
    if (len === 0) { offset++; break; }
    if ((len & 0xc0) === 0xc0) { offset += 2; break; }
    offset++;
    if (offset + len > data.length) return { domain: null, qtype: 0 };
    labels.push(String.fromCharCode(...data.slice(offset, offset + len)));
    offset += len;
  }

  if (labels.length === 0) return { domain: null, qtype: 0 };

  const qtype = offset + 1 < data.length ? (data[offset] << 8) | data[offset + 1] : 0;
  const domain = labels.join(".");

  if (
    domain.endsWith(".local") ||
    domain.endsWith(".arpa") ||
    domain.includes("_dns")
  ) {
    return { domain: null, qtype };
  }

  return { domain, qtype };
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

// ── A record response (for Safe Search IP redirect) ───────────────────────────

function buildAResponse(question: Uint8Array, ip: [number, number, number, number]): Uint8Array {
  // Find the end of the question section
  let qEnd = 12;
  while (qEnd < question.length) {
    const len = question[qEnd];
    if (len === 0) { qEnd += 1 + 4; break; } // null label + QTYPE(2) + QCLASS(2)
    if ((len & 0xc0) === 0xc0) { qEnd += 2 + 4; break; }
    qEnd += 1 + len;
  }
  const questionSection = question.slice(12, Math.min(qEnd, question.length));

  // Response: header(12) + question + answer(16)
  // Answer: name pointer(2) + type A(2) + class IN(2) + TTL(4) + rdlength(2) + IP(4)
  const response = new Uint8Array(12 + questionSection.length + 16);

  // Header
  response[0] = question[0]; response[1] = question[1]; // Transaction ID
  response[2] = 0x81; response[3] = 0x80; // Flags: response, recursion desired+available, no error
  response[4] = 0x00; response[5] = 0x01; // QDCOUNT: 1
  response[6] = 0x00; response[7] = 0x01; // ANCOUNT: 1

  // Question section (copy from query)
  response.set(questionSection, 12);

  // Answer section
  const answerOffset = 12 + questionSection.length;
  response[answerOffset]     = 0xC0; // Name pointer
  response[answerOffset + 1] = 0x0C; // → offset 12 (start of question name)
  response[answerOffset + 2] = 0x00; response[answerOffset + 3] = 0x01; // Type A
  response[answerOffset + 4] = 0x00; response[answerOffset + 5] = 0x01; // Class IN
  response[answerOffset + 6] = 0x00; response[answerOffset + 7] = 0x00;
  response[answerOffset + 8] = 0x01; response[answerOffset + 9] = 0x2C; // TTL: 300s
  response[answerOffset + 10] = 0x00; response[answerOffset + 11] = 0x04; // RDLENGTH: 4
  response[answerOffset + 12] = ip[0];
  response[answerOffset + 13] = ip[1];
  response[answerOffset + 14] = ip[2];
  response[answerOffset + 15] = ip[3];

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

// ── Device status (with timeout so it never hangs DNS) ────────────────────────

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

async function handleDNS(
  token: string,
  dnsBytes: Uint8Array,
  ctx: { waitUntil: (p: Promise<unknown>) => void }
): Promise<Response> {
  const { domain, qtype } = parseDNSQuestion(dnsBytes);

  // Look up device status — race against a 1.5s timeout so we never stall DNS
  let shouldBlock = false;
  try {
    const status = await Promise.race<DeviceStatus | null>([
      getDeviceStatus(token),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
    if (status) {
      if (!status.internet_enabled) {
        shouldBlock = true;
      } else if (!isWithinSchedule(status.schedule_start, status.schedule_end)) {
        shouldBlock = true;
      }
    }
  } catch {
    // Fail open — allow traffic if status lookup errors
  }

  let responseBytes: ArrayBuffer;
  let safeSearchEnforced = false;

  if (shouldBlock) {
    responseBytes = buildNXDOMAIN(dnsBytes).buffer.slice(0) as ArrayBuffer;
  } else if (domain && qtype === 1 /* A record */) {
    // ── Safe Search enforcement ──
    const safeMatch = getSafeSearchMatch(domain);

    if (safeMatch && SAFE_SEARCH_IPS[safeMatch]) {
      // Direct IP redirect (Google, YouTube)
      const safeResponse = buildAResponse(dnsBytes, SAFE_SEARCH_IPS[safeMatch]);
      responseBytes = safeResponse.buffer.slice(safeResponse.byteOffset, safeResponse.byteOffset + safeResponse.byteLength) as ArrayBuffer;
      safeSearchEnforced = true;
    } else if (safeMatch && SAFE_SEARCH_CNAME[safeMatch]) {
      // Resolve the safe variant via Cloudflare (Bing, DuckDuckGo)
      // Build a DNS query for the safe hostname and forward that instead
      const safeHost = SAFE_SEARCH_CNAME[safeMatch];
      const safeQuery = buildDNSQuery(dnsBytes, safeHost);
      const upstream = await fetch(UPSTREAM_DOH, {
        method: "POST",
        headers: { "Content-Type": "application/dns-message", Accept: "application/dns-message" },
        body: safeQuery.buffer.slice(safeQuery.byteOffset, safeQuery.byteOffset + safeQuery.byteLength) as ArrayBuffer,
      });
      responseBytes = await upstream.arrayBuffer();
      safeSearchEnforced = true;
    } else if (/^(www\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(domain.toLowerCase())) {
      // Catch-all for other Google country domains
      const safeResponse = buildAResponse(dnsBytes, [216, 239, 38, 120]);
      responseBytes = safeResponse.buffer.slice(safeResponse.byteOffset, safeResponse.byteOffset + safeResponse.byteLength) as ArrayBuffer;
      safeSearchEnforced = true;
    } else {
      // Normal forward to Cloudflare
      const upstream = await fetch(UPSTREAM_DOH, {
        method: "POST",
        headers: { "Content-Type": "application/dns-message", Accept: "application/dns-message" },
        body: dnsBytes.buffer.slice(dnsBytes.byteOffset, dnsBytes.byteOffset + dnsBytes.byteLength) as ArrayBuffer,
      });
      responseBytes = await upstream.arrayBuffer();
    }
  } else {
    // Non-A queries (AAAA, HTTPS, etc.) or no domain — forward as-is
    const upstream = await fetch(UPSTREAM_DOH, {
      method: "POST",
      headers: { "Content-Type": "application/dns-message", Accept: "application/dns-message" },
      body: dnsBytes.buffer.slice(dnsBytes.byteOffset, dnsBytes.byteOffset + dnsBytes.byteLength) as ArrayBuffer,
    });
    responseBytes = await upstream.arrayBuffer();
  }

  // Log via waitUntil — runs after response is sent, never delays DNS
  if (domain) {
    const appName = detectApp(domain);
    ctx.waitUntil(
      Promise.all([
        supabase.from("dns_logs").insert({
          device_id: token,
          domain,
          blocked: shouldBlock,
          app_name: appName,
          timestamp: new Date().toISOString(),
        }),
        supabase
          .from("devices")
          .update({ last_connected: new Date().toISOString() })
          .eq("id", token),
      ]).catch(() => {})
    );
  }

  return new Response(responseBytes, {
    headers: {
      "Content-Type": "application/dns-message",
      "Cache-Control": "no-store",
    },
  });
}

// ── Build a DNS query for a different hostname (same txid/flags) ─────────────

function buildDNSQuery(originalQuery: Uint8Array, hostname: string): Uint8Array {
  const labels = hostname.split(".");
  let nameLen = 1; // trailing null byte
  for (const label of labels) nameLen += 1 + label.length;

  // Header(12) + name + QTYPE(2) + QCLASS(2)
  const query = new Uint8Array(12 + nameLen + 4);

  // Copy header from original (preserves transaction ID and flags)
  query.set(originalQuery.slice(0, 12));

  // Encode hostname into DNS name format
  let offset = 12;
  for (const label of labels) {
    query[offset++] = label.length;
    for (let i = 0; i < label.length; i++) {
      query[offset++] = label.charCodeAt(i);
    }
  }
  query[offset++] = 0; // null terminator

  // QTYPE = A (1), QCLASS = IN (1)
  query[offset++] = 0x00; query[offset++] = 0x01;
  query[offset++] = 0x00; query[offset++] = 0x01;

  return query;
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const dnsParam = new URL(request.url).searchParams.get("dns");
  if (!dnsParam) return new Response("Missing dns parameter", { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = { waitUntil: ((globalThis as any)[Symbol.for("waitUntil")]?.bind(globalThis) ?? (() => {})) as (p: Promise<unknown>) => void };

  try {
    return await handleDNS(token, base64urlDecode(dnsParam), ctx);
  } catch {
    return new Response(null, { status: 502 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = { waitUntil: ((globalThis as any)[Symbol.for("waitUntil")]?.bind(globalThis) ?? (() => {})) as (p: Promise<unknown>) => void };

  try {
    const dnsBytes = new Uint8Array(await request.arrayBuffer());
    return await handleDNS(token, dnsBytes, ctx);
  } catch {
    return new Response(null, { status: 502 });
  }
}

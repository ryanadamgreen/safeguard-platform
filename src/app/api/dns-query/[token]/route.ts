import { dnsMonitorStore } from "@/lib/dns-monitor-store";

/**
 * DoH endpoint — RFC 8484
 *
 * The device token (= device UUID) is embedded in the URL path so Apple's
 * DoH client sends it unchanged with every request:
 *
 *   GET  /api/dns-query/<token>?dns=<base64url-encoded-dns-message>
 *   POST /api/dns-query/<token>    body: raw DNS wire format
 *
 * The mobileconfig profile sets:
 *   ServerURL = https://<host>/api/dns-query/<deviceId>
 *
 * Filtering logic (block rules, time schedules) will be added here later.
 * For now, all queries are forwarded to Cloudflare and logged.
 */

const UPSTREAM_DOH = "https://cloudflare-dns.com/dns-query";

// ── DNS wire-format parser ────────────────────────────────────────────────────

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

  const dnsBytes = Buffer.from(dnsParam, "base64url");
  const domain = parseDNSQuestion(new Uint8Array(dnsBytes));

  if (domain) {
    dnsMonitorStore.addEntry({
      device_id: token,
      domain,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const upstream = await fetch(
      `${UPSTREAM_DOH}?dns=${encodeURIComponent(dnsParam)}`,
      { headers: { Accept: "application/dns-message" } }
    );
    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
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

  const domain = parseDNSQuestion(dnsBytes);

  if (domain) {
    dnsMonitorStore.addEntry({
      device_id: token,
      domain,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const upstream = await fetch(UPSTREAM_DOH, {
      method: "POST",
      headers: {
        "Content-Type": "application/dns-message",
        Accept: "application/dns-message",
      },
      body: dnsBytes,
    });
    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": "application/dns-message",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

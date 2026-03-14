import { NextResponse } from "next/server";
import { dnsMonitorStore } from "@/lib/dns-monitor-store";

/**
 * GET /api/dns-resolve?name=example.com&device_id=xxx
 *
 * DNS-over-HTTPS (DoH) proxy endpoint.
 * The iOS app configures the device to use this as its DNS resolver.
 *
 * 1. Logs the query (domain, device_id, timestamp)
 * 2. Forwards to Cloudflare DNS (1.1.1.1) for actual resolution
 * 3. Returns the DNS response to the device
 *
 * Supports application/dns-json format (RFC 8484 JSON style).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const type = searchParams.get("type") ?? "A";
  const deviceId = searchParams.get("device_id") ?? "unknown";

  if (!name) {
    return NextResponse.json({ error: "Missing 'name' parameter" }, { status: 400 });
  }

  // Log the query
  dnsMonitorStore.addEntry({
    device_id: deviceId,
    domain: name,
    timestamp: new Date().toISOString(),
  });

  // Forward to Cloudflare DNS-over-HTTPS
  try {
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
    const dohResponse = await fetch(dohUrl, {
      headers: { Accept: "application/dns-json" },
    });

    const dnsResult = await dohResponse.json();

    return NextResponse.json(dnsResult, {
      headers: {
        "Content-Type": "application/dns-json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { Status: 2, TC: false, RD: true, RA: false, AD: false, CD: false, Question: [{ name, type: 1 }], Answer: [] },
      { status: 200 }
    );
  }
}

/**
 * POST /api/dns-resolve
 *
 * Accepts raw DNS wire format (application/dns-message) per RFC 8484.
 * This is what iOS NEDNSSettingsManager sends for DoH.
 *
 * 1. Forwards the raw DNS query to Cloudflare
 * 2. Parses the question section to log the domain
 * 3. Returns the raw DNS response
 */
export async function POST(request: Request) {
  const body = await request.arrayBuffer();
  const dnsBytes = new Uint8Array(body);

  // Parse domain from DNS wire format for logging
  const domain = parseDNSQuestion(dnsBytes);
  const deviceId = request.headers.get("x-device-id") ?? "unknown";

  if (domain) {
    dnsMonitorStore.addEntry({
      device_id: deviceId,
      domain,
      timestamp: new Date().toISOString(),
    });
  }

  // Forward to Cloudflare DoH
  try {
    const dohResponse = await fetch("https://cloudflare-dns.com/dns-query", {
      method: "POST",
      headers: {
        "Content-Type": "application/dns-message",
        Accept: "application/dns-message",
      },
      body: dnsBytes,
    });

    const responseBuffer = await dohResponse.arrayBuffer();

    return new Response(responseBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/dns-message",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    // Return SERVFAIL if upstream fails
    return new Response(dnsBytes, {
      status: 502,
      headers: { "Content-Type": "application/dns-message" },
    });
  }
}

/**
 * Parse the question domain from DNS wire format.
 * DNS header is 12 bytes, then question section has length-prefixed labels.
 */
function parseDNSQuestion(data: Uint8Array): string | null {
  if (data.length < 13) return null;

  let offset = 12; // Skip DNS header
  const labels: string[] = [];

  while (offset < data.length) {
    const length = data[offset];
    if (length === 0) break;
    if ((length & 0xc0) === 0xc0) break; // Pointer compression

    offset++;
    if (offset + length > data.length) return null;

    const label = String.fromCharCode(...data.slice(offset, offset + length));
    labels.push(label);
    offset += length;
  }

  if (labels.length === 0) return null;

  const domain = labels.join(".");

  // Filter noise
  if (domain.endsWith(".local") || domain.endsWith(".arpa") || domain.includes("_dns")) {
    return null;
  }

  return domain;
}

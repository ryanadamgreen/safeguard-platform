import { NextResponse } from "next/server";
import { simulation } from "@/lib/simulation-engine";

/**
 * GET /api/simulate/nextdns/logs
 *
 * Returns DNS query logs matching NextDNS analytics API format.
 *
 * Query params:
 *   ?status=blocked     — only blocked queries
 *   ?mac=AA:BB:CC:...   — filter by device MAC
 *   ?limit=50           — number of entries (default 50)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const macFilter = searchParams.get("mac");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  let logs = simulation.dnsLogs;

  if (statusFilter) {
    logs = logs.filter((l) => l.status === statusFilter);
  }
  if (macFilter) {
    logs = logs.filter((l) => l.client_mac === macFilter);
  }

  return NextResponse.json({
    data: logs.slice(0, limit),
    meta: {
      total: logs.length,
      returned: Math.min(limit, logs.length),
    },
  });
}

/**
 * POST /api/simulate/nextdns/logs
 *
 * Generate a new DNS event. Use this to test safeguarding detection.
 *
 * Body (all optional):
 *   { mac?: string, category?: string, domain?: string }
 *
 * If no body is sent, generates a random event (30% flagged).
 */
export async function POST(request: Request) {
  let options = {};
  try {
    options = await request.json();
  } catch {
    // empty body is fine — generates random event
  }

  const entry = simulation.generateDnsEvent(options);

  return NextResponse.json({
    message:
      entry.status === "blocked"
        ? `Blocked: ${entry.domain} (${entry.categories.join(", ")})`
        : `Allowed: ${entry.domain}`,
    data: entry,
  });
}

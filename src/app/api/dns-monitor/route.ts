import { NextResponse } from "next/server";
import { dnsMonitorStore } from "@/lib/dns-monitor-store";

/**
 * POST /api/dns-monitor
 *
 * Receives DNS query logs from the iOS SafeGuard app.
 * Body: { device_id: string, domain: string, timestamp: string }
 *   or: { device_id: string, queries: [{ domain, timestamp }] } for batch
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support single entry or batch
    if (body.queries && Array.isArray(body.queries)) {
      for (const q of body.queries) {
        dnsMonitorStore.addEntry({
          device_id: body.device_id ?? "unknown",
          domain: q.domain,
          timestamp: q.timestamp ?? new Date().toISOString(),
        });
      }
      return NextResponse.json({
        message: `Received ${body.queries.length} queries`,
        count: dnsMonitorStore.getCount(),
      });
    }

    // Single entry
    dnsMonitorStore.addEntry({
      device_id: body.device_id ?? "unknown",
      domain: body.domain,
      timestamp: body.timestamp ?? new Date().toISOString(),
    });

    return NextResponse.json({
      message: `Logged: ${body.domain}`,
      count: dnsMonitorStore.getCount(),
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * GET /api/dns-monitor
 *
 * Returns recent DNS query logs for the monitoring dashboard.
 * Query params: ?limit=100
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);

  const entries = dnsMonitorStore.getEntries(limit);

  return NextResponse.json({
    data: entries,
    meta: {
      total: dnsMonitorStore.getCount(),
      returned: entries.length,
    },
  });
}

/**
 * DELETE /api/dns-monitor
 *
 * Clears all stored DNS logs.
 */
export async function DELETE() {
  dnsMonitorStore.clear();
  return NextResponse.json({ message: "Logs cleared" });
}

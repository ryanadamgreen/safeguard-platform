import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/dns-monitor
 * Returns recent DNS query logs enriched with device and child information.
 * Query params: ?limit=200
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "200", 10), 500);

  // Fetch logs and a total count in parallel
  const [logsResult, countResult] = await Promise.all([
    supabase
      .from("dns_logs")
      .select("id, device_id, domain, blocked, app_name, timestamp")
      .order("timestamp", { ascending: false })
      .limit(limit),
    supabase
      .from("dns_logs")
      .select("id", { count: "exact", head: true }),
  ]);

  if (logsResult.error) {
    return NextResponse.json({ error: logsResult.error.message }, { status: 500 });
  }

  const logs = logsResult.data ?? [];
  const total = countResult.count ?? 0;

  // Enrich logs with device name and child initials
  const deviceIds = [...new Set(logs.map((l) => l.device_id))];

  let deviceMap: Record<
    string,
    { name: string; child_initials: string | null }
  > = {};

  if (deviceIds.length > 0) {
    const { data: devices } = await supabase
      .from("devices")
      .select("id, name, children(initials)")
      .in("id", deviceIds);

    if (devices) {
      for (const d of devices) {
        const child = Array.isArray(d.children) ? d.children[0] : d.children;
        deviceMap[d.id] = {
          name: d.name,
          child_initials: child?.initials ?? null,
        };
      }
    }
  }

  const enriched = logs.map((log) => ({
    ...log,
    device_name: deviceMap[log.device_id]?.name ?? null,
    child_initials: deviceMap[log.device_id]?.child_initials ?? null,
  }));

  return NextResponse.json({
    data: enriched,
    meta: { returned: logs.length, total },
  });
}

/**
 * DELETE /api/dns-monitor
 * Clears all DNS logs (authenticated users only via RLS).
 */
export async function DELETE() {
  const { error } = await supabase
    .from("dns_logs")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Logs cleared" });
}

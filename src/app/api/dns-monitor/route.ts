import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/dns-monitor
 * Returns recent DNS query logs from the dns_logs Supabase table.
 * Query params: ?limit=200
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "200", 10), 500);

  const { data, error } = await supabase
    .from("dns_logs")
    .select("id, device_id, domain, blocked, timestamp")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { returned: data?.length ?? 0 },
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
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Logs cleared" });
}

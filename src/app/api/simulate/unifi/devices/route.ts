import { NextResponse } from "next/server";
import { simulation } from "@/lib/simulation-engine";

/**
 * GET /api/simulate/unifi/devices
 *
 * Returns all devices currently on the network, matching the format
 * a real UniFi controller API would return from /api/s/default/stat/sta.
 *
 * Query params:
 *   ?blocked=true   — only blocked devices
 *   ?blocked=false  — only unblocked devices
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const blockedFilter = searchParams.get("blocked");

  let clients = simulation.clients;

  if (blockedFilter === "true") {
    clients = clients.filter((c) => c.blocked);
  } else if (blockedFilter === "false") {
    clients = clients.filter((c) => !c.blocked);
  }

  return NextResponse.json({
    meta: { rc: "ok" },
    data: clients,
  });
}

/**
 * POST /api/simulate/unifi/devices
 *
 * Adds a new unknown device to the simulated network.
 * The device is auto-blocked. Returns the new device.
 */
export async function POST() {
  const device = simulation.addUnknownDevice();

  return NextResponse.json({
    meta: { rc: "ok" },
    message: "Unknown device detected and auto-blocked",
    data: device,
  });
}

import { NextResponse } from "next/server";
import { simulation } from "@/lib/simulation-engine";

/**
 * POST /api/simulate/unifi/block
 *
 * Block or unblock a device by MAC address.
 * Mimics the UniFi controller cmd/stamgr endpoint.
 *
 * Body: { mac: string, blocked: boolean }
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { mac, blocked } = body;

  if (!mac || typeof blocked !== "boolean") {
    return NextResponse.json(
      { error: "Required: { mac: string, blocked: boolean }" },
      { status: 400 }
    );
  }

  const success = simulation.setDeviceBlocked(mac, blocked);

  if (!success) {
    return NextResponse.json(
      { error: `Device with MAC ${mac} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    meta: { rc: "ok" },
    message: `Device ${mac} ${blocked ? "blocked" : "unblocked"}`,
    data: { mac, blocked },
  });
}

import { NextResponse } from "next/server";
import { simulation } from "@/lib/simulation-engine";

/**
 * POST /api/simulate/fingerprint/match
 *
 * Tests the device fingerprint matching algorithm.
 * Simulates what happens when a device reconnects with a randomised MAC.
 *
 * Body: { manufacturer?, hostname?, os_type?, model_prediction?, dhcp_fingerprint? }
 *
 * Returns the match result with confidence score and matched factors.
 */
export async function POST(request: Request) {
  const fingerprint = await request.json();

  const result = simulation.matchFingerprint(fingerprint);

  return NextResponse.json({
    matched: result.matched,
    score: result.score,
    threshold: 60,
    factors: result.factors,
    matched_device: result.matchedDevice
      ? {
          mac: result.matchedDevice.mac,
          hostname: result.matchedDevice.hostname,
          manufacturer: result.matchedDevice.oui,
          model: result.matchedDevice.fingerprint.model_prediction,
        }
      : null,
  });
}

/**
 * PUT /api/simulate/fingerprint/match
 *
 * Simulates a known device reconnecting with a new randomised MAC.
 * The system detects the fingerprint match and updates the MAC automatically.
 *
 * Body: { mac: string }  — the current MAC of the device to randomise
 */
export async function PUT(request: Request) {
  const { mac } = await request.json();

  if (!mac) {
    return NextResponse.json(
      { error: "Required: { mac: string }" },
      { status: 400 }
    );
  }

  const result = simulation.simulateMacRandomisation(mac);

  if (!result) {
    return NextResponse.json(
      { error: `Device with MAC ${mac} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "Device reconnected with new MAC — fingerprint matched",
    old_mac: result.oldMac,
    new_mac: result.newMac,
    matched: result.matched,
    fingerprint: result.fingerprint,
  });
}

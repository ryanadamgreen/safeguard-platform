import { NextResponse } from "next/server";
import { simulation } from "@/lib/simulation-engine";

/**
 * POST /api/simulate/events/generate
 *
 * Master endpoint for generating test scenarios.
 *
 * Body:
 *   { scenario: "unknown_device" }
 *     → A new unknown device appears on the network (auto-blocked)
 *
 *   { scenario: "safeguarding_alert", category: "gambling", mac?: "AA:BB:..." }
 *     → A single safeguarding event for the given category
 *
 *   { scenario: "behaviour_pattern", category: "gambling", mac: "AA:BB:...", count?: 5 }
 *     → Multiple rapid attempts triggering a behaviour pattern alert
 *
 *   { scenario: "mac_change", mac: "AA:BB:..." }
 *     → A known device reconnects with a new randomised MAC
 *
 *   { scenario: "late_night_access", mac: "AA:BB:..." }
 *     → Simulates access attempts outside schedule hours
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { scenario } = body;

  switch (scenario) {
    case "unknown_device": {
      const device = simulation.addUnknownDevice();
      return NextResponse.json({
        scenario: "unknown_device",
        message: `New unknown device detected: ${device.mac} (${device.oui})`,
        data: {
          mac: device.mac,
          manufacturer: device.oui,
          hostname: device.hostname,
          os: device.os_name,
          model: device.fingerprint.model_prediction,
          blocked: true,
        },
      });
    }

    case "safeguarding_alert": {
      const { category, mac } = body;
      if (!category) {
        return NextResponse.json(
          {
            error: "Required: { category: string }",
            valid_categories: [
              "adult_content",
              "gambling",
              "violence",
              "drugs",
              "self_harm",
              "proxy_vpn",
            ],
          },
          { status: 400 }
        );
      }
      const entry = simulation.generateDnsEvent({ mac, category });
      return NextResponse.json({
        scenario: "safeguarding_alert",
        message: `Safeguarding alert: ${entry.categories.join(", ")} — ${entry.domain}`,
        data: entry,
      });
    }

    case "behaviour_pattern": {
      const { category, mac, count } = body;
      if (!category || !mac) {
        return NextResponse.json(
          { error: "Required: { category: string, mac: string }" },
          { status: 400 }
        );
      }
      const events = simulation.generateBehaviourPattern(mac, category, count ?? 5);
      return NextResponse.json({
        scenario: "behaviour_pattern",
        message: `Behaviour pattern: ${events.length} ${category} attempts from ${mac}`,
        data: {
          attempts: events.length,
          category,
          mac,
          events,
        },
      });
    }

    case "mac_change": {
      const { mac } = body;
      if (!mac) {
        return NextResponse.json(
          { error: "Required: { mac: string }" },
          { status: 400 }
        );
      }
      const result = simulation.simulateMacRandomisation(mac);
      if (!result) {
        return NextResponse.json(
          { error: `Device ${mac} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        scenario: "mac_change",
        message: `MAC changed: ${result.oldMac} → ${result.newMac} (fingerprint matched)`,
        data: result,
      });
    }

    case "late_night_access": {
      const { mac } = body;
      // Generate a flagged event and mark it as late night
      const entry = simulation.generateDnsEvent({
        mac,
        category: "adult_content",
      });
      return NextResponse.json({
        scenario: "late_night_access",
        message: `Late night access attempt from ${entry.client_mac}: ${entry.domain}`,
        data: {
          ...entry,
          outside_schedule: true,
          note: "Access attempt detected outside permitted hours",
        },
      });
    }

    default:
      return NextResponse.json(
        {
          error: `Unknown scenario: ${scenario}`,
          valid_scenarios: [
            "unknown_device",
            "safeguarding_alert",
            "behaviour_pattern",
            "mac_change",
            "late_night_access",
          ],
        },
        { status: 400 }
      );
  }
}

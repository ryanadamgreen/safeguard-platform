import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";

/**
 * GET /api/mobileconfig/[deviceId]
 *
 * Generates and returns an Apple configuration profile (.mobileconfig) that
 * sets the device's system-wide DNS-over-HTTPS server to our DoH endpoint.
 *
 * The device UUID is embedded in the DoH URL path so every DNS query is
 * automatically tagged to this specific device:
 *   ServerURL = https://<host>/api/dns-query/<deviceId>
 *
 * ServerAddresses (Cloudflare IPs) are required for iOS to mark the profile
 * as "Connected" and actively route DNS through the DoH endpoint.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  let deviceName = "SafeGuard Device";
  try {
    const { data } = await supabase
      .from("devices")
      .select("name")
      .eq("id", deviceId)
      .single();
    if (data?.name) deviceName = data.name;
  } catch {
    // ignore — name is cosmetic only
  }

  const baseUrl =
    process.env.SAFEGUARD_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const dohServerURL = `${baseUrl}/api/dns-query/${deviceId}`;

  const profileUUID = randomUUID().toUpperCase();
  const payloadUUID = randomUUID().toUpperCase();

  const safeName = deviceName.replace(/[^a-zA-Z0-9-_ ]/g, "-");

  const mobileconfig = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    '\t<key>PayloadContent</key>',
    '\t<array>',
    '\t\t<dict>',
    '\t\t\t<key>DNSSettings</key>',
    '\t\t\t<dict>',
    '\t\t\t\t<key>DNSProtocol</key>',
    '\t\t\t\t<string>HTTPS</string>',
    '\t\t\t\t<key>ServerURL</key>',
    `\t\t\t\t<string>${dohServerURL}</string>`,
    '\t\t\t\t<key>ServerAddresses</key>',
    '\t\t\t\t<array>',
    '\t\t\t\t\t<string>1.1.1.1</string>',
    '\t\t\t\t\t<string>1.0.0.1</string>',
    '\t\t\t\t\t<string>2606:4700:4700::1111</string>',
    '\t\t\t\t\t<string>2606:4700:4700::1001</string>',
    '\t\t\t\t</array>',
    '\t\t\t</dict>',
    '\t\t\t<key>PayloadDisplayName</key>',
    '\t\t\t<string>SafeGuard DNS</string>',
    '\t\t\t<key>PayloadDescription</key>',
    '\t\t\t<string>Routes DNS through SafeGuard for monitoring and content filtering</string>',
    '\t\t\t<key>PayloadIdentifier</key>',
    `\t\t\t<string>com.safeguard.dns.settings.${deviceId}</string>`,
    '\t\t\t<key>PayloadType</key>',
    '\t\t\t<string>com.apple.dnsSettings.managed</string>',
    '\t\t\t<key>PayloadUUID</key>',
    `\t\t\t<string>${payloadUUID}</string>`,
    '\t\t\t<key>PayloadVersion</key>',
    '\t\t\t<integer>1</integer>',
    '\t\t</dict>',
    '\t</array>',
    '\t<key>PayloadDisplayName</key>',
    `\t<string>SafeGuard \u2013 ${deviceName}</string>`,
    '\t<key>PayloadDescription</key>',
    `\t<string>SafeGuard DNS monitoring and filtering profile for ${deviceName}</string>`,
    '\t<key>PayloadIdentifier</key>',
    `\t<string>com.safeguard.dns.profile.${deviceId}</string>`,
    '\t<key>PayloadType</key>',
    '\t<string>Configuration</string>',
    '\t<key>PayloadUUID</key>',
    `\t<string>${profileUUID}</string>`,
    '\t<key>PayloadVersion</key>',
    '\t<integer>1</integer>',
    '</dict>',
    '</plist>',
  ].join('\n');

  return new Response(mobileconfig, {
    headers: {
      "Content-Type": "application/x-apple-aspen-config; charset=utf-8",
      "Content-Disposition": `attachment; filename="SafeGuard-${safeName}.mobileconfig"`,
      "Cache-Control": "no-store",
    },
  });
}

"use client";

import { AlertsBanner } from "@/components/dashboard/alerts-banner";
import { ChildrenSection } from "@/components/dashboard/children-section";
import { UnknownDevicesSection } from "@/components/dashboard/unknown-devices-section";
import {
  children,
  devices,
  unknownDevices,
  alerts,
} from "@/lib/mock-data";

export default function DashboardPage() {
  // In production, filter by selectedHome from context
  const homeId = "home-1";
  const homeChildren = children.filter((c) => c.home_id === homeId);
  const homeDevices = devices.filter((d) => d.home_id === homeId);
  const homeUnknown = unknownDevices.filter((d) => d.home_id === homeId);
  const homeAlerts = alerts.filter((a) => a.home_id === homeId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Real-time overview for Meadow House
        </p>
      </div>

      <AlertsBanner alerts={homeAlerts} />

      <ChildrenSection children={homeChildren} devices={homeDevices} />

      <UnknownDevicesSection
        unknownDevices={homeUnknown}
        children={homeChildren}
      />
    </div>
  );
}

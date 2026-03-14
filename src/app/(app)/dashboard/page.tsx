"use client";

import { useEffect, useState } from "react";
import { AlertsBanner } from "@/components/dashboard/alerts-banner";
import { ChildrenSection } from "@/components/dashboard/children-section";
import { UnknownDevicesSection } from "@/components/dashboard/unknown-devices-section";
import { useHome } from "@/contexts/home-context";
import { useAuth } from "@/contexts/auth-context";
import {
  getChildrenByHome,
  getDevicesByHome,
  getUnknownDevicesByHome,
  getAlertsByHome,
} from "@/lib/queries";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { selectedHome, loading: homeLoading } = useHome();
  const { loading: authLoading } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [unknownDevices, setUnknownDevices] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || homeLoading || !selectedHome) return;

    async function load() {
      setLoading(true);
      try {
        const [c, d, u, a] = await Promise.all([
          getChildrenByHome(selectedHome!.id),
          getDevicesByHome(selectedHome!.id),
          getUnknownDevicesByHome(selectedHome!.id),
          getAlertsByHome(selectedHome!.id),
        ]);
        setChildren(c);
        setDevices(d);
        setUnknownDevices(u);
        setAlerts(a);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [selectedHome, authLoading, homeLoading]);

  if (authLoading || homeLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!selectedHome) {
    return (
      <p className="py-20 text-center text-gray-400">
        No home selected. Contact your administrator.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Real-time overview for {selectedHome.name}
        </p>
      </div>

      <AlertsBanner alerts={alerts} />

      <ChildrenSection children={children} devices={devices} homeId={selectedHome.id} />

      <UnknownDevicesSection
        unknownDevices={unknownDevices}
        children={children}
      />
    </div>
  );
}

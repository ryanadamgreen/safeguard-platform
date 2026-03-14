"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Monitor, Wifi, WifiOff, Clock } from "lucide-react";
import { DEVICE_TYPE_LABELS } from "@/types";
import type { Device, Child } from "@/types";
import { format } from "date-fns";

interface DevicesSectionProps {
  devices: Device[];
  children: Child[];
}

export function DevicesSection({ devices, children }: DevicesSectionProps) {
  const [deviceStates, setDeviceStates] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(devices.map((d) => [d.id, d.internet_enabled]))
  );

  const toggleDevice = (deviceId: string) => {
    setDeviceStates((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  const getChildInitials = (childId: string | null) => {
    if (!childId) return "—";
    const child = children.find((c) => c.id === childId);
    return child?.initials ?? "—";
  };

  const getScheduleLabel = (device: Device) => {
    if (!device.schedule_start || !device.schedule_end) return "All Day";
    return `${device.schedule_start}–${device.schedule_end}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Monitor className="h-5 w-5 text-blue-600" />
          Devices
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Child</TableHead>
              <TableHead>Last Connected</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="text-center">WiFi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => {
              const isOn = deviceStates[device.id] ?? device.internet_enabled;
              return (
                <TableRow key={device.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{device.name}</p>
                      <p className="font-mono text-xs text-gray-400">
                        {device.mac_address}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {DEVICE_TYPE_LABELS[device.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {getChildInitials(device.child_id)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {device.last_connected
                        ? format(
                            new Date(device.last_connected),
                            "dd MMM HH:mm"
                          )
                        : "Never"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      {getScheduleLabel(device)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {isOn ? (
                        <Wifi className="h-4 w-4 text-green-600" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-500" />
                      )}
                      <Switch
                        checked={isOn}
                        onCheckedChange={() => toggleDevice(device.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

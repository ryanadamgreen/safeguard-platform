"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CircleAlert, ShieldBan, UserPlus, CheckCircle } from "lucide-react";
import type { UnknownDevice } from "@/types";
import { format } from "date-fns";

interface UnknownDevicesSectionProps {
  unknownDevices: UnknownDevice[];
}

export function UnknownDevicesSection({
  unknownDevices,
}: UnknownDevicesSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CircleAlert className="h-5 w-5 text-amber-600" />
          Unknown Devices
          {unknownDevices.length > 0 && (
            <Badge variant="destructive" className="ml-1">
              {unknownDevices.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {unknownDevices.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
            <CheckCircle className="h-4 w-4 text-green-500" />
            No unknown devices detected.
          </div>
        ) : (
          <div className="space-y-3">
            {unknownDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <div>
                  <p className="font-mono text-sm font-medium">
                    {device.mac_address}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {device.manufacturer ?? "Unknown manufacturer"}
                    </span>
                    {device.device_type && (
                      <>
                        <span>·</span>
                        <span>{device.device_type}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>
                      Detected{" "}
                      {format(
                        new Date(device.first_detected),
                        "dd MMM HH:mm"
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="destructive"
                    className="text-xs"
                  >
                    Blocked
                  </Badge>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                  >
                    <ShieldBan className="h-3.5 w-3.5" />
                    Block
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

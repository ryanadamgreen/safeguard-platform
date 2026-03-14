"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CircleAlert,
  ShieldBan,
  UserPlus,
  CheckCircle,
} from "lucide-react";
import { DEVICE_TYPE_LABELS } from "@/types";
import type { UnknownDevice, Child, DeviceType } from "@/types";
import { format } from "date-fns";
import {
  approveUnknownDevice,
  blockUnknownDevicePermanently,
} from "@/lib/queries";

interface UnknownDevicesSectionProps {
  unknownDevices: UnknownDevice[];
  children: Child[];
}

interface ApproveForm {
  unknownDevice: UnknownDevice;
  deviceName: string;
  deviceType: DeviceType;
  childId: string;
}

export function UnknownDevicesSection({
  unknownDevices,
  children,
}: UnknownDevicesSectionProps) {
  const [visibleDevices, setVisibleDevices] =
    useState<UnknownDevice[]>(unknownDevices);
  const [approveModal, setApproveModal] = useState<ApproveForm | null>(null);

  const openApprove = (device: UnknownDevice) => {
    setApproveModal({
      unknownDevice: device,
      deviceName: "",
      deviceType: "phone",
      childId: "",
    });
  };

  const confirmApprove = async () => {
    if (!approveModal) return;
    const ud = approveModal.unknownDevice;
    try {
      await approveUnknownDevice(ud.id, {
        name: approveModal.deviceName,
        type: approveModal.deviceType,
        mac_address: ud.mac_address,
        child_id: approveModal.childId,
        home_id: ud.home_id,
      });
      setVisibleDevices((prev) => prev.filter((d) => d.id !== ud.id));
    } catch (err) {
      console.error("Failed to approve device:", err);
    }
    setApproveModal(null);
  };

  const blockPermanently = async (deviceId: string) => {
    try {
      await blockUnknownDevicePermanently(deviceId);
      setVisibleDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } catch (err) {
      console.error("Failed to block device:", err);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CircleAlert className="h-5 w-5 text-amber-600" />
            Unknown Devices
            {visibleDevices.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {visibleDevices.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visibleDevices.length === 0 ? (
            <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-500" />
              No unknown devices detected.
            </div>
          ) : (
            <div className="space-y-2">
              {visibleDevices.map((device) => (
                <div
                  key={device.id}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
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
                    <Badge variant="destructive" className="text-xs flex-shrink-0">
                      Blocked
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => openApprove(device)}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Approve & Assign
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      onClick={() => blockPermanently(device.id)}
                    >
                      <ShieldBan className="h-3.5 w-3.5" />
                      Block Permanently
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve & Assign modal */}
      <Dialog
        open={approveModal !== null}
        onOpenChange={(open) => {
          if (!open) setApproveModal(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Approve Device
            </DialogTitle>
          </DialogHeader>
          {approveModal && (
            <div className="space-y-4">
              <div className="rounded-md bg-gray-50 px-3 py-2">
                <p className="font-mono text-xs text-gray-500">
                  {approveModal.unknownDevice.mac_address}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {approveModal.unknownDevice.manufacturer ?? "Unknown"}{" "}
                  {approveModal.unknownDevice.device_type
                    ? `· ${approveModal.unknownDevice.device_type}`
                    : ""}
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="approve-name" className="text-xs">
                    Device Name
                  </Label>
                  <Input
                    id="approve-name"
                    placeholder="e.g. AB's Phone"
                    value={approveModal.deviceName}
                    onChange={(e) =>
                      setApproveModal((prev) =>
                        prev ? { ...prev, deviceName: e.target.value } : null
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Device Type</Label>
                  <Select
                    value={approveModal.deviceType}
                    onValueChange={(v) =>
                      setApproveModal((prev) =>
                        prev
                          ? { ...prev, deviceType: (v ?? "phone") as DeviceType }
                          : null
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEVICE_TYPE_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Assign to Child</Label>
                  <Select
                    value={approveModal.childId}
                    onValueChange={(v) =>
                      setApproveModal((prev) =>
                        prev ? { ...prev, childId: v ?? "" } : null
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a child" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.initials} – Age {child.age}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setApproveModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={confirmApprove}
                  disabled={
                    !approveModal.deviceName || !approveModal.childId
                  }
                >
                  Approve & Assign
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

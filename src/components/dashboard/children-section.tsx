"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Smartphone,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Clock,
  CalendarClock,
} from "lucide-react";
import { DEVICE_TYPE_LABELS } from "@/types";
import type { Child, Device } from "@/types";
import { format } from "date-fns";

interface ChildrenSectionProps {
  children: Child[];
  devices: Device[];
}

interface ScheduleForm {
  deviceId: string;
  deviceName: string;
  start: string;
  end: string;
}

export function ChildrenSection({ children, devices }: ChildrenSectionProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deviceStates, setDeviceStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(devices.map((d) => [d.id, d.internet_enabled]))
  );
  const [schedules, setSchedules] = useState<
    Record<string, { start: string | null; end: string | null }>
  >(() =>
    Object.fromEntries(
      devices.map((d) => [
        d.id,
        { start: d.schedule_start, end: d.schedule_end },
      ])
    )
  );
  const [scheduleModal, setScheduleModal] = useState<ScheduleForm | null>(
    null
  );

  const toggleExpand = (childId: string) => {
    setExpanded((prev) => ({ ...prev, [childId]: !prev[childId] }));
  };

  const toggleDevice = (deviceId: string) => {
    setDeviceStates((prev) => ({ ...prev, [deviceId]: !prev[deviceId] }));
  };

  const openScheduleModal = (device: Device) => {
    const sched = schedules[device.id];
    setScheduleModal({
      deviceId: device.id,
      deviceName: device.name,
      start: sched?.start ?? "",
      end: sched?.end ?? "",
    });
  };

  const saveSchedule = () => {
    if (!scheduleModal) return;
    setSchedules((prev) => ({
      ...prev,
      [scheduleModal.deviceId]: {
        start: scheduleModal.start || null,
        end: scheduleModal.end || null,
      },
    }));
    setScheduleModal(null);
  };

  const getScheduleLabel = (deviceId: string) => {
    const sched = schedules[deviceId];
    if (!sched?.start || !sched?.end) return "All Day";
    return `${sched.start}–${sched.end}`;
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-blue-600" />
            Children & Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {children.map((child) => {
              const childDevices = devices.filter(
                (d) => d.child_id === child.id
              );
              const isExpanded = expanded[child.id] ?? false;

              return (
                <div key={child.id} className="rounded-lg border">
                  {/* Child header — click to expand */}
                  <button
                    onClick={() => toggleExpand(child.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                        {child.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {child.initials}{" "}
                          <span className="font-normal text-gray-500">
                            – Age {child.age}
                          </span>
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Smartphone className="h-3 w-3" />
                          {childDevices.length} device
                          {childDevices.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </button>

                  {/* Expanded device list */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-3 pt-2 space-y-2">
                      {childDevices.length === 0 ? (
                        <p className="py-2 text-xs text-gray-400">
                          No devices assigned.
                        </p>
                      ) : (
                        childDevices.map((device) => {
                          const isOn =
                            deviceStates[device.id] ?? device.internet_enabled;
                          return (
                            <div
                              key={device.id}
                              className="rounded-md bg-gray-50 px-3 py-2.5"
                            >
                              {/* Device top row */}
                              <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate">
                                      {device.name}
                                    </p>
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1.5"
                                    >
                                      {DEVICE_TYPE_LABELS[device.type]}
                                    </Badge>
                                  </div>
                                  <p className="font-mono text-[10px] text-gray-400 mt-0.5">
                                    {device.mac_address}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {isOn ? (
                                    <Wifi className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <WifiOff className="h-4 w-4 text-red-500" />
                                  )}
                                  <Switch
                                    checked={isOn}
                                    onCheckedChange={() =>
                                      toggleDevice(device.id)
                                    }
                                  />
                                </div>
                              </div>

                              {/* Device bottom row — schedule + last seen */}
                              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                <button
                                  onClick={() => openScheduleModal(device)}
                                  className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-gray-200 transition-colors"
                                >
                                  <Clock className="h-3 w-3" />
                                  {getScheduleLabel(device.id)}
                                  <CalendarClock className="h-3 w-3 ml-1 text-blue-500" />
                                </button>
                                <span>
                                  {device.last_connected
                                    ? `Last seen ${format(
                                        new Date(device.last_connected),
                                        "dd MMM HH:mm"
                                      )}`
                                    : "Never connected"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {children.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">
                No children added yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule modal */}
      <Dialog
        open={scheduleModal !== null}
        onOpenChange={(open) => {
          if (!open) setScheduleModal(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-5 w-5 text-blue-600" />
              Set Schedule
            </DialogTitle>
          </DialogHeader>
          {scheduleModal && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Schedule internet access for{" "}
                <span className="font-medium text-gray-900">
                  {scheduleModal.deviceName}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sched-start" className="text-xs">
                    Start Time
                  </Label>
                  <Input
                    id="sched-start"
                    type="time"
                    value={scheduleModal.start}
                    onChange={(e) =>
                      setScheduleModal((prev) =>
                        prev ? { ...prev, start: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sched-end" className="text-xs">
                    End Time
                  </Label>
                  <Input
                    id="sched-end"
                    type="time"
                    value={scheduleModal.end}
                    onChange={(e) =>
                      setScheduleModal((prev) =>
                        prev ? { ...prev, end: e.target.value } : null
                      )
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setScheduleModal((prev) =>
                      prev ? { ...prev, start: "", end: "" } : null
                    );
                  }}
                >
                  Set to All Day
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScheduleModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveSchedule}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

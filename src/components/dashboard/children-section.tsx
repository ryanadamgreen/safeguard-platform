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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  toggleDeviceInternet,
  updateDeviceSchedule,
  createDevice,
} from "@/lib/queries";
import {
  Users,
  Smartphone,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Clock,
  CalendarClock,
  Download,
  Plus,
  Loader2,
  CheckCircle2,
  Copy,
  Settings2,
  QrCode,
} from "lucide-react";
import { DEVICE_TYPE_LABELS } from "@/types";
import type { Child, Device } from "@/types";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

interface ChildrenSectionProps {
  children: Child[];
  devices: Device[];
  homeId: string;
}

interface ScheduleForm {
  deviceId: string;
  deviceName: string;
  start: string;
  end: string;
}

interface AddDeviceForm {
  name: string;
  type: string;
  scheduleStart: string;
  scheduleEnd: string;
}

export function ChildrenSection({ children, devices, homeId }: ChildrenSectionProps) {
  const [localDevices, setLocalDevices] = useState<Device[]>(devices);
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
  const [scheduleModal, setScheduleModal] = useState<ScheduleForm | null>(null);

  // Add device modal state
  const [setupTab, setSetupTab] = useState<"ios" | "android">("ios");
  const [addForChild, setAddForChild] = useState<Child | null>(null);
  const [addForm, setAddForm] = useState<AddDeviceForm>({
    name: "",
    type: "phone",
    scheduleStart: "",
    scheduleEnd: "",
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addedDevice, setAddedDevice] = useState<{ id: string; name: string } | null>(null);

  const [setupDevice, setSetupDevice] = useState<Device | null>(null);
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const dohUrl = (deviceId: string) =>
    `${origin}/api/dns-query/${deviceId}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = (childId: string) => {
    setExpanded((prev) => ({ ...prev, [childId]: !prev[childId] }));
  };

  const toggleDevice = async (deviceId: string) => {
    const newState = !deviceStates[deviceId];
    setDeviceStates((prev) => ({ ...prev, [deviceId]: newState }));
    try {
      await toggleDeviceInternet(deviceId, newState);
    } catch (err) {
      console.error("Failed to toggle device:", err);
      setDeviceStates((prev) => ({ ...prev, [deviceId]: !newState }));
    }
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

  const saveSchedule = async () => {
    if (!scheduleModal) return;
    const start = scheduleModal.start || null;
    const end = scheduleModal.end || null;
    setSchedules((prev) => ({
      ...prev,
      [scheduleModal.deviceId]: { start, end },
    }));
    setScheduleModal(null);
    try {
      await updateDeviceSchedule(scheduleModal.deviceId, start, end);
    } catch (err) {
      console.error("Failed to update schedule:", err);
    }
  };

  const getScheduleLabel = (deviceId: string) => {
    const sched = schedules[deviceId];
    if (!sched?.start || !sched?.end) return "All Day";
    return `${sched.start}–${sched.end}`;
  };

  const openAddDevice = (child: Child) => {
    setAddForChild(child);
    setAddForm({ name: "", type: "phone", scheduleStart: "", scheduleEnd: "" });
    setAddError(null);
    setAddedDevice(null);
    // Auto-expand the child so the new device is visible after creation
    setExpanded((prev) => ({ ...prev, [child.id]: true }));
  };

  const closeAddDevice = () => {
    setAddForChild(null);
    setAddedDevice(null);
    setAddError(null);
  };

  const submitAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setAddError("Device name is required.");
      return;
    }
    setAddError(null);
    setAddSubmitting(true);
    try {
      const created = await createDevice({
        name: addForm.name.trim(),
        type: addForm.type,
        home_id: homeId,
        child_id: addForChild!.id,
        schedule_start: addForm.scheduleStart || null,
        schedule_end: addForm.scheduleEnd || null,
      });

      // Add to local state so it appears immediately
      const newDevice: Device = {
        id: created.id,
        name: addForm.name.trim(),
        type: addForm.type as Device["type"],
        mac_address: null,
        child_id: addForChild!.id,
        home_id: homeId,
        last_connected: null,
        internet_enabled: true,
        schedule_start: addForm.scheduleStart || null,
        schedule_end: addForm.scheduleEnd || null,
        manufacturer: null,
        hostname: null,
        os_type: null,
        model_prediction: null,
        created_at: new Date().toISOString(),
      };
      setLocalDevices((prev) => [...prev, newDevice]);
      setDeviceStates((prev) => ({ ...prev, [created.id]: true }));
      setSchedules((prev) => ({
        ...prev,
        [created.id]: {
          start: addForm.scheduleStart || null,
          end: addForm.scheduleEnd || null,
        },
      }));

      setAddedDevice({ id: created.id, name: addForm.name.trim() });
    } catch (err: any) {
      setAddError(err?.message ?? "Failed to create device.");
    } finally {
      setAddSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-[#3730a3]" />
            Children & Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {children.map((child) => {
              const childDevices = localDevices.filter(
                (d) => d.child_id === child.id
              );
              const isExpanded = expanded[child.id] ?? false;

              return (
                <div key={child.id} className="rounded-lg border">
                  {/* Child header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <button
                      onClick={() => toggleExpand(child.id)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbeafe] text-sm font-bold text-[#2563eb]">
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
                      <span className="ml-1">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </span>
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs text-[#3730a3] hover:bg-indigo-50 hover:text-[#3730a3]"
                      onClick={() => openAddDevice(child)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Device
                    </Button>
                  </div>

                  {/* Expanded device list */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-3 pt-2 space-y-2">
                      {childDevices.length === 0 ? (
                        <p className="py-2 text-xs text-gray-400">
                          No devices assigned. Click &ldquo;Add Device&rdquo; to register one.
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
                                  <div className="flex items-center gap-2 min-w-0">
                                    <p className="text-sm font-medium truncate min-w-0">
                                      {device.name}
                                    </p>
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1.5 flex-shrink-0"
                                    >
                                      {DEVICE_TYPE_LABELS[device.type]}
                                    </Badge>
                                  </div>
                                  {device.mac_address && (
                                    <p className="font-mono text-[10px] text-gray-400 mt-0.5">
                                      {device.mac_address}
                                    </p>
                                  )}
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

                              {/* Device bottom row */}
                              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <button
                                    onClick={() => openScheduleModal(device)}
                                    className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-gray-200 transition-colors"
                                  >
                                    <Clock className="h-3 w-3" />
                                    {getScheduleLabel(device.id)}
                                    <CalendarClock className="h-3 w-3 ml-1 text-[#3730a3]" />
                                  </button>
                                  <button
                                    onClick={() => { setSetupDevice(device); setSetupTab("ios"); }}
                                    className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-gray-200 transition-colors text-[#3730a3]"
                                  >
                                    <QrCode className="h-3 w-3" />
                                    Setup
                                  </button>
                                </div>
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
              <CalendarClock className="h-5 w-5 text-[#3730a3]" />
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

      {/* Add Device modal */}
      <Dialog open={addForChild !== null} onOpenChange={(open) => { if (!open) closeAddDevice(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-5 w-5 text-[#3730a3]" />
              {addedDevice ? "Device Created" : `Add Device for ${addForChild?.initials}`}
            </DialogTitle>
          </DialogHeader>

          {/* Success state */}
          {addedDevice ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div className="space-y-1">
                  <p className="font-semibold text-green-900">&ldquo;{addedDevice.name}&rdquo; registered</p>
                  <p className="text-sm text-green-700">
                    Follow the setup instructions for the device&apos;s platform.
                  </p>
                </div>
              </div>

              {/* Platform tabs */}
              <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs font-medium">
                <button
                  onClick={() => setSetupTab("ios")}
                  className={`flex-1 px-3 py-2 transition-colors ${
                    setupTab === "ios" ? "bg-[#1f2937] text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Apple (iOS)
                </button>
                <button
                  onClick={() => setSetupTab("android")}
                  className={`flex-1 px-3 py-2 border-l border-gray-200 transition-colors ${
                    setupTab === "android" ? "bg-[#1f2937] text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Android
                </button>
              </div>

              {setupTab === "ios" ? (
                <>
                  <div className="flex justify-center rounded-lg border bg-white p-4">
                    <QRCodeSVG
                      value={`${origin}/api/mobileconfig/${addedDevice.id}`}
                      size={180}
                      level="M"
                      marginSize={2}
                    />
                  </div>
                  <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 space-y-1">
                    <p className="font-semibold">Scan with the child&apos;s iPhone:</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Open the <strong>Camera</strong> app and scan the QR code above</li>
                      <li>Tap the notification banner to open in Safari</li>
                      <li>Tap <strong>Allow</strong> to download the profile</li>
                      <li>Go to <strong>Settings → General → VPN &amp; Device Management</strong></li>
                      <li>Tap the SafeGuard profile and tap <strong>Install</strong></li>
                    </ol>
                  </div>
                  <Button variant="outline" className="w-full" onClick={closeAddDevice}>Done</Button>
                </>
              ) : (
                <>
                  <div className="flex justify-center rounded-lg border bg-white p-4">
                    <QRCodeSVG
                      value={dohUrl(addedDevice.id)}
                      size={180}
                      level="M"
                      marginSize={2}
                    />
                  </div>
                  <div className="rounded-md border border-green-100 bg-green-50 p-3 text-xs text-green-700 space-y-1">
                    <p className="font-semibold">Setup on the child&apos;s Android phone:</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Install <strong>Intra</strong> from the Google Play Store</li>
                      <li>Open Intra → <strong>Choose server</strong> → <strong>Custom server URL</strong></li>
                      <li>Scan the QR code above to copy the URL, then paste it</li>
                      <li>Toggle Intra <strong>on</strong></li>
                    </ol>
                  </div>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">DoH Server URL</p>
                    <p className="break-all font-mono text-xs text-gray-500">{dohUrl(addedDevice.id)}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() => copyToClipboard(dohUrl(addedDevice.id))}
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied!" : "Copy URL"}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={closeAddDevice}>Done</Button>
                </>
              )}
            </div>
          ) : (
            /* Form state */
            <form onSubmit={submitAddDevice} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="add-device-name">Device Name</Label>
                  <Input
                    id="add-device-name"
                    placeholder="e.g. AB's iPhone"
                    value={addForm.name}
                    onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="add-device-type">Device Type</Label>
                  <Select
                    value={addForm.type}
                    onValueChange={(v) => setAddForm((f) => ({ ...f, type: v ?? f.type }))}
                  >
                    <SelectTrigger id="add-device-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="gaming_console">Gaming Console</SelectItem>
                      <SelectItem value="smart_tv">Smart TV</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="add-sched-start" className="text-xs">Internet From</Label>
                  <Input
                    id="add-sched-start"
                    type="time"
                    value={addForm.scheduleStart}
                    onChange={(e) => setAddForm((f) => ({ ...f, scheduleStart: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-sched-end" className="text-xs">Internet Until</Label>
                  <Input
                    id="add-sched-end"
                    type="time"
                    value={addForm.scheduleEnd}
                    onChange={(e) => setAddForm((f) => ({ ...f, scheduleEnd: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">Leave blank for unrestricted access.</p>
              {addError && <p className="text-sm text-red-500">{addError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeAddDevice}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addSubmitting}
                  className="gap-1.5 bg-[#3730a3] hover:bg-[#312e81]"
                >
                  {addSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {addSubmitting ? "Creating…" : "Add Device"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Setup instructions modal for existing devices */}
      <Dialog open={setupDevice !== null} onOpenChange={(open) => { if (!open) { setSetupDevice(null); setCopied(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-5 w-5 text-[#3730a3]" />
              Setup: {setupDevice?.name}
            </DialogTitle>
          </DialogHeader>
          {setupDevice && (
            <div className="space-y-4">
              {/* Platform tabs */}
              <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs font-medium">
                <button
                  onClick={() => setSetupTab("ios")}
                  className={`flex-1 px-3 py-2 transition-colors ${
                    setupTab === "ios" ? "bg-[#1f2937] text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Apple (iOS)
                </button>
                <button
                  onClick={() => setSetupTab("android")}
                  className={`flex-1 px-3 py-2 border-l border-gray-200 transition-colors ${
                    setupTab === "android" ? "bg-[#1f2937] text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Android
                </button>
              </div>

              {setupTab === "ios" ? (
                <>
                  <div className="flex justify-center rounded-lg border bg-white p-4">
                    <QRCodeSVG
                      value={`${origin}/api/mobileconfig/${setupDevice.id}`}
                      size={180}
                      level="M"
                      marginSize={2}
                    />
                  </div>
                  <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 space-y-1">
                    <p className="font-semibold">Scan with the child&apos;s iPhone:</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Open the <strong>Camera</strong> app and scan the QR code above</li>
                      <li>Tap the notification banner to open in Safari</li>
                      <li>Tap <strong>Allow</strong> to download the profile</li>
                      <li>Go to <strong>Settings → General → VPN &amp; Device Management</strong></li>
                      <li>Tap the SafeGuard profile and tap <strong>Install</strong></li>
                    </ol>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center rounded-lg border bg-white p-4">
                    <QRCodeSVG
                      value={dohUrl(setupDevice.id)}
                      size={180}
                      level="M"
                      marginSize={2}
                    />
                  </div>
                  <div className="rounded-md border border-green-100 bg-green-50 p-3 text-xs text-green-700 space-y-1">
                    <p className="font-semibold">Setup on the child&apos;s Android phone:</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Install <strong>Intra</strong> from the Google Play Store</li>
                      <li>Open Intra → <strong>Choose server</strong> → <strong>Custom server URL</strong></li>
                      <li>Scan the QR code above to copy the URL, then paste it</li>
                      <li>Toggle Intra <strong>on</strong></li>
                    </ol>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() => copyToClipboard(dohUrl(setupDevice.id))}
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied!" : "Copy URL"}
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

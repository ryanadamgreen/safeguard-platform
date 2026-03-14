"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Home,
  Router,
  UserPlus,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  Download,
  Smartphone,
} from "lucide-react";
import { useHome } from "@/contexts/home-context";
import { useAuth } from "@/contexts/auth-context";
import { getChildrenByHome, createDevice } from "@/lib/queries";

const BASE_URL =
  process.env.NEXT_PUBLIC_SAFEGUARD_BASE_URL?.replace(/\/$/, "") ??
  (typeof window !== "undefined" ? window.location.origin : "");

interface NewDeviceForm {
  name: string;
  type: string;
  childId: string;
  scheduleStart: string;
  scheduleEnd: string;
}

interface CreatedDevice {
  id: string;
  name: string;
  profileUrl: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { selectedHome, loading: homeLoading } = useHome();
  const { profile, loading: authLoading } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<NewDeviceForm>({
    name: "",
    type: "phone",
    childId: "",
    scheduleStart: "",
    scheduleEnd: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedDevice | null>(null);

  useEffect(() => {
    if (!authLoading && profile?.role !== "platform_admin") {
      router.replace("/dashboard");
      return;
    }
    if (authLoading || homeLoading || !selectedHome) return;

    async function load() {
      setLoading(true);
      try {
        const c = await getChildrenByHome(selectedHome!.id);
        setChildren(c);
      } catch (err) {
        console.error("Failed to load settings data:", err);
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
      <p className="py-20 text-center text-gray-400">No home selected.</p>
    );
  }

  async function handleAddDevice(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Device name is required.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const device = await createDevice({
        name: form.name.trim(),
        type: form.type,
        home_id: selectedHome!.id,
        child_id: form.childId || null,
        schedule_start: form.scheduleStart || null,
        schedule_end: form.scheduleEnd || null,
      });

      const origin =
        BASE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");

      setCreated({
        id: device.id,
        name: form.name.trim(),
        profileUrl: `${origin}/api/mobileconfig/${device.id}`,
      });

      // Reset form
      setForm({ name: "", type: "phone", childId: "", scheduleStart: "", scheduleEnd: "" });
    } catch (err: any) {
      setFormError(err?.message ?? "Failed to create device.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500">
          Manage configuration for {selectedHome.name}
        </p>
      </div>

      {/* Home Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Home className="h-5 w-5 text-[#3730a3]" />
            Home Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="home-name">Home Name</Label>
              <Input id="home-name" defaultValue={selectedHome.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home-address">Address</Label>
              <Input id="home-address" defaultValue={selectedHome.address} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Router & DNS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Router className="h-5 w-5 text-[#3730a3]" />
            Router & DNS Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="router-id">Router ID</Label>
              <Input id="router-id" defaultValue={selectedHome.router_id} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextdns-id">NextDNS Profile ID</Label>
              <Input
                id="nextdns-id"
                defaultValue={selectedHome.nextdns_profile_id}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Router Connected
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              NextDNS Active
            </Badge>
          </div>
          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Children Management */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-5 w-5 text-[#3730a3]" />
              Children
            </CardTitle>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Child
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Initials</TableHead>
                <TableHead>Age</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {children.map((child: any) => (
                <TableRow key={child.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dbeafe] text-sm font-bold text-[#2563eb]">
                        {child.initials}
                      </div>
                      <span className="font-medium">{child.initials}</span>
                    </div>
                  </TableCell>
                  <TableCell>{child.age}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Device */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5 text-[#3730a3]" />
            Add Device
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Success panel */}
          {created && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="font-semibold text-green-900">
                      Device &ldquo;{created.name}&rdquo; created
                    </p>
                    <p className="text-sm text-green-700">
                      Install the profile on the device to start monitoring DNS queries.
                    </p>
                  </div>
                  <div className="rounded-md border border-green-200 bg-white p-3">
                    <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Install Profile URL
                    </p>
                    <p className="break-all font-mono text-sm text-gray-800">
                      {created.profileUrl}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={created.profileUrl} download>
                      <Button size="sm" className="gap-1.5 bg-[#3730a3] hover:bg-[#312e81]">
                        <Download className="h-4 w-4" />
                        Download Profile
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCreated(null)}
                    >
                      Add Another Device
                    </Button>
                  </div>
                  <p className="text-xs text-green-700">
                    <strong>iOS instructions:</strong> Open Safari on the child&apos;s phone → tap the link above → tap Allow → go to Settings → General → VPN &amp; Device Management → install the profile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!created && (
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="device-name">Device Name</Label>
                  <Input
                    id="device-name"
                    placeholder="e.g. AB's iPhone"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device-type">Device Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                  >
                    <SelectTrigger id="device-type">
                      <SelectValue placeholder="Select type" />
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
                <div className="space-y-2">
                  <Label htmlFor="assign-child">Assign to Child</Label>
                  <Select
                    value={form.childId}
                    onValueChange={(v) => setForm((f) => ({ ...f, childId: v }))}
                  >
                    <SelectTrigger id="assign-child">
                      <SelectValue placeholder="Select child (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child: any) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.initials} – Age {child.age}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schedule-start">Internet From</Label>
                  <Input
                    id="schedule-start"
                    type="time"
                    value={form.scheduleStart}
                    onChange={(e) => setForm((f) => ({ ...f, scheduleStart: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-end">Internet Until</Label>
                  <Input
                    id="schedule-end"
                    type="time"
                    value={form.scheduleEnd}
                    onChange={(e) => setForm((f) => ({ ...f, scheduleEnd: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Leave schedule blank for unrestricted access.
              </p>
              {formError && (
                <p className="text-sm text-red-500">{formError}</p>
              )}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="gap-1.5 bg-[#3730a3] hover:bg-[#312e81]"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {submitting ? "Creating…" : "Add Device"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

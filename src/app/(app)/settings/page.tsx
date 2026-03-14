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
} from "lucide-react";
import { useHome } from "@/contexts/home-context";
import { useAuth } from "@/contexts/auth-context";
import { getChildrenByHome } from "@/lib/queries";

export default function SettingsPage() {
  const router = useRouter();
  const { selectedHome, loading: homeLoading } = useHome();
  const { profile, loading: authLoading } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            <Home className="h-5 w-5 text-blue-600" />
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
            <Router className="h-5 w-5 text-blue-600" />
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
              <UserPlus className="h-5 w-5 text-blue-600" />
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
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
            <Settings className="h-5 w-5 text-blue-600" />
            Add Device
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="device-name">Device Name</Label>
              <Input id="device-name" placeholder="e.g. AB's iPhone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device-type">Device Type</Label>
              <Select>
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
              <Label htmlFor="mac-address">MAC Address</Label>
              <Input id="mac-address" placeholder="AA:BB:CC:DD:EE:FF" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-child">Assign to Child</Label>
              <Select>
                <SelectTrigger id="assign-child">
                  <SelectValue placeholder="Select child" />
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
              <Label htmlFor="schedule-start">Schedule Start</Label>
              <Input id="schedule-start" type="time" placeholder="08:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-end">Schedule End</Label>
              <Input id="schedule-end" type="time" placeholder="20:00" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>Add Device</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

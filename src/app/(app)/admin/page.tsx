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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  Plus,
  Loader2,
  Trash2,
  Router,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  getAllHomes,
  getAllManagers,
  getManagerAssignments,
  createHome,
  assignManagerToHome,
  removeManagerFromHome,
} from "@/lib/queries";

interface HomeRecord {
  id: string;
  name: string;
  address: string;
  router_id: string;
  nextdns_profile_id: string;
}

interface ManagerProfile {
  id: string;
  email: string;
  full_name: string;
}

interface Assignment {
  user_id: string;
  home_id: string;
  role_label: string;
  profiles: ManagerProfile | ManagerProfile[] | null;
  homes: HomeRecord | HomeRecord[] | null;
}

export default function AdminPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [homes, setHomes] = useState<HomeRecord[]>([]);
  const [managers, setManagers] = useState<ManagerProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Create home form
  const [newHomeName, setNewHomeName] = useState("");
  const [newHomeAddress, setNewHomeAddress] = useState("");
  const [newRouterId, setNewRouterId] = useState("");
  const [newNextdnsId, setNewNextdnsId] = useState("");
  const [creatingHome, setCreatingHome] = useState(false);

  // Assign manager modal
  const [assignModal, setAssignModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignHomeId, setAssignHomeId] = useState("");
  const [assignRole, setAssignRole] = useState("Registered Manager");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (profile?.role !== "platform_admin") {
      router.replace("/dashboard");
      return;
    }
    loadData();
  }, [authLoading, profile, router]);

  async function loadData() {
    setLoading(true);
    try {
      const [h, m, a] = await Promise.all([
        getAllHomes(),
        getAllManagers(),
        getManagerAssignments(),
      ]);
      setHomes(h);
      setManagers(m);
      setAssignments(a as Assignment[]);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateHome(e: React.FormEvent) {
    e.preventDefault();
    if (!newHomeName || !newHomeAddress || !newRouterId || !newNextdnsId) return;
    setCreatingHome(true);
    try {
      await createHome({
        name: newHomeName,
        address: newHomeAddress,
        router_id: newRouterId,
        nextdns_profile_id: newNextdnsId,
      });
      setNewHomeName("");
      setNewHomeAddress("");
      setNewRouterId("");
      setNewNextdnsId("");
      await loadData();
    } catch (err) {
      console.error("Failed to create home:", err);
    } finally {
      setCreatingHome(false);
    }
  }

  async function handleAssignManager() {
    if (!assignUserId || !assignHomeId) return;
    setAssigning(true);
    try {
      await assignManagerToHome(assignUserId, assignHomeId, assignRole);
      setAssignModal(false);
      setAssignUserId("");
      setAssignHomeId("");
      setAssignRole("Registered Manager");
      await loadData();
    } catch (err) {
      console.error("Failed to assign manager:", err);
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemoveAssignment(userId: string, homeId: string) {
    try {
      await removeManagerFromHome(userId, homeId);
      await loadData();
    } catch (err) {
      console.error("Failed to remove assignment:", err);
    }
  }

  // Group assignments by manager
  function getManagerData() {
    const grouped: Record<
      string,
      {
        profile: ManagerProfile;
        homes: { home: HomeRecord; role_label: string }[];
      }
    > = {};

    for (const a of assignments) {
      const prof = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
      const home = Array.isArray(a.homes) ? a.homes[0] : a.homes;
      if (!prof || !home) continue;

      if (!grouped[a.user_id]) {
        grouped[a.user_id] = { profile: prof, homes: [] };
      }
      grouped[a.user_id].homes.push({ home, role_label: a.role_label });
    }

    return Object.values(grouped);
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const managerData = getManagerData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Platform Administration
        </h1>
        <p className="text-sm text-gray-500">
          Manage homes, routers, and home manager assignments.
        </p>
      </div>

      {/* Homes list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-blue-600" />
              Homes
              <Badge variant="secondary">{homes.length}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Home Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Router ID</TableHead>
                <TableHead>NextDNS Profile</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {homes.map((home) => (
                <TableRow key={home.id}>
                  <TableCell className="font-medium">{home.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {home.address}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                      {home.router_id}
                    </code>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                      {home.nextdns_profile_id}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {homes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-gray-400">
                    No homes created yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Home */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-5 w-5 text-blue-600" />
            Create New Home
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateHome} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-home-name">Home Name</Label>
                <Input
                  id="new-home-name"
                  placeholder="e.g. Oakwood House"
                  value={newHomeName}
                  onChange={(e) => setNewHomeName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-home-address">Address</Label>
                <Input
                  id="new-home-address"
                  placeholder="Full address"
                  value={newHomeAddress}
                  onChange={(e) => setNewHomeAddress(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-router-id">Router ID</Label>
                <Input
                  id="new-router-id"
                  placeholder="e.g. unifi-003"
                  value={newRouterId}
                  onChange={(e) => setNewRouterId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-nextdns-id">NextDNS Profile ID</Label>
                <Input
                  id="new-nextdns-id"
                  placeholder="e.g. ndns-xyz789"
                  value={newNextdnsId}
                  onChange={(e) => setNewNextdnsId(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={creatingHome}>
                {creatingHome ? "Creating..." : "Create Home"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Manager Assignments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-blue-600" />
              Home Manager Assignments
            </CardTitle>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setAssignModal(true)}
            >
              <Plus className="h-4 w-4" />
              Assign Manager
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manager</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned Homes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managerData.map((m) => (
                <TableRow key={m.profile.id}>
                  <TableCell className="font-medium">
                    {m.profile.full_name}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {m.profile.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {m.homes.map((h) => (
                        <Badge
                          key={h.home.id}
                          variant="secondary"
                          className="gap-1"
                        >
                          {h.home.name}
                          <span className="text-[10px] text-gray-400">
                            ({h.role_label})
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {m.homes.map((h) => (
                      <Button
                        key={h.home.id}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() =>
                          handleRemoveAssignment(m.profile.id, h.home.id)
                        }
                        title={`Remove from ${h.home.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
              {managerData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-gray-400"
                  >
                    No managers assigned yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Unassigned managers */}
      {managers.filter(
        (m) => !managerData.some((md) => md.profile.id === m.id)
      ).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-amber-700">
              <Users className="h-5 w-5 text-amber-600" />
              Unassigned Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {managers
                .filter(
                  (m) => !managerData.some((md) => md.profile.id === m.id)
                )
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{m.full_name}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAssignUserId(m.id);
                        setAssignModal(true);
                      }}
                    >
                      Assign to Home
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Privacy notice:</strong> As a platform admin, you cannot view
        children&apos;s details, safeguarding reports, or internet activity
        logs. This data is restricted to home managers only.
      </div>

      {/* Assign Manager Modal */}
      <Dialog open={assignModal} onOpenChange={setAssignModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-blue-600" />
              Assign Manager to Home
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Manager</Label>
              <Select
                value={assignUserId}
                onValueChange={(v) => setAssignUserId(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name} ({m.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Home</Label>
              <Select
                value={assignHomeId}
                onValueChange={(v) => setAssignHomeId(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select home" />
                </SelectTrigger>
                <SelectContent>
                  {homes.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select
                value={assignRole}
                onValueChange={(v) => setAssignRole(v ?? "Registered Manager")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Registered Manager">
                    Registered Manager
                  </SelectItem>
                  <SelectItem value="Responsible Individual">
                    Responsible Individual
                  </SelectItem>
                  <SelectItem value="Deputy Manager">
                    Deputy Manager
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAssignManager}
                disabled={!assignUserId || !assignHomeId || assigning}
              >
                {assigning ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

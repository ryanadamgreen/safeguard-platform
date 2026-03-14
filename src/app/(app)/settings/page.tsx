"use client";

import { useEffect, useState } from "react";
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
import { Home, Router, UserPlus, Trash2, Plus, Loader2 } from "lucide-react";
import { useHome } from "@/contexts/home-context";
import { useAuth } from "@/contexts/auth-context";
import { getChildrenByHome } from "@/lib/queries";

export default function SettingsPage() {
  const { selectedHome, loading: homeLoading } = useHome();
  const { loading: authLoading } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

      {/* Children */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-5 w-5 text-[#3730a3]" />
              Children
            </CardTitle>
            <Button size="sm" className="gap-1.5 bg-[#3730a3] hover:bg-[#312e81]">
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
              {children.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-gray-400 py-6">
                    No children added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
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
  Shield,
  Building2,
  Router,
  Users,
  Plus,
} from "lucide-react";
import { homes } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <Shield className="h-7 w-7 text-blue-600" />
          <span className="text-lg font-semibold">SafeGuard Admin</span>
          <Badge variant="secondary" className="ml-2">
            Platform Admin
          </Badge>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
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
              </CardTitle>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Home
              </Button>
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
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add New Home */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-5 w-5 text-blue-600" />
              Create New Home
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-home-name">Home Name</Label>
                <Input id="new-home-name" placeholder="e.g. Oakwood House" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-home-address">Address</Label>
                <Input
                  id="new-home-address"
                  placeholder="Full address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-router-id">Router ID</Label>
                <Input
                  id="new-router-id"
                  placeholder="e.g. unifi-003"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-nextdns-id">NextDNS Profile ID</Label>
                <Input
                  id="new-nextdns-id"
                  placeholder="e.g. ndns-xyz789"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Create Home</Button>
            </div>
          </CardContent>
        </Card>

        {/* Home Manager Assignments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-blue-600" />
                Home Manager Assignments
              </CardTitle>
              <Button size="sm" className="gap-1.5">
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
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Jane Doe</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    jane@example.com
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Badge variant="secondary">Meadow House</Badge>
                      <Badge variant="secondary">Riverside Lodge</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>Registered Manager</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">John Smith</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    john@example.com
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Meadow House</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>Deputy Manager</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Info notice */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <strong>Privacy notice:</strong> As a platform admin, you cannot view
          children&apos;s details, safeguarding reports, or internet activity
          logs. This data is restricted to home managers only.
        </div>
      </div>
    </div>
  );
}

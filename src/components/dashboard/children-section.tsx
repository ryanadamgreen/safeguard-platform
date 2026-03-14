"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Smartphone } from "lucide-react";
import type { Child, Device } from "@/types";

interface ChildrenSectionProps {
  children: Child[];
  devices: Device[];
}

export function ChildrenSection({ children, devices }: ChildrenSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-blue-600" />
          Children
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {children.map((child) => {
            const childDevices = devices.filter(
              (d) => d.child_id === child.id
            );
            return (
              <div
                key={child.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {child.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{child.initials}</p>
                    <p className="text-xs text-gray-500">Age {child.age}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Smartphone className="h-3.5 w-3.5" />
                  {childDevices.length} device
                  {childDevices.length !== 1 ? "s" : ""}
                </div>
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
  );
}

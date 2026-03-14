"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Shield,
  ChevronDown,
  FlaskConical,
} from "lucide-react";
import type { Home } from "@/types";

interface SidebarProps {
  homes: Home[];
  selectedHome: Home;
  onSelectHome: (home: Home) => void;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/simulate", label: "Simulate", icon: FlaskConical },
];

export function Sidebar({ homes, selectedHome, onSelectHome }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <Shield className="h-7 w-7 text-blue-600" />
        <span className="text-lg font-semibold tracking-tight">
          SafeGuard
        </span>
      </div>

      {/* Home selector */}
      <div className="border-b px-4 py-3">
        <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wider">
          Home
        </label>
        <div className="relative">
          <select
            value={selectedHome.id}
            onChange={(e) => {
              const home = homes.find((h) => h.id === e.target.value);
              if (home) onSelectHome(home);
            }}
            className="w-full appearance-none rounded-md border bg-gray-50 px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {homes.map((home) => (
              <option key={home.id} value={home.id}>
                {home.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="border-t px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            JD
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Jane Doe</p>
            <p className="truncate text-xs text-gray-500">Home Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

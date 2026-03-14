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
  LogOut,
  Building2,
  Radar,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useHome } from "@/contexts/home-context";

const managerNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: FileText },
];

const adminNavItems = [
  { href: "/admin", label: "Homes & Managers", icon: Building2 },
  { href: "/dns-monitor", label: "DNS Monitor", icon: Radar },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/simulate", label: "Simulate", icon: FlaskConical },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { homes, selectedHome, setSelectedHome } = useHome();

  const isAdmin = profile?.role === "platform_admin";
  const navItems = isAdmin ? adminNavItems : managerNavItems;

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-white">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3730a3] flex-shrink-0">
          <Shield className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight text-[#1f2937]">
          SafeGuard
        </span>
      </div>

      {/* Home selector — managers only */}
      {!isAdmin && homes.length > 0 && (
        <div className="border-b px-4 py-3">
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wider">
            Home
          </label>
          <div className="relative">
            <select
              value={selectedHome?.id ?? ""}
              onChange={(e) => {
                const home = homes.find((h) => h.id === e.target.value);
                if (home) setSelectedHome(home);
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
      )}

      {/* Admin label */}
      {isAdmin && (
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2">
            <Shield className="h-4 w-4 text-[#3730a3]" />
            <span className="text-sm font-medium text-[#3730a3]">
              Platform Admin
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dbeafe] text-sm font-semibold text-[#2563eb] flex-shrink-0">
              {profile?.full_name
                ? profile.full_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                : "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {profile?.full_name ?? "Loading..."}
              </p>
              <p className="truncate text-xs text-gray-500">
                {isAdmin ? "Platform Admin" : "Home Manager"}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

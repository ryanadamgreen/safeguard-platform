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
    <aside className="hidden md:flex h-screen w-64 flex-col bg-white">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3730a3] flex-shrink-0">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-[#1f2937]">
          SafeGuard
        </span>
      </div>

      {/* Home selector — managers only */}
      {!isAdmin && homes.length > 0 && (
        <div className="px-4 pb-4">
          <label className="mb-1.5 block text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Home
          </label>
          <div className="relative">
            <select
              value={selectedHome?.id ?? ""}
              onChange={(e) => {
                const home = homes.find((h) => h.id === e.target.value);
                if (home) setSelectedHome(home);
              }}
              className="w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]/30 transition-shadow"
            >
              {homes.map((home) => (
                <option key={home.id} value={home.id}>
                  {home.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      )}

      {/* Admin label */}
      {isAdmin && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 rounded-xl bg-[#3730a3]/5 px-3 py-2.5">
            <Shield className="h-4 w-4 text-[#3730a3]" />
            <span className="text-sm font-medium text-[#3730a3]">
              Platform Admin
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-[#3730a3] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-[#1f2937]"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-white/90" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between rounded-xl bg-gray-50/80 px-3 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3730a3]/10 text-sm font-semibold text-[#3730a3] flex-shrink-0">
              {profile?.full_name
                ? profile.full_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                : "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#1f2937]">
                {profile?.full_name ?? "Loading..."}
              </p>
              <p className="truncate text-[11px] text-gray-400">
                {isAdmin ? "Platform Admin" : "Home Manager"}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

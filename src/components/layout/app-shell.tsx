"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { HomeProvider, useHome } from "@/contexts/home-context";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import {
  Shield,
  LayoutDashboard,
  FileText,
  Settings,
  Building2,
  Radar,
  FlaskConical,
  ChevronDown,
  LogOut,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mobile top header
// ---------------------------------------------------------------------------
function MobileHeader() {
  const { profile, signOut } = useAuth();
  const { homes, selectedHome, setSelectedHome } = useHome();
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = profile?.role === "platform_admin";

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("")
    : "?";

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between bg-white/95 backdrop-blur-sm px-4"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3730a3]">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight text-[#1f2937]">SafeGuard</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {!isAdmin && homes.length > 0 && (
            <div className="relative">
              <select
                value={selectedHome?.id ?? ""}
                onChange={(e) => {
                  const home = homes.find((h) => h.id === e.target.value);
                  if (home) setSelectedHome(home);
                }}
                className="appearance-none bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 pr-6 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 max-w-[120px] truncate"
              >
                {homes.map((home) => (
                  <option key={home.id} value={home.id}>
                    {home.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
          )}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3730a3]/10 text-xs font-semibold text-[#3730a3] transition-colors hover:bg-[#3730a3]/20"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* User menu dropdown */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowMenu(false)} />
          <div
            className="fixed right-4 z-[70] rounded-xl bg-white border border-gray-100 shadow-lg p-3 w-56"
            style={{ top: "calc(60px + env(safe-area-inset-top, 0px))" }}
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3730a3]/10 text-sm font-semibold text-[#3730a3] flex-shrink-0">
                {initials}
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
              onClick={() => { setShowMenu(false); signOut(); }}
              className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-[#1f2937] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Mobile bottom tab navigation
// ---------------------------------------------------------------------------
const managerTabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminTabs = [
  { href: "/admin", label: "Homes", icon: Building2 },
  { href: "/dns-monitor", label: "DNS", icon: Radar },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/simulate", label: "Simulate", icon: FlaskConical },
];

function MobileBottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "platform_admin";
  const tabs = isAdmin ? adminTabs : managerTabs;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex bg-white/95 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 pt-2 pb-1 relative"
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#3730a3]" />
            )}
            <Icon
              className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-[#3730a3]" : "text-gray-400"
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-[#3730a3]" : "text-gray-400"
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Inner layout (uses context hooks — must live inside providers)
// ---------------------------------------------------------------------------
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ── Desktop layout ── */}
      <div className="hidden md:flex h-screen bg-[#f8fafc]">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
        </main>
      </div>

      {/* ── Mobile layout ── */}
      <div
        className="flex md:hidden flex-col bg-[#f8fafc]"
        style={{ minHeight: "100dvh" }}
      >
        <MobileHeader />
        <main
          className="flex-1 overflow-auto"
          style={{
            paddingTop: "56px",
            paddingBottom: "calc(56px + env(safe-area-inset-bottom, 8px))",
          }}
        >
          <div className="px-4 py-4">{children}</div>
        </main>
        <MobileBottomNav />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Public export — wraps everything in providers
// ---------------------------------------------------------------------------
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HomeProvider>
        <AppLayout>{children}</AppLayout>
      </HomeProvider>
    </AuthProvider>
  );
}

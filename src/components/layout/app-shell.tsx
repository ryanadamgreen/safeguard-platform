"use client";

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
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mobile top header
// ---------------------------------------------------------------------------
function MobileHeader() {
  const { profile } = useAuth();
  const { homes, selectedHome, setSelectedHome } = useHome();
  const isAdmin = profile?.role === "platform_admin";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3730a3]">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight text-[#1f2937]">SafeGuard</span>
      </div>

      {/* Right side */}
      {isAdmin ? (
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-[#3730a3]">
          Admin
        </span>
      ) : homes.length > 0 ? (
        <div className="relative">
          <select
            value={selectedHome?.id ?? ""}
            onChange={(e) => {
              const home = homes.find((h) => h.id === e.target.value);
              if (home) setSelectedHome(home);
            }}
            className="appearance-none bg-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 pr-6 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[140px] truncate"
          >
            {homes.map((home) => (
              <option key={home.id} value={home.id}>
                {home.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
        </div>
      ) : null}
    </header>
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
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-100 bg-white"
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
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-600" />
            )}
            <Icon
              className={cn(
                "h-5 w-5",
                isActive ? "text-blue-600" : "text-gray-400"
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium",
                isActive ? "text-blue-600" : "text-gray-400"
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
      <div className="hidden md:flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
        </main>
      </div>

      {/* ── Mobile layout ── */}
      <div
        className="flex md:hidden flex-col bg-gray-50"
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

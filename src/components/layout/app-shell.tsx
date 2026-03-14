"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { HomeProvider } from "@/contexts/home-context";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HomeProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
          </main>
        </div>
      </HomeProvider>
    </AuthProvider>
  );
}

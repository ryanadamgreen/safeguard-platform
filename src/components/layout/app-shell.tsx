"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { homes } from "@/lib/mock-data";
import type { Home } from "@/types";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [selectedHome, setSelectedHome] = useState<Home>(homes[0]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        homes={homes}
        selectedHome={selectedHome}
        onSelectHome={setSelectedHome}
      />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}

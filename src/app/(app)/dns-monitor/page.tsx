"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Radar, Pause, Play, Trash2, Loader2, ShieldX, LayoutGrid, List, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { rootDomain, detectService } from "@/lib/app-domains";

interface DnsEntry {
  id: string;
  device_id: string;
  device_name: string | null;
  child_initials: string | null;
  domain: string;
  app_name: string | null;
  blocked: boolean;
  timestamp: string;
}

// App colour palette — consistent colours per app across renders
const APP_COLOURS: Record<string, string> = {
  "Instagram":           "bg-pink-100 text-pink-700",
  "TikTok":              "bg-gray-900 text-white",
  "Snapchat":            "bg-yellow-100 text-yellow-700",
  "X (Twitter)":         "bg-sky-100 text-sky-700",
  "Facebook":            "bg-blue-100 text-blue-700",
  "Discord":             "bg-indigo-100 text-indigo-700",
  "WhatsApp":            "bg-green-100 text-green-700",
  "Telegram":            "bg-sky-100 text-sky-700",
  "Reddit":              "bg-orange-100 text-orange-700",
  "Signal":              "bg-blue-100 text-blue-700",
  "YouTube":             "bg-red-100 text-red-700",
  "Netflix":             "bg-red-100 text-red-700",
  "Disney+":             "bg-blue-100 text-blue-700",
  "Amazon Prime Video":  "bg-sky-100 text-sky-700",
  "Twitch":              "bg-purple-100 text-purple-700",
  "BBC iPlayer":         "bg-red-100 text-red-700",
  "Roblox":              "bg-red-100 text-red-700",
  "Steam":               "bg-gray-100 text-gray-700",
  "Epic Games":          "bg-gray-100 text-gray-700",
  "Fortnite":            "bg-blue-100 text-blue-700",
  "Minecraft":           "bg-green-100 text-green-700",
  "Xbox":                "bg-green-100 text-green-700",
  "PlayStation":         "bg-blue-100 text-blue-700",
  "EA Games":            "bg-gray-100 text-gray-700",
  "Riot Games":          "bg-red-100 text-red-700",
  "Spotify":             "bg-green-100 text-green-700",
  "SoundCloud":          "bg-orange-100 text-orange-700",
  "BeReal":              "bg-gray-100 text-gray-700",
  "Pinterest":           "bg-red-100 text-red-700",
  "LinkedIn":            "bg-blue-100 text-blue-700",
  "Google":              "bg-blue-100 text-blue-700",
  "Amazon":              "bg-orange-100 text-orange-700",
};

function appColour(appName: string): string {
  return APP_COLOURS[appName] ?? "bg-violet-100 text-violet-700";
}

type FilterMode = "all" | "blocked" | "apps";

export default function DnsMonitorPage() {
  const [entries, setEntries] = useState<DnsEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/dns-monitor?limit=200");
      const data = await res.json();
      setEntries(data.data ?? []);
      setTotal(data.meta.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch DNS logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(fetchLogs, 2000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [live]);

  const clearLogs = async () => {
    await fetch("/api/dns-monitor", { method: "DELETE" });
    setEntries([]);
    setTotal(0);
  };

  const blockedCount = entries.filter((e) => e.blocked).length;
  const appEntries = entries.filter((e) => e.app_name !== null);
  const uniqueApps = [...new Set(entries.map((e) => e.app_name).filter(Boolean))] as string[];

  // App summary: { appName → { count, blocked, lastSeen, devices } }
  const appSummary = uniqueApps
    .map((app) => {
      const rows = entries.filter((e) => e.app_name === app);
      return {
        app,
        count: rows.length,
        blocked: rows.filter((r) => r.blocked).length,
        lastSeen: rows[0]?.timestamp ?? null,
        devices: [...new Set(rows.map((r) => r.device_name ?? r.device_id))],
      };
    })
    .sort((a, b) => b.count - a.count);

  const visible =
    filter === "blocked" ? entries.filter((e) => e.blocked) :
    filter === "apps"    ? appEntries :
    entries;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1f2937] flex items-center gap-2">
            <Radar className="h-6 w-6 text-[#2563eb]" />
            DNS Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time DNS queries from all connected SafeGuard devices
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {live && (
            <div className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-700">Live</span>
            </div>
          )}
          <Button size="sm" variant="outline" onClick={() => setLive(!live)} className="gap-1.5">
            {live ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Resume</>}
          </Button>
          <Button size="sm" variant="outline" onClick={clearLogs} className="gap-1.5 text-red-500 hover:text-red-700">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </div>

      {/* Explainer */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p>
          Every website visit triggers DNS lookups for <strong>all resources on the page</strong> — CDNs, analytics, fonts, ads. Visiting <em>npr.org</em> may show <em>piano.io</em>, <em>fastly.net</em>, and others alongside it. The domain you typed will also appear in the list. Apps appear here once their DNS cache expires (usually within a few minutes of opening them).
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-[#1f2937]">{total.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Queries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-[#1f2937]">
              {new Set(entries.map((e) => e.device_id)).size}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Active Devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-[#3730a3]">{uniqueApps.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Apps Detected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* App Summary Cards */}
      {appSummary.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Apps &amp; Services
          </p>
          <div className="flex flex-wrap gap-2">
            {appSummary.map(({ app, count, blocked }) => (
              <button
                key={app}
                onClick={() => setFilter("apps")}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:opacity-80 ${appColour(app)}`}
              >
                {app}
                <span className="opacity-60">{count}</span>
                {blocked > 0 && (
                  <span className="flex items-center gap-0.5 text-red-600">
                    <ShieldX className="h-2.5 w-2.5" />{blocked}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Query log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              Query Log
              <Badge variant="secondary">{visible.length}</Badge>
            </CardTitle>
            {/* Filter tabs */}
            <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs font-medium">
              <button
                onClick={() => setFilter("all")}
                className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${
                  filter === "all" ? "bg-[#1f2937] text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <List className="h-3 w-3" /> All
              </button>
              <button
                onClick={() => setFilter("apps")}
                className={`flex items-center gap-1 px-3 py-1.5 border-l border-gray-200 transition-colors ${
                  filter === "apps" ? "bg-[#3730a3] text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                Apps
                {appEntries.length > 0 && (
                  <span className={`ml-1 rounded-full px-1.5 text-[10px] font-bold ${
                    filter === "apps" ? "bg-indigo-400 text-white" : "bg-indigo-100 text-indigo-600"
                  }`}>
                    {appEntries.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter("blocked")}
                className={`flex items-center gap-1 px-3 py-1.5 border-l border-gray-200 transition-colors ${
                  filter === "blocked" ? "bg-red-600 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <ShieldX className="h-3 w-3" />
                Blocked
                {blockedCount > 0 && (
                  <span className={`ml-1 rounded-full px-1.5 text-[10px] font-bold ${
                    filter === "blocked" ? "bg-red-400 text-white" : "bg-red-100 text-red-600"
                  }`}>
                    {blockedCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {/* Apps summary view */}
          {filter === "apps" && appSummary.length > 0 ? (
            <div className="divide-y">
              {appSummary.map(({ app, count, blocked, lastSeen, devices }) => (
                <div key={app} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-xs border-0 ${appColour(app)}`}>{app}</Badge>
                    <div>
                      <p className="text-xs text-gray-500">
                        {devices.slice(0, 2).join(", ")}
                        {devices.length > 2 && ` +${devices.length - 2} more`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {blocked > 0 && (
                      <span className="flex items-center gap-1 text-red-500">
                        <ShieldX className="h-3 w-3" /> {blocked} blocked
                      </span>
                    )}
                    <span>{count} queries</span>
                    {lastSeen && (
                      <span className="hidden sm:inline">
                        Last: {format(new Date(lastSeen), "HH:mm:ss")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Time</TableHead>
                    <TableHead>Domain / App</TableHead>
                    <TableHead className="w-36">Device</TableHead>
                    <TableHead className="w-16">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((entry, i) => (
                    <TableRow
                      key={`${entry.id ?? entry.timestamp}-${i}`}
                      className={entry.blocked ? "bg-red-50/40" : undefined}
                    >
                      <TableCell className="text-xs text-gray-400 whitespace-nowrap font-mono">
                        {format(new Date(entry.timestamp), "HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {entry.app_name ? (
                            <Badge className={`text-[10px] border-0 px-1.5 py-0 ${appColour(entry.app_name)}`}>
                              {entry.app_name}
                            </Badge>
                          ) : (() => {
                            const svc = detectService(entry.domain);
                            return svc ? (
                              <span className="text-[10px] text-gray-400 font-medium">{svc}</span>
                            ) : null;
                          })()}
                          <p className="font-mono text-xs text-[#1f2937] truncate max-w-[300px]" title={entry.domain}>
                            {entry.domain}
                          </p>
                          {(() => {
                            const root = rootDomain(entry.domain);
                            return root !== entry.domain ? (
                              <p className="text-[10px] text-gray-400">{root}</p>
                            ) : null;
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.child_initials && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#dbeafe] text-[9px] font-bold text-[#2563eb] flex-shrink-0">
                              {entry.child_initials}
                            </span>
                          )}
                          <span className="text-xs text-gray-600 truncate max-w-[110px]" title={entry.device_name ?? entry.device_id}>
                            {entry.device_name ?? (
                              <span className="font-mono text-gray-400">{entry.device_id.slice(0, 8)}…</span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.blocked ? (
                          <Badge className="bg-red-100 text-red-700 border-0 text-[10px] px-1.5 py-0.5 gap-1">
                            <ShieldX className="h-2.5 w-2.5" /> Blocked
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 text-gray-400">
                            Allowed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {visible.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-gray-400 text-sm">
                        {filter === "blocked"
                          ? "No blocked queries in the current view."
                          : filter === "apps"
                          ? "No recognised app traffic yet. Browsing social media, streaming, or gaming apps will appear here."
                          : "No DNS queries received yet. Install a SafeGuard profile on a device to start monitoring."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

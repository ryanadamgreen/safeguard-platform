"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
import {
  Radar, Pause, Play, Trash2, Loader2, ShieldX,
  LayoutGrid, List, Activity, Globe, Smartphone,
} from "lucide-react";
import { format } from "date-fns";
import { rootDomain, detectService, isNoiseDomain } from "@/lib/app-domains";

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
  "Bing":                "bg-teal-100 text-teal-700",
  "DuckDuckGo":          "bg-orange-100 text-orange-700",
};

function appColour(appName: string): string {
  return APP_COLOURS[appName] ?? "bg-violet-100 text-violet-700";
}

// ── Activity grouping ──────────────────────────────────────────────────────

interface ActivityGroup {
  label: string;        // Display name: app name or root domain
  isApp: boolean;       // true = known app, false = website
  root: string;         // Root domain
  count: number;
  blocked: number;
  firstSeen: string;
  lastSeen: string;
  devices: string[];
  childInitials: string[];
  domains: string[];    // All unique subdomains in this group
}

function buildActivityGroups(entries: DnsEntry[]): ActivityGroup[] {
  const map = new Map<string, ActivityGroup>();

  for (const e of entries) {
    // Skip noise
    if (!e.app_name && isNoiseDomain(e.domain)) continue;

    const key = e.app_name ?? rootDomain(e.domain);
    const existing = map.get(key);

    if (existing) {
      existing.count++;
      if (e.blocked) existing.blocked++;
      if (e.timestamp < existing.firstSeen) existing.firstSeen = e.timestamp;
      if (e.timestamp > existing.lastSeen) existing.lastSeen = e.timestamp;
      if (e.device_name && !existing.devices.includes(e.device_name)) existing.devices.push(e.device_name);
      if (e.child_initials && !existing.childInitials.includes(e.child_initials)) existing.childInitials.push(e.child_initials);
      if (!existing.domains.includes(e.domain)) existing.domains.push(e.domain);
    } else {
      map.set(key, {
        label: e.app_name ?? rootDomain(e.domain),
        isApp: !!e.app_name,
        root: rootDomain(e.domain),
        count: 1,
        blocked: e.blocked ? 1 : 0,
        firstSeen: e.timestamp,
        lastSeen: e.timestamp,
        devices: e.device_name ? [e.device_name] : [],
        childInitials: e.child_initials ? [e.child_initials] : [],
        domains: [e.domain],
      });
    }
  }

  return [...map.values()].sort(
    (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
  );
}

// ── Component ──────────────────────────────────────────────────────────────

type FilterMode = "activity" | "all" | "blocked";

export default function DnsMonitorPage() {
  const [entries, setEntries] = useState<DnsEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("activity");
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
  const activityGroups = useMemo(() => buildActivityGroups(entries), [entries]);
  const sitesCount = activityGroups.filter((g) => !g.isApp).length;
  const appsCount = activityGroups.filter((g) => g.isApp).length;

  const visible = filter === "blocked" ? entries.filter((e) => e.blocked) : entries;

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
            Real-time activity from all connected SafeGuard devices
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-[#1f2937]">{sitesCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Sites Visited</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-[#3730a3]">{appsCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Apps Used</p>
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
            <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Main card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {filter === "activity" ? "Activity" : filter === "blocked" ? "Blocked Queries" : "All DNS Queries"}
            </CardTitle>
            {/* Filter tabs */}
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-medium">
              <button
                onClick={() => setFilter("activity")}
                className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${
                  filter === "activity" ? "bg-[#3730a3] text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Activity className="h-3 w-3" /> Activity
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`flex items-center gap-1 px-3 py-1.5 border-l border-gray-200 transition-colors ${
                  filter === "all" ? "bg-[#1f2937] text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <List className="h-3 w-3" /> All
                <span className={`ml-1 rounded-full px-1.5 text-[10px] font-bold ${
                  filter === "all" ? "bg-gray-500 text-white" : "bg-gray-100 text-gray-500"
                }`}>{total}</span>
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
                  }`}>{blockedCount}</span>
                )}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {filter === "activity" ? (
            /* ── Activity view: grouped by site/app, noise filtered ── */
            <div className="divide-y">
              {activityGroups.map((group) => (
                <div key={group.label} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50/50 transition-colors">
                  {/* Icon / badge */}
                  <div className="flex-shrink-0">
                    {group.isApp ? (
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${appColour(group.label)}`}>
                        {group.label.slice(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                        <Globe className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {group.isApp ? (
                        <Badge className={`text-[11px] border-0 px-2 py-0 ${appColour(group.label)}`}>
                          {group.label}
                        </Badge>
                      ) : (
                        <p className="text-sm font-medium text-[#1f2937] truncate">
                          {group.label}
                        </p>
                      )}
                      {group.blocked > 0 && (
                        <Badge className="bg-red-100 text-red-700 border-0 text-[10px] px-1.5 py-0 gap-0.5">
                          <ShieldX className="h-2.5 w-2.5" /> {group.blocked}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                      {group.childInitials.length > 0 && (
                        <span className="flex items-center gap-1">
                          {group.childInitials.map((ci) => (
                            <span key={ci} className="flex h-4 w-4 items-center justify-center rounded-full bg-[#dbeafe] text-[8px] font-bold text-[#2563eb]">
                              {ci}
                            </span>
                          ))}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {group.devices.join(", ") || "Unknown"}
                      </span>
                      <span>{group.count} queries</span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 font-mono">
                      {format(new Date(group.lastSeen), "HH:mm")}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {format(new Date(group.lastSeen), "dd MMM")}
                    </p>
                  </div>
                </div>
              ))}
              {activityGroups.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-sm">
                  No activity yet. Sites and apps will appear here as devices browse the internet.
                </div>
              )}
            </div>
          ) : (
            /* ── Raw log view (All / Blocked) ── */
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
                          ? "No blocked queries."
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

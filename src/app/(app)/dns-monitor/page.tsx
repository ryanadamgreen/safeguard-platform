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
import { Radar, Pause, Play, Trash2, Loader2, ShieldX } from "lucide-react";
import { format } from "date-fns";

interface DnsEntry {
  id: string;
  device_id: string;
  device_name: string | null;
  child_initials: string | null;
  domain: string;
  blocked: boolean;
  timestamp: string;
}

export default function DnsMonitorPage() {
  const [entries, setEntries] = useState<DnsEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState<"all" | "blocked">("all");
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

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(fetchLogs, 2000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [live]);

  const clearLogs = async () => {
    await fetch("/api/dns-monitor", { method: "DELETE" });
    setEntries([]);
    setTotal(0);
  };

  const visible = filter === "blocked" ? entries.filter((e) => e.blocked) : entries;
  const blockedCount = entries.filter((e) => e.blocked).length;

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
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLive(!live)}
            className="gap-1.5"
          >
            {live ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Resume
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clearLogs}
            className="gap-1.5 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        </div>
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
            <p className="text-2xl font-bold text-[#1f2937]">
              {new Set(entries.map((e) => e.domain)).size}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Unique Domains</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Blocked (this page)</p>
          </CardContent>
        </Card>
      </div>

      {/* Query log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              Query Log
              <Badge variant="secondary">{visible.length}</Badge>
            </CardTitle>
            {/* Filter toggle */}
            <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs font-medium">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 transition-colors ${
                  filter === "all"
                    ? "bg-[#1f2937] text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("blocked")}
                className={`px-3 py-1.5 flex items-center gap-1 transition-colors border-l border-gray-200 ${
                  filter === "blocked"
                    ? "bg-red-600 text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <ShieldX className="h-3 w-3" />
                Blocked
                {blockedCount > 0 && (
                  <span
                    className={`ml-1 rounded-full px-1.5 text-[10px] font-bold ${
                      filter === "blocked" ? "bg-red-400 text-white" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {blockedCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Time</TableHead>
                  <TableHead>Domain</TableHead>
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
                    <TableCell className="font-mono text-sm text-[#1f2937]">
                      {entry.domain}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.child_initials && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#dbeafe] text-[9px] font-bold text-[#2563eb] flex-shrink-0">
                            {entry.child_initials}
                          </span>
                        )}
                        <span className="text-xs text-gray-600 truncate max-w-[120px]" title={entry.device_name ?? entry.device_id}>
                          {entry.device_name ?? (
                            <span className="font-mono text-gray-400">
                              {entry.device_id.slice(0, 8)}…
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.blocked ? (
                        <Badge className="bg-red-100 text-red-700 border-0 text-[10px] px-1.5 py-0.5 gap-1">
                          <ShieldX className="h-2.5 w-2.5" />
                          Blocked
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
                    <TableCell
                      colSpan={4}
                      className="py-12 text-center text-gray-400 text-sm"
                    >
                      {filter === "blocked"
                        ? "No blocked queries in the current view."
                        : "No DNS queries received yet. Install a SafeGuard profile on a device to start monitoring."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

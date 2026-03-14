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
import { Radar, Pause, Play, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface DnsEntry {
  device_id: string;
  domain: string;
  timestamp: string;
}

export default function DnsMonitorPage() {
  const [entries, setEntries] = useState<DnsEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/dns-monitor?limit=200");
      const data = await res.json();
      setEntries(data.data);
      setTotal(data.meta.total);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Radar className="h-6 w-6 text-green-600" />
            DNS Monitor
          </h1>
          <p className="text-sm text-gray-500">
            Real-time DNS queries from connected SafeGuard devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          {live && (
            <Badge className="animate-pulse bg-green-100 text-green-800 gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Live
            </Badge>
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
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-gray-500">Total Queries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold">
              {new Set(entries.map((e) => e.device_id)).size}
            </p>
            <p className="text-xs text-gray-500">Devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-bold">
              {new Set(entries.map((e) => e.domain)).size}
            </p>
            <p className="text-xs text-gray-500">Unique Domains</p>
          </CardContent>
        </Card>
      </div>

      {/* Query log table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            Query Log
            <Badge variant="secondary">{entries.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Device ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, i) => (
                  <TableRow key={`${entry.timestamp}-${entry.domain}-${i}`}>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      {format(new Date(entry.timestamp), "HH:mm:ss.SSS")}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry.domain}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {entry.device_id.slice(0, 12)}
                        {entry.device_id.length > 12 ? "…" : ""}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {entries.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-12 text-center text-gray-400"
                    >
                      No DNS queries received yet. Connect the SafeGuard app
                      on an iOS device to start monitoring.
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

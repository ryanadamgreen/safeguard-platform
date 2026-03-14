"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FlaskConical,
  Wifi,
  ShieldAlert,
  Repeat,
  Fingerprint,
  Moon,
  Play,
  Radio,
  Terminal,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface LogEntry {
  time: string;
  scenario: string;
  message: string;
  data: unknown;
}

export default function SimulatePage() {
  const routerSim = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [streamSource, setStreamSource] = useState<EventSource | null>(null);

  useEffect(() => {
    if (!authLoading && profile?.role !== "platform_admin") {
      routerSim.replace("/dashboard");
    }
  }, [authLoading, profile, routerSim]);

  // Form state
  const [alertCategory, setAlertCategory] = useState("gambling");
  const [alertMac, setAlertMac] = useState("AA:BB:CC:11:22:33");
  const [patternCategory, setPatternCategory] = useState("gambling");
  const [patternMac, setPatternMac] = useState("AA:BB:CC:11:22:33");
  const [patternCount, setPatternCount] = useState("5");
  const [macChangeMac, setMacChangeMac] = useState("AA:BB:CC:11:22:33");
  const [lateNightMac, setLateNightMac] = useState("AA:BB:CC:11:22:33");

  const addLog = (scenario: string, message: string, data: unknown) => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), scenario, message, data },
      ...prev.slice(0, 49),
    ]);
  };

  const runScenario = async (
    scenario: string,
    body: Record<string, unknown>
  ) => {
    setLoading(scenario);
    try {
      const res = await fetch("/api/simulate/events/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, ...body }),
      });
      const data = await res.json();
      addLog(scenario, data.message ?? "Done", data.data);
    } catch (err) {
      addLog(scenario, `Error: ${err}`, null);
    } finally {
      setLoading(null);
    }
  };

  const toggleStream = () => {
    if (streamActive && streamSource) {
      streamSource.close();
      setStreamSource(null);
      setStreamActive(false);
      addLog("stream", "Live DNS stream stopped", null);
      return;
    }

    const es = new EventSource("/api/simulate/nextdns/stream");
    es.onmessage = (e) => {
      const entry = JSON.parse(e.data);
      addLog(
        "stream",
        `${entry.status === "blocked" ? "BLOCKED" : "allowed"}: ${entry.domain} (${entry.device_name})`,
        entry
      );
    };
    es.onerror = () => {
      es.close();
      setStreamSource(null);
      setStreamActive(false);
    };
    setStreamSource(es);
    setStreamActive(true);
    addLog("stream", "Live DNS stream started", null);
  };

  const categories = [
    { value: "adult_content", label: "Adult Content" },
    { value: "gambling", label: "Gambling" },
    { value: "violence", label: "Violence" },
    { value: "drugs", label: "Drugs" },
    { value: "self_harm", label: "Self Harm" },
    { value: "proxy_vpn", label: "Proxy / VPN" },
  ];

  const knownMacs = [
    { value: "AA:BB:CC:11:22:33", label: "AB's iPhone" },
    { value: "AA:BB:CC:44:55:66", label: "AB's iPad" },
    { value: "DD:EE:FF:11:22:33", label: "CD's Samsung" },
    { value: "11:22:33:AA:BB:CC", label: "EF's Laptop" },
    { value: "44:55:66:DD:EE:FF", label: "GH's Phone" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-purple-600" />
          Simulation Control Panel
        </h1>
        <p className="text-sm text-gray-500">
          Trigger test scenarios for local development. State resets on server
          restart.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Unknown Device */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wifi className="h-4 w-4 text-amber-600" />
              Unknown Device
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-gray-500">
              Adds a random new device to the network. It will be auto-blocked.
            </p>
            <Button
              size="sm"
              onClick={() => runScenario("unknown_device", {})}
              disabled={loading === "unknown_device"}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              {loading === "unknown_device" ? "Running..." : "Generate"}
            </Button>
          </CardContent>
        </Card>

        {/* Safeguarding Alert */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Safeguarding Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={alertCategory} onValueChange={(v) => setAlertCategory(v ?? "gambling")}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Device</Label>
                <Select value={alertMac} onValueChange={(v) => setAlertMac(v ?? knownMacs[0].value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {knownMacs.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                runScenario("safeguarding_alert", {
                  category: alertCategory,
                  mac: alertMac,
                })
              }
              disabled={loading === "safeguarding_alert"}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              {loading === "safeguarding_alert" ? "Running..." : "Generate"}
            </Button>
          </CardContent>
        </Card>

        {/* Behaviour Pattern */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Repeat className="h-4 w-4 text-orange-600" />
              Behaviour Pattern
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500">
              Generates multiple rapid attempts to trigger a pattern alert.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={patternCategory} onValueChange={(v) => setPatternCategory(v ?? "gambling")}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Device</Label>
                <Select value={patternMac} onValueChange={(v) => setPatternMac(v ?? knownMacs[0].value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {knownMacs.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Count</Label>
                <Input
                  type="number"
                  value={patternCount}
                  onChange={(e) => setPatternCount(e.target.value)}
                  className="h-8 text-xs"
                  min={2}
                  max={20}
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                runScenario("behaviour_pattern", {
                  category: patternCategory,
                  mac: patternMac,
                  count: parseInt(patternCount, 10),
                })
              }
              disabled={loading === "behaviour_pattern"}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              {loading === "behaviour_pattern" ? "Running..." : "Generate"}
            </Button>
          </CardContent>
        </Card>

        {/* MAC Randomisation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Fingerprint className="h-4 w-4 text-blue-600" />
              MAC Randomisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500">
              Simulates a device reconnecting with a new random MAC. The
              fingerprint algorithm should match it.
            </p>
            <div className="space-y-1">
              <Label className="text-xs">Device</Label>
              <Select value={macChangeMac} onValueChange={(v) => setMacChangeMac(v ?? knownMacs[0].value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {knownMacs.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={() =>
                runScenario("mac_change", { mac: macChangeMac })
              }
              disabled={loading === "mac_change"}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              {loading === "mac_change" ? "Running..." : "Randomise"}
            </Button>
          </CardContent>
        </Card>

        {/* Late Night Access */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Moon className="h-4 w-4 text-indigo-600" />
              Late Night Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500">
              Simulates a device attempting access outside permitted hours.
            </p>
            <div className="space-y-1">
              <Label className="text-xs">Device</Label>
              <Select value={lateNightMac} onValueChange={(v) => setLateNightMac(v ?? knownMacs[0].value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {knownMacs.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={() =>
                runScenario("late_night_access", { mac: lateNightMac })
              }
              disabled={loading === "late_night_access"}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              {loading === "late_night_access" ? "Running..." : "Generate"}
            </Button>
          </CardContent>
        </Card>

        {/* Live DNS Stream */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Radio className="h-4 w-4 text-green-600" />
              Live DNS Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500">
              Starts a live Server-Sent Events stream that generates random DNS
              events every 3-8 seconds.
            </p>
            <Button
              size="sm"
              onClick={toggleStream}
              variant={streamActive ? "destructive" : "default"}
              className="gap-1.5"
            >
              <Radio className="h-3.5 w-3.5" />
              {streamActive ? "Stop Stream" : "Start Stream"}
            </Button>
            {streamActive && (
              <Badge className="ml-2 animate-pulse bg-green-100 text-green-800">
                Live
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Terminal className="h-4 w-4 text-gray-600" />
              Event Log
              {logs.length > 0 && (
                <Badge variant="secondary">{logs.length}</Badge>
              )}
            </CardTitle>
            {logs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLogs([])}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              No events yet. Trigger a scenario above.
            </p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-md bg-gray-50 px-3 py-2 font-mono text-xs"
                >
                  <span className="flex-shrink-0 text-gray-400">
                    {log.time}
                  </span>
                  <Badge
                    variant="secondary"
                    className="flex-shrink-0 text-[10px]"
                  >
                    {log.scenario}
                  </Badge>
                  <span className="text-gray-700">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

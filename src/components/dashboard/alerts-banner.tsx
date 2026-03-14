"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SAFEGUARDING_CATEGORY_LABELS } from "@/types";
import type { SafeguardingAlert } from "@/types";
import { format } from "date-fns";

interface AlertsBannerProps {
  alerts: SafeguardingAlert[];
}

export function AlertsBanner({ alerts }: AlertsBannerProps) {
  // Show only the latest 3 alerts, newest first
  const sortedAlerts = [...alerts]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Alerts
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-1">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedAlerts.length === 0 ? (
          <p className="py-2 text-sm text-gray-400">No active alerts.</p>
        ) : (
          <div className="space-y-2">
            {sortedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  alert.type === "pattern"
                    ? "border-red-300 bg-red-50"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <AlertTriangle
                  className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                    alert.type === "pattern"
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      alert.type === "pattern"
                        ? "text-red-800"
                        : "text-amber-800"
                    }`}
                  >
                    {alert.type === "pattern"
                      ? "Behaviour Pattern Detected"
                      : "Safeguarding Alert"}
                  </p>
                  <div
                    className={`mt-0.5 text-xs ${
                      alert.type === "pattern"
                        ? "text-red-700"
                        : "text-amber-700"
                    }`}
                  >
                    <span>Child: {alert.child_initials}</span>
                    <span className="mx-1.5">·</span>
                    <span>
                      {SAFEGUARDING_CATEGORY_LABELS[alert.category]}
                    </span>
                    <span className="mx-1.5">·</span>
                    <span>
                      {format(new Date(alert.timestamp), "HH:mm")}
                    </span>
                    {alert.type === "pattern" && alert.attempts && (
                      <>
                        <span className="mx-1.5">·</span>
                        <span>{alert.attempts} attempts in 24h</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {alerts.length > 3 && (
              <p className="pt-1 text-xs text-gray-400 text-center">
                + {alerts.length - 3} more alert
                {alerts.length - 3 !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

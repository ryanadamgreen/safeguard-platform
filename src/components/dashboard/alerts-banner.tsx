"use client";

import { AlertTriangle } from "lucide-react";
import { SAFEGUARDING_CATEGORY_LABELS } from "@/types";
import type { SafeguardingAlert } from "@/types";
import { format } from "date-fns";

interface AlertsBannerProps {
  alerts: SafeguardingAlert[];
}

export function AlertsBanner({ alerts }: AlertsBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 rounded-lg border p-4 ${
            alert.type === "pattern"
              ? "border-red-300 bg-red-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <AlertTriangle
            className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
              alert.type === "pattern" ? "text-red-600" : "text-amber-600"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-semibold ${
                alert.type === "pattern" ? "text-red-800" : "text-amber-800"
              }`}
            >
              {alert.type === "pattern"
                ? "Behaviour Pattern Detected"
                : "Safeguarding Alert"}
            </p>
            <div
              className={`mt-1 text-sm ${
                alert.type === "pattern" ? "text-red-700" : "text-amber-700"
              }`}
            >
              <span>Child: {alert.child_initials}</span>
              <span className="mx-2">·</span>
              <span>
                Category: {SAFEGUARDING_CATEGORY_LABELS[alert.category]}
              </span>
              <span className="mx-2">·</span>
              <span>Time: {format(new Date(alert.timestamp), "HH:mm")}</span>
              {alert.type === "pattern" && alert.attempts && (
                <>
                  <span className="mx-2">·</span>
                  <span>Attempts: {alert.attempts} in 24 hours</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

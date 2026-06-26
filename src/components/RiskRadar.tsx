"use client";

import { useState } from "react";
import { mockWeatherAlerts } from "@/lib/mockData";
import { AlertTriangle, ShieldAlert, AlertCircle, X } from "lucide-react";

/**
 * RiskRadar — Proactive weather alert system for Al Qua'a.
 * Displays severity-coded dismissible alerts with Arabic + English titles.
 * Uses ultra-modern Dark Mode Glassmorphism UI.
 */
export default function RiskRadar() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleAlerts = mockWeatherAlerts.filter((a) => !dismissed.has(a.id));
  if (visibleAlerts.length === 0) return null;

  const severityStyles = {
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    danger: "border-red-500/30 bg-red-500/10 text-red-200",
    critical: "border-rose-500/40 bg-rose-500/20 text-rose-100 animate-pulse",
  };

  const IconMap = {
    warning: AlertTriangle,
    danger: ShieldAlert,
    critical: AlertCircle,
  };

  return (
    <div className="space-y-3">
      {visibleAlerts.map((alert) => {
        const Icon = IconMap[alert.severity];
        return (
          <div
            key={alert.id}
            className={`relative rounded-xl border p-4 backdrop-blur-lg transition-all duration-300 ${severityStyles[alert.severity]}`}
          >
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
              className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors"
              aria-label="Dismiss alert"
            >
              <X size={18} strokeWidth={1.5} />
            </button>

            <div className="flex items-start gap-3 pr-8">
              <div className="mt-0.5">
                <Icon size={24} strokeWidth={1.5} className="opacity-90" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-xs uppercase tracking-widest opacity-60">
                    {alert.type}
                  </span>
                </div>
                <p className="font-semibold text-base tracking-tight">{alert.title}</p>
                <p className="text-sm opacity-60 mt-0.5 font-medium" dir="rtl">{alert.titleAr}</p>
                <p className="text-sm mt-2 opacity-80 leading-relaxed">{alert.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

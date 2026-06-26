"use client";

import { useState, useEffect } from "react";
import { subscribeToWeatherAlerts } from "@/lib/db";
import type { WeatherAlert } from "@/lib/mockData";
import { AlertTriangle, ShieldAlert, AlertCircle, X } from "lucide-react";

/**
 * RiskRadar — Proactive weather alert system for Al Qua'a.
 * Stargazer Deep Space Theme.
 */
export default function RiskRadar() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToWeatherAlerts((liveAlerts) => {
      setAlerts(liveAlerts);
    });
    return () => unsubscribe();
  }, []);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));
  if (visibleAlerts.length === 0) return null;

  const severityStyles = {
    warning: "border-amber-500/30 bg-amber-950/20 text-amber-200 hover:border-t-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.05)]",
    danger: "border-orange-500/30 bg-orange-950/20 text-orange-200 hover:border-t-orange-400/50 shadow-[0_0_20px_rgba(249,115,22,0.05)]",
    critical: "border-rose-500/40 bg-rose-950/30 text-rose-100 animate-[pulse_3s_ease-in-out_infinite] hover:border-t-rose-400/60 shadow-[0_0_30px_rgba(244,63,94,0.15)]",
  };

  const IconMap = {
    warning: AlertTriangle,
    danger: ShieldAlert,
    critical: AlertCircle,
  };

  return (
    <div className="space-y-4">
      {visibleAlerts.map((alert) => {
        const Icon = IconMap[alert.severity];
        return (
          <div
            key={alert.id}
            className={`relative rounded-xl border border-zinc-800/50 backdrop-blur-md p-4 transition-all duration-500 ease-out hover:-translate-y-1 ${severityStyles[alert.severity]}`}
          >
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
              className="absolute top-3 right-3 text-white/30 hover:text-white/80 transition-colors"
              aria-label="Dismiss alert"
            >
              <X size={18} strokeWidth={1.5} />
            </button>

            <div className="flex items-start gap-3 pr-8">
              <div className="mt-0.5">
                <Icon size={22} strokeWidth={1.5} className="opacity-90" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[10px] uppercase tracking-widest opacity-60">
                    {alert.type}
                  </span>
                </div>
                <p className="font-semibold text-sm tracking-wide uppercase">{alert.title}</p>
                <p className="text-xs opacity-60 mt-0.5 font-medium" dir="rtl">{alert.titleAr}</p>
                <p className="text-sm mt-2 opacity-70 leading-relaxed">{alert.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

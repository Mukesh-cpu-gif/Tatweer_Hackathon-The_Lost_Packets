"use client";

import { useState } from "react";
import { mockWeatherAlerts, type WeatherAlert } from "@/lib/mockData";

/**
 * RiskRadar — Proactive weather alert banner system.
 *
 * Design rationale:
 *  - Glassmorphism (backdrop-blur + semi-transparent bg) for premium layered look
 *  - Severity-coded visuals: warning=amber, danger=red, critical=pulsing red
 *  - Bilingual (EN/AR) titles for Al Qua'a's diverse community
 *  - Dismissible per-alert with smooth exit transitions
 */

/* Maps severity to Tailwind classes for background, border, icon, and badge */
const severityStyles: Record<
  WeatherAlert["severity"],
  { container: string; icon: string; badge: string }
> = {
  warning: {
    container: "bg-amber-950/40 border-amber-500/50 backdrop-blur-md",
    icon: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  },
  danger: {
    container: "bg-red-950/40 border-red-500/50 backdrop-blur-md",
    icon: "text-red-400",
    badge: "bg-red-500/20 text-red-300 border border-red-500/30",
  },
  critical: {
    /* animate-pulse gives a subtle pulsing glow for critical alerts */
    container: "bg-red-950/50 border-red-400/60 backdrop-blur-md animate-pulse",
    icon: "text-red-300",
    badge: "bg-red-400/30 text-red-200 border border-red-400/40",
  },
};

/* Maps weather type to descriptive emoji icon */
const typeIcons: Record<WeatherAlert["type"], string> = {
  sandstorm: "\u{1F32A}\uFE0F",
  heatwave: "\u{1F525}",
  flood: "\u{1F30A}",
};

export default function RiskRadar() {
  /* Track which alerts the user has dismissed */
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleAlerts = mockWeatherAlerts.filter(
    (alert) => !dismissed.has(alert.id)
  );

  /* Don't render anything if all alerts are dismissed */
  if (visibleAlerts.length === 0) return null;

  return (
    <section aria-label="Weather Risk Alerts" className="space-y-3">
      {/* Section header with radar branding */}
      <div className="flex items-center gap-2 px-1">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
        </span>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">
          Risk Radar &mdash; Live Alerts
        </h2>
      </div>

      {visibleAlerts.map((alert) => {
        const styles = severityStyles[alert.severity];

        return (
          <div
            key={alert.id}
            className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ease-out ${styles.container}`}
          >
            {/* Top row: icon, titles, severity badge, dismiss button */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {/* Weather type icon - large for quick recognition */}
                <span className={`text-2xl shrink-0 ${styles.icon}`}>
                  {typeIcons[alert.type]}
                </span>

                <div className="min-w-0">
                  {/* English title */}
                  <h3 className="font-semibold text-white/95 text-sm leading-tight">
                    {alert.title}
                  </h3>
                  {/* Arabic title for bilingual support */}
                  <p className="text-white/60 text-xs mt-0.5 font-medium" dir="rtl">
                    {alert.titleAr}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Severity badge */}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}
                >
                  {alert.severity}
                </span>

                {/* Dismiss button - min 48px touch target for mobile */}
                <button
                  onClick={() =>
                    setDismissed((prev) => new Set(prev).add(alert.id))
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/50 transition-colors hover:bg-white/20 hover:text-white/80 active:scale-95 min-h-[48px] min-w-[48px]"
                  aria-label={`Dismiss ${alert.title} alert`}
                >
                  &#x2715;
                </button>
              </div>
            </div>

            {/* Alert description */}
            <p className="mt-2 text-xs leading-relaxed text-white/70 pl-9">
              {alert.description}
            </p>

            {/* Expiry countdown line */}
            <div className="mt-2 flex items-center gap-1.5 pl-9">
              <span className="text-[10px] text-white/40">
                Expires:{" "}
                {new Date(alert.expiresAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Decorative gradient edge - adds depth to the glassmorphism */}
            <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-gradient-to-b from-current to-transparent opacity-60" />
          </div>
        );
      })}
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import RiskRadar from "@/components/RiskRadar";
import { sosTypes, mockIncidents, type SOSType } from "@/lib/mockData";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/**
 * Aounak Dashboard — The FIRST screen judges see.
 *
 * Architecture:
 *  1. Gradient header with live online/offline indicator
 *  2. RiskRadar weather alert banners
 *  3. 6-category SOS grid (2-col mobile, 3-col desktop)
 *  4. Recent incidents feed with shadcn Cards + status badges
 *  5. Responder dashboard CTA
 *  6. Floating bottom network status bar
 */

/* Status badge color map for incident states */
const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "\u23F3 Pending",
    className: "bg-amber-500/20 text-amber-300",
  },
  accepted: {
    label: "\u{1F680} Accepted",
    className: "bg-emerald-500/20 text-emerald-300",
  },
  resolved: {
    label: "\u2705 Resolved",
    className: "bg-blue-500/20 text-blue-300",
  },
};

/* Maps SOS category IDs to their data for the incident feed */
const sosMap = Object.fromEntries(sosTypes.map((s) => [s.id, s]));

export default function Home() {
  // ── Online/Offline detection ──────────────────────────────────────
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Show most recent 2 incidents for the activity feed
  const recentIncidents = mockIncidents.slice(0, 2);

  return (
    <div className="relative min-h-screen bg-background pb-24">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER — Gradient branding with status indicator
          ═══════════════════════════════════════════════════════════════ */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 px-5 pb-6 pt-8">
        {/* Decorative ambient glow orbs */}
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-500/8 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            {/* App name — bilingual branding */}
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Aounak{" "}
              <span className="text-amber-400 font-semibold">{"\u0639\u064E\u0648\u0652\u0646\u064E\u0643"}</span>
            </h1>
            <p className="mt-0.5 text-xs text-white/50 tracking-wide">
              Al Qua&apos;a Rapid Response Network
            </p>
          </div>

          {/* Live status indicator — pulses when online */}
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              isOnline
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isOnline && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isOnline ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
            </span>
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════════════════════ */}
      <main className="space-y-8 px-5 pt-6">
        {/* ── Risk Radar: Weather Alerts ─────────────────────────────── */}
        <RiskRadar />

        {/* ── SOS Emergency Grid ─────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Emergency SOS
            </h2>
            <Separator className="flex-1 bg-white/10" />
          </div>

          {/* Responsive grid: 2 cols on mobile, 3 cols on md+ screens */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {sosTypes.map((sos: SOSType) => (
              <Link
                key={sos.id}
                href={`/sos?type=${sos.id}`}
                className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${sos.color} p-5 text-center shadow-lg transition-all duration-200 ease-out hover:scale-[1.04] hover:shadow-2xl active:scale-[0.97] min-h-[140px]`}
              >
                {/* Hover glow effect — expanding radial glow behind the card */}
                <div className="absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-white/5" />

                {/* Large emoji icon for instant recognition (4rem = text-[4rem]) */}
                <span className="relative text-[4rem] leading-none drop-shadow-lg transition-transform duration-200 group-hover:scale-110">
                  {sos.icon}
                </span>

                {/* English label */}
                <span className="relative mt-2 text-sm font-bold text-white/95 leading-tight">
                  {sos.label}
                </span>

                {/* Arabic label */}
                <span
                  className="relative mt-0.5 text-[11px] text-white/60 font-medium"
                  dir="rtl"
                >
                  {sos.labelAr}
                </span>

                {/* Subtle bottom edge gradient for depth */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent Activity Feed ───────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Recent Activity
            </h2>
            <Separator className="flex-1 bg-white/10" />
          </div>

          <div className="space-y-3">
            {recentIncidents.map((incident) => {
              const sosInfo = sosMap[incident.type];
              const status = statusConfig[incident.status];

              return (
                <Card
                  key={incident.id}
                  className="border-white/5 bg-white/[0.03] backdrop-blur-sm"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Incident type icon */}
                        <span className="text-2xl">{sosInfo?.icon}</span>
                        <div>
                          <CardTitle className="text-sm text-white/90">
                            {sosInfo?.label ?? incident.type}
                          </CardTitle>
                          <CardDescription className="text-xs text-white/40">
                            {incident.id} &bull; {incident.requesterName}
                          </CardDescription>
                        </div>
                      </div>

                      {/* Status badge — color-coded */}
                      <Badge
                        variant="secondary"
                        className={status?.className}
                      >
                        {status?.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span>
                        Skills: {incident.requiredSkills.join(", ")}
                      </span>
                      <span>
                        {new Date(incident.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* AI Classification callout (if available) */}
                    {incident.aiClassification && (
                      <div className="mt-2 rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 text-xs text-purple-300">
                        {"\u{1F916}"} AI: {incident.aiClassification}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── Responder Dashboard CTA ────────────────────────────────── */}
        <section className="flex flex-col items-center gap-3 pt-2">
          <Link href="/responder" className="w-full">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-base font-semibold border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 transition-all duration-200"
            >
              {"\u{1F6E1}\uFE0F"} Responder Dashboard
            </Button>
          </Link>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          FLOATING BOTTOM BAR — Persistent network status
          ═══════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div
          className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium backdrop-blur-lg transition-colors ${
            isOnline
              ? "bg-emerald-950/80 text-emerald-300 border-t border-emerald-500/20"
              : "bg-red-950/80 text-red-300 border-t border-red-500/20"
          }`}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                isOnline ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
          </span>
          {isOnline
            ? "Connected \u2014 SMS fallback ready"
            : "Offline \u2014 SMS-only mode active"}
        </div>
      </div>
    </div>
  );
}

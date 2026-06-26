"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import RiskRadar from "@/components/RiskRadar";
import { sosTypes, mockIncidents } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Bug, HeartPulse, Tractor, Stethoscope, Droplet, BrainCircuit, ArrowRight } from "lucide-react";

/**
 * Aounak Dashboard — The main landing page.
 * Completely overhauled with Dark Mode Glassmorphism and Lucide SVGs.
 */

const iconMap: Record<string, React.ElementType> = {
  Activity,
  Bug,
  HeartPulse,
  Tractor,
  Stethoscope,
  Droplet,
};

export default function Home() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const timeAgo = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 selection:bg-rose-500/30">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="relative px-5 py-5 max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
              Aounak
              <span className="text-zinc-400 font-medium text-lg" dir="rtl">
                عَوْنَك
              </span>
            </h1>
            <p className="text-zinc-500 text-xs mt-0.5 tracking-wide uppercase">
              Rapid Response Network
            </p>
          </div>
          {/* Live network status indicator */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                  : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse"
              }`}
            />
            <span className="text-xs text-zinc-300 font-medium tracking-wide uppercase">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </header>

      <main className="px-5 py-8 space-y-10 max-w-2xl mx-auto">
        {/* ─── Risk Radar ───────────────────────────────────────── */}
        <RiskRadar />

        {/* ─── Emergency SOS Grid ───────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-rose-500/80 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Emergency SOS</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sosTypes.map((sos) => {
              const Icon = sos.lucideIconName && iconMap[sos.lucideIconName] ? iconMap[sos.lucideIconName] : Activity;
              const style = sos.styleConfig || {
                bg: "bg-zinc-800/50",
                border: "border-white/10",
                text: "text-zinc-300",
                hoverBg: "hover:bg-white/10",
                iconColor: "text-zinc-400"
              };

              return (
                <Link key={sos.id} href={`/sos?type=${sos.id}`}>
                  <div
                    className={`group relative overflow-hidden rounded-2xl ${style.bg} border ${style.border} p-5 text-center transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer backdrop-blur-md`}
                  >
                    <div className={`absolute inset-0 transition-colors duration-300 ${style.hoverBg} opacity-0 group-hover:opacity-100`} />
                    <div className="relative flex flex-col items-center">
                      <Icon size={36} strokeWidth={1.5} className={`${style.iconColor} mb-3 transition-transform duration-300 group-hover:scale-110`} />
                      <div className={`font-semibold ${style.text} text-sm tracking-tight`}>{sos.label}</div>
                      <div className="text-zinc-500 font-medium text-xs mt-1" dir="rtl">
                        {sos.labelAr}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ─── Recent Activity ──────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-amber-500/80 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {mockIncidents.slice(0, 2).map((inc) => {
              const sosType = sosTypes.find((s) => s.id === inc.type);
              const Icon = sosType?.lucideIconName && iconMap[sosType.lucideIconName] ? iconMap[sosType.lucideIconName] : Activity;
              
              return (
                <Card key={inc.id} className="border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl shadow-none">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-full bg-zinc-900/50 border border-white/5">
                           <Icon size={20} strokeWidth={1.5} className="text-zinc-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-100 text-sm tracking-tight">
                            {sosType?.label}
                          </p>
                          <p className="text-xs text-zinc-500 font-medium mt-0.5">
                            {inc.requesterName} · {timeAgo(inc.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          inc.status === "pending"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-medium animate-pulse"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium"
                        }
                      >
                        {inc.status}
                      </Badge>
                    </div>
                    {inc.aiClassification && (
                      <div className="mt-4 flex items-center gap-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3.5 py-2.5">
                        <BrainCircuit size={16} strokeWidth={1.5} className="text-indigo-400" />
                        <span className="text-indigo-300 text-xs font-medium tracking-wide">
                          AI Match: {inc.aiClassification}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      {/* ─── Fixed Bottom Navigation ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/80 backdrop-blur-xl px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse"
              }`}
            />
            <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">
              {isOnline ? "Network Sync OK" : "SMS Fallback Ready"}
            </span>
          </div>
          <Link href="/responder">
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-xl px-5 flex items-center gap-2 h-10"
            >
              <span className="font-medium text-sm">Dispatch Center</span>
              <ArrowRight size={16} strokeWidth={1.5} className="opacity-70" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

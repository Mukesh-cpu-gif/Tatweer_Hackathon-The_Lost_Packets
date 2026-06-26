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
 * Aounak Dashboard — Deep Space & Stargazing Theme
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
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 pb-24 selection:bg-indigo-500/30 overflow-hidden">
      
      {/* ─── Cosmic Nebulas (Background Orbs) ───────────────────── */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-sky-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-zinc-950/40 backdrop-blur-xl border-b border-white/10">
        <div className="relative px-5 py-5 max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 flex items-center gap-2">
              Aounak
              <span className="text-indigo-200/60 font-medium text-lg tracking-normal" dir="rtl">
                عَوْنَك
              </span>
            </h1>
            <p className="text-indigo-200/50 text-xs mt-0.5 tracking-widest uppercase font-medium">
              Rapid Response Network
            </p>
          </div>
          {/* Live network status indicator */}
          <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-700/50 rounded-full px-3 py-1.5 backdrop-blur-md">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                  : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse"
              }`}
            />
            <span className="text-xs text-indigo-100/70 font-semibold tracking-widest uppercase">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-5 py-8 space-y-10 max-w-2xl mx-auto">
        {/* ─── Risk Radar ───────────────────────────────────────── */}
        <RiskRadar />

        {/* ─── Emergency SOS Grid ───────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
            <h2 className="text-lg font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              Emergency SOS
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sosTypes.map((sos) => {
              const Icon = sos.lucideIconName && iconMap[sos.lucideIconName] ? iconMap[sos.lucideIconName] : Activity;
              const style = sos.styleConfig || {
                bg: "bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 hover:bg-white/5",
                border: "border-white/10",
                text: "text-zinc-300",
                hoverBg: "hover:bg-white/10",
                iconColor: "text-zinc-400"
              };

              return (
                <Link key={sos.id} href={`/sos?type=${sos.id}`}>
                  <div
                    className={`group relative overflow-hidden rounded-2xl p-5 text-center cursor-pointer ${style.bg}`}
                  >
                    <div className="relative flex flex-col items-center">
                      <Icon size={32} strokeWidth={1.5} className={`${style.iconColor} mb-3 transition-transform duration-500 group-hover:scale-110`} />
                      <div className={`font-semibold ${style.text} text-sm tracking-wide uppercase`}>{sos.label}</div>
                      <div className="text-indigo-200/50 font-medium text-xs mt-1" dir="rtl">
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
            <h2 className="text-lg font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              Recent Activity
            </h2>
          </div>
          <div className="space-y-4">
            {mockIncidents.slice(0, 2).map((inc) => {
              const sosType = sosTypes.find((s) => s.id === inc.type);
              const Icon = sosType?.lucideIconName && iconMap[sosType.lucideIconName] ? iconMap[sosType.lucideIconName] : Activity;
              
              return (
                <Card key={inc.id} className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-md rounded-2xl shadow-none hover:-translate-y-1 hover:border-t-indigo-500/30 transition-all duration-500">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-full bg-zinc-950/50 border border-zinc-800">
                           <Icon size={20} strokeWidth={1.5} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-200 text-sm tracking-wide uppercase">
                            {sosType?.label}
                          </p>
                          <p className="text-xs text-indigo-200/50 font-medium mt-0.5">
                            {inc.requesterName} · {timeAgo(inc.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          inc.status === "pending"
                            ? "bg-amber-950/30 border-amber-500/30 text-amber-400 font-medium animate-pulse"
                            : "bg-emerald-950/30 border-emerald-500/30 text-emerald-400 font-medium"
                        }
                      >
                        {inc.status}
                      </Badge>
                    </div>
                    {inc.aiClassification && (
                      <div className="mt-4 flex items-center gap-2.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl px-3.5 py-2.5">
                        <BrainCircuit size={16} strokeWidth={1.5} className="text-indigo-400" />
                        <span className="text-indigo-300 text-xs font-medium tracking-wider uppercase">
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
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/60 backdrop-blur-xl px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse"
              }`}
            />
            <span className="text-xs text-indigo-200/60 font-medium tracking-widest uppercase">
              {isOnline ? "Network Sync OK" : "SMS Fallback Ready"}
            </span>
          </div>
          <Link href="/responder">
            <Button
              variant="outline"
              className="border-zinc-700/50 bg-zinc-900/50 text-zinc-300 hover:bg-indigo-950/50 hover:text-indigo-200 hover:border-indigo-500/30 transition-all duration-300 rounded-xl px-5 flex items-center gap-2 h-10"
            >
              <span className="font-semibold tracking-wide uppercase text-xs">Dispatch Center</span>
              <ArrowRight size={16} strokeWidth={1.5} className="opacity-70" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

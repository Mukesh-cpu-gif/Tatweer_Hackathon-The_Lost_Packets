"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MapWrapper from "@/components/MapWrapper";
import { ChevronLeft, Navigation2, Timer, Map as MapIcon, Route, Compass } from "lucide-react";
import { useState } from "react";

/**
 * Mock Dune vs. Paved Route Comparison Page — Deep Space Aesthetic
 */
export default function MapComparison() {
  const [navigating, setNavigating] = useState(false);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 pb-24 selection:bg-indigo-500/30 overflow-hidden">
      
      {/* ─── Cosmic Nebulas ───────────────────────────────────── */}
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-zinc-950/40 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="px-5 py-4 max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/responder">
              <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 -ml-2 rounded-full h-10 w-10 p-0">
                <ChevronLeft size={24} strokeWidth={1.5} />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                Route Analysis
              </h1>
              <p className="text-indigo-200/50 text-[10px] tracking-widest uppercase font-medium">
                Dune vs Paved Comparison
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-indigo-950/30 border-indigo-500/30 text-indigo-300 font-bold tracking-widest text-[10px] uppercase">
            ID: VST-892
          </Badge>
        </div>
      </header>

      <main className="relative z-10 px-5 py-6 space-y-6 max-w-2xl mx-auto">
        
        {/* ─── Summary Card ────────────────────────────────────── */}
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 flex items-center gap-4 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-emerald-400">35m</span>
          </div>
          <div>
            <h3 className="text-emerald-300 text-sm font-bold tracking-widest uppercase mb-1">Massive Time Save</h3>
            <p className="text-emerald-200/70 text-xs font-medium leading-relaxed tracking-wide">
              Aounak saves 35 minutes by routing through accessible dune paths instead of standard highway detours.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ─── Standard Road Route ────────────────────────────── */}
          <Card className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none">
            <CardHeader className="pb-3 border-b border-zinc-800/50 bg-zinc-950/30">
              <CardTitle className="text-xs font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
                <Route size={16} /> Standard Road Route
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Timer size={16} />
                  <span className="font-mono text-sm">47 mins</span>
                </div>
                <Badge variant="outline" className="bg-zinc-900/50 border-zinc-700 text-zinc-400 text-[10px] tracking-widest uppercase">
                  38 km
                </Badge>
              </div>

              {/* Interactive map */}
              <div className="relative h-48 bg-zinc-950/80 rounded-xl border border-zinc-800/50 overflow-hidden">
                <MapWrapper
                  routeType="paved"
                  start={[23.5410, 55.4890]}
                  end={[23.5450, 55.4900]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px] tracking-widest uppercase font-bold text-zinc-500">
                <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/50 text-center">Via E95 Highway</div>
                <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/50 text-center">Paved Road</div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Aounak Dune Route ──────────────────────────────── */}
          <Card className="bg-zinc-900/40 backdrop-blur-md border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.05)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-3 border-b border-amber-900/30 bg-amber-950/10">
              <CardTitle className="text-xs font-bold tracking-widest uppercase text-amber-400 flex items-center gap-2">
                <Compass size={16} /> Aounak Dune Route
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300">
                  <Timer size={16} />
                  <span className="font-mono text-xl font-bold">12 mins</span>
                </div>
                <Badge variant="outline" className="bg-amber-950/40 border-amber-500/30 text-amber-400 text-[10px] tracking-widest uppercase shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  4.2 km
                </Badge>
              </div>

              {/* Interactive map */}
              <div className="relative h-48 bg-zinc-950/80 rounded-xl border border-amber-500/30 overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <MapWrapper
                  routeType="dune"
                  start={[23.5410, 55.4890]}
                  end={[23.5450, 55.4900]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px] tracking-widest uppercase font-bold text-amber-400/70">
                <div className="bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30 text-center">Line of Sight</div>
                <div className="bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30 text-center">Sand Dune</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Navigation Details ─────────────────────────────── */}
        <Card className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-zinc-950 border border-zinc-800/50">
                <MapIcon size={20} className="text-indigo-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Start Coordinates</p>
                <p className="font-mono text-zinc-300 text-sm tracking-tight">23.5410° N, 55.4890° E</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Incident Coords</p>
              <p className="font-mono text-zinc-300 text-sm tracking-tight">23.5450° N, 55.4900° E</p>
            </div>
          </CardContent>
        </Card>

        {/* ─── Action Button ────────────────────────────────────── */}
        <div className="pt-4 pb-8">
          <Button 
            onClick={() => setNavigating(true)}
            className={`w-full h-14 rounded-xl font-bold tracking-widest uppercase text-sm transition-all duration-500 ${
              navigating 
                ? "bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
            }`}
          >
            {navigating ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Navigating Dune Route...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Navigation2 size={18} strokeWidth={2} />
                Start Off-Road Navigation
              </span>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}

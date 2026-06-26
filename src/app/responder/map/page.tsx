"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MapWrapper from "@/components/MapWrapper";

/**
 * Mock Dune vs. Paved Route Comparison Page.
 * Demonstrates how Aounak's off-road routing saves critical time
 * compared to standard paved-road navigation algorithms.
 */
export default function RouteMapPage() {
  return (
    <div className="min-h-screen bg-background pb-8">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-lg">
        <div className="px-5 py-4 flex items-center gap-3">
          <Link
            href="/responder"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-white font-bold">Route Comparison</h1>
            <p className="text-xs text-slate-400">Incident INC-1042 · Vehicle Stuck</p>
          </div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-6 max-w-2xl mx-auto">
        {/* ─── Route Comparison Cards ───────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Standard Road Route (slow) */}
          <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-slate-500" />
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-300">Standard Road</h3>
                <Badge variant="outline" className="border-slate-500 text-slate-400">
                  Google Maps
                </Badge>
              </div>

              {/* Interactive map replacing the SVG */}
              <div className="relative h-48 bg-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
                <MapWrapper
                  routeType="paved"
                  start={[23.5410, 55.4890]}
                  end={[23.5450, 55.4900]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Distance</p>
                  <p className="text-xl font-bold text-slate-300">38 km</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ETA</p>
                  <p className="text-xl font-bold text-slate-300">47 min</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                ⚠ Follows paved highway — loops around the entire dune belt
              </p>
            </CardContent>
          </Card>

          {/* Aounak Dune Route (fast) */}
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-800/50 backdrop-blur-sm overflow-hidden ring-1 ring-amber-500/20">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-400" />
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-300">Aounak Dune Route</h3>
                <Badge className="bg-amber-600/80 text-amber-100">
                  ⚡ Recommended
                </Badge>
              </div>

              {/* Interactive map replacing the SVG */}
              <div className="relative h-48 bg-slate-900/60 rounded-xl border border-amber-500/20 overflow-hidden">
                <MapWrapper
                  routeType="dune"
                  start={[23.5410, 55.4890]}
                  end={[23.5450, 55.4900]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-amber-500/70">Distance</p>
                  <p className="text-xl font-bold text-amber-300">4.2 km</p>
                </div>
                <div>
                  <p className="text-xs text-amber-500/70">ETA</p>
                  <p className="text-xl font-bold text-amber-300">12 min</p>
                </div>
              </div>
              <p className="text-xs text-amber-400/70">
                ⚡ Direct off-road path through accessible dune corridors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Savings Summary ──────────────────────────────────── */}
        <Card className="border-green-500/30 bg-green-950/20 backdrop-blur-sm">
          <CardContent className="pt-5 space-y-3">
            <h3 className="font-bold text-green-300 text-center text-lg">
              Aounak saves 35 minutes
            </h3>
            <p className="text-sm text-green-200/70 text-center">
              By routing through accessible dune paths instead of the paved highway
              detour — critical minutes in a desert emergency.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">74%</p>
                <p className="text-xs text-green-400/60">Faster</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">33.8 km</p>
                <p className="text-xs text-green-400/60">Shorter</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">4x4</p>
                <p className="text-xs text-green-400/60">Required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Waypoint Details ─────────────────────────────────── */}
        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="pt-5 space-y-3">
            <h3 className="font-bold text-white">Waypoint Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Start (Your Location)</p>
                <p className="font-mono text-slate-300">23.5410°N, 55.4890°E</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">End (Incident)</p>
                <p className="font-mono text-slate-300">23.5450°N, 55.4900°E</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Terrain</p>
                <p className="text-slate-300">Packed sand + soft dune crossing</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Vehicle Clearance</p>
                <p className="text-slate-300">High clearance 4x4 recommended</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Start Navigation Button ──────────────────────────── */}
        <Button className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-lg py-6 rounded-2xl shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-95">
          🧭 Start Navigation
        </Button>
      </main>
    </div>
  );
}

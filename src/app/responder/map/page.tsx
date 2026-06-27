"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { GlassPanel } from "@/components/GlassPanel";
import { StatusPill } from "@/components/StatusPill";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MapWrapper from "@/components/MapWrapper";
import { ChevronLeft, Navigation2, Timer, Map as MapIcon, Route, Compass, Maximize2, X, AlertTriangle } from "lucide-react";
import { getIncidentById } from "@/lib/db";
import type { Incident } from "@/lib/mockData";

const fallbackResponderCoords: [number, number] = [23.543, 55.487];

const hasBrowserGeolocation = () => {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
};

/**
 * Route Comparison Content — Handles Geolocation, Fallbacks, and Map Rendering
 */
function MapContent() {
  const searchParams = useSearchParams();
  const incidentId = searchParams.get("incidentId");

  const [navigating, setNavigating] = useState(false);
  const [fullscreenMap, setFullscreenMap] = useState<"paved" | "dune" | null>(null);

  const [responderCoords, setResponderCoords] = useState<[number, number] | null>(() =>
    hasBrowserGeolocation() ? null : fallbackResponderCoords
  );
  const [geoError, setGeoError] = useState<string | null>(() =>
    hasBrowserGeolocation() ? null : "Geolocation not supported by device."
  );
  const [incidentLookup, setIncidentLookup] = useState<{ id: string; incident: Incident | null } | null>(null);

  useEffect(() => {
    if (!incidentId) return;

    let active = true;
    getIncidentById(incidentId)
      .then((nextIncident) => {
        if (active) {
          setIncidentLookup({ id: incidentId, incident: nextIncident });
        }
      })
      .catch((error) => {
        console.error("Incident lookup failed", error);
        if (active) {
          setIncidentLookup({ id: incidentId, incident: null });
        }
      });

    return () => {
      active = false;
    };
  }, [incidentId]);

  useEffect(() => {
    if (!hasBrowserGeolocation()) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setResponderCoords([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error("Geo error:", error);
        setGeoError("GPS blocked or unavailable. Using fallback Al Qua'a location.");
        setResponderCoords(fallbackResponderCoords);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  // Prevent scroll when fullscreen
  useEffect(() => {
    if (fullscreenMap) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [fullscreenMap]);

  const loading = Boolean(incidentId && incidentLookup?.id !== incidentId);
  const incident = incidentLookup?.id === incidentId ? incidentLookup.incident : null;

  if (loading) {
    return (
      <main className="relative z-10 mx-auto max-w-2xl space-y-4 px-5 py-8">
        <GlassPanel tone="system" className="p-5">
          <Skeleton className="mb-4 h-4 w-48" />
          <Skeleton className="h-56 w-full" />
          <p className="mt-4 text-center text-sm font-bold uppercase tracking-widest text-zinc-400">
            Fetching Incident Coordinates...
          </p>
        </GlassPanel>
      </main>
    );
  }

  if (!incident) {
    return (
      <div className="p-8 text-center">
        <Alert variant="warning" className="mb-4">
          <AlertTitle>Incident Not Found</AlertTitle>
          <AlertDescription>Return to dispatch and select another active request.</AlertDescription>
        </Alert>
        <Link href="/responder">
          <Button variant="outline" className="border-zinc-700">Return to Dispatch</Button>
        </Link>
      </div>
    );
  }

  const incidentCoords: [number, number] = [incident.location.lat, incident.location.lng];

  return (
    <>
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
          <StatusPill tone="system">ID: {incident.id}</StatusPill>
        </div>
      </header>

      <main className="relative z-10 px-5 py-6 space-y-6 max-w-2xl mx-auto">
        
        {/* Geo Warning Banner */}
        {geoError && (
          <Alert variant="warning">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <AlertDescription>
              {geoError} This happens on local networks or if permissions are denied.
            </AlertDescription>
          </div>
          </Alert>
        )}

        {/* Post-Deployment Notice Banner */}
        <Alert variant="system">
        <div className="flex items-start gap-3">
          <Compass size={18} className="text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
          <AlertDescription>
            <strong>Post-Deployment Note:</strong> Advanced hardware features (Live Compass Direct Bearing and Real-Time Mobile GPS tracking) require a secure HTTPS connection and will be completed once the project is deployed.
          </AlertDescription>
        </div>
        </Alert>

        {/* ─── Summary Card ────────────────────────────────────── */}
        <GlassPanel tone="success" className="flex items-center gap-4 p-5">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-emerald-400">35m</span>
          </div>
          <div>
            <h3 className="text-emerald-300 text-sm font-bold tracking-widest uppercase mb-1">Prototype Route Estimate</h3>
            <p className="text-emerald-200/70 text-xs font-medium leading-relaxed tracking-wide">
              Hackathon demo data compares a 12-minute off-road route with a 47-minute paved detour for this incident.
            </p>
          </div>
        </GlassPanel>

        {!responderCoords ? (
          <GlassPanel className="flex h-64 flex-col items-center justify-center border-dashed border-zinc-800/80 p-5">
            <Skeleton className="mb-3 h-10 w-10 rounded-full" />
            <Skeleton className="mb-4 h-4 w-48" />
            <p className="text-zinc-500 text-sm font-medium tracking-wide">Acquiring GPS Signal...</p>
          </GlassPanel>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* ─── Standard Road Route ────────────────────────────── */}
            <Card className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none">
              <CardHeader className="pb-3 border-b border-zinc-800/50 bg-zinc-950/30">
                <CardTitle className="text-xs font-bold tracking-widest uppercase text-zinc-400 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Route size={16} /> Standard Road Route</div>
                  <button onClick={() => setFullscreenMap("paved")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <Maximize2 size={16} />
                  </button>
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

                <div className="relative h-48 bg-zinc-950/80 rounded-xl border border-zinc-800/50 overflow-hidden group">
                  <MapWrapper routeType="paved" start={responderCoords} end={incidentCoords} />
                </div>
              </CardContent>
            </Card>

            {/* ─── Aounak Dune Route ──────────────────────────────── */}
            <Card className="bg-zinc-900/40 backdrop-blur-md border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.05)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
              <CardHeader className="pb-3 border-b border-amber-900/30 bg-amber-950/10 relative z-10">
                <CardTitle className="text-xs font-bold tracking-widest uppercase text-amber-400 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Compass size={16} /> Aounak Dune Route</div>
                  <button onClick={() => setFullscreenMap("dune")} className="text-amber-500/70 hover:text-amber-300 transition-colors">
                    <Maximize2 size={16} />
                  </button>
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

                <div className="relative h-48 bg-zinc-950/80 rounded-xl border border-amber-500/30 overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  <MapWrapper routeType="dune" start={responderCoords} end={incidentCoords} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Navigation Details ─────────────────────────────── */}
        <Card className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-zinc-950 border border-zinc-800/50">
                <MapIcon size={20} className="text-indigo-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Your Position</p>
                <p className="font-mono text-zinc-300 text-sm tracking-tight">
                  {responderCoords ? `${responderCoords[0].toFixed(4)}°, ${responderCoords[1].toFixed(4)}°` : "---"}
                </p>
              </div>
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

      {/* ─── Fullscreen Map Modal ──────────────────────────────── */}
      {fullscreenMap && responderCoords && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col">
          <div className="p-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 flex justify-between items-center absolute top-0 left-0 right-0 z-10">
            <h2 className={`font-bold tracking-widest uppercase text-xs ${fullscreenMap === "dune" ? "text-amber-400" : "text-zinc-300"}`}>
              {fullscreenMap === "dune" ? "Aounak Dune Route" : "Standard Road Route"}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setFullscreenMap(null)} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <X size={24} />
            </Button>
          </div>
          <div className="flex-1 w-full h-full pt-14">
            <MapWrapper routeType={fullscreenMap} start={responderCoords} end={incidentCoords} />
          </div>
        </div>
      )}

    </>
  );
}

export default function MapComparison() {
  return (
    <div className="relative min-h-screen bg-zinc-950 pb-24 selection:bg-indigo-500/30 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(49,46,129,0.34),transparent_55%),linear-gradient(to_bottom,rgba(12,10,9,0.08),rgba(9,9,11,0.97))]" />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest">Loading Route Data...</div>}>
        <MapContent />
      </Suspense>
    </div>
  );
}

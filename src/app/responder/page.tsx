"use client";

import { useState } from "react";
import Link from "next/link";
import { mockIncidents, mockResponders, sosTypes } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/**
 * Responder Dashboard — The dispatch center for community volunteers.
 * Shows skill-matched incidents, responder profile, and accept/route actions.
 */
export default function ResponderDashboard() {
  // Mock current responder (Ahmed Al Dhaheri)
  const currentResponder = mockResponders[0];
  const [isAvailable, setIsAvailable] = useState(currentResponder.available);

  /** Calculate a human-readable "time ago" from an ISO timestamp */
  const timeAgo = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-slate-700/50">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900" />
        <div className="relative px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Exit to Home
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-xs text-blue-300 font-medium">DISPATCH ACTIVE</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Faza&apos;a Dispatch</h1>
          <p className="text-slate-400 text-sm mt-1">Community Response Center</p>
        </div>
      </header>

      <main className="px-5 py-6 space-y-8 max-w-2xl mx-auto">
        {/* ─── Responder Profile ────────────────────────────────── */}
        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-bold text-lg">{currentResponder.name}</p>
                <p className="text-slate-400 text-sm">{currentResponder.vehicleType}</p>
              </div>
              {/* Availability toggle */}
              <button
                onClick={() => setIsAvailable(!isAvailable)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                  isAvailable ? "bg-green-600" : "bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${
                    isAvailable ? "translate-x-7" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentResponder.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="border-blue-500/40 text-blue-300 text-xs"
                >
                  {skill}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {isAvailable
                ? "✓ You are visible to nearby emergencies"
                : "⏸ You are hidden from dispatch"}
            </p>
          </CardContent>
        </Card>

        <Separator className="bg-slate-700/50" />

        {/* ─── Active Incidents ─────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-red-500 rounded-full" />
            Active Incidents
            <Badge className="bg-red-600/80 text-red-100 ml-2">
              {mockIncidents.filter((i) => i.status === "pending").length} Pending
            </Badge>
          </h2>

          <div className="space-y-4">
            {mockIncidents.map((inc) => {
              const sosType = sosTypes.find((s) => s.id === inc.type);
              return (
                <Card
                  key={inc.id}
                  className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm overflow-hidden"
                >
                  {/* Status bar at top */}
                  <div
                    className={`h-1 ${
                      inc.status === "pending"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-green-500"
                    }`}
                  />
                  <CardContent className="pt-4 pb-5 space-y-4">
                    {/* Incident header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{sosType?.icon}</span>
                        <div>
                          <p className="font-bold text-white">{sosType?.label}</p>
                          <p className="text-xs text-slate-400">
                            {inc.requesterName} · {timeAgo(inc.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          inc.status === "pending"
                            ? "bg-amber-600/80 text-amber-100"
                            : "bg-green-600/80 text-green-100"
                        }
                      >
                        {inc.status}
                      </Badge>
                    </div>

                    {/* Required skills */}
                    <div className="flex flex-wrap gap-1.5">
                      {inc.requiredSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="border-amber-500/40 text-amber-300 text-xs"
                        >
                          Needs: {skill}
                        </Badge>
                      ))}
                    </div>

                    {/* AI Classification if present */}
                    {inc.aiClassification && (
                      <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/30 rounded-lg px-3 py-2">
                        <span>🧠</span>
                        <span className="text-purple-300 text-sm font-medium">
                          AI: {inc.aiClassification}
                        </span>
                      </div>
                    )}

                    {/* Coordinates */}
                    <p className="font-mono text-xs text-slate-500">
                      📍 {inc.location.lat.toFixed(4)}, {inc.location.lng.toFixed(4)}
                    </p>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Link href="/responder/map" className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                          🗺 View Dune Route
                        </Button>
                      </Link>
                      <Button className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold">
                        ✓ Accept (On My Way)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

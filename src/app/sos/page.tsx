"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import OfflineAnimalAI from "@/components/OfflineAnimalAI";
import { sosTypes, mockResponders } from "@/lib/mockData";
import { calculateDistance } from "@/lib/geo";
import { generateSmsDeepLink } from "@/lib/sms";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * SOSPageContent — Active emergency screen.
 * Captures GPS, identifies threats with AI, finds nearby responders,
 * and provides first-aid guidance + offline SMS fallback.
 */
function SOSPageContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") || "medical";
  const sosType = sosTypes.find((s) => s.id === typeParam) || sosTypes[2];

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"loading" | "success" | "error">("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsStatus("success");
        },
        () => {
          // Fallback to mock Al Qua'a coordinates if GPS fails
          setCoords({ lat: 23.543, lng: 55.487 });
          setGpsStatus("success");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setTimeout(() => {
        setCoords({ lat: 23.543, lng: 55.487 });
        setGpsStatus("success");
      }, 0);
    }
  }, []);

  /** Copy coordinates to clipboard */
  const copyCoords = useCallback(() => {
    if (!coords) return;
    navigator.clipboard.writeText(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [coords]);

  /** Calculate sorted nearby responders that match the required skills */
  const nearbyResponders = coords
    ? mockResponders
        .filter((r) => r.available)
        .filter((r) => r.skills.some((s) => sosType.requiredSkills.includes(s)))
        .map((r) => ({
          ...r,
          distanceKm: calculateDistance(coords, r.location),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 3)
    : [];

  /** Trigger the zero-data SMS fallback */
  const handleSendSMS = () => {
    if (!coords) return;
    const smsLink = generateSmsDeepLink(
      "+971501234567",
      sosType.label,
      coords,
      sosType.id === "snake_bite" ? "Possible venomous snake" : ""
    );
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = smsLink;
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className={`relative overflow-hidden border-b border-slate-700/50`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${sosType.color} opacity-30`} />
        <div className="relative px-5 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-3"
          >
            ← Back to Safety
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{sosType.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-white">{sosType.label}</h1>
              <p className="text-slate-400 text-sm" dir="rtl">{sosType.labelAr}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                  Active Emergency
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-6 max-w-2xl mx-auto">
        {/* ─── GPS Location ─────────────────────────────────────── */}
        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📡</span>
              <h2 className="font-bold text-white">GPS Location</h2>
            </div>
            {gpsStatus === "loading" ? (
              <div className="flex items-center gap-3 text-slate-400">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Acquiring satellite signal...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="font-mono text-sm text-green-300">
                    {coords?.lat.toFixed(6)}, {coords?.lng.toFixed(6)}
                  </span>
                </div>
                <button
                  onClick={copyCoords}
                  className="text-xs bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {copied ? "✓ Copied!" : "📋 Copy Coordinates"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Offline AI Animal ID (only for creature emergencies) */}
        {(sosType.id === "snake_bite" || sosType.id === "scorpion_sting") && (
          <OfflineAnimalAI />
        )}

        {/* ─── Nearby Responders (Skill-Tag Dispatch) ───────────── */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-green-500 rounded-full" />
            Nearby Responders
          </h2>
          {nearbyResponders.length === 0 ? (
            <p className="text-slate-400 text-sm">Searching for qualified responders...</p>
          ) : (
            <div className="space-y-3">
              {nearbyResponders.map((r, i) => (
                <Card key={r.id} className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-white flex items-center gap-2">
                          {i === 0 && <span className="text-green-400 text-xs">● NEAREST</span>}
                          {r.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {r.vehicleType} · {r.distanceKm?.toFixed(1)} km away
                        </p>
                      </div>
                      <Badge className="bg-green-600/80 text-green-100 text-xs">
                        On My Way
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {r.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="border-slate-600 text-slate-300 text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* ─── First Aid Guidance (Cached Offline) ──────────────── */}
        <Card className="border-blue-500/30 bg-blue-950/30 backdrop-blur-sm">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🩺</span>
              <h2 className="font-bold text-blue-300">First Aid Guidance (Offline)</h2>
            </div>
            <ol className="space-y-2">
              {sosType.firstAid.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-blue-200/80">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-800/60 flex items-center justify-center text-xs font-bold text-blue-300">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* ─── Send Offline SMS (Zero Data Fallback) ────────────── */}
        <button
          onClick={handleSendSMS}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg py-5 rounded-2xl shadow-lg shadow-red-500/20 transition-all duration-200 active:scale-95 animate-pulse"
        >
          🆘 Send Offline SMS (Zero Data)
        </button>
        <p className="text-center text-xs text-slate-500">
          Uses native SMS — works with no internet connection
        </p>
      </main>
    </div>
  );
}

/** Wrap in Suspense for useSearchParams() compatibility */
export default function SosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SOSPageContent />
    </Suspense>
  );
}

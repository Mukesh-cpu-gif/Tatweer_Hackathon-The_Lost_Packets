"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { sosTypes, mockResponders } from "@/lib/mockData";
import { calculateDistance } from "@/lib/geo";
import { generateSmsDeepLink } from "@/lib/sms";
import OfflineAnimalAI from "@/components/OfflineAnimalAI";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Copy, CheckCircle2, ChevronLeft, Send, Activity, Bug, HeartPulse, Tractor, Stethoscope, Droplet } from "lucide-react";

/**
 * Active Emergency SOS Page — Stargazer Deep Space Theme
 */

const iconMap: Record<string, React.ElementType> = {
  Activity, Bug, HeartPulse, Tractor, Stethoscope, Droplet
};

function SOSContent() {
  const searchParams = useSearchParams();
  const typeId = searchParams.get("type");
  const sosType = sosTypes.find((t) => t.id === typeId);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Hardcoded Al Qua'a mock coords as fallback
  const fallbackCoords = { lat: 23.543, lng: 55.487 };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => {
          console.error("Geo error:", error);
          setGeoError("Using mock Al Qua'a coordinates.");
          setCoords(fallbackCoords);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGeoError("Geolocation not supported. Using mock coords.");
      setCoords(fallbackCoords);
    }
  }, []);

  if (!sosType) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
        <p>Invalid Emergency Type</p>
        <Link href="/" className="mt-4 text-indigo-400 hover:text-indigo-300">Return Home</Link>
      </div>
    );
  }

  const Icon = sosType.lucideIconName && iconMap[sosType.lucideIconName] ? iconMap[sosType.lucideIconName] : Activity;
  const style = sosType.styleConfig || { iconColor: "text-rose-500", border: "border-rose-500/30", bg: "bg-rose-500/10" };

  // Calculate nearby responders
  const respondersWithDistance = coords
    ? mockResponders
        .filter((r) => r.available && r.skills.some((s) => sosType.requiredSkills.includes(s)))
        .map((r) => ({
          ...r,
          distance: calculateDistance(coords, r.location),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
    : [];

  const handleCopy = () => {
    if (coords) {
      navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOfflineSms = () => {
    if (coords) {
      const link = generateSmsDeepLink("999", sosType.label, coords);
      window.location.href = link;
    }
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 pb-24 selection:bg-rose-500/30 overflow-hidden">
      
      {/* ─── Cosmic Nebulas ───────────────────────────────────── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ─── Top Nav ──────────────────────────────────────────── */}
      <nav className="relative z-10 px-5 py-4">
        <Link href="/">
          <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 -ml-2 rounded-full h-10 w-10 p-0">
            <ChevronLeft size={24} strokeWidth={1.5} />
          </Button>
        </Link>
      </nav>

      <main className="relative z-10 px-5 max-w-2xl mx-auto space-y-8">
        
        {/* ─── Emergency Header ─────────────────────────────────── */}
        <div className="text-center space-y-3 relative">
          <div className="absolute inset-0 bg-rose-500/10 blur-[50px] rounded-full w-32 h-32 mx-auto -z-10" />
          <div className={`inline-flex p-5 rounded-3xl ${style.bg} ${style.border} border mb-2 shadow-[0_0_30px_rgba(244,63,94,0.15)]`}>
            <Icon size={48} strokeWidth={1.5} className={style.iconColor} />
          </div>
          <h1 className="text-3xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            {sosType.label}
          </h1>
          <p className="text-rose-200/60 font-medium text-lg tracking-wide" dir="rtl">
            {sosType.labelAr}
          </p>
          <div className="inline-flex items-center gap-2 bg-rose-950/40 border border-rose-500/30 rounded-full px-4 py-1.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <span className="text-rose-300 text-xs font-bold tracking-widest uppercase">Active Emergency</span>
          </div>
        </div>

        {/* ─── Section 1: GPS Location ──────────────────────────── */}
        <Card className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none hover:border-t-indigo-500/30 transition-all duration-500">
          <CardHeader className="pb-3 border-b border-zinc-800/50">
            <CardTitle className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-zinc-300">
              <MapPin size={16} className="text-indigo-400" />
              Your Coordinates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {!coords ? (
              <div className="flex items-center gap-3 text-zinc-400">
                <div className="w-4 h-4 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin" />
                <span className="text-sm font-medium tracking-wide">Acquiring satellite lock...</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span className="text-xl font-mono text-zinc-200 tracking-tight">
                      {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </span>
                  </div>
                  {geoError && <p className="text-xs text-amber-500/70 mt-1">{geoError}</p>}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopy}
                  className="bg-zinc-950/50 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                >
                  {copied ? <CheckCircle2 size={14} className="mr-1 text-emerald-400" /> : <Copy size={14} className="mr-1 opacity-70" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Section 2: AI ID (If Applicable) ─────────────────── */}
        {(typeId === "snake_bite" || typeId === "scorpion_sting") && (
          <OfflineAnimalAI />
        )}

        {/* ─── Section 3: Nearby Responders ─────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-400 ml-1">
            Dispatching to Responders
          </h3>
          {respondersWithDistance.length > 0 ? (
            respondersWithDistance.map((r) => (
              <Card key={r.id} className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-zinc-200 tracking-wide">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-indigo-950/30 border-indigo-500/30 text-indigo-300 text-[10px]">
                        {r.distance.toFixed(1)} km away
                      </Badge>
                      <span className="text-xs text-zinc-500">{r.vehicleType}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1">
                      {r.skills.slice(0, 2).map((skill) => (
                        <span key={skill} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-emerald-400/80 font-medium tracking-wide flex items-center gap-1">
                      <Navigation size={10} /> Alerted
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-zinc-500 ml-1">Scanning network for available responders...</p>
          )}
        </div>

        {/* ─── Section 4: First Aid Guidance ────────────────────── */}
        <Card className="bg-sky-950/20 backdrop-blur-md border border-sky-900/30 shadow-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-[40px] rounded-full pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-widest uppercase text-sky-400">
              Immediate First Aid
            </CardTitle>
            <CardDescription className="text-sky-200/60 font-medium">
              Follow these steps while waiting for help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {sosType.firstAid.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-zinc-300 text-sm">
                  <span className="font-mono text-sky-500/70 font-bold">{idx + 1}.</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* ─── Section 5: Offline SMS Action ────────────────────── */}
        <div className="pt-4 pb-12">
          <Button 
            onClick={handleOfflineSms}
            className="w-full h-14 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:border-rose-400/60 transition-all duration-500 rounded-xl font-bold tracking-widest uppercase text-sm shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:shadow-[0_0_30px_rgba(244,63,94,0.25)]"
          >
            <Send size={18} className="mr-2" strokeWidth={2} />
            Send Offline SMS (Zero Data)
          </Button>
          <p className="text-center text-[10px] text-zinc-500 uppercase tracking-widest mt-4 font-medium">
            This will open your messages app with pre-filled coordinates
          </p>
        </div>

      </main>
    </div>
  );
}

export default function SOSPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin mb-4" />
        <p className="tracking-widest uppercase font-bold text-sm">Initializing Emergency Systems...</p>
      </div>
    }>
      <SOSContent />
    </Suspense>
  );
}

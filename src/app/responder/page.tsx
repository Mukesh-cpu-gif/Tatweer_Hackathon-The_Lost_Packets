"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { mockIncidents as fallbackMockIncidents, sosTypes, Incident } from "@/lib/mockData";
import { subscribeToIncidents, acceptIncident } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Map, CheckCircle2, Navigation, User, Car, BrainCircuit, Activity, Bug, HeartPulse, Tractor, Stethoscope, Droplet, Fuel, LogOut } from "lucide-react";

const RESPONSE_NOW = new Date("2026-06-26T14:00:00+04:00").getTime();

/**
 * Responder Dashboard — Deep Space Aesthetic
 */

const iconMap: Record<string, React.ElementType> = {
  Activity, Bug, HeartPulse, Tractor, Stethoscope, Droplet, Fuel
};

export default function ResponderDashboard() {
  const router = useRouter();
  const [acceptedIncidents, setAcceptedIncidents] = useState<Set<string>>(new Set());
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [now] = useState(() => Date.now());
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthLoading(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Firestore Live Incidents Listener
  useEffect(() => {
    if (!user) return; // Only subscribe if logged in
    const unsubscribe = subscribeToIncidents((incidents) => {
      setLiveIncidents(incidents.length > 0 ? incidents : fallbackMockIncidents);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptIncident(id);
      setAcceptedIncidents((prev) => new Set(prev).add(id));
    } catch (error) {
      console.error("Failed to accept incident", error);
      // Fallback to local state if firestore fails
      setAcceptedIncidents((prev) => new Set(prev).add(id));
    }
  };
  const timeAgo = (ts: string) => {
    const diff = Math.floor((now - new Date(ts).getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin mb-4" />
        <p className="tracking-widest uppercase font-bold text-sm text-zinc-400">Authenticating Dispatch...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 pb-24 selection:bg-indigo-500/30 overflow-hidden">
      
      {/* ─── Cosmic Nebulas ───────────────────────────────────── */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-zinc-950/40 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="px-5 py-4 max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 -ml-2 rounded-full h-10 w-10 p-0">
                <ChevronLeft size={24} strokeWidth={1.5} />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                Aounak Dispatch
              </h1>
              <p className="text-indigo-200/50 text-[10px] tracking-widest uppercase font-medium">
                Responder Network
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-indigo-950/30 border border-indigo-500/20 rounded-full px-3 py-1.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
            <span className="text-[10px] text-indigo-300 font-bold tracking-widest uppercase">Live</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-5 py-6 space-y-8 max-w-2xl mx-auto">
        
        {/* ─── Responder Profile ──────────────────────────────── */}
        <Card className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center">
                  <User size={24} className="text-zinc-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-zinc-100 tracking-wide">{user?.displayName || user?.phoneNumber || "Aounak Responder"}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-indigo-200/60 mt-0.5">
                    <Car size={12} /> Toyota Land Cruiser
                  </div>
                </div>
              </div>
              {/* Availability Toggle and Logout */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                    isAvailable ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-zinc-700/50'
                  }`}
                  title="Toggle Availability"
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                    isAvailable ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </button>
                <Button 
                  onClick={handleLogout} 
                  variant="ghost" 
                  size="icon" 
                  className="text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-full h-8 w-8"
                  title="Log Out"
                >
                  <LogOut size={16} />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-indigo-950/20 border-indigo-500/30 text-indigo-300 font-medium tracking-wide">Medical</Badge>
              <Badge variant="outline" className="bg-indigo-950/20 border-indigo-500/30 text-indigo-300 font-medium tracking-wide">First Aid</Badge>
              <Badge variant="outline" className="bg-amber-950/20 border-amber-500/30 text-amber-300 font-medium tracking-wide">4x4 Recovery</Badge>
            </div>
          </CardContent>
        </Card>

        {/* ─── Active Incidents Feed ──────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-300">Active Incidents</h2>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium bg-zinc-900/50 px-2 py-1 rounded-full border border-zinc-800">
              {isAvailable ? "Searching Area" : "Offline"}
            </span>
          </div>

          <div className="space-y-4">
            {!isAvailable ? (
              <div className="text-center py-10 bg-zinc-900/20 border border-zinc-800/30 rounded-2xl border-dashed">
                <p className="text-zinc-500 text-sm font-medium tracking-wide">You are currently offline.</p>
                <p className="text-zinc-600 text-xs mt-1">Toggle availability to receive dispatch requests.</p>
              </div>
            ) : (
              liveIncidents.map((inc) => {
                const sosType = sosTypes.find((s) => s.id === inc.type);
                const isAccepted = acceptedIncidents.has(inc.id) || inc.status === "accepted";
                const Icon = sosType?.lucideIconName && iconMap[sosType.lucideIconName] ? iconMap[sosType.lucideIconName] : Activity;

                return (
                  <Card key={inc.id} className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none hover:border-t-indigo-500/30 transition-all duration-500 overflow-hidden group">
                    <CardHeader className="pb-3 border-b border-zinc-800/50 bg-zinc-950/20">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700/50">
                            <Icon size={24} className="text-indigo-400" strokeWidth={1.5} />
                          </div>
                          <div>
                            <CardTitle className="text-base text-zinc-100 tracking-wide uppercase font-bold">
                              {sosType?.label}
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-500 mt-0.5 tracking-wide">
                              ID: {inc.id.toUpperCase()} · {timeAgo(inc.timestamp)}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            isAccepted 
                              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-400 font-bold tracking-widest text-[10px] uppercase"
                              : "bg-amber-950/30 border-amber-500/40 text-amber-400 font-bold tracking-widest text-[10px] uppercase animate-pulse"
                          }
                        >
                          {isAccepted ? "En Route" : "Pending"}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400 font-medium tracking-wide">Requester</span>
                        <span className="text-zinc-200 font-semibold">{inc.requesterName}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400 font-medium tracking-wide">Required</span>
                        <div className="flex gap-1.5">
                          {sosType?.requiredSkills.slice(0,2).map(skill => (
                            <Badge key={skill} variant="secondary" className="bg-zinc-800/50 text-zinc-300 text-[10px] font-medium tracking-wider uppercase border border-zinc-700/50 hover:bg-zinc-800/50">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {inc.aiClassification && (
                        <div className="mt-2 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex gap-3">
                          <BrainCircuit size={18} className="text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-rose-500/80 font-bold tracking-widest uppercase mb-0.5">AI Threat Analysis</p>
                            <p className="text-sm text-rose-200/90 font-medium tracking-wide">{inc.aiClassification}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>

                    <Separator className="bg-zinc-800/50" />
                    
                    <CardFooter className="p-4 grid grid-cols-2 gap-3 bg-zinc-950/30">
                      <Link href={`/responder/map?incidentId=${inc.id}`} className="w-full">
                        <Button 
                          variant="outline" 
                          className="w-full border-zinc-700/50 bg-zinc-900/50 hover:bg-indigo-950/40 hover:text-indigo-300 hover:border-indigo-500/30 text-zinc-300 font-bold tracking-widest text-[10px] uppercase h-11"
                        >
                          <Map size={16} className="mr-2" strokeWidth={1.5} /> View Route
                        </Button>
                      </Link>
                      
                      <Button 
                        onClick={() => handleAccept(inc.id)}
                        disabled={isAccepted}
                        className={`w-full font-bold tracking-widest text-[10px] uppercase h-11 transition-all duration-500 ${
                          isAccepted 
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950/40 opacity-80"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                        }`}
                      >
                        {isAccepted ? (
                          <><CheckCircle2 size={16} className="mr-2" strokeWidth={2} /> Accepted</>
                        ) : (
                          <><Navigation size={16} className="mr-2" strokeWidth={2} /> Accept SOS</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { Activity, ArrowRight, BadgeCheck, Bug, Droplet, Fuel, HeartPulse, History, Stethoscope, Tractor } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { getClientSessionId, subscribeToIncidents } from "@/lib/db";
import { sosTypes } from "@/lib/mockData";
import type { Incident } from "@/lib/mockData";

const iconMap: Record<string, React.ElementType> = {
  Activity,
  Bug,
  HeartPulse,
  Tractor,
  Stethoscope,
  Droplet,
  Fuel,
};

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [now] = useState(() => Date.now());
  const clientSessionId = useMemo(() => getClientSessionId(), []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
        if (!currentUser) router.replace("/login");
      },
      () => {
        setAuthLoading(false);
        router.replace("/login");
      }
    );

    return () => unsubscribe();
  }, [router]);

  useEffect(() => subscribeToIncidents(setIncidents), []);

  const createdIncidents = incidents.filter(
    (incident) => incident.createdByUid === user?.uid || incident.clientSessionId === clientSessionId
  );
  const helpedIncidents = incidents.filter((incident) =>
    incident.acceptedBy?.includes(user?.uid ?? clientSessionId)
  );

  const activityRecords = [...createdIncidents, ...helpedIncidents]
    .filter((incident, index, all) => all.findIndex((candidate) => candidate.id === incident.id) === index)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const pendingCount = createdIncidents.filter((incident) => incident.status === "pending").length;
  const acceptedCount = activityRecords.filter((incident) => incident.status === "accepted").length;
  const resolvedCount = activityRecords.filter((incident) => incident.status === "resolved").length;

  const timeAgo = (timestamp: string) => {
    const diff = Math.floor((now - new Date(timestamp).getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/50 border-t-indigo-400" />
        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">Loading History...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 pb-28 selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-sky-600/10 blur-[100px]" />

      <header className="sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-950/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-xl font-bold uppercase tracking-wider text-transparent">
              History
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-indigo-200/50">
              SOS requests and incidents you helped with
            </p>
          </div>
          <div className="rounded-full border border-indigo-500/20 bg-indigo-950/30 px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Live</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl space-y-6 px-5 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Created</p>
              <p className="mt-2 text-2xl font-extrabold text-zinc-100">{createdIncidents.length}</p>
            </CardContent>
          </Card>
          <Card className="border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Helped</p>
              <p className="mt-2 text-2xl font-extrabold text-zinc-100">{helpedIncidents.length}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-950/20 shadow-none backdrop-blur-md">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Pending</p>
              <p className="mt-2 text-2xl font-extrabold text-amber-100">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20 bg-emerald-950/20 shadow-none backdrop-blur-md">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Closed</p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-100">{acceptedCount + resolvedCount}</p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Activity Records</h2>
          </div>

          {activityRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center">
              <History size={28} className="mx-auto mb-3 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-500">No activity records yet.</p>
              <Link href="/sos" className="mt-4 inline-flex items-center text-xs font-bold uppercase tracking-widest text-indigo-300 hover:text-indigo-200">
                Send SOS
                <ArrowRight size={14} className="ml-1.5" />
              </Link>
            </div>
          ) : (
            activityRecords.map((incident) => {
              const sosType = sosTypes.find((type) => type.id === incident.type);
              const Icon = sosType?.lucideIconName && iconMap[sosType.lucideIconName] ? iconMap[sosType.lucideIconName] : Activity;
              const isCreator = incident.createdByUid === user?.uid || incident.clientSessionId === clientSessionId;

              return (
                <Card key={incident.id} className="overflow-hidden rounded-2xl border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md">
                  <CardHeader className="border-b border-zinc-800/50 bg-zinc-950/20 pb-3">
                    <CardTitle className="flex items-start justify-between gap-3">
                      <span className="flex items-center gap-3">
                        <span className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5">
                          <Icon size={20} className="text-indigo-400" strokeWidth={1.5} />
                        </span>
                        <span>
                          <span className="block text-sm font-bold uppercase tracking-wide text-zinc-100">
                            {sosType?.label ?? incident.type}
                          </span>
                          <span className="mt-0.5 block text-xs font-medium text-zinc-500">
                            {isCreator ? "Created by you" : "Helped by you"} · {timeAgo(incident.timestamp)}
                          </span>
                        </span>
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          incident.status === "pending"
                            ? "border-amber-500/35 bg-amber-950/30 text-amber-400"
                            : "border-emerald-500/35 bg-emerald-950/30 text-emerald-400"
                        }
                      >
                        {incident.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Responders</span>
                      <span className="font-semibold text-zinc-200">
                        {incident.responderCounts?.notified ?? 0} notified · {incident.responderCounts?.enRoute ?? 0} en route
                      </span>
                    </div>
                    {incident.acceptedByNames && incident.acceptedByNames.length > 0 && (
                      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3">
                        <BadgeCheck size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                        <p className="text-xs leading-relaxed text-emerald-200/80">
                          Accepted by {incident.acceptedByNames.join(", ")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

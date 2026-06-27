"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { Activity, ArrowRight, BadgeCheck, Bug, Droplet, Fuel, HeartPulse, History, Stethoscope, Tractor } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { GlassPanel } from "@/components/GlassPanel";
import { StatusPill } from "@/components/StatusPill";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
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
  const { t, language, isAr } = useLanguage();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
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

  useEffect(
    () =>
      subscribeToIncidents((nextIncidents) => {
        setIncidents(nextIncidents);
        setIncidentsLoading(false);
      }),
    []
  );

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
    if (diff < 1) return t("Just now");
    if (diff < 60) return `${diff}${t("m ago")}`;
    return `${Math.floor(diff / 60)}${t("h ago")}`;
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-5">
        <GlassPanel tone="system" className="w-full max-w-sm p-5">
          <div className="space-y-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <p className="text-center text-sm font-bold uppercase tracking-widest text-zinc-400">{t("Loading History...")}</p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 pb-28 selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(49,46,129,0.38),transparent_55%),linear-gradient(to_bottom,rgba(12,10,9,0.08),rgba(9,9,11,0.97))]" />

      <header className="sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-950/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-xl font-bold uppercase tracking-wider text-transparent">
              {t("History")}
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-indigo-200/50">
              {t("SOS requests and incidents you helped with")}
            </p>
          </div>
          <StatusPill tone="system" pulse>{t("Live")}</StatusPill>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl space-y-6 px-5 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <GlassPanel className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t("Created")}</p>
              <p className="mt-2 text-2xl font-extrabold text-zinc-100">{createdIncidents.length}</p>
          </GlassPanel>
          <GlassPanel className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t("Helped")}</p>
              <p className="mt-2 text-2xl font-extrabold text-zinc-100">{helpedIncidents.length}</p>
          </GlassPanel>
          <GlassPanel tone="warning" className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">{t("Pending")}</p>
              <p className="mt-2 text-2xl font-extrabold text-amber-100">{pendingCount}</p>
          </GlassPanel>
          <GlassPanel tone="success" className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{t("Closed")}</p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-100">{acceptedCount + resolvedCount}</p>
          </GlassPanel>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">{t("Activity Records")}</h2>
          </div>

          {incidentsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : activityRecords.length === 0 ? (
            <Alert className="border-dashed border-zinc-800/80 bg-zinc-950/30 p-8 text-center">
              <History size={28} className="mx-auto mb-3 text-zinc-600" />
              <AlertTitle>{t("Activity Records")}</AlertTitle>
              <AlertDescription>{t("No activity records yet.")}</AlertDescription>
              <Link href="/sos" className="mt-4 inline-flex items-center text-xs font-bold uppercase tracking-widest text-indigo-300 hover:text-indigo-200">
                {t("Send SOS")}
                <ArrowRight size={14} className={`ml-1.5 ${isAr ? "rotate-180" : ""}`} />
              </Link>
            </Alert>
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
                            {language === "ar" ? sosType?.labelAr ?? incident.type : sosType?.label ?? incident.type}
                          </span>
                          <span className="mt-0.5 block text-xs font-medium text-zinc-500">
                            {isCreator ? t("Created by you") : t("Helped by you")} · {timeAgo(incident.timestamp)}
                          </span>
                        </span>
                      </span>
                      <StatusPill tone={incident.status === "pending" ? "warning" : "success"} pulse={incident.status === "pending"}>
                        {t(incident.status.charAt(0).toUpperCase() + incident.status.slice(1))}
                      </StatusPill>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">{t("Responders")}</span>
                      <span className="font-semibold text-zinc-200">
                        {incident.responderCounts?.notified ?? 0} {t("notified")} · {incident.responderCounts?.enRoute ?? 0} {t("en route")}
                      </span>
                    </div>
                    {incident.acceptedByNames && incident.acceptedByNames.length > 0 && (
                      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3">
                        <BadgeCheck size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                        <p className="text-xs leading-relaxed text-emerald-200/80">
                          {t("Accepted by")} {incident.acceptedByNames.join(", ")}
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

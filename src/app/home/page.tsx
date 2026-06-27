"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Bug,
  Droplet,
  Fuel,
  HeartPulse,
  Navigation,
  Stethoscope,
  Tractor,
  User,
  X,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RiskRadar from "@/components/RiskRadar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { calculateDistance } from "@/lib/geo";
import { sosTypes } from "@/lib/mockData";
import type { Incident } from "@/lib/mockData";
import {
  acceptIncident,
  getClientSessionId,
  subscribeCommunityProfile,
  subscribeIncidentBlocks,
  subscribeToIncidents,
  type CommunityProfile,
  type IncidentBlock,
} from "@/lib/db";

const iconMap: Record<string, React.ElementType> = {
  Activity,
  Bug,
  HeartPulse,
  Tractor,
  Stethoscope,
  Droplet,
  Fuel,
};

export default function HomePage() {
  const router = useRouter();
  const { t, language, toggleLanguage, isAr } = useLanguage();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedBlocks, setSelectedBlocks] = useState<IncidentBlock[]>([]);
  const [dismissedPromptId, setDismissedPromptId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

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

  useEffect(() => {
    const uid = user?.uid ?? (!isFirebaseConfigured ? "demo-user" : null);
    if (!uid) return;
    return subscribeCommunityProfile(uid, setProfile);
  }, [user]);

  useEffect(() => subscribeToIncidents((nextIncidents) => setIncidents(nextIncidents.slice(0, 8))), []);

  useEffect(() => {
    if (!selectedIncident) return;
    return subscribeIncidentBlocks(selectedIncident.id, setSelectedBlocks);
  }, [selectedIncident]);

  const clientSessionId = useMemo(() => getClientSessionId(), []);
  const userId = user?.uid;

  const helperPrompt = useMemo(() => {
    if (!profile?.available || profile.skills.length === 0) return null;

    const matches = incidents
      .filter((incident) => {
        if (incident.status !== "pending") return false;
        if (incident.id === dismissedPromptId) return false;
        if (incident.createdByUid && userId && incident.createdByUid === userId) return false;
        if (incident.clientSessionId && incident.clientSessionId === clientSessionId) return false;
        if (incident.acceptedBy?.includes(userId ?? clientSessionId)) return false;
        return incident.requiredSkills.some((skill) => profile.skills.includes(skill));
      })
      .map((incident) => ({
        incident,
        distance: profile.location ? calculateDistance(profile.location, incident.location) : Number.POSITIVE_INFINITY,
      }))
      .sort((a, b) => a.distance - b.distance);

    return matches[0] ?? null;
  }, [clientSessionId, dismissedPromptId, incidents, profile, userId]);

  const timeAgo = (timestamp: string) => {
    const diff = Math.floor((now - new Date(timestamp).getTime()) / 60000);
    if (diff < 1) return t("Just now");
    if (diff < 60) return `${diff}${t("m ago")}`;
    return `${Math.floor(diff / 60)}${t("h ago")}`;
  };

  const handleAccept = async (incident: Incident) => {
    await acceptIncident(incident.id, {
      uid: user?.uid ?? clientSessionId,
      name: profile?.name ?? t("Community Helper"),
    });
    setDismissedPromptId(incident.id);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/50 border-t-indigo-400" />
        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">{t("Loading Aounak...")}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 pb-28 selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute left-[20%] top-[40%] h-[300px] w-[300px] rounded-full bg-sky-600/10 blur-[100px]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/40 backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-2xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="flex items-center gap-2 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-2xl font-bold uppercase tracking-wider text-transparent">
              {t("Aounak")}
            </h1>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-widest text-indigo-200/50">
              {t("Rapid Response Network")}
              {profile ? ` · ${t("Hello")}, ${profile.name}` : ` · ${t("Guest")}`}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/profile"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-900/50 text-indigo-200/90 shadow-md transition-all duration-300 hover:bg-zinc-800"
              title={t("Profile")}
            >
              <User size={16} />
              <span className={`absolute right-0 top-0 h-2.5 w-2.5 rounded-full border border-zinc-950 ${profile ? "bg-emerald-400" : "animate-pulse bg-rose-500"}`} />
            </Link>
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-full border border-zinc-700/50 bg-zinc-900/50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-200/90 shadow-md transition-all duration-300 hover:bg-zinc-800 active:scale-95"
            >
              {isAr ? "EN 🌐" : "AR 🌐"}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl space-y-10 px-5 py-8">
        {!profile && (
          <Link
            href="/profile?setup=1"
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-rose-500/35 bg-rose-950/25 p-4 transition-all duration-300 hover:bg-rose-950/30"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0 animate-pulse text-rose-400" />
            <p className="text-xs font-semibold leading-relaxed tracking-wide text-rose-200/90">
              {t("Your Profile is incomplete. Tap user icon to set contact details.")}
            </p>
          </Link>
        )}

        <RiskRadar />

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
            <h2 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-lg font-bold uppercase tracking-widest text-transparent">
              {t("Emergency SOS")}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {sosTypes.map((sos) => {
              const Icon = sos.lucideIconName && iconMap[sos.lucideIconName] ? iconMap[sos.lucideIconName] : Activity;
              const style = sos.styleConfig ?? {
                bg: "bg-zinc-900/40 border border-zinc-800/50 hover:bg-white/5",
                text: "text-zinc-300",
                iconColor: "text-zinc-400",
              };

              return (
                <Link
                  key={sos.id}
                  href={`/sos/report?type=${sos.id}&returnTo=/home`}
                  className={`group relative w-full overflow-hidden rounded-2xl p-5 text-center ${style.bg}`}
                >
                  <div className="relative flex flex-col items-center">
                    <Icon size={32} strokeWidth={1.5} className={`${style.iconColor} mb-3 transition-transform duration-500 group-hover:scale-110`} />
                    <div className={`text-sm font-semibold uppercase tracking-wide ${style.text}`}>
                      {language === "ar" ? sos.labelAr : sos.label}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
            <h2 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-lg font-bold uppercase tracking-widest text-transparent">
              {t("Recent Activity")}
            </h2>
          </div>
          <div className="space-y-4">
            {incidents.length === 0 ? (
              <p className="text-sm font-medium text-zinc-500">{t("No recent incidents recorded.")}</p>
            ) : (
              incidents.map((incident) => {
                const sosType = sosTypes.find((sos) => sos.id === incident.type);
                const Icon = sosType?.lucideIconName && iconMap[sosType.lucideIconName] ? iconMap[sosType.lucideIconName] : Activity;

                return (
                  <button
                    key={incident.id}
                    type="button"
                    onClick={() => {
                      setSelectedBlocks([]);
                      setSelectedIncident(incident);
                    }}
                    className="block w-full text-left"
                  >
                    <Card className="rounded-2xl border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-t-indigo-500/30">
                      <CardContent className="pb-5 pt-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div className="rounded-full border border-zinc-800 bg-zinc-950/50 p-2.5">
                              <Icon size={20} strokeWidth={1.5} className="text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-200">
                                {language === "ar" ? sosType?.labelAr ?? incident.type : sosType?.label ?? incident.type}
                              </p>
                              <p className="mt-0.5 text-xs font-medium text-indigo-200/50">
                                {incident.requesterName} · {timeAgo(incident.timestamp)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              incident.status === "pending"
                                ? "border-amber-500/30 bg-amber-950/30 font-medium text-amber-400"
                                : "border-emerald-500/30 bg-emerald-950/30 font-medium text-emerald-400"
                            }
                          >
                            {t(incident.status.charAt(0).toUpperCase() + incident.status.slice(1))}
                          </Badge>
                        </div>
                        {incident.aiClassification && (
                          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-950/30 px-3.5 py-2.5">
                            <BrainCircuit size={16} strokeWidth={1.5} className="text-indigo-400" />
                            <span className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                              {t("AI Match:")} {incident.aiClassification}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </main>

      {selectedIncident && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => {
              setSelectedIncident(null);
              setSelectedBlocks([]);
            }}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
            aria-label={t("Close incident details")}
          />
          <Card className="relative z-10 max-h-[82vh] w-full max-w-lg overflow-y-auto rounded-2xl border-zinc-800 bg-zinc-900/95 shadow-2xl">
            <CardHeader className="border-b border-zinc-800/60 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold uppercase tracking-widest text-zinc-100">
                    {language === "ar"
                      ? sosTypes.find((type) => type.id === selectedIncident.type)?.labelAr ?? selectedIncident.type
                      : sosTypes.find((type) => type.id === selectedIncident.type)?.label ?? selectedIncident.type}
                  </CardTitle>
                  <p className="mt-1 font-mono text-xs text-indigo-200/50">ID: {selectedIncident.id}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedIncident(null);
                    setSelectedBlocks([]);
                  }}
                  className="h-8 w-8 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <X size={17} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">{t("Requester")}</span>
                  <span className="text-right font-semibold text-zinc-200">{selectedIncident.requesterName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">{t("Location")}</span>
                  <span className="font-mono text-xs text-zinc-200">
                    {selectedIncident.location.lat.toFixed(4)}, {selectedIncident.location.lng.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">{t("Responders")}</span>
                  <span className="font-semibold text-zinc-200">
                    {selectedIncident.responderCounts?.notified ?? 0} {t("notified")} · {selectedIncident.responderCounts?.enRoute ?? 0} {t("en route")}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedIncident.requiredSkills.map((skill) => (
                  <Badge key={skill} variant="outline" className="border-zinc-700 bg-zinc-950/40 text-zinc-300">
                    {t(skill)}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2 border-t border-zinc-800/70 pt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t("Request Details")}</p>
                {selectedBlocks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-zinc-800 p-3 text-xs text-zinc-500">
                    {t("No extra details have been added yet.")}
                  </p>
                ) : (
                  selectedBlocks.map((block) => (
                    <div key={block.key} className="rounded-xl border border-zinc-800 bg-zinc-950/35 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">{t(block.title)}</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-300">{block.summary}</p>
                    </div>
                  ))
                )}
              </div>

              {profile && selectedIncident.status === "pending" && (
                <Button onClick={() => handleAccept(selectedIncident)} className="h-12 w-full rounded-xl bg-indigo-600 font-bold uppercase tracking-widest text-white hover:bg-indigo-500">
                  <Navigation size={16} className={`mr-2 ${isAr ? "rotate-180" : ""}`} />
                  {t("I Can Help")}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {helperPrompt && (
        <div className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-lg">
          <Card className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-zinc-900/95 shadow-[0_0_35px_rgba(16,185,129,0.18)] backdrop-blur-xl">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">{t("Nearby Match")}</p>
                  <h3 className="mt-1 text-sm font-bold uppercase tracking-wide text-zinc-100">
                    {language === "ar"
                      ? sosTypes.find((type) => type.id === helperPrompt.incident.type)?.labelAr
                      : sosTypes.find((type) => type.id === helperPrompt.incident.type)?.label}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {t("Your skills match this incident")}{Number.isFinite(helperPrompt.distance) ? ` · ${helperPrompt.distance.toFixed(1)} ${t("km away")}` : ""}.
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setDismissedPromptId(helperPrompt.incident.id)} className="h-8 w-8 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white">
                  <X size={16} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedBlocks([]);
                    setSelectedIncident(helperPrompt.incident);
                  }}
                  className="h-11 rounded-xl border-zinc-700 bg-zinc-950/50 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-zinc-800"
                >
                  {t("View Details")}
                </Button>
                <Button type="button" onClick={() => handleAccept(helperPrompt.incident)} className="h-11 rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest text-white hover:bg-emerald-500">
                  {t("I Can Help")}
                  <ArrowRight size={14} className={`ml-2 ${isAr ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

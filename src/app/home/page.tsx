"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { EmergencyCommandTile } from "@/components/EmergencyCommandTile";
import { GlassPanel } from "@/components/GlassPanel";
import { StatusPill } from "@/components/StatusPill";
import RiskRadar from "@/components/RiskRadar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
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

const commandToneByType: Record<string, "danger" | "warning" | "system" | "gps" | "neutral"> = {
  venomous_bite: "danger",
  medical: "danger",
  vehicle_stuck: "warning",
  sick_livestock: "warning",
  out_of_fuel: "system",
  water_emergency: "gps",
};

export default function HomePage() {
  const router = useRouter();
  const { t, language, toggleLanguage, isAr } = useLanguage();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
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

  useEffect(
    () =>
      subscribeToIncidents((nextIncidents) => {
        setIncidents(nextIncidents.slice(0, 8));
        setIncidentsLoading(false);
      }),
    []
  );

  useEffect(() => {
    if (!selectedIncident) return;
    return subscribeIncidentBlocks(selectedIncident.id, setSelectedBlocks);
  }, [selectedIncident]);

  const clientSessionId = useMemo(() => getClientSessionId(), []);
  const userId = user?.uid;
  const profileComplete = Boolean(
    profile?.name.trim() &&
    profile.phone.trim() &&
    profile.vehicleType.trim() &&
    profile.skills.length > 0 &&
    profile.location
  );
  const profileMissingItems = [
    !profile?.name.trim() ? t("Name") : "",
    !profile?.phone.trim() ? t("Phone") : "",
    !profile?.vehicleType.trim() ? t("Vehicle") : "",
    !profile?.skills.length ? t("Skills") : "",
    !profile?.location ? t("GPS Location") : "",
  ].filter(Boolean);
  const profileCompletion = Math.round(((5 - profileMissingItems.length) / 5) * 100);
  const profileStatusLabel = !profileComplete
    ? t("Profile incomplete")
    : profile?.available
      ? t("Available to help")
      : t("Profile offline");
  const profileStatusTone = !profileComplete ? "warning" : profile?.available ? "success" : "offline";
  const profileStatusDotClass = !profileComplete
    ? "animate-pulse bg-amber-500"
    : profile?.available
      ? "bg-emerald-400"
      : "bg-zinc-500";

  const isOwnIncident = useCallback(
    (incident: Incident) =>
      Boolean(incident.createdByUid && userId && incident.createdByUid === userId) ||
      Boolean(incident.clientSessionId && incident.clientSessionId === clientSessionId),
    [clientSessionId, userId]
  );

  const helperPrompt = useMemo(() => {
    if (!profile?.available || profile.skills.length === 0) return null;

    const matches = incidents
      .filter((incident) => {
        if (incident.status !== "pending") return false;
        if (incident.id === dismissedPromptId) return false;
        if (isOwnIncident(incident)) return false;
        if (incident.acceptedBy?.includes(userId ?? clientSessionId)) return false;
        return incident.requiredSkills.some((skill) => profile.skills.includes(skill));
      })
      .map((incident) => ({
        incident,
        distance: profile.location ? calculateDistance(profile.location, incident.location) : Number.POSITIVE_INFINITY,
      }))
      .sort((a, b) => a.distance - b.distance);

    return matches[0] ?? null;
  }, [clientSessionId, dismissedPromptId, incidents, isOwnIncident, profile, userId]);

  const timeAgo = (timestamp: string) => {
    const diff = Math.floor((now - new Date(timestamp).getTime()) / 60000);
    if (diff < 1) return t("Just now");
    if (diff < 60) return `${diff}${t("m ago")}`;
    return `${Math.floor(diff / 60)}${t("h ago")}`;
  };

  const handleAccept = async (incident: Incident) => {
    if (isOwnIncident(incident)) {
      setDismissedPromptId(incident.id);
      return;
    }

    await acceptIncident(incident.id, {
      uid: user?.uid ?? clientSessionId,
      name: profile?.name ?? t("Community Helper"),
    });
    setDismissedPromptId(incident.id);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-5">
        <GlassPanel tone="system" className="w-full max-w-sm p-5">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <p className="text-center text-sm font-bold uppercase tracking-widest text-zinc-400">{t("Loading Aounak...")}</p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 pb-28 selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(49,46,129,0.42),transparent_55%),linear-gradient(to_bottom,rgba(12,10,9,0.08),rgba(9,9,11,0.97))]" />

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
              title={profileStatusLabel}
              aria-label={profileStatusLabel}
            >
              <User size={16} />
              <span className={`absolute right-0 top-0 h-2.5 w-2.5 rounded-full border border-zinc-950 ${profileStatusDotClass}`} />
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
            className="block"
          >
            <Alert variant="warning" className="transition-all duration-300 hover:bg-amber-950/25">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <AlertTitle>{t("Profile incomplete")}</AlertTitle>
                  <AlertDescription>
                    {t("Your Profile is incomplete. Tap user icon to set contact details.")}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </Link>
        )}

        <GlassPanel tone="system" className="p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {t("Profile")}
              </p>
              <StatusPill tone={profileStatusTone} pulse={!profileComplete}>
                {profileCompletion}%
              </StatusPill>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {t("Status")}
              </p>
              <StatusPill tone={profileStatusTone}>{profileStatusLabel}</StatusPill>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {t("GPS Location")}
              </p>
              <StatusPill tone={profile?.location ? "gps" : "warning"} pulse={!profile?.location}>
                {profile?.location ? t("Ready") : t("Not set")}
              </StatusPill>
            </div>
          </div>
        </GlassPanel>

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

              return (
                <Link
                  key={sos.id}
                  href={`/sos/report?type=${sos.id}&returnTo=/home`}
                  className="block"
                >
                  <EmergencyCommandTile
                    icon={Icon}
                    label={language === "ar" ? sos.labelAr : sos.label}
                    description={language === "ar" ? sos.descriptionAr : sos.description}
                    tone={commandToneByType[sos.id] ?? "neutral"}
                    isRtl={isAr}
                  />
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
            {incidentsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : incidents.length === 0 ? (
              <Alert variant="default" className="border-dashed border-zinc-800/80 bg-zinc-950/30">
                <AlertTitle>{t("Recent Activity")}</AlertTitle>
                <AlertDescription>{t("No recent incidents recorded.")}</AlertDescription>
              </Alert>
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
                    <GlassPanel interactive className="p-0">
                      <div className="p-5">
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
                          <StatusPill tone={incident.status === "pending" ? "warning" : "success"} pulse={incident.status === "pending"}>
                            {t(incident.status.charAt(0).toUpperCase() + incident.status.slice(1))}
                          </StatusPill>
                        </div>
                        {incident.aiClassification && (
                          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-950/30 px-3.5 py-2.5">
                            <BrainCircuit size={16} strokeWidth={1.5} className="text-indigo-400" />
                            <span className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                              {t("AI Match:")} {incident.aiClassification}
                            </span>
                          </div>
                        )}
                      </div>
                    </GlassPanel>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </main>

      <Dialog
        open={Boolean(selectedIncident)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedIncident(null);
            setSelectedBlocks([]);
          }
        }}
      >
        {selectedIncident && (
          <DialogContent closeLabel={t("Close incident details")} className="border-white/10 bg-zinc-950/95">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle>
                    {language === "ar"
                      ? sosTypes.find((type) => type.id === selectedIncident.type)?.labelAr ?? selectedIncident.type
                      : sosTypes.find((type) => type.id === selectedIncident.type)?.label ?? selectedIncident.type}
                  </DialogTitle>
                  <DialogDescription className="font-mono">ID: {selectedIncident.id}</DialogDescription>
                </div>
                <StatusPill tone={selectedIncident.status === "pending" ? "warning" : "success"} pulse={selectedIncident.status === "pending"}>
                  {t(selectedIncident.status.charAt(0).toUpperCase() + selectedIncident.status.slice(1))}
                </StatusPill>
              </div>
            </DialogHeader>
            <div className="space-y-4">
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

              {profile && selectedIncident.status === "pending" && isOwnIncident(selectedIncident) && (
                <Alert variant="system">
                  <AlertDescription className="text-center font-semibold uppercase tracking-widest">
                    {t("This is your request. Nearby helpers can accept it.")}
                  </AlertDescription>
                </Alert>
              )}

              {profile && selectedIncident.status === "pending" && !isOwnIncident(selectedIncident) && (
                <Button onClick={() => handleAccept(selectedIncident)} className="h-12 w-full rounded-xl bg-indigo-600 font-bold uppercase tracking-widest text-white hover:bg-indigo-500">
                  <Navigation size={16} className={`mr-2 ${isAr ? "rotate-180" : ""}`} />
                  {t("I Can Help")}
                </Button>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {helperPrompt && (
        <div className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-lg">
          <GlassPanel tone="success" className="p-4 shadow-[0_0_35px_rgba(16,185,129,0.16)]">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <StatusPill tone="success" pulse>{t("Nearby Match")}</StatusPill>
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
            </div>
          </GlassPanel>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

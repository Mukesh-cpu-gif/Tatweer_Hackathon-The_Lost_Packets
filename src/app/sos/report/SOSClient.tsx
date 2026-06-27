"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import {
  Activity,
  AlertCircle,
  Bug,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Droplet,
  FileText,
  Fuel,
  HeartPulse,
  MapPin,
  Navigation,
  Send,
  Stethoscope,
  Tractor,
  User,
  Users,
} from "lucide-react";
import DeflationGuide from "@/components/DeflationGuide";
import FuelCalculator from "@/components/FuelCalculator";
import { GlassPanel } from "@/components/GlassPanel";
import LivestockSelector from "@/components/LivestockSelector";
import BodyLocationSelector from "@/components/BodyLocationSelector";
import { StatusPill } from "@/components/StatusPill";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { calculateDistance } from "@/lib/geo";
import { generateSmsDeepLink } from "@/lib/sms";
import { queueSosRequest, registerSosSync } from "@/lib/storage";
import { sosTypes } from "@/lib/mockData";
import type { Incident, Responder } from "@/lib/mockData";
import type { ParsedVoiceEmergency } from "@/lib/voice-ai";
import {
  createIncidentSummary,
  getClientSessionId,
  subscribeCommunityProfile,
  subscribeIncidentBlocks,
  subscribeIncidentSummary,
  subscribeResponderDirectory,
  upsertIncidentBlock,
  type CommunityProfile,
  type IncidentBlockKey,
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

const OfflineAnimalAI = dynamic(() => import("@/components/OfflineAnimalAI"), {
  ssr: false,
  loading: () => (
    <GlassPanel tone="system" className="p-4">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-24 w-full" />
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Loading AI identifier...
        </p>
      </div>
    </GlassPanel>
  ),
});

const fallbackCoords = { lat: 23.543, lng: 55.487 };

type VoiceSosDraft = Partial<ParsedVoiceEmergency> & {
  type?: string;
};

const readLocalEmergencyProfile = (): { name: string; phone: string; vehicle: string } => {
  if (typeof window === "undefined") return { name: "", phone: "", vehicle: "" };

  try {
    const saved = window.localStorage.getItem("aounak-user-profile");
    if (!saved) return { name: "", phone: "", vehicle: "" };
    const parsed = JSON.parse(saved);
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      vehicle: typeof parsed.vehicle === "string" ? parsed.vehicle : "",
    };
  } catch {
    return { name: "", phone: "", vehicle: "" };
  }
};

const formatSummaryRows = (summary: string) =>
  summary
    .replace(/\s+\|\s+/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return { label: "", value: line };
      }

      return {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    });

type SavedBlocks = Partial<Record<IncidentBlockKey, string>>;
type EditingBlocks = Partial<Record<IncidentBlockKey, boolean>>;

interface RequestBlockProps {
  blockKey: IncidentBlockKey;
  title: string;
  icon: React.ElementType;
  activeIncidentId: string | null;
  savedSummary?: string;
  editing: boolean;
  saving: boolean;
  onEdit: (key: IncidentBlockKey) => void;
  onSave: () => void;
  children: React.ReactNode;
}

function RequestBlock({
  blockKey,
  title,
  icon: Icon,
  activeIncidentId,
  savedSummary,
  editing,
  saving,
  onEdit,
  onSave,
  children,
}: RequestBlockProps) {
  const { t } = useLanguage();
  const hasSaved = Boolean(savedSummary);
  const frozen = hasSaved && !editing;
  const savedRows = savedSummary ? formatSummaryRows(savedSummary) : [];

  return (
    <GlassPanel interactive className="p-0">
      <div className="border-b border-zinc-800/50 p-4 pb-3">
        <div className="flex items-center justify-between gap-3 text-sm font-bold uppercase tracking-widest text-zinc-300">
          <span className="flex items-center gap-2">
            <Icon size={16} className="text-indigo-400" />
            {t(title)}
          </span>
          {frozen && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(blockKey)}
              className="h-8 border-zinc-700 bg-zinc-950/50 px-3 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              {t("Edit")}
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-4 p-4 pt-4">
        {frozen ? (
          <div className="space-y-2 rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-3">
            {savedRows.length > 1 || savedRows.some((row) => row.label) ? (
              savedRows.map((row) => (
                <div key={`${row.label}-${row.value}`} className="flex items-start justify-between gap-4 rounded-lg border border-zinc-800/60 bg-zinc-950/25 px-3 py-2">
                  {row.label ? (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t(row.label)}</span>
                  ) : null}
                  <span className="text-right text-sm font-medium leading-relaxed text-zinc-200">{row.value}</span>
                </div>
              ))
            ) : (
              <p className="text-sm leading-relaxed text-zinc-300">{savedSummary}</p>
            )}
          </div>
        ) : (
          <>
            {children}
            <Button
              type="button"
              onClick={onSave}
              disabled={!activeIncidentId || saving}
              className="h-11 w-full rounded-xl bg-indigo-600/20 text-xs font-bold uppercase tracking-widest text-indigo-300 ring-1 ring-indigo-500/40 hover:bg-indigo-600/30 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {saving ? t("Saving...") : hasSaved ? t("Update request") : t("Add to request")}
            </Button>
            {!activeIncidentId && (
              <Alert variant="warning">
                <AlertDescription className="text-center font-semibold uppercase tracking-widest">
                  {t("Send Live Digital SOS first to update responders.")}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    </GlassPanel>
  );
}

export default function SOSClient() {
  const searchParams = useSearchParams();
  const typeId = searchParams.get("type");
  const returnToParam = searchParams.get("returnTo");
  const backHref = returnToParam?.startsWith("/") ? returnToParam : "/sos";
  const { t, language, toggleLanguage, isAr } = useLanguage();
  const sosType = sosTypes.find((category) => category.id === typeId);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [queued, setQueued] = useState(false);
  const [sendNotice, setSendNotice] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendingLive, setSendingLive] = useState(false);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [incidentSummary, setIncidentSummary] = useState<Incident | null>(null);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [savedBlocks, setSavedBlocks] = useState<SavedBlocks>({});
  const [editingBlocks, setEditingBlocks] = useState<EditingBlocks>({});
  const [blockSavingKey, setBlockSavingKey] = useState<IncidentBlockKey | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactVehicle, setContactVehicle] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);
  const [customNotes, setCustomNotes] = useState("");
  const [venomousThreatInfo, setVenomousThreatInfo] = useState("");
  const [fuelRequestInfo, setFuelRequestInfo] = useState("");
  const [stuckVehicleInfo, setStuckVehicleInfo] = useState("");
  const [livestockInfo, setLivestockInfo] = useState("");
  const [waterInfo, setWaterInfo] = useState("");
  const [medicalInfo, setMedicalInfo] = useState("");
  const [injuryLocation, setInjuryLocation] = useState("");
  const [venomousBodyPart, setVenomousBodyPart] = useState("");

  const handleVenomousChange = useCallback((info: string) => setVenomousThreatInfo(info), []);
  const handleFuelChange = useCallback((info: string) => setFuelRequestInfo(info), []);
  const handleStuckChange = useCallback((info: string) => setStuckVehicleInfo(info), []);
  const handleLivestockChange = useCallback((info: string) => setLivestockInfo(info), []);

  const [voiceAutofilled, setVoiceAutofilled] = useState(false);

  // Load Voice SOS draft if present in session storage
  useEffect(() => {
    if (typeof window === "undefined" || !typeId) return;

    const timer = window.setTimeout(() => {
      const rawDraft = window.sessionStorage.getItem("aounak-voice-sos-draft");
      if (!rawDraft) return;

      try {
        const draft = JSON.parse(rawDraft) as VoiceSosDraft;
        if (draft.type === typeId) {
          if (draft.name) setContactName(draft.name);
          if (draft.phone) setContactPhone(draft.phone);
          if (typeof draft.passengers === "number") setPeopleCount(Math.max(1, draft.passengers));
          if (draft.notes) setCustomNotes(draft.notes);

          if (typeId === "venomous_bite") {
            if (draft.specifics) setVenomousThreatInfo(draft.specifics);
            if (draft.bodyPart) setVenomousBodyPart(draft.bodyPart);
          }
          else if (typeId === "out_of_fuel" && draft.specifics) setFuelRequestInfo(draft.specifics);
          else if (typeId === "vehicle_stuck" && draft.specifics) setStuckVehicleInfo(draft.specifics);
          else if (typeId === "sick_livestock" && draft.specifics) setLivestockInfo(draft.specifics);
          else if (typeId === "medical") {
            if (draft.notes) setMedicalInfo(draft.notes);
            if (draft.bodyPart) setInjuryLocation(draft.bodyPart);
          }

          setVoiceAutofilled(true);
          // Clear draft so it doesn't trigger on subsequent loads
          window.sessionStorage.removeItem("aounak-voice-sos-draft");
        }
      } catch (e) {
        console.error("Failed to load voice draft", e);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [typeId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const localProfile = readLocalEmergencyProfile();
      setContactName((current) => current || localProfile.name);
      setContactPhone((current) => current || localProfile.phone);
      setContactVehicle((current) => current || localProfile.vehicle);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!typeId) return;
    const timer = window.setTimeout(() => {
      setActiveIncidentId(window.sessionStorage.getItem(`aounak-active-incident-${typeId}`));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [typeId]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    return subscribeCommunityProfile(user.uid, (nextProfile) => {
      setProfile(nextProfile);
      if (!nextProfile) return;
      setContactName((current) => current || nextProfile.name);
      setContactPhone((current) => current || nextProfile.phone);
      setContactVehicle((current) => current || nextProfile.vehicleType);
    });
  }, [user]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      const timer = window.setTimeout(() => {
        setGeoError("Geolocation not supported. Using fallback coordinates.");
        setCoords(fallbackCoords);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        console.error("Geo error:", error);
        setGeoError("Using fallback Al Qua'a coordinates.");
        setCoords(fallbackCoords);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  useEffect(() => registerSosSync(), []);
  useEffect(() => subscribeResponderDirectory(setResponders), []);

  useEffect(() => {
    if (!activeIncidentId) return;
    return subscribeIncidentSummary(activeIncidentId, setIncidentSummary);
  }, [activeIncidentId]);

  useEffect(() => {
    if (!activeIncidentId) return;

    return subscribeIncidentBlocks(activeIncidentId, (blocks) => {
      setSavedBlocks((prev) => {
        const next = { ...prev };
        blocks.forEach((block) => {
          next[block.key] = block.summary;
        });
        return next;
      });
    });
  }, [activeIncidentId]);

  const respondersWithDistance = coords && sosType
    ? responders
        .filter((responder) => responder.available && responder.skills.some((skill) => sosType.requiredSkills.includes(skill)))
        .map((responder) => ({
          ...responder,
          distance: calculateDistance(coords, responder.location),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
    : [];

  const notifiedCount = incidentSummary?.responderCounts?.notified ?? respondersWithDistance.length;
  const enRouteCount = incidentSummary?.responderCounts?.enRoute ?? 0;
  const dispatchProgress = activeIncidentId ? (enRouteCount > 0 ? 100 : notifiedCount > 0 ? 66 : 33) : 0;

  const contactSummary = useMemo(() => {
    const parts = [
      contactName.trim() ? `${t("Name")}: ${contactName.trim()}` : "",
      contactPhone.trim() ? `${t("Phone")}: ${contactPhone.trim()}` : "",
      contactVehicle.trim() ? `${t("Vehicle")}: ${contactVehicle.trim()}` : "",
    ].filter(Boolean);
    return parts.length ? parts.join("\n") : t("No contact details added yet.");
  }, [contactName, contactPhone, contactVehicle, t]);

  const crisisSummary = useMemo(() => {
    const parts = [`${t("People in crisis")}: ${peopleCount}`];
    if (customNotes.trim()) parts.push(`${t("Notes")}: ${customNotes.trim()}`);
    return parts.join("\n");
  }, [customNotes, peopleCount, t]);

  if (!sosType) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-400">
        <p>{t("Invalid Emergency Type")}</p>
        <Link href="/sos" className="mt-4 text-indigo-400 hover:text-indigo-300">
          {t("Return Home")}
        </Link>
      </div>
    );
  }

  const Icon = sosType.lucideIconName && iconMap[sosType.lucideIconName] ? iconMap[sosType.lucideIconName] : Activity;
  const style = sosType.styleConfig ?? {
    iconColor: "text-rose-500",
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
  };

  const saveLocalEmergencyProfile = () => {
    if (!contactName.trim() && !contactPhone.trim() && !contactVehicle.trim()) return;
    localStorage.setItem(
      "aounak-user-profile",
      JSON.stringify({
        name: contactName.trim(),
        phone: contactPhone.trim(),
        vehicle: contactVehicle.trim(),
      })
    );
  };

  const handleCopy = () => {
    if (!coords) return;
    navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLiveSos = async () => {
    if (!coords || activeIncidentId) return;

    setSendingLive(true);
    setSendNotice(null);
    setSendError(null);

    try {
      const currentClientSessionId = getClientSessionId();
      const incidentId = await createIncidentSummary({
        type: sosType.id,
        location: coords,
        requesterName: profile?.name || contactName.trim() || t("Emergency Guest"),
        clientSessionId: currentClientSessionId,
        createdByUid: user?.uid ?? null,
        notifiedCount: respondersWithDistance.length,
        isVoiceCommand: voiceAutofilled,
      });

      setActiveIncidentId(incidentId);
      window.sessionStorage.setItem(`aounak-active-incident-${sosType.id}`, incidentId);
      setSendNotice(t("SOS sent. Responders can see the location now."));
    } catch (error) {
      console.error("Live SOS failed", error);
      setSendError(t("Live SOS failed. Use Offline SMS backup now."));
    } finally {
      setSendingLive(false);
    }
  };

  const handleOfflineSms = async () => {
    if (!coords) return;

    const phone = "+971501234567";
    const extraInfoParts = [];
    if (contactName.trim()) extraInfoParts.push(`${t("Name")}: ${contactName.trim()}`);
    if (contactPhone.trim()) extraInfoParts.push(`${t("Contact")}: ${contactPhone.trim()}`);
    if (contactVehicle.trim()) extraInfoParts.push(`${t("Vehicle")}: ${contactVehicle.trim()}`);
    extraInfoParts.push(`${t("People in crisis")}: ${peopleCount}`);
    if (customNotes.trim()) extraInfoParts.push(`${t("Notes")}: ${customNotes.trim()}`);
    const smsExtraInfo = extraInfoParts.join("\n");
    const smsLink = generateSmsDeepLink(phone, sosType.label, coords, smsExtraInfo);

    try {
      await queueSosRequest({
        emergencyType: sosType.id,
        coords,
        extraInfo: smsExtraInfo,
        phone,
        smsBody: decodeURIComponent(smsLink.split("body=")[1] ?? ""),
      });
      setQueued(true);
    } catch {
      setQueued(false);
    }

    window.location.assign(smsLink);
  };

  const saveBlock = async (key: IncidentBlockKey, title: string, summary: string) => {
    if (!activeIncidentId) {
      setSendError(t("Send Live Digital SOS first so responders can receive updates."));
      return;
    }

    setBlockSavingKey(key);
    setSendError(null);

    try {
      if (key === "contact") saveLocalEmergencyProfile();
      await upsertIncidentBlock(activeIncidentId, {
        key,
        title,
        summary,
        clientSessionId: getClientSessionId(),
        updatedByUid: user?.uid ?? null,
      });
      setSavedBlocks((current) => ({ ...current, [key]: summary }));
      setEditingBlocks((current) => ({ ...current, [key]: false }));
    } catch (error) {
      console.error("Block save failed", error);
      setSendError(t("Could not update the request block. Please try again."));
    } finally {
      setBlockSavingKey(null);
    }
  };

  const editBlock = (key: IncidentBlockKey) => {
    setEditingBlocks((current) => ({ ...current, [key]: true }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 pb-24 selection:bg-rose-500/30">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(127,29,29,0.32),transparent_52%),linear-gradient(to_bottom,rgba(12,10,9,0.08),rgba(9,9,11,0.97))]" />

      <nav className="relative z-10 mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <Link href={backHref}>
          <Button variant="ghost" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full p-0 text-zinc-400 hover:bg-white/5 hover:text-white">
            <ChevronLeft size={24} strokeWidth={1.5} className={language === "ar" ? "rotate-180" : ""} />
          </Button>
        </Link>

        <button
          type="button"
          onClick={toggleLanguage}
          className="rounded-full border border-zinc-700/50 bg-zinc-900/50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-200/90 shadow-md transition-all duration-300 hover:bg-zinc-800"
        >
          {isAr ? "EN 🌐" : "AR 🌐"}
        </button>
      </nav>

      <main className="relative z-10 mx-auto max-w-2xl space-y-6 px-5">
        {voiceAutofilled && (
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 flex items-center gap-3 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm">
              ✨
            </span>
            <p className="text-xs text-indigo-200/90 font-medium leading-relaxed">
              <strong>Voice Assistant:</strong> Form details successfully populated from your voice transcript.
            </p>
          </div>
        )}
        <div className="relative space-y-3 text-center">
          <div className="absolute inset-0 -z-10 mx-auto h-32 w-32 rounded-full bg-rose-500/10 blur-[50px]" />
          <div className={`mb-2 inline-flex rounded-3xl border p-5 shadow-[0_0_30px_rgba(244,63,94,0.15)] ${style.bg} ${style.border}`}>
            <Icon size={48} strokeWidth={1.5} className={style.iconColor} />
          </div>
          <h1 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-3xl font-bold uppercase tracking-widest text-transparent">
            {language === "ar" ? sosType.labelAr : sosType.label}
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-950/40 px-4 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-300">{t("Active Emergency")}</span>
          </div>
        </div>

        <GlassPanel tone={geoError ? "warning" : "gps"} className="p-0">
          <div className="border-b border-zinc-800/50 p-4 pb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-300">
              <MapPin size={16} className="text-indigo-400" />
              {t("Your Coordinates")}
            </h2>
          </div>
          <div className="p-4">
            {!coords ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-10 w-full" />
                <p className="text-sm font-medium tracking-wide text-zinc-400">{t("Acquiring satellite lock...")}</p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span className="font-mono text-xl tracking-tight text-zinc-200">
                      {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </span>
                  </div>
                  {geoError && (
                    <Alert variant="warning" className="mt-3">
                      <AlertDescription>{t(geoError)}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleCopy} className="border-zinc-700 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800">
                  {copied ? <CheckCircle2 size={14} className="mr-1 text-emerald-400" /> : <Copy size={14} className="mr-1 opacity-70" />}
                  {copied ? t("Copied") : t("Copy")}
                </Button>
              </div>
            )}
          </div>
        </GlassPanel>

        <GlassPanel tone="danger" className="p-4">
          <div className="space-y-4">
            {activeIncidentId ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <StatusPill tone="success" pulse>{t("Live request active")}</StatusPill>
                  <span className="font-mono text-[10px] text-emerald-200/60">ID {activeIncidentId.slice(0, 8).toUpperCase()}</span>
                </div>
                <p className="mt-2 text-sm text-emerald-100/80">
                  {notifiedCount} {t("Responders")} {t("notified")} · {enRouteCount} {t("en route")}
                </p>
                <div className="mt-3 space-y-2">
                  <Progress value={dispatchProgress} className="[&_div]:bg-emerald-400" />
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-200/65">
                    <span>{t("Created")}</span>
                    <span className="text-center">{t("Alerted")}</span>
                    <span className="text-right">{t("En route")}</span>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleLiveSos}
                disabled={!coords || sendingLive}
                className="h-14 w-full rounded-xl border border-indigo-500/40 bg-indigo-600/25 text-sm font-bold uppercase tracking-widest text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-500 hover:bg-indigo-600/35"
              >
                <Activity size={18} className="mr-2" strokeWidth={2} />
                {sendingLive ? t("Sending...") : t("Send Live Digital SOS")}
              </Button>
            )}

            <Button
              onClick={handleOfflineSms}
              disabled={!coords}
              className="h-14 w-full rounded-xl border border-amber-500/40 bg-amber-600/20 text-sm font-bold uppercase tracking-widest text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.14)] transition-all duration-500 hover:bg-amber-600/30"
            >
              <Send size={18} className="mr-2" strokeWidth={2} />
              {t("Send Offline SMS (Zero Data)")}
            </Button>

            {(sendNotice || sendError || queued) && (
              <Alert variant={sendError || queued ? "warning" : "success"}>
                <AlertDescription className="text-center font-semibold uppercase tracking-widest">
                  {sendError ?? sendNotice ?? t("SOS saved/sending...")}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </GlassPanel>

        <div className="space-y-4">
          <RequestBlock
            blockKey="contact"
            title="Contact Info"
            icon={User}
            activeIncidentId={activeIncidentId}
            savedSummary={savedBlocks.contact}
            editing={Boolean(editingBlocks.contact)}
            saving={blockSavingKey === "contact"}
            onEdit={editBlock}
            onSave={() => saveBlock("contact", "Contact Info", contactSummary)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                placeholder={t("Full name")}
                className="h-11 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
              <input
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="+971..."
                className="h-11 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
              <input
                value={contactVehicle}
                onChange={(event) => setContactVehicle(event.target.value)}
                placeholder={t("Vehicle details")}
                className="h-11 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none sm:col-span-2"
              />
            </div>
          </RequestBlock>

          <RequestBlock
            blockKey="crisis"
            title="Crisis Details"
            icon={AlertCircle}
            activeIncidentId={activeIncidentId}
            savedSummary={savedBlocks.crisis}
            editing={Boolean(editingBlocks.crisis)}
            saving={blockSavingKey === "crisis"}
            onEdit={editBlock}
            onSave={() => saveBlock("crisis", "Crisis Details", crisisSummary)}
          >
            <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
              <div className="space-y-1.5 md:col-span-1">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <Users size={12} className="text-indigo-400" />
                  {t("Passengers in Vehicle / Crisis")}
                </label>
                <div className="flex h-10 items-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40">
                  <button type="button" onClick={() => setPeopleCount((count) => Math.max(1, count - 1))} className="h-full px-3 text-lg font-bold text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white">
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={peopleCount}
                    onChange={(event) => setPeopleCount(Math.max(1, parseInt(event.target.value) || 1))}
                    className="w-full bg-transparent text-center font-mono text-sm text-zinc-100 focus:outline-none"
                  />
                  <button type="button" onClick={() => setPeopleCount((count) => count + 1)} className="h-full px-3 text-lg font-bold text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white">
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <FileText size={12} className="text-indigo-400" />
                  {t("Situation Notes / Details")}
                </label>
                <textarea
                  value={customNotes}
                  onChange={(event) => setCustomNotes(event.target.value)}
                  placeholder={t("e.g. Stuck on high dunes, low water")}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                  dir={isAr ? "rtl" : "ltr"}
                />
              </div>
            </div>
          </RequestBlock>

          {typeId === "venomous_bite" && (
            <RequestBlock
              blockKey="venomousDiagnostics"
              title="Bite Diagnostics"
              icon={Bug}
              activeIncidentId={activeIncidentId}
              savedSummary={savedBlocks.venomousDiagnostics}
              editing={Boolean(editingBlocks.venomousDiagnostics)}
              saving={blockSavingKey === "venomousDiagnostics"}
              onEdit={editBlock}
              onSave={() => saveBlock("venomousDiagnostics", "Bite Diagnostics", venomousThreatInfo || t("Venomous threat diagnostics pending."))}
            >
              <OfflineAnimalAI onChange={handleVenomousChange} initialBodyPart={venomousBodyPart} />
            </RequestBlock>
          )}

          {typeId === "out_of_fuel" && (
            <RequestBlock
              blockKey="fuel"
              title="Fuel Calculator"
              icon={Fuel}
              activeIncidentId={activeIncidentId}
              savedSummary={savedBlocks.fuel}
              editing={Boolean(editingBlocks.fuel)}
              saving={blockSavingKey === "fuel"}
              onEdit={editBlock}
              onSave={() => saveBlock("fuel", "Fuel Calculator", fuelRequestInfo || t("Fuel request details pending."))}
            >
              <FuelCalculator coordinates={coords} responders={responders} onChange={handleFuelChange} />
            </RequestBlock>
          )}

          {typeId === "vehicle_stuck" && (
            <RequestBlock
              blockKey="vehicleStuck"
              title="Tyre Deflation & PSI"
              icon={Tractor}
              activeIncidentId={activeIncidentId}
              savedSummary={savedBlocks.vehicleStuck}
              editing={Boolean(editingBlocks.vehicleStuck)}
              saving={blockSavingKey === "vehicleStuck"}
              onEdit={editBlock}
              onSave={() => saveBlock("vehicleStuck", "Tyre Deflation & PSI", stuckVehicleInfo || t("Vehicle recovery guidance pending."))}
            >
              <DeflationGuide onChange={handleStuckChange} />
            </RequestBlock>
          )}

          {typeId === "sick_livestock" && (
            <RequestBlock
              blockKey="livestock"
              title="Animal Profile"
              icon={Stethoscope}
              activeIncidentId={activeIncidentId}
              savedSummary={savedBlocks.livestock}
              editing={Boolean(editingBlocks.livestock)}
              saving={blockSavingKey === "livestock"}
              onEdit={editBlock}
              onSave={() => saveBlock("livestock", "Animal Profile", livestockInfo || t("Animal profile details pending."))}
            >
              <LivestockSelector onChange={handleLivestockChange} />
            </RequestBlock>
          )}

          {typeId === "water_emergency" && (
            <RequestBlock
              blockKey="water"
              title="Water Emergency Details"
              icon={Droplet}
              activeIncidentId={activeIncidentId}
              savedSummary={savedBlocks.water}
              editing={Boolean(editingBlocks.water)}
              saving={blockSavingKey === "water"}
              onEdit={editBlock}
              onSave={() => saveBlock("water", "Water Emergency Details", waterInfo || t("Water supply emergency details pending."))}
            >
              <textarea
                value={waterInfo}
                onChange={(event) => setWaterInfo(event.target.value)}
                placeholder={t("Pump failure, water shortage, animals affected...")}
                rows={3}
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
            </RequestBlock>
          )}

          {typeId === "medical" && (
            <RequestBlock
              blockKey="medical"
              title="Medical Assist Details"
              icon={HeartPulse}
              activeIncidentId={activeIncidentId}
              savedSummary={savedBlocks.medical}
              editing={Boolean(editingBlocks.medical)}
              saving={blockSavingKey === "medical"}
              onEdit={editBlock}
              onSave={() => {
                const parts = [];
                if (injuryLocation) parts.push(`Injury Location: ${injuryLocation}`);
                if (medicalInfo.trim()) parts.push(`Details: ${medicalInfo.trim()}`);
                const summary = parts.join(" | ") || t("Medical assistance details pending.");
                saveBlock("medical", "Medical Assist Details", summary);
              }}
            >
              <div className="space-y-4">
                <BodyLocationSelector
                  selectedPart={injuryLocation}
                  onSelectPart={setInjuryLocation}
                  title={t("Select Injury Location")}
                  themeColor="indigo"
                />

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Injury Details & Symptoms
                  </label>
                  <textarea
                    value={medicalInfo}
                    onChange={(event) => setMedicalInfo(event.target.value)}
                    placeholder={t("Symptoms, injuries, allergies, consciousness...")}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </RequestBlock>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="ml-1 text-sm font-bold uppercase tracking-widest text-zinc-400">
            {t("Dispatching to Responders")}
          </h3>
          {respondersWithDistance.length > 0 ? (
            respondersWithDistance.map((responder) => (
              <Card key={responder.id} className="border border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold tracking-wide text-zinc-200">{responder.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="border-indigo-500/30 bg-indigo-950/30 text-[10px] text-indigo-300">
                        {responder.distance.toFixed(1)} {t("km away")}
                      </Badge>
                      <span className="text-xs text-zinc-500">{responder.vehicleType}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1">
                      {responder.skills.slice(0, 2).map((skill) => (
                        <span key={skill} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                          {t(skill)}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium tracking-wide text-emerald-400/80">
                      <Navigation size={10} className={language === "ar" ? "rotate-180" : ""} />
                      {activeIncidentId ? t("Alerted") : t("Ready")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="ml-1 text-sm text-zinc-500">{t("Scanning network for available responders...")}</p>
          )}
        </div>

        <Card className="relative overflow-hidden border border-sky-900/30 bg-sky-950/20 shadow-none backdrop-blur-md">
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-sky-500/10 blur-[40px]" />
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-sky-400">
              {t("Immediate First Aid")}
            </CardTitle>
            <CardDescription className="font-medium text-sky-200/60">
              {t("Follow these steps while waiting for help.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(language === "ar" && sosType.firstAidAr ? sosType.firstAidAr : sosType.firstAid).map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-zinc-300">
                  <span className="font-mono font-bold text-sky-500/70">{idx + 1}.</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

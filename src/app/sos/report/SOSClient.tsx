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
import LivestockSelector from "@/components/LivestockSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { calculateDistance } from "@/lib/geo";
import { generateSmsDeepLink } from "@/lib/sms";
import { queueSosRequest, registerSosSync } from "@/lib/storage";
import { sosTypes } from "@/lib/mockData";
import type { Incident, Responder } from "@/lib/mockData";
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
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
      <CardContent className="p-6 text-center text-sm font-semibold uppercase tracking-widest text-zinc-500">
        Loading AI identifier...
      </CardContent>
    </Card>
  ),
});

const fallbackCoords = { lat: 23.543, lng: 55.487 };

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
  const hasSaved = Boolean(savedSummary);
  const frozen = hasSaved && !editing;

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md transition-all duration-500 hover:border-t-indigo-500/30">
      <div className="border-b border-zinc-800/50 p-4 pb-3">
        <div className="flex items-center justify-between gap-3 text-sm font-bold uppercase tracking-widest text-zinc-300">
          <span className="flex items-center gap-2">
            <Icon size={16} className="text-indigo-400" />
            {title}
          </span>
          {frozen && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(blockKey)}
              className="h-8 border-zinc-700 bg-zinc-950/50 px-3 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              Edit
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-4 p-4 pt-4">
        {frozen ? (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-3">
            <p className="text-sm leading-relaxed text-zinc-300">{savedSummary}</p>
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
              {saving ? "Saving..." : hasSaved ? "Update request" : "Add to request"}
            </Button>
            {!activeIncidentId && (
              <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Send Live Digital SOS first to update responders.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default function SOSClient() {
  const searchParams = useSearchParams();
  const typeId = searchParams.get("type");
  const { t, language, toggleLanguage, isAr } = useLanguage();
  const sosType = sosTypes.find((category) => category.id === typeId);
  const clientSessionId = useMemo(() => getClientSessionId(), []);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return fallbackCoords;
    return null;
  });
  const [geoError, setGeoError] = useState<string | null>(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return "Geolocation not supported. Using fallback coordinates.";
    }
    return null;
  });
  const [copied, setCopied] = useState(false);
  const [queued, setQueued] = useState(false);
  const [sendNotice, setSendNotice] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendingLive, setSendingLive] = useState(false);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [incidentSummary, setIncidentSummary] = useState<Incident | null>(null);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(() => {
    if (typeof window === "undefined" || !typeId) return null;
    return window.sessionStorage.getItem(`aounak-active-incident-${typeId}`);
  });
  const [savedBlocks, setSavedBlocks] = useState<SavedBlocks>({});
  const [editingBlocks, setEditingBlocks] = useState<EditingBlocks>({});
  const [blockSavingKey, setBlockSavingKey] = useState<IncidentBlockKey | null>(null);

  const [contactName, setContactName] = useState(() => readLocalEmergencyProfile().name);
  const [contactPhone, setContactPhone] = useState(() => readLocalEmergencyProfile().phone);
  const [contactVehicle, setContactVehicle] = useState(() => readLocalEmergencyProfile().vehicle);
  const [peopleCount, setPeopleCount] = useState(1);
  const [customNotes, setCustomNotes] = useState("");
  const [venomousThreatInfo, setVenomousThreatInfo] = useState("");
  const [fuelRequestInfo, setFuelRequestInfo] = useState("");
  const [stuckVehicleInfo, setStuckVehicleInfo] = useState("");
  const [livestockInfo, setLivestockInfo] = useState("");
  const [waterInfo, setWaterInfo] = useState("");
  const [medicalInfo, setMedicalInfo] = useState("");

  const handleVenomousChange = useCallback((info: string) => setVenomousThreatInfo(info), []);
  const handleFuelChange = useCallback((info: string) => setFuelRequestInfo(info), []);
  const handleStuckChange = useCallback((info: string) => setStuckVehicleInfo(info), []);
  const handleLivestockChange = useCallback((info: string) => setLivestockInfo(info), []);

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
    if (typeof window !== "undefined" && "geolocation" in navigator) {
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
    }
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
      setSavedBlocks(
        blocks.reduce<SavedBlocks>((acc, block) => {
          acc[block.key] = block.summary;
          return acc;
        }, {})
      );
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

  const contactSummary = useMemo(() => {
    const parts = [
      contactName.trim() ? `Name: ${contactName.trim()}` : "",
      contactPhone.trim() ? `Phone: ${contactPhone.trim()}` : "",
      contactVehicle.trim() ? `Vehicle: ${contactVehicle.trim()}` : "",
    ].filter(Boolean);
    return parts.length ? parts.join(" | ") : "No contact details added yet.";
  }, [contactName, contactPhone, contactVehicle]);

  const crisisSummary = useMemo(() => {
    const parts = [`People in crisis: ${peopleCount}`];
    if (customNotes.trim()) parts.push(`Notes: ${customNotes.trim()}`);
    return parts.join(" | ");
  }, [customNotes, peopleCount]);

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
      const incidentId = await createIncidentSummary({
        type: sosType.id,
        location: coords,
        requesterName: profile?.name || contactName.trim() || "Emergency Guest",
        clientSessionId,
        createdByUid: user?.uid ?? null,
        notifiedCount: respondersWithDistance.length,
      });

      setActiveIncidentId(incidentId);
      window.sessionStorage.setItem(`aounak-active-incident-${sosType.id}`, incidentId);
      setSendNotice("SOS sent. Responders can see the location now.");
    } catch (error) {
      console.error("Live SOS failed", error);
      setSendError("Live SOS failed. Use Offline SMS backup now.");
    } finally {
      setSendingLive(false);
    }
  };

  const handleOfflineSms = async () => {
    if (!coords) return;

    const phone = "+971501234567";
    const extraInfoParts = [];
    if (contactName.trim()) extraInfoParts.push(`Name: ${contactName.trim()}`);
    if (contactPhone.trim()) extraInfoParts.push(`Contact: ${contactPhone.trim()}`);
    if (contactVehicle.trim()) extraInfoParts.push(`Vehicle: ${contactVehicle.trim()}`);
    extraInfoParts.push(`People in crisis: ${peopleCount}`);
    if (customNotes.trim()) extraInfoParts.push(`Notes: ${customNotes.trim()}`);
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
      setSendError("Send Live Digital SOS first so responders can receive updates.");
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
        clientSessionId,
        updatedByUid: user?.uid ?? null,
      });
      setSavedBlocks((current) => ({ ...current, [key]: summary }));
      setEditingBlocks((current) => ({ ...current, [key]: false }));
    } catch (error) {
      console.error("Block save failed", error);
      setSendError("Could not update the request block. Please try again.");
    } finally {
      setBlockSavingKey(null);
    }
  };

  const editBlock = (key: IncidentBlockKey) => {
    setEditingBlocks((current) => ({ ...current, [key]: true }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 pb-24 selection:bg-rose-500/30">
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-rose-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />

      <nav className="relative z-10 mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <Link href="/sos">
          <Button variant="ghost" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full p-0 text-zinc-400 hover:bg-white/5 hover:text-white">
            <ChevronLeft size={24} strokeWidth={1.5} className={language === "ar" ? "rotate-180" : ""} />
          </Button>
        </Link>

        <button
          type="button"
          onClick={toggleLanguage}
          className="rounded-full border border-zinc-700/50 bg-zinc-900/50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-200/90 shadow-md transition-all duration-300 hover:bg-zinc-800"
        >
          {language === "en" ? "عربي 🌐" : "🌐 EN"}
        </button>
      </nav>

      <main className="relative z-10 mx-auto max-w-2xl space-y-6 px-5">
        <div className="relative space-y-3 text-center">
          <div className="absolute inset-0 -z-10 mx-auto h-32 w-32 rounded-full bg-rose-500/10 blur-[50px]" />
          <div className={`mb-2 inline-flex rounded-3xl border p-5 shadow-[0_0_30px_rgba(244,63,94,0.15)] ${style.bg} ${style.border}`}>
            <Icon size={48} strokeWidth={1.5} className={style.iconColor} />
          </div>
          <h1 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-3xl font-bold uppercase tracking-widest text-transparent">
            {language === "ar" ? sosType.labelAr : sosType.label}
          </h1>
          {language === "en" && (
            <p className="text-lg font-medium tracking-wide text-rose-200/60" dir="rtl">
              {sosType.labelAr}
            </p>
          )}
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-950/40 px-4 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-300">{t("Active Emergency")}</span>
          </div>
        </div>

        <Card className="border border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md">
          <CardHeader className="border-b border-zinc-800/50 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-300">
              <MapPin size={16} className="text-indigo-400" />
              {t("Your Coordinates")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {!coords ? (
              <div className="flex items-center gap-3 text-zinc-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500/50 border-t-indigo-400" />
                <span className="text-sm font-medium tracking-wide">{t("Acquiring satellite lock...")}</span>
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
                  {geoError && <p className="mt-1 text-xs text-amber-500/70">{t(geoError)}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={handleCopy} className="border-zinc-700 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800">
                  {copied ? <CheckCircle2 size={14} className="mr-1 text-emerald-400" /> : <Copy size={14} className="mr-1 opacity-70" />}
                  {copied ? t("Copied") : t("Copy")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-rose-500/30 bg-rose-950/15 shadow-[0_0_25px_rgba(244,63,94,0.1)] backdrop-blur-md">
          <CardContent className="space-y-4 p-4">
            {activeIncidentId ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">SOS Active</p>
                <p className="mt-1 text-sm text-emerald-100/80">
                  {notifiedCount} responders notified · {enRouteCount} en route
                </p>
              </div>
            ) : (
              <Button
                onClick={handleLiveSos}
                disabled={!coords || sendingLive}
                className="h-14 w-full rounded-xl border border-indigo-500/40 bg-indigo-600/25 text-sm font-bold uppercase tracking-widest text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-500 hover:bg-indigo-600/35"
              >
                <Activity size={18} className="mr-2" strokeWidth={2} />
                {sendingLive ? "Sending..." : t("Send Live Digital SOS")}
              </Button>
            )}

            <Button
              onClick={handleOfflineSms}
              disabled={!coords}
              className="h-14 w-full rounded-xl border border-rose-500/40 bg-rose-600/25 text-sm font-bold uppercase tracking-widest text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all duration-500 hover:bg-rose-600/35"
            >
              <Send size={18} className="mr-2" strokeWidth={2} />
              {t("Send Offline SMS (Zero Data)")}
            </Button>

            {(sendNotice || sendError || queued) && (
              <p className={`text-center text-xs font-semibold uppercase tracking-widest ${sendError ? "text-rose-300" : "text-emerald-300"}`}>
                {sendError ?? sendNotice ?? t("SOS saved/sending...")}
              </p>
            )}
          </CardContent>
        </Card>

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
                placeholder="Full name"
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
                placeholder="Vehicle details"
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
              onSave={() => saveBlock("venomousDiagnostics", "Bite Diagnostics", venomousThreatInfo || "Venomous threat diagnostics pending.")}
            >
              <OfflineAnimalAI onChange={handleVenomousChange} />
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
              onSave={() => saveBlock("fuel", "Fuel Calculator", fuelRequestInfo || "Fuel request details pending.")}
            >
              <FuelCalculator coordinates={coords} onChange={handleFuelChange} />
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
              onSave={() => saveBlock("vehicleStuck", "Tyre Deflation & PSI", stuckVehicleInfo || "Vehicle recovery guidance pending.")}
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
              onSave={() => saveBlock("livestock", "Animal Profile", livestockInfo || "Animal profile details pending.")}
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
              onSave={() => saveBlock("water", "Water Emergency Details", waterInfo || "Water supply emergency details pending.")}
            >
              <textarea
                value={waterInfo}
                onChange={(event) => setWaterInfo(event.target.value)}
                placeholder="Pump failure, water shortage, animals affected..."
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
              onSave={() => saveBlock("medical", "Medical Assist Details", medicalInfo || "Medical assistance details pending.")}
            >
              <textarea
                value={medicalInfo}
                onChange={(event) => setMedicalInfo(event.target.value)}
                placeholder="Symptoms, injuries, allergies, consciousness..."
                rows={3}
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
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
                      {activeIncidentId ? t("Alerted") : "Ready"}
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

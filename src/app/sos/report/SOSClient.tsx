"use client";

import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { sosTypes } from "@/lib/mockData";
import { calculateDistance } from "@/lib/geo";
import { generateSmsDeepLink } from "@/lib/sms";
import { queueSosRequest, registerSosSync } from "@/lib/storage";
import { createIncident, subscribeToResponders } from "@/lib/db";
import type { Responder } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Copy, CheckCircle2, ChevronLeft, Send, Activity, Bug, HeartPulse, Tractor, Stethoscope, Droplet, User, AlertCircle, Users, FileText } from "lucide-react";
import LivestockSelector from "@/components/LivestockSelector";
import FuelCalculator from "@/components/FuelCalculator";
import DeflationGuide from "@/components/DeflationGuide";
import { useLanguage } from "@/context/LanguageContext";
import UserProfileModal from "@/components/UserProfileModal";

const iconMap: Record<string, React.ElementType> = {
  Activity, Bug, HeartPulse, Tractor, Stethoscope, Droplet
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


export default function SOSClient() {
  const searchParams = useSearchParams();
  const typeId = searchParams.get("type");
  const { t, language, toggleLanguage, isAr } = useLanguage();
  const sosType = sosTypes.find((t) => t.id === typeId);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return fallbackCoords;
    }
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
  const [livestockInfo, setLivestockInfo] = useState<string>("");
  const [fuelRequestInfo, setFuelRequestInfo] = useState<string>("");
  const [stuckVehicleInfo, setStuckVehicleInfo] = useState<string>("");
  const [venomousThreatInfo, setVenomousThreatInfo] = useState<string>("");
  const [responders, setResponders] = useState<Responder[]>([]);
  
  const [peopleCount, setPeopleCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const active = sessionStorage.getItem("aounak-active-crisis");
        if (active) {
          const parsed = JSON.parse(active);
          return parsed.peopleCount || 1;
        }
      } catch (err) {
        console.error("Error reading sessionStorage active-crisis", err);
      }
    }
    return 1;
  });

  const [customNotes, setCustomNotes] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const active = sessionStorage.getItem("aounak-active-crisis");
        if (active) {
          const parsed = JSON.parse(active);
          return parsed.notes || "";
        }
      } catch (err) {
        console.error("Error reading sessionStorage active-crisis", err);
      }
    }
    return "";
  });

  const handlePeopleCountChange = (val: number) => {
    const count = Math.max(1, val);
    setPeopleCount(count);
    if (typeof window !== "undefined") {
      try {
        const active = sessionStorage.getItem("aounak-active-crisis");
        const parsed = active ? JSON.parse(active) : {};
        parsed.peopleCount = count;
        sessionStorage.setItem("aounak-active-crisis", JSON.stringify(parsed));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleNotesChange = (val: string) => {
    setCustomNotes(val);
    if (typeof window !== "undefined") {
      try {
        const active = sessionStorage.getItem("aounak-active-crisis");
        const parsed = active ? JSON.parse(active) : {};
        parsed.notes = val;
        sessionStorage.setItem("aounak-active-crisis", JSON.stringify(parsed));
      } catch (err) {
        console.error(err);
      }
    }
  };
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState<{ name: string; phone: string; vehicle: string } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("aounak-user-profile");
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.error("Error reading localStorage profile", err);
      }
    }
    return null;
  });

  const refreshLocalProfile = () => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("aounak-user-profile");
        if (saved) {
          setLocalProfile(JSON.parse(saved));
        } else {
          setLocalProfile(null);
        }
      } catch (err) {
        console.error("Error reading localStorage profile", err);
      }
    }
  };

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

  useEffect(() => {
    const unsubscribe = subscribeToResponders((resps) => {
      setResponders(resps);
    });
    return () => unsubscribe();
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

  const respondersWithDistance = coords
    ? responders
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

  const handleLiveSos = async () => {
    if (!coords) return;

    if (!localProfile) {
      alert(t("Please fill in Name and Phone Number."));
      setIsProfileModalOpen(true);
      return;
    }

    setQueued(true);
    try {
      let calcInfo = "";
      if (sosType.id === "venomous_bite") {
        calcInfo = venomousThreatInfo || "Possible venomous creature";
      } else if (sosType.id === "sick_livestock") {
        calcInfo = livestockInfo || "Sick livestock reported";
      } else if (sosType.id === "out_of_fuel") {
        calcInfo = fuelRequestInfo || "Stranded vehicle requires fuel";
      } else if (sosType.id === "vehicle_stuck") {
        calcInfo = stuckVehicleInfo || "Stranded vehicle stuck in sand";
      }

      const extraInfoParts = [];
      if (localProfile.phone) extraInfoParts.push(`Phone: ${localProfile.phone}`);
      if (localProfile.vehicle) extraInfoParts.push(`Vehicle: ${localProfile.vehicle}`);
      extraInfoParts.push(`People: ${peopleCount}`);
      if (customNotes.trim()) extraInfoParts.push(`Notes: ${customNotes.trim()}`);
      if (calcInfo) extraInfoParts.push(`Diagnostics: ${calcInfo}`);
      
      const fullExtraInfo = extraInfoParts.join(" | ");

      await createIncident(sosType.id, coords, localProfile.name, fullExtraInfo);
      setTimeout(() => setQueued(false), 2000);
      alert(t("SOS Sent to Dispatch Successfully!"));
    } catch (err) {
      console.error("Live SOS failed, falling back to SMS", err);
      handleOfflineSms();
    }
  };

  const handleOfflineSms = async () => {
    if (!coords) return;

    if (!localProfile) {
      alert(t("Please fill in Name and Phone Number."));
      setIsProfileModalOpen(true);
      return;
    }

    const phone = "+971501234567";
    let calcInfo = "";
    if (sosType.id === "venomous_bite") {
      calcInfo = venomousThreatInfo || "";
    } else if (sosType.id === "sick_livestock") {
      calcInfo = livestockInfo || "";
    } else if (sosType.id === "out_of_fuel") {
      calcInfo = fuelRequestInfo || "";
    } else if (sosType.id === "vehicle_stuck") {
      calcInfo = stuckVehicleInfo || "";
    }

    const extraInfoParts = [];
    extraInfoParts.push(`Name: ${localProfile.name}`);
    extraInfoParts.push(`Contact: ${localProfile.phone}`);
    if (localProfile.vehicle) extraInfoParts.push(`Vehicle: ${localProfile.vehicle}`);
    extraInfoParts.push(`People in crisis: ${peopleCount}`);
    if (customNotes.trim()) extraInfoParts.push(`Notes: ${customNotes.trim()}`);
    if (calcInfo) extraInfoParts.push(`Details: ${calcInfo}`);
    
    const smsExtraInfo = extraInfoParts.join("\n");

    const smsLink = generateSmsDeepLink(
      phone,
      sosType.label,
      coords,
      smsExtraInfo
    );
    try {
      await queueSosRequest({
        emergencyType: sosType.label,
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

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 pb-24 selection:bg-rose-500/30 overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <nav className="relative z-10 px-5 py-4 flex items-center justify-between max-w-2xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 -ml-2 rounded-full h-10 w-10 p-0 flex items-center justify-center">
            <ChevronLeft size={24} strokeWidth={1.5} className={language === "ar" ? "rotate-180" : ""} />
          </Button>
        </Link>
        
        {/* Language switcher */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="bg-zinc-900/50 border border-zinc-700/50 hover:bg-zinc-800 text-indigo-200/90 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all duration-300 active:scale-95 shadow-md"
        >
          {language === "en" ? "عربي 🌐" : "🌐 EN"}
        </button>
      </nav>

      <main className="relative z-10 px-5 max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3 relative">
          <div className="absolute inset-0 bg-rose-500/10 blur-[50px] rounded-full w-32 h-32 mx-auto -z-10" />
          <div className={`inline-flex p-5 rounded-3xl ${style.bg} ${style.border} border mb-2 shadow-[0_0_30px_rgba(244,63,94,0.15)]`}>
            <Icon size={48} strokeWidth={1.5} className={style.iconColor} />
          </div>
          <h1 className="text-3xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            {language === "ar" ? sosType.labelAr : sosType.label}
          </h1>
          {language === "en" && (
            <p className="text-rose-200/60 font-medium text-lg tracking-wide" dir="rtl">
              {sosType.labelAr}
            </p>
          )}
          <div className="inline-flex items-center gap-2 bg-rose-950/40 border border-rose-500/30 rounded-full px-4 py-1.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <span className="text-rose-300 text-xs font-bold tracking-widest uppercase">{t("Active Emergency")}</span>
          </div>
        </div>

        <Card className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none hover:border-t-indigo-500/30 transition-all duration-500">
          <CardHeader className="pb-3 border-b border-zinc-800/50">
            <CardTitle className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-zinc-300">
              <MapPin size={16} className="text-indigo-400" />
              {t("Your Coordinates")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {!coords ? (
              <div className="flex items-center gap-3 text-zinc-400">
                <div className="w-4 h-4 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin" />
                <span className="text-sm font-medium tracking-wide">{t("Acquiring satellite lock...")}</span>
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
                  {geoError && <p className="text-xs text-amber-500/70 mt-1">{t(geoError)}</p>}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopy}
                  className="bg-zinc-950/50 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                >
                  {copied ? <CheckCircle2 size={14} className="mr-1 text-emerald-400" /> : <Copy size={14} className="mr-1 opacity-70" />}
                  {copied ? t("Copied") : t("Copy")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Contact Info Card ────────────────────────────────── */}
        <Card className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none hover:border-t-indigo-500/30 transition-all duration-500">
          <CardHeader className="pb-3 border-b border-zinc-800/50">
            <CardTitle className="flex items-center justify-between text-sm font-bold tracking-widest uppercase text-zinc-300">
              <div className="flex items-center gap-2">
                <User size={16} className="text-indigo-400" />
                {localProfile ? t("Contact Info (Saved)") : t("Contact Info (Required)")}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsProfileModalOpen(true)}
                className="bg-zinc-950/50 border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs px-3"
              >
                {localProfile ? t("Edit") : t("Setup")}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {localProfile ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 font-medium">{t("Full Name")}</span>
                  <span className="text-zinc-200 font-semibold">{localProfile.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 font-medium">{t("Phone Number")}</span>
                  <span className="text-zinc-200 font-mono font-semibold">{localProfile.phone}</span>
                </div>
                {localProfile.vehicle && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-medium">{t("Vehicle")}</span>
                    <span className="text-zinc-200 font-semibold">{localProfile.vehicle}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 font-medium">{t("Number of People")}</span>
                  <span className="text-zinc-200 font-semibold">{peopleCount}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 space-y-3">
                <p className="text-xs text-rose-400/90 font-semibold">
                  {t("Set contact profile to help responders find you quickly.")}
                </p>
                <Button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold uppercase tracking-wider text-xs px-5 h-9 rounded-xl"
                >
                  {t("Setup Emergency Profile")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Crisis Details Card (Passengers & Notes) ────────────────── */}
        <Card className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none hover:border-t-indigo-500/30 transition-all duration-500">
          <CardHeader className="pb-3 border-b border-zinc-800/50">
            <CardTitle className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-zinc-300">
              <AlertCircle size={16} className="text-indigo-400" />
              {t("Crisis Details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Users size={12} className="text-indigo-400" /> {t("Passengers in Vehicle / Crisis")}
                </label>
                <div className="flex items-center bg-zinc-950/40 border border-zinc-800 rounded-xl h-10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handlePeopleCountChange(peopleCount - 1)}
                    className="px-3 h-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-lg font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={peopleCount}
                    onChange={(e) => handlePeopleCountChange(parseInt(e.target.value) || 1)}
                    className="w-full bg-transparent text-center text-zinc-100 font-mono focus:outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => handlePeopleCountChange(peopleCount + 1)}
                    className="px-3 h-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <FileText size={12} className="text-indigo-400" /> {t("Situation Notes / Details")}
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder={t("e.g. Stuck on high dunes, low water")}
                  rows={1}
                  className="w-full h-10 bg-zinc-950/40 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-zinc-200 text-sm placeholder:text-zinc-600 resize-none leading-relaxed transition-all"
                  dir={isAr ? "rtl" : "ltr"}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {typeId === "venomous_bite" && (
          <OfflineAnimalAI onChange={setVenomousThreatInfo} />
        )}

        {typeId === "sick_livestock" && (
          <LivestockSelector onChange={setLivestockInfo} />
        )}

        {typeId === "out_of_fuel" && (
          <FuelCalculator coordinates={coords} onChange={setFuelRequestInfo} />
        )}

        {typeId === "vehicle_stuck" && (
          <DeflationGuide onChange={setStuckVehicleInfo} />
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-400 ml-1">
            {t("Dispatching to Responders")}
          </h3>
          {respondersWithDistance.length > 0 ? (
            respondersWithDistance.map((r) => (
              <Card key={r.id} className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-zinc-200 tracking-wide">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-indigo-950/30 border-indigo-500/30 text-indigo-300 text-[10px]">
                        {r.distance.toFixed(1)} {t("km away")}
                      </Badge>
                      <span className="text-xs text-zinc-500">{r.vehicleType}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1">
                      {r.skills.slice(0, 2).map((skill) => (
                        <span key={skill} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          {t(skill)}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-emerald-400/80 font-medium tracking-wide flex items-center gap-1">
                      <Navigation size={10} className={language === "ar" ? "rotate-180" : ""} /> {t("Alerted")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-zinc-500 ml-1">{t("Scanning network for available responders...")}</p>
          )}
        </div>

        <Card className="bg-sky-950/20 backdrop-blur-md border border-sky-900/30 shadow-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-[40px] rounded-full pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-widest uppercase text-sky-400">
              {t("Immediate First Aid")}
            </CardTitle>
            <CardDescription className="text-sky-200/60 font-medium">
              {t("Follow these steps while waiting for help.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(language === "ar" && sosType.firstAidAr ? sosType.firstAidAr : sosType.firstAid).map((step, idx) => (
                <li key={idx} className="flex gap-3 text-zinc-300 text-sm">
                  <span className="font-mono text-sky-500/70 font-bold">{idx + 1}.</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="pt-4 pb-12 space-y-4">
          <Button 
            onClick={handleLiveSos}
            className="w-full h-14 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:border-indigo-400/60 transition-all duration-500 rounded-xl font-bold tracking-widest uppercase text-sm shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:shadow-[0_0_30px_rgba(99,102,241,0.25)]"
          >
            <Activity size={18} className="mr-2" strokeWidth={2} />
            {t("Send Live Digital SOS")}
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-600 text-xs font-medium uppercase tracking-widest">{t("Or Fallback to SMS")}</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <Button 
            onClick={handleOfflineSms}
            className="w-full h-14 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:border-rose-400/60 transition-all duration-500 rounded-xl font-bold tracking-widest uppercase text-sm shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:shadow-[0_0_30px_rgba(244,63,94,0.25)]"
          >
            <Send size={18} className="mr-2" strokeWidth={2} />
            {t("Send Offline SMS (Zero Data)")}
          </Button>
          <p className="text-center text-[10px] text-zinc-500 uppercase tracking-widest mt-4 font-medium">
            {queued
              ? t("SOS saved/sending...")
              : t("Digital SOS requires internet. SMS opens messages app.")}
          </p>
        </div>
      </main>

      {/* User Profile Settings Modal */}
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        onSave={refreshLocalProfile} 
      />
    </div>
  );
}

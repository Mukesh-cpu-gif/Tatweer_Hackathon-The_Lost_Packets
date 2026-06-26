"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, updateProfile, User as FirebaseUser } from "firebase/auth";
import { sosTypes } from "@/lib/mockData";
import type { Incident } from "@/lib/mockData";
import type { Coordinates } from "@/lib/geo";
import {
  subscribeToIncidents,
  acceptIncident,
  saveResponderProfile,
  subscribeToResponderProfile,
  updateResponderAvailability,
} from "@/lib/db";
import type { ResponderProfile } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Map, CheckCircle2, Navigation, User, Car, BrainCircuit, Activity, Bug, HeartPulse, Tractor, Stethoscope, Droplet, Fuel, LogOut, Phone, Pencil, Save, MapPin, AlertCircle, X } from "lucide-react";

/**
 * Responder Dashboard — Deep Space Aesthetic
 */

const iconMap: Record<string, React.ElementType> = {
  Activity, Bug, HeartPulse, Tractor, Stethoscope, Droplet, Fuel
};

const responderSkillOptions = [
  "Medical",
  "First Aid",
  "Anti-Venom",
  "4x4",
  "Winch",
  "Heavy Machinery",
  "Transport",
  "Fuel Supply",
  "Livestock Expert",
  "Veterinary",
  "Plumbing",
];

type ProfileFormState = {
  name: string;
  phone: string;
  vehicleType: string;
  skills: string[];
  location: Coordinates | null;
};

const createEmptyProfileForm = (): ProfileFormState => ({
  name: "",
  phone: "",
  vehicleType: "",
  skills: [],
  location: null,
});

export default function ResponderDashboard() {
  const router = useRouter();
  const [acceptedIncidents, setAcceptedIncidents] = useState<Set<string>>(new Set());
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [now] = useState(() => Date.now());
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<ResponderProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() => createEmptyProfileForm());
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);

        if (!currentUser) {
          router.replace("/login");
        }
      },
      (error) => {
        console.error("Auth state check failed", error);
        setUser(null);
        setAuthLoading(false);
        router.replace("/login");
      }
    );
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToResponderProfile(user.uid, (currentProfile) => {
      setProfile(currentProfile);
      setProfileLoading(false);

      if (currentProfile) {
        setProfileForm({
          name: currentProfile.name,
          phone: currentProfile.phone,
          vehicleType: currentProfile.vehicleType,
          skills: currentProfile.skills,
          location: currentProfile.location ?? null,
        });
        setIsAvailable(currentProfile.available);
        setIsEditingProfile(false);
      } else {
        setProfileForm(createEmptyProfileForm());
        setIsAvailable(true);
        setIsEditingProfile(true);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Firestore Live Incidents Listener
  useEffect(() => {
    if (!user) return; // Only subscribe if logged in
    const unsubscribe = subscribeToIncidents((incidents) => {
      setLiveIncidents(incidents);
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

  const toggleSkill = (skill: string) => {
    setProfileForm((currentForm) => {
      const hasSkill = currentForm.skills.includes(skill);
      return {
        ...currentForm,
        skills: hasSkill
          ? currentForm.skills.filter((currentSkill) => currentSkill !== skill)
          : [...currentForm.skills, skill],
      };
    });
  };

  const handleUseCurrentLocation = () => {
    setProfileError(null);

    if (!("geolocation" in navigator)) {
      setProfileError("Location services are not available in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfileForm((currentForm) => ({
          ...currentForm,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        }));
        setLocating(false);
      },
      () => {
        setProfileError("Location permission was blocked. You can save your profile and add GPS later.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const cleanedProfile = {
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      vehicleType: profileForm.vehicleType.trim(),
      skills: profileForm.skills,
      available: isAvailable,
      location: profileForm.location ?? undefined,
    };

    if (!cleanedProfile.name || !cleanedProfile.phone || !cleanedProfile.vehicleType) {
      setProfileError("Add your name, phone number, and vehicle before saving.");
      return;
    }

    if (cleanedProfile.skills.length === 0) {
      setProfileError("Select at least one responder skill.");
      return;
    }

    setProfileSaving(true);
    setProfileError(null);
    setProfileNotice(null);

    try {
      await saveResponderProfile(user.uid, cleanedProfile);

      if (user.displayName !== cleanedProfile.name) {
        try {
          await updateProfile(user, { displayName: cleanedProfile.name });
        } catch (error) {
          console.error("Display name update failed", error);
        }
      }

      setProfileNotice("Profile saved.");
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Profile save failed", error);
      setProfileError("Could not save your responder profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    const nextAvailability = !isAvailable;
    setIsAvailable(nextAvailability);

    if (!user || !profile) return;

    try {
      await updateResponderAvailability(user.uid, nextAvailability);
    } catch (error) {
      console.error("Availability update failed", error);
      setIsAvailable(!nextAvailability);
      setProfileError("Could not update availability.");
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

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin mb-4" />
        <p className="tracking-widest uppercase font-bold text-sm text-zinc-400">Redirecting to login...</p>
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
            {profileLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800/80" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-44 rounded bg-zinc-800" />
                    <div className="h-3 w-28 rounded bg-zinc-800/70" />
                  </div>
                </div>
                <div className="h-9 rounded-lg bg-zinc-800/60" />
              </div>
            ) : isEditingProfile || !profile ? (
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center">
                      <User size={24} className="text-zinc-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-zinc-100 tracking-wide">
                        {profile ? "Edit responder profile" : "Complete responder profile"}
                      </h2>
                      <p className="text-xs text-indigo-200/60 mt-0.5">
                        {user?.email || user?.phoneNumber || "Signed in"}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-full h-8 w-8"
                    title="Log Out"
                  >
                    <LogOut size={16} />
                  </Button>
                </div>

                {profileError && (
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-rose-300/90">{profileError}</p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Full Name
                    <Input
                      value={profileForm.name}
                      onChange={(event) => setProfileForm((currentForm) => ({ ...currentForm, name: event.target.value }))}
                      placeholder="Enter your name"
                      className="h-11 bg-zinc-950/50 border-zinc-700 text-white normal-case tracking-normal font-medium"
                    />
                  </label>
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Phone
                    <Input
                      value={profileForm.phone}
                      onChange={(event) => setProfileForm((currentForm) => ({ ...currentForm, phone: event.target.value }))}
                      placeholder="+971..."
                      className="h-11 bg-zinc-950/50 border-zinc-700 text-white normal-case tracking-normal font-medium"
                    />
                  </label>
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 sm:col-span-2">
                    Vehicle
                    <Input
                      value={profileForm.vehicleType}
                      onChange={(event) => setProfileForm((currentForm) => ({ ...currentForm, vehicleType: event.target.value }))}
                      placeholder="Vehicle type"
                      className="h-11 bg-zinc-950/50 border-zinc-700 text-white normal-case tracking-normal font-medium"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Responder Skills</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {responderSkillOptions.map((skill) => {
                      const selected = profileForm.skills.includes(skill);
                      return (
                        <label
                          key={skill}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                            selected
                              ? "bg-indigo-950/30 border-indigo-500/40 text-indigo-200"
                              : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSkill(skill)}
                            className="sr-only"
                          />
                          <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            selected ? "border-indigo-400 bg-indigo-500" : "border-zinc-700"
                          }`}>
                            {selected && <CheckCircle2 size={12} className="text-white" />}
                          </span>
                          <span>{skill}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">GPS Location</p>
                    <p className="mt-1 font-mono text-xs text-zinc-300">
                      {profileForm.location
                        ? `${profileForm.location.lat.toFixed(4)}, ${profileForm.location.lng.toFixed(4)}`
                        : "Not set"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    className="h-full min-h-12 border-zinc-700 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800"
                  >
                    <MapPin size={16} className="mr-2 text-indigo-400" />
                    {locating ? "Locating..." : "Set GPS"}
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/30 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Availability</p>
                    <p className="text-xs text-indigo-200/50 mt-0.5">{isAvailable ? "Available" : "Offline"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAvailabilityToggle}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                      isAvailable ? "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "bg-zinc-700/50"
                    }`}
                    title="Toggle Availability"
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                      isAvailable ? "translate-x-8" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {profile && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setProfileForm({
                          name: profile.name,
                          phone: profile.phone,
                          vehicleType: profile.vehicleType,
                          skills: profile.skills,
                          location: profile.location ?? null,
                        });
                        setProfileError(null);
                        setIsEditingProfile(false);
                      }}
                      className="h-11 border-zinc-700 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={profileSaving}
                    className="h-11 flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-wider"
                  >
                    <Save size={16} className="mr-2" />
                    {profileSaving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0">
                      <User size={24} className="text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-zinc-100 tracking-wide truncate">{profile.name}</h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-indigo-200/60 mt-0.5">
                        <span className="inline-flex items-center gap-1.5">
                          <Car size={12} /> {profile.vehicleType}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={12} /> {profile.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleAvailabilityToggle}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                        isAvailable ? "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "bg-zinc-700/50"
                      }`}
                      title="Toggle Availability"
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                        isAvailable ? "translate-x-8" : "translate-x-1"
                      }`} />
                    </button>
                    <Button
                      onClick={() => {
                        setProfileNotice(null);
                        setProfileError(null);
                        setIsEditingProfile(true);
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-indigo-300 hover:bg-indigo-950/30 rounded-full h-8 w-8"
                      title="Edit Profile"
                    >
                      <Pencil size={16} />
                    </Button>
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

                {profileNotice && (
                  <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                    {profileNotice}
                  </div>
                )}

                {profileError && (
                  <div className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-rose-300/90">{profileError}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="bg-indigo-950/20 border-indigo-500/30 text-indigo-300 font-medium tracking-wide">
                      {skill}
                    </Badge>
                  ))}
                  <Badge variant="outline" className={profile.location ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300 font-medium tracking-wide" : "bg-zinc-950/30 border-zinc-700 text-zinc-400 font-medium tracking-wide"}>
                    {profile.location ? "GPS Linked" : "GPS Not Set"}
                  </Badge>
                </div>
              </>
            )}
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
                            <Badge key={skill} variant="outline" className="bg-zinc-800/50 text-zinc-300 text-[10px] font-medium tracking-wider uppercase border border-zinc-700/50 hover:bg-zinc-800/50">
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

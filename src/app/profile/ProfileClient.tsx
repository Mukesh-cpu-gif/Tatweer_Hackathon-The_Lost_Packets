"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, signOut, updateProfile, type User as FirebaseUser } from "firebase/auth";
import { AlertCircle, Car, CheckCircle2, LogOut, MapPin, Save, Stethoscope, User } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { type CommunityProfile, saveCommunityProfile, subscribeCommunityProfile } from "@/lib/db";
import type { Coordinates } from "@/lib/geo";
import { communitySkillOptions } from "@/lib/profileOptions";

type ProfileFormState = {
  name: string;
  phone: string;
  vehicleType: string;
  skills: string[];
  medicalDetails: string;
  location: Coordinates | null;
  available: boolean;
};

const createEmptyForm = (user?: FirebaseUser | null): ProfileFormState => ({
  name: user?.displayName ?? "",
  phone: user?.phoneNumber ?? "",
  vehicleType: "",
  skills: [],
  medicalDetails: "",
  location: null,
  available: true,
});

export default function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const setupMode = searchParams.get("setup") === "1";

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [form, setForm] = useState<ProfileFormState>(() => createEmptyForm());
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

    const unsubscribe = subscribeCommunityProfile(uid, (nextProfile) => {
      setProfile(nextProfile);
      setProfileLoading(false);

      if (nextProfile) {
        setForm({
          name: nextProfile.name,
          phone: nextProfile.phone,
          vehicleType: nextProfile.vehicleType,
          skills: nextProfile.skills,
          medicalDetails: nextProfile.medicalDetails,
          location: nextProfile.location ?? null,
          available: nextProfile.available,
        });
      } else {
        setForm(createEmptyForm(user));
      }
    });

    return () => unsubscribe();
  }, [user]);

  const toggleSkill = (skill: string) => {
    setForm((current) => {
      const selected = current.skills.includes(skill);
      return {
        ...current,
        skills: selected
          ? current.skills.filter((currentSkill) => currentSkill !== skill)
          : [...current.skills, skill],
      };
    });
  };

  const handleUseCurrentLocation = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError(t("Location services are not available in this browser."));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        }));
        setLocating(false);
      },
      () => {
        setError(t("Location permission was blocked. You can save your profile and add GPS later."));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleLogout = async () => {
    if (!isFirebaseConfigured) {
      router.push("/");
      return;
    }

    await signOut(auth);
    router.push("/");
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const uid = user?.uid ?? (!isFirebaseConfigured ? "demo-user" : null);
    if (!uid) return;

    const cleanedProfile = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      vehicleType: form.vehicleType.trim(),
      skills: form.skills,
      medicalDetails: form.medicalDetails.trim(),
      available: form.available,
      location: form.location ?? undefined,
    };

    if (!cleanedProfile.name || !cleanedProfile.phone) {
      setError(t("Add your full name and phone number before saving."));
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      await saveCommunityProfile(uid, cleanedProfile);

      if (user && user.displayName !== cleanedProfile.name) {
        try {
          await updateProfile(user, { displayName: cleanedProfile.name });
        } catch (profileError) {
          console.error("Display name update failed", profileError);
        }
      }

      if (setupMode) {
        router.push("/home");
        return;
      }

      setNotice(t("Profile saved."));
    } catch (nextError) {
      console.error("Profile save failed", nextError);
      setError(t("Could not save your profile. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/50 border-t-indigo-400" />
        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">{t("Loading Profile...")}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 pb-28 selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-sky-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[100px]" />

      <header className="sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-950/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-xl font-bold uppercase tracking-wider text-transparent">
              {setupMode || !profile ? t("Community Setup") : t("Profile")}
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-indigo-200/50">
              {t("Contact, skills, vehicle, and medical readiness")}
            </p>
          </div>
          <Button
            type="button"
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-zinc-400 hover:bg-rose-950/30 hover:text-rose-400"
            title={t("Log out")}
          >
            <LogOut size={17} />
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl space-y-6 px-5 py-6">
        {(setupMode || !profile) && (
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4">
            <p className="text-xs font-semibold leading-relaxed tracking-wide text-indigo-100/80">
              {t("Complete this once so Aounak can match your skills to nearby incidents and share the right contact details during emergencies.")}
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
            <p className="text-xs text-rose-300/90">{error}</p>
          </div>
        )}

        {notice && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
            {notice}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="border border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md">
            <CardHeader className="border-b border-zinc-800/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-300">
                <User size={16} className="text-indigo-400" />
                {t("User & Contact")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                {t("Full Name")}
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder={t("Enter your name")}
                  className="h-11 border-zinc-700 bg-zinc-950/50 font-medium normal-case tracking-normal text-white"
                />
              </label>
              <label className="space-y-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                {t("Phone")}
                <Input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="+971..."
                  className="h-11 border-zinc-700 bg-zinc-950/50 font-medium normal-case tracking-normal text-white"
                />
              </label>
            </CardContent>
          </Card>

          <Card className="border border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md">
            <CardHeader className="border-b border-zinc-800/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-300">
                <Car size={16} className="text-indigo-400" />
                {t("Vehicle & Location")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <label className="space-y-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                {t("Vehicle Details")}
                <Input
                  value={form.vehicleType}
                  onChange={(event) => setForm((current) => ({ ...current, vehicleType: event.target.value }))}
                  placeholder={t("Vehicle type or description")}
                  className="h-11 border-zinc-700 bg-zinc-950/50 font-medium normal-case tracking-normal text-white"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t("GPS Location")}</p>
                  <p className="mt-1 font-mono text-xs text-zinc-300">
                    {form.location ? `${form.location.lat.toFixed(4)}, ${form.location.lng.toFixed(4)}` : t("Not set")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  className="min-h-12 border-zinc-700 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800"
                >
                  <MapPin size={16} className="mr-2 text-indigo-400" />
                  {locating ? t("Locating...") : t("Set GPS")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md">
            <CardHeader className="border-b border-zinc-800/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-300">
                <CheckCircle2 size={16} className="text-indigo-400" />
                {t("Skills & Availability")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {communitySkillOptions.map((skill) => {
                  const selected = form.skills.includes(skill);
                  return (
                    <label
                      key={skill}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold tracking-wide transition-all ${
                        selected
                          ? "border-indigo-500/40 bg-indigo-950/30 text-indigo-200"
                          : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <input type="checkbox" checked={selected} onChange={() => toggleSkill(skill)} className="sr-only" />
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-indigo-400 bg-indigo-500" : "border-zinc-700"}`}>
                        {selected && <CheckCircle2 size={12} className="text-white" />}
                      </span>
                      <span>{t(skill)}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/30 px-3 py-2.5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{t("Available to Help")}</p>
                  <p className="mt-0.5 text-xs text-indigo-200/50">{form.available ? t("Available") : t("Offline")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, available: !current.available }))}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${
                    form.available ? "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "bg-zinc-700/50"
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${form.available ? "translate-x-8" : "translate-x-1"}`} />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md">
            <CardHeader className="border-b border-zinc-800/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-300">
                <Stethoscope size={16} className="text-indigo-400" />
                {t("Medical Details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <textarea
                value={form.medicalDetails}
                onChange={(event) => setForm((current) => ({ ...current, medicalDetails: event.target.value }))}
                placeholder={t("Allergies, medications, conditions, emergency notes...")}
                rows={4}
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
            </CardContent>
          </Card>

          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="border-indigo-500/30 bg-indigo-950/20 font-medium tracking-wide text-indigo-300">
                  {t(skill)}
                </Badge>
              ))}
            </div>
          )}

          <Button type="submit" disabled={saving} className="h-12 w-full rounded-xl bg-indigo-600 font-bold uppercase tracking-widest text-white hover:bg-indigo-500">
            <Save size={16} className="mr-2" />
            {saving ? t("Saving...") : setupMode ? t("Save & Go Home") : t("Save Profile")}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, signOut, updateProfile, type User as FirebaseUser } from "firebase/auth";
import { AlertCircle, Car, CheckCircle2, LogOut, MapPin, Save, Stethoscope, User } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { GlassPanel } from "@/components/GlassPanel";
import { ProfileCompletionCard } from "@/components/ProfileCompletionCard";
import { StatusPill } from "@/components/StatusPill";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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

  const profileMissingItems = [
    !form.name.trim() ? t("Name") : "",
    !form.phone.trim() ? t("Phone") : "",
    !form.vehicleType.trim() ? t("Vehicle") : "",
    form.skills.length === 0 ? t("Skills") : "",
    !form.location ? t("GPS Location") : "",
  ].filter(Boolean);
  const profileCompletion = Math.round(((5 - profileMissingItems.length) / 5) * 100);

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-5">
        <GlassPanel tone="system" className="w-full max-w-sm p-5">
          <div className="space-y-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <p className="text-center text-sm font-bold uppercase tracking-widest text-zinc-400">{t("Loading Profile...")}</p>
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
          <Alert variant="system">
            <AlertTitle>{t("Community Setup")}</AlertTitle>
            <AlertDescription>
              {t("Complete this once so Aounak can match your skills to nearby incidents and share the right contact details during emergencies.")}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="danger">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        )}

        {notice && (
          <Alert variant="success">
            <AlertDescription className="font-semibold">{notice}</AlertDescription>
          </Alert>
        )}

        <ProfileCompletionCard
          title={t("Profile readiness")}
          subtitle={t("Contact, skills, vehicle, and medical readiness")}
          percentage={profileCompletion}
          missingItems={profileMissingItems}
          completeLabel={t("Ready")}
          incompleteLabel={t("Incomplete")}
        />

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
                  <div className="mt-1">
                    <StatusPill tone={form.available ? "success" : "offline"}>
                      {form.available ? t("Available") : t("Offline")}
                    </StatusPill>
                  </div>
                </div>
                <Switch
                  checked={form.available}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, available: checked }))}
                  aria-label={t("Available to Help")}
                />
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

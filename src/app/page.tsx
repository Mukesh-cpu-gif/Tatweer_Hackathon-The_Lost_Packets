"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowRight, Compass, LogIn, ShieldAlert, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmergencyCommandTile } from "@/components/EmergencyCommandTile";
import { GlassPanel } from "@/components/GlassPanel";
import { StatusPill } from "@/components/StatusPill";
import { useLanguage } from "@/context/LanguageContext";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

export default function WelcomePage() {
  const router = useRouter();
  const { t, toggleLanguage, isAr } = useLanguage();
  const [checkingAuth, setCheckingAuth] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          router.replace("/home");
          return;
        }
        setCheckingAuth(false);
      },
      () => setCheckingAuth(false)
    );

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-zinc-950 selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(49,46,129,0.45),transparent_55%),linear-gradient(to_bottom,rgba(12,10,9,0.12),rgba(9,9,11,0.96))]" />

      <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-5">
        <div>
          <h1 className="flex items-center gap-2 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-xl font-bold uppercase tracking-wider text-transparent">
            {t("Aounak")}
          </h1>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-200/50">
            {t("Rapid Response Network")}
          </p>
          <div className="mt-2">
            <StatusPill tone="system">{t("Dispatch Center")}</StatusPill>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="rounded-full border border-zinc-700/50 bg-zinc-900/50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-200/90 shadow-md transition-all duration-300 hover:bg-zinc-800 active:scale-95"
        >
          {isAr ? "EN 🌐" : "AR 🌐"}
        </button>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-grow flex-col justify-center space-y-9 px-5 py-10">
        <div className="relative space-y-3 text-center">
          <div className="absolute inset-0 -z-10 mx-auto h-32 w-32 rounded-full bg-indigo-500/10 blur-[50px]" />
          <div className="mb-2 inline-flex rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-4 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <Compass size={40} className="animate-spin-slow text-indigo-400" />
          </div>
          <h2 className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-3xl font-extrabold uppercase tracking-widest text-transparent">
            {t("Welcome to Aounak")}
          </h2>
          <p className="text-sm font-medium tracking-wide text-indigo-200/60">
            {checkingAuth ? t("Loading Aounak...") : t("Choose how you want to continue.")}
          </p>
        </div>

        <div className="grid gap-4">
          <GlassPanel tone="danger" interactive className="group">
            <div className="relative z-10 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 shadow-md">
                  <ShieldAlert size={25} className="animate-pulse text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wide text-zinc-100">
                    {t("Send SOS Now")}
                  </h3>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-zinc-400">
                    {t("Report immediately without registration.")}
                  </p>
                </div>
              </div>
              <Link href="/sos" className="shrink-0">
                <Button className="h-11 w-full rounded-xl bg-rose-600 px-5 text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:bg-rose-500 sm:w-auto">
                  {t("Start SOS")}
                  <ArrowRight size={14} className={`ml-2 ${isAr ? "rotate-180" : ""}`} />
                </Button>
              </Link>
            </div>
          </GlassPanel>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/login" className="block">
              <EmergencyCommandTile
                icon={LogIn}
                label={t("Log In")}
                description={t("Return to your community profile and history.")}
                tone="system"
                isRtl={isAr}
              />
            </Link>

            <Link href="/register" className="block">
              <EmergencyCommandTile
                icon={UserPlus}
                label={t("Register")}
                description={t("Create a profile so nearby helpers can match your skills.")}
                tone="gps"
                isRtl={isAr}
              />
            </Link>
          </div>

        </div>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-4xl px-5 py-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Aounak Rapid Rescue Network &copy; 2026
        </p>
      </footer>
    </div>
  );
}

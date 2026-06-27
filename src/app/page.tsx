"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowRight, Compass, LogIn, ShieldAlert, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

export default function WelcomePage() {
  const router = useRouter();
  const { t, language, toggleLanguage, isAr } = useLanguage();
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
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute left-[20%] top-[40%] h-[300px] w-[300px] rounded-full bg-sky-600/10 blur-[100px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-5">
        <div>
          <h1 className="flex items-center gap-2 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-xl font-bold uppercase tracking-wider text-transparent">
            {t("Aounak")}
            {language === "en" && (
              <span className="font-sans text-lg font-medium tracking-normal text-indigo-200/60" dir="rtl">
                عَوْنَك
              </span>
            )}
          </h1>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-200/50">
            {t("Rapid Response Network")}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="rounded-full border border-zinc-700/50 bg-zinc-900/50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-200/90 shadow-md transition-all duration-300 hover:bg-zinc-800 active:scale-95"
        >
          {language === "en" ? "عربي 🌐" : "🌐 EN"}
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
          <Card className="group relative overflow-hidden rounded-2xl border border-rose-500/25 bg-zinc-900/35 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-1 hover:border-rose-400/45">
            <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-32 w-32 rounded-full bg-rose-500/10 blur-[40px] transition-all duration-500 group-hover:bg-rose-500/15" />
            <CardContent className="relative z-10 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
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
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-1 hover:border-indigo-500/30">
              <CardContent className="relative z-10 flex h-full flex-col justify-between p-5">
                <div className="space-y-3">
                  <div className="inline-flex rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3">
                    <LogIn size={22} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-100">{t("Log In")}</h3>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-zinc-400">
                      {t("Return to your community profile and history.")}
                    </p>
                  </div>
                </div>
                <Link href="/login" className="mt-5 block">
                  <Button variant="outline" className="h-11 w-full rounded-xl border-zinc-700/50 bg-zinc-950/50 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-indigo-950/50 hover:text-indigo-200">
                    {t("Log In")}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-1 hover:border-sky-500/30">
              <CardContent className="relative z-10 flex h-full flex-col justify-between p-5">
                <div className="space-y-3">
                  <div className="inline-flex rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3">
                    <UserPlus size={22} className="text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-100">{t("Register")}</h3>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-zinc-400">
                      {t("Create a profile so nearby helpers can match your skills.")}
                    </p>
                  </div>
                </div>
                <Link href="/register" className="mt-5 block">
                  <Button variant="outline" className="h-11 w-full rounded-xl border-zinc-700/50 bg-zinc-950/50 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-sky-950/50 hover:text-sky-200">
                    {t("Register")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
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

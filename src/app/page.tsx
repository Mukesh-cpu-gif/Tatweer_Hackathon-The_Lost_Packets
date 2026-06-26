"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, Compass, ArrowRight, ShieldCheck } from "lucide-react";

export default function GatewayPage() {
  const { t, language, toggleLanguage, isAr } = useLanguage();

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 flex flex-col justify-between selection:bg-indigo-500/30 overflow-hidden">
      
      {/* ─── Cosmic Background Nebulas ───────────────────────────── */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-sky-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="relative z-10 px-5 py-5 max-w-4xl mx-auto w-full flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 flex items-center gap-2">
            {t("Aounak")}
            {language === "en" && (
              <span className="text-indigo-200/60 font-medium text-lg tracking-normal font-sans" dir="rtl">
                عَوْنَك
              </span>
            )}
          </h1>
          <p className="text-indigo-200/50 text-[10px] tracking-widest uppercase font-semibold">
            {t("Rapid Response Network")}
          </p>
        </div>
        
        {/* Language Switcher Toggle */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="bg-zinc-900/50 border border-zinc-700/50 hover:bg-zinc-800 text-indigo-200/90 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all duration-300 active:scale-95 shadow-md"
        >
          {language === "en" ? "عربي 🌐" : "🌐 EN"}
        </button>
      </header>

      {/* ─── Main Entrance Grid ────────────────────────────────── */}
      <main className="relative z-10 px-5 py-12 max-w-2xl mx-auto w-full flex-grow flex flex-col justify-center space-y-10">
        
        {/* Welcome Banner */}
        <div className="text-center space-y-3 relative">
          <div className="absolute inset-0 bg-indigo-500/10 blur-[50px] rounded-full w-32 h-32 mx-auto -z-10" />
          <div className="inline-flex p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 mb-2 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <Compass size={40} className="text-indigo-400 animate-spin-slow" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
            {t("Welcome to Aounak")}
          </h2>
          <p className="text-indigo-200/60 font-medium text-sm tracking-wide">
            {t("Select your access pathway to continue.")}
          </p>
        </div>

        {/* Action Pathways Stack */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* PATHWAY 1: Emergency SOS */}
          <Card className="relative overflow-hidden bg-zinc-900/30 border border-zinc-800 hover:border-rose-500/30 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-1.5 group flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-rose-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-rose-500/10 transition-all duration-500" />
            <CardContent className="p-6 flex-grow flex flex-col justify-between relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-md group-hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-500">
                    <ShieldAlert size={24} className="text-rose-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100 text-base uppercase tracking-wide">
                      {t("Emergency SOS")}
                    </h3>
                    <p className="text-[10px] text-rose-400/80 font-bold uppercase tracking-widest mt-0.5">
                      {t("Desert Assistance")}
                    </p>
                  </div>
                </div>
                <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                  {t("If you are stranded, require vehicle recovery, fuel, water, veterinary help, or medical assistance in the desert.")}
                </p>
              </div>
              
              <Link href="/sos" className="block w-full pt-6">
                <Button 
                  className="w-full h-12 bg-rose-600 hover:bg-rose-500 text-white font-bold tracking-widest uppercase text-xs rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.35)] transition-all duration-300"
                >
                  {t("Report Emergency")}
                  <ArrowRight size={14} className={`ml-2 group-hover:translate-x-1 transition-transform ${isAr ? "rotate-180" : ""}`} />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* PATHWAY 2: Responder / Dispatch Portal */}
          <Card className="relative overflow-hidden bg-zinc-900/30 border border-zinc-800 hover:border-indigo-500/30 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-1.5 group flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-500" />
            <CardContent className="p-6 flex-grow flex flex-col justify-between relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-md group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-500">
                    <ShieldCheck size={24} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100 text-base uppercase tracking-wide">
                      {t("Responder Portal")}
                    </h3>
                    <p className="text-[10px] text-indigo-400/80 font-bold uppercase tracking-widest mt-0.5">
                      {t("Dispatch Center")}
                    </p>
                  </div>
                </div>
                <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                  {t("For rescue volunteers, dispatchers, and vets to manage active incidents and coordinate response routes.")}
                </p>
              </div>
              
              <Link href="/responder" className="block w-full pt-6">
                <Button 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-widest uppercase text-xs rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.35)] transition-all duration-300"
                >
                  {t("Access Dispatch Center")}
                  <ArrowRight size={14} className={`ml-2 group-hover:translate-x-1 transition-transform ${isAr ? "rotate-180" : ""}`} />
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>

      </main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="relative z-10 px-5 py-6 max-w-4xl mx-auto w-full text-center">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
          Aounak Rapid Rescue Network &copy; 2026
        </p>
      </footer>
    </div>
  );
}

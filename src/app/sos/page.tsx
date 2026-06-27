"use client";

import Link from "next/link";
import { Activity, Bug, ChevronLeft, Droplet, Fuel, HeartPulse, ShieldAlert, Stethoscope, Tractor } from "lucide-react";
import { EmergencyCommandTile } from "@/components/EmergencyCommandTile";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { sosTypes } from "@/lib/mockData";

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

export default function SOSChooserPage() {
  const { t, language, toggleLanguage, isAr } = useLanguage();

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 pb-10 selection:bg-rose-500/30">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(76,29,149,0.36),transparent_55%),linear-gradient(to_bottom,rgba(12,10,9,0.08),rgba(9,9,11,0.96))]" />

      <nav className="relative z-10 mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <Link href="/">
          <Button variant="ghost" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full p-0 text-zinc-400 hover:bg-white/5 hover:text-white">
            <ChevronLeft size={24} strokeWidth={1.5} className={language === "ar" ? "rotate-180" : ""} />
          </Button>
        </Link>

        <button
          type="button"
          onClick={toggleLanguage}
          className="rounded-full border border-zinc-700/50 bg-zinc-900/50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-200/90 shadow-md transition-all duration-300 hover:bg-zinc-800 active:scale-95"
        >
          {isAr ? "EN 🌐" : "AR 🌐"}
        </button>
      </nav>

      <main className="relative z-10 mx-auto max-w-2xl space-y-8 px-5 py-6">
        <div className="relative space-y-3 text-center">
          <div className="absolute inset-0 -z-10 mx-auto h-32 w-32 rounded-full bg-rose-500/10 blur-[50px]" />
          <div className="mb-2 inline-flex rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
            <ShieldAlert size={48} strokeWidth={1.5} className="animate-pulse text-rose-500" />
          </div>
          <h1 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-3xl font-bold uppercase tracking-widest text-transparent">
            {t("Send SOS Now")}
          </h1>
          <p className="text-sm font-semibold uppercase tracking-widest text-rose-200/60">
            {t("Choose Emergency Type")}
          </p>
          <StatusPill tone="live" pulse>{t("Active Emergency")}</StatusPill>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {sosTypes.map((sos) => {
            const Icon = sos.lucideIconName && iconMap[sos.lucideIconName] ? iconMap[sos.lucideIconName] : Activity;

            return (
              <Link key={sos.id} href={`/sos/report?type=${sos.id}&returnTo=/sos`} className="block">
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
      </main>
    </div>
  );
}

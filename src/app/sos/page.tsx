"use client";

import Link from "next/link";
import { Activity, ArrowRight, Bug, ChevronLeft, Droplet, Fuel, HeartPulse, ShieldAlert, Stethoscope, Tractor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function SOSChooserPage() {
  const { t, language, toggleLanguage, isAr } = useLanguage();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 pb-10 selection:bg-rose-500/30">
      <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-rose-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />

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
          {language === "en" ? "عربي 🌐" : "🌐 EN"}
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
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {sosTypes.map((sos) => {
            const Icon = sos.lucideIconName && iconMap[sos.lucideIconName] ? iconMap[sos.lucideIconName] : Activity;
            const style = sos.styleConfig ?? {
              bg: "bg-zinc-900/40 border border-zinc-800/50 hover:bg-white/5",
              text: "text-zinc-300",
              iconColor: "text-zinc-400",
            };

            return (
              <Link key={sos.id} href={`/sos/report?type=${sos.id}`} className="block">
                <Card className={`group min-h-36 overflow-hidden rounded-2xl shadow-none ${style.bg}`}>
                  <CardContent className="flex h-full flex-col items-center justify-between p-5 text-center">
                    <Icon size={34} strokeWidth={1.5} className={`${style.iconColor} mb-3 transition-transform duration-500 group-hover:scale-110`} />
                    <div>
                      <p className={`text-sm font-bold uppercase tracking-wide ${style.text}`}>
                        {language === "ar" ? sos.labelAr : sos.label}
                      </p>
                      {language === "en" && (
                        <p className="mt-1 text-xs font-medium text-indigo-200/50" dir="rtl">
                          {sos.labelAr}
                        </p>
                      )}
                    </div>
                    <ArrowRight size={15} className={`mt-4 text-zinc-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-rose-300 ${isAr ? "rotate-180" : ""}`} />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

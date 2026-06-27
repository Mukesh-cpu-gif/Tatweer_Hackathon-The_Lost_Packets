"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, Bug, ChevronLeft, Droplet, Fuel, HeartPulse, ShieldAlert, Stethoscope, Tractor, Mic, Loader2, X, AlertTriangle, Users, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import { sosTypes } from "@/lib/mockData";
import VoiceSosButton from "@/components/VoiceSosButton";

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
  const router = useRouter();

  const [voiceText, setVoiceText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedDraft, setParsedDraft] = useState<any | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualText, setManualText] = useState("");

  const handleVoiceTranscript = (text: string) => {
    setVoiceText(text);
    setIsAnalyzing(true);
    setShowReviewModal(true);

    fetch("/api/voice-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setParsedDraft(data);
        } else {
          console.error("Voice AI parsing failed:", data.error);
        }
      })
      .catch((err) => console.error("Failed to parse voice:", err))
      .finally(() => setIsAnalyzing(false));
  };

  const handleConfirmDraft = () => {
    if (!parsedDraft) return;
    sessionStorage.setItem("aounak-voice-sos-draft", JSON.stringify(parsedDraft));
    router.push(`/sos/report?type=${parsedDraft.type}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 pb-20 selection:bg-rose-500/30">
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

      <main className="relative z-10 mx-auto max-w-2xl space-y-6 px-5 py-6">
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

        {/* ─── Voice Command AI Card ─────────────────────────── */}
        <Card className="border border-indigo-500/30 bg-indigo-950/20 shadow-[0_0_30px_rgba(99,102,241,0.08)] backdrop-blur-md rounded-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          <CardContent className="p-5 flex flex-col items-stretch gap-4 relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4 text-left">
                <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shrink-0">
                  <Mic className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-300">Voice Assistant SOS</h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed max-w-sm">
                    Tap microphone to state your emergency hands-free. Specify name, phone, crisis description, and location details.
                  </p>
                </div>
              </div>
              
              <VoiceSosButton 
                onTranscriptionComplete={handleVoiceTranscript}
                className="shrink-0"
              />
            </div>

            {/* Demo / Offline Text Fallback */}
            <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowTextInput(!showTextInput)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest text-left w-fit self-start transition-colors"
              >
                {showTextInput ? "Hide text entry" : "⌨️ Or type your emergency text command (Demo Fallback)"}
              </button>

              {showTextInput && (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="e.g. need help snake bit me, name is aasif, phone 052404918..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    className="flex-grow bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-700"
                  />
                  <Button
                    onClick={() => handleVoiceTranscript(manualText)}
                    disabled={!manualText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest px-4 h-10 rounded-xl shrink-0 shadow-md"
                  >
                    Analyze
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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

      {/* ─── Voice SOS AI Review Modal ──────────────────────── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-lg font-bold tracking-wider uppercase text-indigo-400 flex items-center gap-2">
                <Mic size={20} className="text-indigo-400 animate-pulse" />
                AI Emergency Transcript
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Processing your voice recording...
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Transcribed Voice</label>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-300 italic leading-relaxed">
                  "{voiceText || "Recording captured, waiting for analysis..."}"
                </div>
              </div>

              {isAnalyzing ? (
                <div className="h-44 flex flex-col items-center justify-center bg-zinc-950/40 border border-zinc-800/50 rounded-xl border-dashed">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Running Entity Classifier...</p>
                </div>
              ) : parsedDraft ? (
                <div className="space-y-3.5">
                  <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Classified Emergency</span>
                      <Badge variant="outline" className="bg-rose-950/40 border-rose-500/30 text-rose-300 font-bold uppercase text-[9px] tracking-wider">
                        {parsedDraft.type.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Name</p>
                        <p className="font-semibold text-zinc-200">{parsedDraft.name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Phone</p>
                        <p className="font-semibold text-zinc-200">{parsedDraft.phone}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Passengers</p>
                        <p className="font-semibold text-zinc-200">{parsedDraft.passengers}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Diagnostics / Specs</p>
                        <p className="font-semibold text-zinc-200 truncate">{parsedDraft.specifics}</p>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800/80 pt-2 text-xs">
                      <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Notes Summary</p>
                      <p className="text-zinc-300 leading-relaxed font-medium">{parsedDraft.notes}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button
                      onClick={() => setShowReviewModal(false)}
                      variant="outline"
                      className="w-1/3 border-zinc-800 bg-zinc-950 text-zinc-400 font-bold text-xs uppercase tracking-widest h-12 rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmDraft}
                      className="w-2/3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-widest uppercase text-xs h-12 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                    >
                      <Check className="w-4 h-4" />
                      Proceed to SOS Form
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center bg-zinc-950/40 border border-zinc-800/50 rounded-xl border-dashed">
                  <AlertTriangle className="w-8 h-8 text-rose-500 mb-2" />
                  <p className="text-zinc-400 text-xs font-semibold">Classifier analysis failed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

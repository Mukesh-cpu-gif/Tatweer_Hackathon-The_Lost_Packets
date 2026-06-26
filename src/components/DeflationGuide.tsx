"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tractor, Info, AlertTriangle } from "lucide-react";

interface VehicleOption {
  id: string;
  label: string;
  labelAr: string;
  emoji: string;
  desc: string;
}

interface TerrainOption {
  id: string;
  label: string;
  labelAr: string;
  emoji: string;
  desc: string;
}

const VEHICLES: VehicleOption[] = [
  { id: "crossover", label: "Crossover SUV", labelAr: "كروس أوفر", emoji: "🚙", desc: "e.g. RAV4, CR-V (No low-range gear)" },
  { id: "heavy_4x4", label: "Heavy 4x4", labelAr: "دفع رباعي ثقيل", emoji: "🚜", desc: "e.g. Land Cruiser, Patrol, Raptor" },
  { id: "light_4x4", label: "Light 4x4 / Jeep", labelAr: "دفع رباعي خفيف", emoji: "🛞", desc: "e.g. Jimny, Wrangler, Defender" },
];

const TERRAINS: TerrainOption[] = [
  { id: "deep_sand", label: "Deep Sand / Dunes", labelAr: "رمل عميق / كثبان", emoji: "🏜️", desc: "Loose, dry sand dunes" },
  { id: "sabkha", label: "Sabkha / Salt Flat", labelAr: "سبخة ملحية", emoji: "🧂", desc: "Crusted flats, soft mud underneath" },
  { id: "gravel", label: "Gravel / Rocks", labelAr: "حصى / صخور", emoji: "🪨", desc: "Sharp gravel roads & rocky trails" },
];

interface DeflationRule {
  targetPsi: string;
  advice: string;
  adviceAr: string;
}

const DEFLATION_RULES: Record<string, Record<string, DeflationRule>> = {
  crossover: {
    deep_sand: {
      targetPsi: "15 - 17 PSI",
      advice: "Deflate carefully. Crossovers have smaller tire sidewalls. Do NOT deflate below 15 PSI to avoid rolling off the bead.",
      adviceAr: "قم بتنسيم الإطارات بحذر. لا تقلل الضغط عن 15 لتجنب خروج الإطار من الرنج."
    },
    sabkha: {
      targetPsi: "18 - 20 PSI",
      advice: "Keep steady momentum. Avoid stopping. Wet mud below salt crust can sink vehicles quickly.",
      adviceAr: "حافظ على زخم الحركة. تجنب التوقف. الطين الرطب تحت القشرة قد يغرق المركبة."
    },
    gravel: {
      targetPsi: "22 - 25 PSI",
      advice: "Slight deflation for comfort and traction. Keep speeds low to prevent sharp stone cuts.",
      adviceAr: "تنسيم بسيط للراحة والتماسك. حافظ على سرعة منخفضة لتجنب قطع الصخور للإطارات."
    }
  },
  heavy_4x4: {
    deep_sand: {
      targetPsi: "12 - 14 PSI",
      advice: "Heavy vehicles need wider footprint. Deflate down to 12 PSI if deeply stuck. Keep wheels straight when starting.",
      adviceAr: "المركبات الثقيلة تحتاج مساحة تلامس أكبر. نسم إلى 12 إذا علقت بعمق. حافظ على استقامة المقود."
    },
    sabkha: {
      targetPsi: "15 - 18 PSI",
      advice: "Keep low gear active. If tires start spinning, stop immediately and use traction boards or winch.",
      adviceAr: "فعل الترس المنخفض. إذا بدأت الإطارات بالدوران الفراغي، توقف فوراً واستخدم ألواح التخلص من التغريز."
    },
    gravel: {
      targetPsi: "20 - 24 PSI",
      advice: "Protects sidewalls from pinching on rocks. Maintain safe speeds to avoid tire punctures.",
      adviceAr: "يحمي جدار الإطار من القرص على الصخور. حافظ على سرعات آمنة لتجنب الثقوب."
    }
  },
  light_4x4: {
    deep_sand: {
      targetPsi: "10 - 12 PSI",
      advice: "Lightweight bodies can go lower. Floatation is high. Avoid high speeds or sharp turns to prevent de-beading.",
      adviceAr: "المركبات الخفيفة يمكنها النزول لضغط أقل. طفو عالي. تجنب السرعات العالية أو الانعطافات الحادة."
    },
    sabkha: {
      targetPsi: "13 - 15 PSI",
      advice: "Easy traction. Stay on existing tracks if visible. Do not brake hard.",
      adviceAr: "تماسك سهل. ابقَ على المسارات الواضحة إن وجدت. لا تضغط الفرامل بقوة."
    },
    gravel: {
      targetPsi: "18 - 22 PSI",
      advice: "Optimal balance of traction and ground clearance. Watch out for sharp stones.",
      adviceAr: "توازن مثالي بين التماسك وارتفاع المركبة. انتبه للحجارة الحادة."
    }
  }
};

interface DeflationGuideProps {
  onChange: (info: string) => void;
}

export default function DeflationGuide({ onChange }: DeflationGuideProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption>(VEHICLES[1]); // Heavy 4x4 default
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainOption>(TERRAINS[0]); // Deep Sand default
  
  const [step1, setStep1] = useState(false);
  const [step2, setStep2] = useState(false);
  const [step3, setStep3] = useState(false);

  const rule = useMemo(() => {
    return DEFLATION_RULES[selectedVehicle.id]?.[selectedTerrain.id] || {
      targetPsi: "15 PSI",
      advice: "General deflation recommended.",
      adviceAr: "ينصح بتنسيم عام للإطارات."
    };
  }, [selectedVehicle, selectedTerrain]);

  const summaryText = useMemo(() => {
    return `Stuck Vehicle: ${selectedVehicle.label} | Terrain: ${selectedTerrain.label} | Target Pressure: ${rule.targetPsi}`;
  }, [selectedVehicle, selectedTerrain, rule]);

  // Sync back to parent page
  useEffect(() => {
    onChange(summaryText);
  }, [summaryText, onChange]);

  // Reset steps when selections change
  useEffect(() => {
    setStep1(false);
    setStep2(false);
    setStep3(false);
  }, [selectedVehicle, selectedTerrain]);

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none" />
      <CardHeader className="pb-3 border-b border-zinc-800/50">
        <CardTitle className="flex items-center gap-2 text-slate-200 text-sm font-bold tracking-widest uppercase">
          <Tractor size={18} className="text-amber-400" />
          Tire Deflation & PSI Guide
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Configure vehicle & terrain details to display custom deflation recovery instructions.
        </p>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* ── Vehicle Selector ── */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Vehicle Type</label>
          <div className="grid grid-cols-3 gap-2.5">
            {VEHICLES.map((v) => {
              const isSelected = selectedVehicle.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVehicle(v)}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${
                    isSelected
                      ? "bg-amber-600/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-2xl mb-1 transition-transform duration-300 group-hover:scale-110">
                    {v.emoji}
                  </span>
                  <span className={`text-[10px] font-bold tracking-wide uppercase text-center ${
                    isSelected ? "text-amber-300" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}>
                    {v.label}
                  </span>
                  <span className={`text-[9px] font-medium opacity-50 mt-0.5 ${
                    isSelected ? "text-amber-400" : "text-zinc-500"
                  }`} dir="rtl">
                    {v.labelAr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Terrain Selector ── */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Terrain Condition</label>
          <div className="grid grid-cols-3 gap-2.5">
            {TERRAINS.map((t) => {
              const isSelected = selectedTerrain.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTerrain(t)}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${
                    isSelected
                      ? "bg-amber-600/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-2xl mb-1 transition-transform duration-300 group-hover:scale-110">
                    {t.emoji}
                  </span>
                  <span className={`text-[10px] font-bold tracking-wide uppercase text-center ${
                    isSelected ? "text-amber-300" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}>
                    {t.label}
                  </span>
                  <span className={`text-[9px] font-medium opacity-50 mt-0.5 ${
                    isSelected ? "text-amber-400" : "text-zinc-500"
                  }`} dir="rtl">
                    {t.labelAr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Custom Target PSI Gauge ── */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">Recommended Pressure</p>
              <p className="text-2xl font-extrabold text-zinc-100 mt-1">
                {rule.targetPsi}
              </p>
            </div>
            <Badge className="bg-amber-600/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold tracking-widest uppercase">
              Tire Deflation
            </Badge>
          </div>
          
          <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50 space-y-2">
            <div className="flex gap-2.5">
              <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-300 leading-relaxed font-medium">
                {rule.advice}
              </div>
            </div>
            <div className="text-[11px] text-amber-200/60 leading-relaxed text-right font-medium" dir="rtl">
              {rule.adviceAr}
            </div>
          </div>
        </div>

        {/* ── Interactive Recovery Checklist ── */}
        <div className="space-y-3 pt-2 border-t border-zinc-800/60">
          <label className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Active Self-Recovery Steps</label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/30 p-3 hover:bg-zinc-900/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={step1}
                onChange={() => setStep1(!step1)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900"
              />
              <div>
                <p className="text-xs font-semibold text-zinc-200">1. Deflate all 4 tires down to {rule.targetPsi}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Use tire deflators, a key, or a pin. Check pressure regularly.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/30 p-3 hover:bg-zinc-900/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={step2}
                onChange={() => setStep2(!step2)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900"
              />
              <div>
                <p className="text-xs font-semibold text-zinc-200">2. Clear sand blockages around the tires</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Dig out sand behind and in front of all 4 tires to create a ramp.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/30 p-3 hover:bg-zinc-900/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={step3}
                onChange={() => setStep3(!step3)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900"
              />
              <div>
                <p className="text-xs font-semibold text-zinc-200">3. Set wheels straight & drive out slowly</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Set steering wheel completely straight. Apply smooth, low throttle.</p>
              </div>
            </label>
          </div>
          
          <div className="flex gap-2 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 mt-1.5">
            <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <p className="text-[10px] text-rose-300/80 leading-relaxed font-semibold uppercase tracking-wider">
              Warning: Do NOT make sharp turns below 15 PSI. This prevents tires from popping off the rim (de-beading).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

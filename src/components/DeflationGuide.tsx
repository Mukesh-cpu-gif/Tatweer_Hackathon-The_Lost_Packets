"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tractor, Info, AlertTriangle, Scale } from "lucide-react";

interface VehicleOption {
  id: string;
  label: string;
  labelAr: string;
  emoji: string;
  desc: string;
  defaultWeight: number;
  minWeight: number;
  maxWeight: number;
  basePsi: number;      // Base PSI on soft sand
  minSafePsi: number;   // Minimum safe threshold to prevent de-beading
}

interface TerrainOption {
  id: string;
  label: string;
  labelAr: string;
  emoji: string;
  desc: string;
  psiOffset: number;    // Offset relative to soft sand base
}

const VEHICLES: VehicleOption[] = [
  {
    id: "hatchback",
    label: "Hatchback",
    labelAr: "هاتشباك",
    emoji: "🚗",
    desc: "e.g. Golf, Yaris, Swift",
    defaultWeight: 1200,
    minWeight: 800,
    maxWeight: 1800,
    basePsi: 16,
    minSafePsi: 16,
  },
  {
    id: "sedan",
    label: "Sedan",
    labelAr: "سيدان",
    emoji: "🚗",
    desc: "e.g. Corolla, Camry, Accord",
    defaultWeight: 1500,
    minWeight: 1000,
    maxWeight: 2500,
    basePsi: 17,
    minSafePsi: 16,
  },
  {
    id: "crossover",
    label: "Crossover SUV",
    labelAr: "كروس أوفر",
    emoji: "🚙",
    desc: "e.g. RAV4, CR-V, Tucson",
    defaultWeight: 1800,
    minWeight: 1200,
    maxWeight: 2800,
    basePsi: 15,
    minSafePsi: 14,
  },
  {
    id: "heavy_4x4",
    label: "Heavy 4x4",
    labelAr: "دفع رباعي ثقيل",
    emoji: "🚜",
    desc: "e.g. Land Cruiser, Patrol, Raptor",
    defaultWeight: 2600,
    minWeight: 2000,
    maxWeight: 4500,
    basePsi: 13,
    minSafePsi: 10,
  },
  {
    id: "light_4x4",
    label: "Light 4x4 / Jeep",
    labelAr: "دفع رباعي خفيف",
    emoji: "🛞",
    desc: "e.g. Jimny, Wrangler, Defender",
    defaultWeight: 1400,
    minWeight: 900,
    maxWeight: 2200,
    basePsi: 11,
    minSafePsi: 8,
  },
];

const TERRAINS: TerrainOption[] = [
  { id: "deep_sand", label: "Deep Sand / Dunes", labelAr: "رمل عميق / كثبان", emoji: "🏜️", desc: "Loose, dry sand dunes", psiOffset: 0 },
  { id: "sabkha", label: "Sabkha / Salt Flat", labelAr: "سبخة ملحية", emoji: "🧂", desc: "Crusted flats, soft mud underneath", psiOffset: 3 },
  { id: "gravel", label: "Gravel / Rocks", labelAr: "حصى / صخور", emoji: "🪨", desc: "Sharp gravel roads & rocky trails", psiOffset: 8 },
];

interface DeflationGuideProps {
  onChange: (info: string) => void;
}

export default function DeflationGuide({ onChange }: DeflationGuideProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption>(VEHICLES[3]); // Heavy 4x4 default
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainOption>(TERRAINS[0]); // Deep Sand default
  const [vehicleWeight, setVehicleWeight] = useState<number>(VEHICLES[3].defaultWeight);

  const [step1, setStep1] = useState(false);
  const [step2, setStep2] = useState(false);
  const [step3, setStep3] = useState(false);

  // Sync weight slider when vehicle type changes
  useEffect(() => {
    setVehicleWeight(selectedVehicle.defaultWeight);
  }, [selectedVehicle]);

  // Compute weight-adjusted PSI
  const calculationResult = useMemo(() => {
    // Calculate deviation from default weight
    const weightDelta = vehicleWeight - selectedVehicle.defaultWeight;
    
    // Every 200kg of extra weight requires deflating 0.5 PSI more to expand footprint,
    // and every 200kg less requires 0.5 PSI more to maintain ground clearance.
    const weightAdjustment = Math.round(weightDelta / 200) * -0.5;
    
    // Apply weight delta to base soft sand pressure
    let sandPsi = selectedVehicle.basePsi + weightAdjustment;
    
    // Cap sand PSI at the safe minimum to prevent rolling off the rim
    sandPsi = Math.max(sandPsi, selectedVehicle.minSafePsi);
    
    // Apply terrain offsets
    const targetBase = Math.round(sandPsi + selectedTerrain.psiOffset);
    
    // Output target range
    const minRange = Math.round(targetBase - 1);
    const maxRange = Math.round(targetBase + 1);

    // Build custom contextual advice based on class
    let advice = "";
    let adviceAr = "";

    if (selectedVehicle.id === "sedan" || selectedVehicle.id === "hatchback") {
      advice = `Low clearance warning. Keep pressure above ${selectedVehicle.minSafePsi} PSI. Do NOT spin tires — you will bottom out immediately. Dig paths before moving.`;
      adviceAr = `تحذير ارتفاع منخفض. حافظ على الضغط أعلى من ${selectedVehicle.minSafePsi} رطل. لا تدور الإطارات بقوة لتجنب التغريز الكلي. احفر ممرات قبل التحرك.`;
    } else {
      advice = `Maintain steady low throttle. Set low-range gears active. Minimize sharp steering adjustments at low PSI (${minRange}-${maxRange}) to prevent de-beading.`;
      adviceAr = `حافظ على ثبات دواسة الوقود المنخفضة. فعل الدبل الثقيل. تجنب الانعطافات الحادة بضغط منخفض لتجنب خروج الإطار من الرنج.`;
    }

    return {
      psiRange: `${minRange} - ${maxRange} PSI`,
      advice,
      adviceAr,
    };
  }, [selectedVehicle, selectedTerrain, vehicleWeight]);

  const summaryText = useMemo(() => {
    return `Stuck Vehicle: ${selectedVehicle.label} (${vehicleWeight}kg) | Terrain: ${selectedTerrain.label} | Calculated Target: ${calculationResult.psiRange}`;
  }, [selectedVehicle, selectedTerrain, vehicleWeight, calculationResult]);

  // Sync back to parent page
  useEffect(() => {
    onChange(summaryText);
  }, [summaryText, onChange]);

  // Reset checkmarks when configuration changes
  useEffect(() => {
    setStep1(false);
    setStep2(false);
    setStep3(false);
  }, [selectedVehicle, selectedTerrain, vehicleWeight]);

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none" />
      <CardHeader className="pb-3 border-b border-zinc-800/50">
        <CardTitle className="flex items-center gap-2 text-slate-200 text-sm font-bold tracking-widest uppercase">
          <Tractor size={18} className="text-amber-400" />
          Tire Deflation & PSI Guide
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Configure vehicle, load weight, & sand terrain to calculate optimal tire recovery pressure.
        </p>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* ── Vehicle Selector Grid ── */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Vehicle Type</label>
          <div className="grid grid-cols-5 gap-1.5">
            {VEHICLES.map((v) => {
              const isSelected = selectedVehicle.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVehicle(v)}
                  className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ${
                    isSelected
                      ? "bg-amber-600/20 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                      : "bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-xl mb-1 transition-transform duration-300 group-hover:scale-110">
                    {v.emoji}
                  </span>
                  <span className={`text-[8px] font-bold tracking-tight uppercase text-center truncate w-full ${
                    isSelected ? "text-amber-300" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}>
                    {v.label.split(" ")[0]}
                  </span>
                  <span className={`text-[8px] font-medium opacity-50 mt-0.5 ${
                    isSelected ? "text-amber-400" : "text-zinc-500"
                  }`} dir="rtl">
                    {v.labelAr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Vehicle Weight Slider ── */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-zinc-400 tracking-wider uppercase flex items-center gap-1.5">
              <Scale size={13} className="text-zinc-500" />
              Vehicle Weight
            </label>
            <span className="font-mono font-bold text-amber-300 bg-amber-950/30 border border-amber-500/20 px-2 py-0.5 rounded">
              {vehicleWeight.toLocaleString()} kg
            </span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={selectedVehicle.minWeight}
              max={selectedVehicle.maxWeight}
              step="50"
              value={vehicleWeight}
              onChange={(e) => setVehicleWeight(parseInt(e.target.value))}
              className="flex-grow h-1.5 rounded-lg bg-zinc-800 accent-amber-500 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[9px] text-zinc-600 font-semibold tracking-wider uppercase">
            <span>Min: {selectedVehicle.minWeight} kg</span>
            <span className="text-zinc-500">Default: {selectedVehicle.defaultWeight} kg</span>
            <span>Max: {selectedVehicle.maxWeight} kg</span>
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
                {calculationResult.psiRange}
              </p>
            </div>
            <Badge className="bg-amber-600/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold tracking-widest uppercase">
              Weight Adjusted
            </Badge>
          </div>
          
          <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50 space-y-2">
            <div className="flex gap-2.5">
              <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-300 leading-relaxed font-medium">
                {calculationResult.advice}
              </div>
            </div>
            <div className="text-[11px] text-amber-200/60 leading-relaxed text-right font-medium" dir="rtl">
              {calculationResult.adviceAr}
            </div>
          </div>
        </div>

        {/* ── Sedan/Hatchback Deep Sand Critical Alert ── */}
        {(selectedVehicle.id === "sedan" || selectedVehicle.id === "hatchback") && selectedTerrain.id === "deep_sand" && (
          <div className="flex gap-2.5 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3.5 animate-in slide-in-from-top-2 duration-300">
            <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-rose-300 uppercase tracking-wide">Critical Dune Hazard</p>
              <p className="text-[10px] text-rose-300/70 leading-relaxed mt-0.5">
                Low-clearance vehicles are highly prone to bottoming out. Avoid spinning wheels or flooring the gas — you will dig the chassis directly onto the sand. Dig flat ramps under all 4 tires and put wood tracks or floor mats under them.
              </p>
            </div>
          </div>
        )}

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
                <p className="text-xs font-semibold text-zinc-200">1. Deflate all 4 tires down to {calculationResult.psiRange}</p>
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

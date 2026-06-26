"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface AnimalOption {
  id: string;
  label: string;
  labelAr: string;
  emoji: string;
  category: "large" | "medium_small" | "bird" | "pet";
}

const ANIMALS: AnimalOption[] = [
  { id: "camel", label: "Camel", labelAr: "جمل", emoji: "🐪", category: "large" },
  { id: "goat_sheep", label: "Goat/Sheep", labelAr: "ماعز / ضأن", emoji: "🐐", category: "medium_small" },
  { id: "cow", label: "Cow", labelAr: "بقرة", emoji: "🐄", category: "large" },
  { id: "horse", label: "Horse", labelAr: "حصان", emoji: "🐎", category: "large" },
  { id: "falcon", label: "Falcon", labelAr: "صقر", emoji: "🦅", category: "bird" },
  { id: "parrot", label: "Parrot", labelAr: "ببغاء", emoji: "🦜", category: "bird" },
  { id: "cat", label: "Cat", labelAr: "قطة", emoji: "🐈", category: "pet" },
  { id: "dog", label: "Dog", labelAr: "كلب", emoji: "🐕", category: "pet" },
  { id: "other", label: "Other", labelAr: "حيوان آخر", emoji: "🐾", category: "pet" },
];

interface AgeClassification {
  group: string;
  groupAr: string;
}

function getAgeClassification(category: string, age: number, unit: "years" | "months"): AgeClassification {
  const ageInYears = unit === "years" ? age : age / 12;

  switch (category) {
    case "large": // Camel, Cow, Horse
      if (ageInYears < 1) return { group: "Calf / Foal", groupAr: "حوار / مهر" };
      if (ageInYears <= 4) return { group: "Young", groupAr: "مفرود / لقي" };
      if (ageInYears <= 15) return { group: "Adult", groupAr: "بعير / ناقة / عسيف" };
      return { group: "Elderly", groupAr: "هرم / مسن" };

    case "medium_small": // Goat / Sheep
      if (ageInYears < 0.5) return { group: "Lamb / Kid", groupAr: "بهمة / طلي" };
      if (ageInYears <= 1.5) return { group: "Young", groupAr: "جذع / جذعة" };
      if (ageInYears <= 6) return { group: "Adult", groupAr: "ثني / رباع" };
      return { group: "Elderly", groupAr: "عجوز / هرمة" };

    case "bird": // Falcon, Parrot
      if (ageInYears < 1) return { group: "Chick", groupAr: "فرخ" };
      if (ageInYears <= 3) return { group: "Young / Jirnas", groupAr: "قرناس بكر" };
      if (ageInYears <= 12) return { group: "Adult / Shahin", groupAr: "قرناس / شاهين" };
      return { group: "Senior", groupAr: "عجوز / مسن" };

    case "pet": // Cat, Dog, Other
    default:
      if (ageInYears < 1) return { group: "Kitten / Puppy", groupAr: "جرو / صغير" };
      if (ageInYears <= 3) return { group: "Young", groupAr: "يافع" };
      if (ageInYears <= 10) return { group: "Adult", groupAr: "بالغ" };
      return { group: "Senior", groupAr: "مسن" };
  }
}

interface LivestockSelectorProps {
  onChange: (info: string) => void;
}

export default function LivestockSelector({ onChange }: LivestockSelectorProps) {
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalOption>(ANIMALS[0]);
  const [ageInput, setAgeInput] = useState<string>("2");
  const [ageUnit, setAgeUnit] = useState<"years" | "months">("years");

  const ageNumber = parseFloat(ageInput) || 0;

  const ageClassification = useMemo(() => {
    return getAgeClassification(selectedAnimal.category, ageNumber, ageUnit);
  }, [selectedAnimal, ageNumber, ageUnit]);

  const summaryText = useMemo(() => {
    if (ageNumber <= 0) {
      return `${selectedAnimal.label} (Age unknown)`;
    }
    const unitLabel = ageUnit === "years" ? (ageNumber === 1 ? "year" : "years") : (ageNumber === 1 ? "month" : "months");
    return `${selectedAnimal.label} - ${ageClassification.group} (${ageInput} ${unitLabel} old)`;
  }, [selectedAnimal, ageInput, ageUnit, ageClassification]);

  // Notify parent whenever selection details change
  useEffect(() => {
    onChange(summaryText);
  }, [summaryText, onChange]);

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none" />
      <CardHeader className="pb-3 border-b border-zinc-800/50">
        <CardTitle className="flex items-center gap-2 text-slate-200 text-sm font-bold tracking-widest uppercase">
          <span className="text-xl">🐪</span>
          Animal Profile Creator
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Select animal type and specify age for specialized responder guidance.
        </p>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* ── Animal Selection Grid ────────────────────────────── */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Select Animal</label>
          <div className="grid grid-cols-3 gap-2.5">
            {ANIMALS.map((animal) => {
              const isSelected = selectedAnimal.id === animal.id;
              return (
                <button
                  key={animal.id}
                  type="button"
                  onClick={() => setSelectedAnimal(animal)}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                      : "bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-2xl mb-1.5 transition-transform duration-300 group-hover:scale-110">
                    {animal.emoji}
                  </span>
                  <span className={`text-[11px] font-semibold tracking-wide uppercase transition-colors ${
                    isSelected ? "text-indigo-200" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}>
                    {animal.label}
                  </span>
                  <span className={`text-[9px] font-medium mt-0.5 opacity-55 ${
                    isSelected ? "text-indigo-300" : "text-zinc-500"
                  }`} dir="rtl">
                    {animal.labelAr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Age Input Controls ───────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="animal-age" className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
              Age Value
            </label>
            <Input
              id="animal-age"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 3"
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              className="bg-zinc-950/50 border-zinc-800 focus-visible:border-indigo-500 text-zinc-200 font-medium placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
              Age Unit
            </label>
            <div className="grid grid-cols-2 bg-zinc-950/50 border border-zinc-800 rounded-lg p-0.5 h-8.5 items-center">
              <button
                type="button"
                onClick={() => setAgeUnit("years")}
                className={`text-[10px] font-bold tracking-widest uppercase py-1.5 rounded-md transition-all ${
                  ageUnit === "years"
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/20"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Years
              </button>
              <button
                type="button"
                onClick={() => setAgeUnit("months")}
                className={`text-[10px] font-bold tracking-widest uppercase py-1.5 rounded-md transition-all ${
                  ageUnit === "months"
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/20"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Months
              </button>
            </div>
          </div>
        </div>

        {/* ── Summary & Classification Output ──────────────────── */}
        {ageNumber > 0 && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-3.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/80">Computed Classification</p>
              <p className="text-sm font-bold text-zinc-200 mt-1">
                {ageClassification.group}
                <span className="text-xs text-indigo-200/50 font-medium ml-1.5" dir="rtl">
                  ({ageClassification.groupAr})
                </span>
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Age: {ageInput} {ageUnit}
              </p>
            </div>
            <Badge className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold tracking-widest uppercase">
              {selectedAnimal.label}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

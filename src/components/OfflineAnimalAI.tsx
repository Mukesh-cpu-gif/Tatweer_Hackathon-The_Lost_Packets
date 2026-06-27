"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Clock, ShieldAlert, Check } from "lucide-react";
import type { LayersModel, Tensor } from "@tensorflow/tfjs";
import { IMAGENET_CLASSES } from "@tensorflow-models/mobilenet/dist/imagenet_classes";
import { useLanguage } from "@/context/LanguageContext";
import BodyLocationSelector from "./BodyLocationSelector";

/**
 * Mock classification results for on-device AI animal identification.
 */
interface ClassificationResult {
  species: string;
  confidence: number;
  dangerLevel: "extreme" | "high" | "low";
  dangerColor: string;
  action: string;
  topMatches?: Array<{ name: string; probability: number; danger: string }>;
}

const SYMPTOMS_LIST = [
  { id: 'puncture_two', label: 'Two distinct puncture wounds (fang marks)' },
  { id: 'puncture_one', label: 'Small single puncture or sting' },
  { id: 'pain_severe', label: 'Severe sharp pain' },
  { id: 'swelling', label: 'Rapid swelling and bruising' },
  { id: 'bleeding', label: 'Bleeding from gums or wound' },
  { id: 'numbness', label: 'Numbness or tingling' },
  { id: 'no_bite', label: 'No visible bite mark, constriction only' },
];

interface SpeciesProfile {
  dangerLevel: "extreme" | "high" | "low";
  dangerColor: string;
  action: string;
  symptomWeights: Record<string, number>;
}

const SPECIES_PROFILES: Record<string, SpeciesProfile> = {
  'Arabian Horned Viper': {
    dangerLevel: 'extreme', dangerColor: 'bg-red-600 text-white',
    action: 'Do NOT move. Keep bitten area below heart level. Anti-venom required — responder alerted.',
    symptomWeights: { 'puncture_two': 1.0, 'pain_severe': 0.8, 'swelling': 0.8, 'bleeding': 0.9 }
  },
  'Arabian Sand Boa': {
    dangerLevel: 'low', dangerColor: 'bg-green-600 text-white',
    action: 'Non-venomous species. Clean any wound. No anti-venom needed.',
    symptomWeights: { 'no_bite': 1.0 }
  },
  'Deathstalker Scorpion': {
    dangerLevel: 'high', dangerColor: 'bg-orange-500 text-white',
    action: 'Wash sting with soap & water. Apply cold compress. Monitor for severe reaction.',
    symptomWeights: { 'puncture_one': 0.8, 'pain_severe': 0.9, 'numbness': 0.8 }
  },
  'Desert Spider': {
    dangerLevel: 'high', dangerColor: 'bg-orange-500 text-white',
    action: 'Wash bitten area. Apply ice pack. Seek medical attention if symptoms worsen.',
    symptomWeights: { 'puncture_one': 0.7, 'pain_severe': 0.6, 'swelling': 0.5 }
  },
  'Desert Snake': {
    dangerLevel: 'high', dangerColor: 'bg-orange-500 text-white',
    action: 'Exercise caution. Treat as venomous. Keep distance and seek medical response.',
    symptomWeights: { 'puncture_two': 0.5 }
  }
};


export default function OfflineAnimalAI({ 
  onChange,
  initialBodyPart = ""
}: { 
  onChange?: (info: string) => void;
  initialBodyPart?: string;
}) {
  const { t, isAr } = useLanguage();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Multimodal state
  const [imagePredictions, setImagePredictions] = useState<Array<{className: string, probability: number}> | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [showSymptoms, setShowSymptoms] = useState(false);

  // New Diagnostics & Timer States
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>(initialBodyPart);
  const [firstAidActions, setFirstAidActions] = useState<{
    tourniquet: boolean;
    ice: boolean;
    cutWound: boolean;
  }>({
    tourniquet: false,
    ice: false,
    cutWound: false,
  });
  const [biteTimePreset, setBiteTimePreset] = useState<string>("just_now");
  const [customTime, setCustomTime] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<LayersModel | null>(null);

  // Calculate reference bite time
  const biteTime = useMemo(() => {
    const now = new Date();
    if (biteTimePreset === "just_now") {
      return now;
    }
    if (biteTimePreset === "5m") {
      return new Date(now.getTime() - 5 * 60000);
    }
    if (biteTimePreset === "15m") {
      return new Date(now.getTime() - 15 * 60000);
    }
    if (biteTimePreset === "30m") {
      return new Date(now.getTime() - 30 * 60000);
    }
    if (biteTimePreset === "1h") {
      return new Date(now.getTime() - 60 * 60000);
    }
    if (biteTimePreset === "2h") {
      return new Date(now.getTime() - 120 * 60000);
    }
    if (biteTimePreset === "custom" && customTime) {
      const [hours, minutes] = customTime.split(":").map(Number);
      const customDate = new Date();
      customDate.setHours(hours);
      customDate.setMinutes(minutes);
      customDate.setSeconds(0);
      if (customDate.getTime() > now.getTime()) {
        customDate.setDate(customDate.getDate() - 1);
      }
      return customDate;
    }
    return now;
  }, [biteTimePreset, customTime]);

  // Tick elapsed stopwatch timer
  useEffect(() => {
    const updateElapsed = () => {
      const diff = Math.floor((Date.now() - biteTime.getTime()) / 1000);
      setElapsedSeconds(diff >= 0 ? diff : 0);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [biteTime]);

  const formatElapsed = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (isAr) {
      return `${hrs.toString().padStart(2, "0")}س : ${mins.toString().padStart(2, "0")}د : ${secs.toString().padStart(2, "0")}ث`;
    }
    return `${hrs.toString().padStart(2, "0")}h : ${mins.toString().padStart(2, "0")}m : ${secs.toString().padStart(2, "0")}s`;
  };

  // Determine current timeline phase index
  const currentPhaseIndex = useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60);
    if (mins < 15) return 0;
    if (mins < 60) return 1;
    return 2;
  }, [elapsedSeconds]);

  const bodyParts = useMemo(() => [
    { id: "Head & Neck", label: t("Head & Neck") },
    { id: "Torso", label: t("Torso") },
    { id: "Right Arm", label: t("Right Arm") },
    { id: "Left Arm", label: t("Left Arm") },
    { id: "Right Leg", label: t("Right Leg") },
    { id: "Left Leg", label: t("Left Leg") },
    { id: "Right Foot", label: t("Right Foot") },
    { id: "Left Foot", label: t("Left Foot") },
  ], [t]);



  useEffect(() => {
    let isMounted = true;
    async function loadLocalModel() {
      try {
        if (isMounted) { setModelLoading(true); setModelError(null); }
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();
        const loadedModel = await tf.loadLayersModel("/model/model.json");
        if (isMounted) modelRef.current = loadedModel;
      } catch (err: unknown) {
        console.error("Error loading offline TF.js model:", err);
        if (isMounted) setModelError((err as Error).message || "Failed to load model files.");
      } finally {
        if (isMounted) setModelLoading(false);
      }
    }
    loadLocalModel();
    return () => { isMounted = false; };
  }, []);

  // Recalculate combined probability when Image or Symptoms change
  const result = useMemo<ClassificationResult | null>(() => {
    if (!imagePredictions && selectedSymptoms.length === 0) {
      return null;
    }

    // --- 1. Calculate Image Probabilities ---
    const imageProbs: Record<string, number> = {
      'Arabian Horned Viper': 0,
      'Arabian Sand Boa': 0,
      'Deathstalker Scorpion': 0,
      'Desert Spider': 0,
      'Desert Snake': 0
    };

    let rawNameFallback = "";

    if (imagePredictions) {
      imagePredictions.forEach(pred => {
        const label = pred.className.toLowerCase();
        const prob = pred.probability;
        if (!rawNameFallback) rawNameFallback = pred.className.split(',')[0];

        const isSnake = label.includes("snake") || label.includes("viper") || label.includes("boa") || label.includes("cobra") || label.includes("python") || label.includes("sidewinder");
        const isScorpion = label.includes("scorpion");
        const isSpider = label.includes("spider") || label.includes("tarantula");

        if (isSnake) {
          if (label.includes("horned") || label.includes("viper") || label.includes("sidewinder") || label.includes("cobra") || label.includes("rattle")) {
            imageProbs['Arabian Horned Viper'] += prob;
          } else if (label.includes("boa") || label.includes("garter") || label.includes("python")) {
            imageProbs['Arabian Sand Boa'] += prob;
          } else {
            imageProbs['Desert Snake'] += prob;
          }
        } else if (isScorpion) {
          imageProbs['Deathstalker Scorpion'] += prob;
        } else if (isSpider) {
          imageProbs['Desert Spider'] += prob;
        }
      });
    }

    // --- 2. Calculate Symptom Probabilities ---
    const symptomProbs: Record<string, number> = {
      'Arabian Horned Viper': 0,
      'Arabian Sand Boa': 0,
      'Deathstalker Scorpion': 0,
      'Desert Spider': 0,
      'Desert Snake': 0
    };

    if (selectedSymptoms.length > 0) {
      Object.keys(SPECIES_PROFILES).forEach(species => {
        let score = 0;
        selectedSymptoms.forEach(sym => {
          score += (SPECIES_PROFILES[species].symptomWeights[sym] || 0);
        });
        symptomProbs[species] = Math.min(score, 1.0); // Normalize to max 1.0 per species for simplicity
      });
    }

    // --- 3. Combine Probabilities (60% Image, 40% Symptoms) ---
    const combinedProbs: Record<string, number> = {};
    Object.keys(imageProbs).forEach(species => {
      let finalProb = 0;
      if (imagePredictions && selectedSymptoms.length > 0) {
        finalProb = (imageProbs[species] * 0.6) + (symptomProbs[species] * 0.4);
      } else if (imagePredictions) {
        finalProb = imageProbs[species];
      } else if (selectedSymptoms.length > 0) {
        finalProb = symptomProbs[species];
      }
      combinedProbs[species] = finalProb;
    });

    // Find highest scoring species
    let topSpecies = "";
    let maxProb = 0;
    Object.keys(combinedProbs).forEach(species => {
      if (combinedProbs[species] > maxProb) {
        maxProb = combinedProbs[species];
        topSpecies = species;
      }
    });

    // If nothing found from logic but image exists, use generic fallback
    if (topSpecies === "" && imagePredictions && imagePredictions.length > 0) {
      const top1 = imagePredictions[0];
      topSpecies = top1.className.split(',')[0];
      maxProb = top1.probability;
      return {
        species: `${t("Unclassified:")} ${topSpecies}`,
        confidence: Math.round(maxProb * 100),
        dangerLevel: "low",
        dangerColor: "bg-slate-500 text-white",
        action: t("Unclassified species. Keep away and report to a responder if concerned."),
      };
    } else if (topSpecies === "") {
      return null;
    }

    // Build the final result
    const profile = SPECIES_PROFILES[topSpecies] || {
      dangerLevel: 'low', dangerColor: 'bg-slate-500 text-white', action: 'Unknown species risk.'
    };

    let displayName = "";
    if (imagePredictions) {
      const translatedSpecies = t(topSpecies);
      displayName = rawNameFallback ? `${translatedSpecies} (${t("Image Preview")}: ${rawNameFallback})` : translatedSpecies;
    } else {
      const threatLabel = profile.dangerLevel === "extreme" ? t("Extreme") : profile.dangerLevel === "high" ? t("High") : t("Low");
      displayName = isAr 
        ? `مستوى التهديد: ${threatLabel} (تقييم الأعراض)`
        : `${profile.dangerLevel.charAt(0).toUpperCase() + profile.dangerLevel.slice(1)} Threat Level (Symptom Assessment)`;
    }
    return {
      species: displayName,
      confidence: Math.round(maxProb * 100),
      dangerLevel: profile.dangerLevel,
      dangerColor: profile.dangerColor,
      action: t(profile.action),
    };

  }, [imagePredictions, selectedSymptoms, isAr, t]);

  // Medical advisory timeline content based on danger level
  const timelinePhases = useMemo(() => {
    const danger = result?.dangerLevel || "unknown";
    
    if (danger === "extreme" || danger === "high") {
      return [
        {
          title: t("Phase 1: Localized Phase (0-15m)"),
          symptoms: t("Intense local pain, minor swelling, fang marks oozing."),
          action: t("Immobilize the limb below heart level. Remain completely still to slow venom spread. Remove rings/watches."),
        },
        {
          title: t("Phase 2: Lymphatic Spread (15-60m)"),
          symptoms: t("Swelling spreads up the limb, numbness/tingling, rapid pulse, nausea."),
          action: t("Do NOT move. Splint the limb if possible. Keep airway clear. Responders are en route."),
        },
        {
          title: t("Phase 3: Systemic Absorption (60m+)"),
          symptoms: t("Dizziness, sweating, muscle twitching, breathing difficulty."),
          action: t("Lie in recovery position (left side) if feeling faint or weak. Ensure your mouth is clear."),
        },
      ];
    } else if (danger === "low") {
      return [
        {
          title: t("Phase 1: Localized Phase (0-15m)"),
          symptoms: t("Mild localized pain, small puncture/scratch marks."),
          action: t("Wash the bite wound thoroughly with soap and clean water to prevent local infection."),
        },
        {
          title: t("Phase 2: Observation Phase (15-60m)"),
          symptoms: t("Pain subsides, no spreading swelling, no systemic issues."),
          action: t("Keep the area clean. Monitor for any signs of allergic reactions (hives, wheezing)."),
        },
        {
          title: t("Phase 3: Recovery Phase (60m+)"),
          symptoms: t("Wound irritation only."),
          action: t("Standard wound care. Reassure the victim. Tetanus shot booster recommended if not up-to-date."),
        },
      ];
    } else {
      return [
        {
          title: t("Phase 1: Shock & Local Pain (0-15m)"),
          symptoms: t("Pain or stinging, shock, fear."),
          action: t("Wash the bite area. Immobilize the limb below heart level. DO NOT walk or run."),
        },
        {
          title: t("Phase 2: Symptom Assessment (15-60m)"),
          symptoms: t("Observe if swelling spreads, or if numbness, nausea, or sweating starts."),
          action: t("Keep still. Responders will check for clinical signs of envenomation upon arrival."),
        },
        {
          title: t("Phase 3: Critical Window (60m+)"),
          symptoms: t("Potential systemic effects if creature was venomous."),
          action: t("Lie in the recovery position if feeling dizzy or faint. Prepare details for medical personnel."),
        },
      ];
    }
  }, [result, t]);

  // Report details back to SOSClient
  useEffect(() => {
    if (!onChange) return;

    const parts: string[] = [];
    if (isAr) {
      if (result) {
        parts.push(`الكائن: ${result.species} (${result.confidence}%)`);
      } else {
        parts.push("الكائن: غير معروف");
      }

      if (selectedBodyPart) {
        parts.push(`الموقع: ${t(selectedBodyPart)}`);
      } else {
        parts.push("الموقع: غير محدد");
      }

      const elapsedMins = Math.floor(elapsedSeconds / 60);
      parts.push(`الوقت: ${biteTimePreset === "just_now" ? "الآن" : `${elapsedMins} دقيقة مضت`} (المنقضي: ${formatElapsed(elapsedSeconds)})`);

      const symptomsText = selectedSymptoms
        .map(id => {
          const sym = SYMPTOMS_LIST.find(s => s.id === id);
          return sym ? t(sym.label) : "";
        })
        .filter(Boolean)
        .join("، ");
      if (symptomsText) {
        parts.push(`الأعراض: ${symptomsText}`);
      }

      const badActions = [];
      if (firstAidActions.tourniquet) badActions.push("تم وضع عاصبة");
      if (firstAidActions.ice) badActions.push("تم استخدام الثلج");
      if (firstAidActions.cutWound) badActions.push("تم شق الجرح");
      if (badActions.length > 0) {
        parts.push(`إجراءات خاطئة تم اتخاذها: ${badActions.join("، ")}`);
      }
    } else {
      if (result) {
        parts.push(`Creature: ${result.species} (${result.confidence}%)`);
      } else {
        parts.push("Creature: Unknown/Unclassified");
      }

      if (selectedBodyPart) {
        parts.push(`Location: ${selectedBodyPart}`);
      } else {
        parts.push("Location: Not specified");
      }

      const elapsedMins = Math.floor(elapsedSeconds / 60);
      parts.push(`Time: ${biteTimePreset === "just_now" ? "Just now" : `${elapsedMins}m ago`} (Elapsed: ${formatElapsed(elapsedSeconds)})`);

      const symptomsText = selectedSymptoms
        .map(id => SYMPTOMS_LIST.find(s => s.id === id)?.label)
        .filter(Boolean)
        .join(", ");
      if (symptomsText) {
        parts.push(`Symptoms: ${symptomsText}`);
      }

      const badActions = [];
      if (firstAidActions.tourniquet) badActions.push("Tourniquet");
      if (firstAidActions.ice) badActions.push("Ice applied");
      if (firstAidActions.cutWound) badActions.push("Wound cut");
      if (badActions.length > 0) {
        parts.push(`Contraindicated actions taken: ${badActions.join(", ")}`);
      }
    }

    onChange(parts.join(" | "));
  }, [result, selectedBodyPart, elapsedSeconds, selectedSymptoms, firstAidActions, biteTimePreset, onChange, isAr, t]);

  const runInference = useCallback(async (canvas: HTMLCanvasElement) => {
    if (!modelRef.current) return;
    try {
      const tf = await import("@tensorflow/tfjs");
      const topPredictions = tf.tidy(() => {
        const imgTensor = tf.browser.fromPixels(canvas);
        const resized = tf.image.resizeBilinear(imgTensor, [224, 224]);
        const normalized = resized.toFloat().sub(127.5).div(127.5);
        const batched = normalized.expandDims(0);
        const output = modelRef.current!.predict(batched) as Tensor;
        const predictions = output.squeeze().arraySync() as number[];
        
        return Array.from(predictions)
          .map((prob, idx) => ({
            className: IMAGENET_CLASSES[idx] || "unknown",
            probability: prob
          }))
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 5); // Take top 5 for better aggregate matching
      });
      setImagePredictions(topPredictions);
    } catch (err) {
      console.error("Error during model classification:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleImageCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsAnalyzing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) { setIsAnalyzing(false); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { setIsAnalyzing(false); return; }

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      runInference(canvas);
    };
    img.src = previewUrl;
  }, [runInference]);

  const handleSymptomToggle = (id: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleReset = useCallback(() => {
    setImagePreview(null);
    setImagePredictions(null);
    setSelectedSymptoms([]);
    setShowSymptoms(false);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="space-y-6">
      {/* ─── Bite Diagnostics & Time Tracker ────────────────── */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-200">
            <Activity className="text-rose-500 h-5 w-5 animate-pulse" />
            {t("Bite Diagnostics & Time Tracker")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("Log the bite location and track elapsed time to guide responders and first aid.")}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Layout for Body Map & Parts Selection */}
          <BodyLocationSelector
            selectedPart={selectedBodyPart}
            onSelectPart={setSelectedBodyPart}
            title={t("Select Bite Location")}
            themeColor="rose"
          />

          {/* First Aid Actions Checker */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              {t("First Aid Verification")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t("Please verify if any of these actions have been taken (for clinical tracking):")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/30 p-2.5 hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={firstAidActions.tourniquet}
                  onChange={(e) => setFirstAidActions(prev => ({ ...prev, tourniquet: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-300">{t("Tourniquet Applied")}</span>
              </label>

              <label className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/30 p-2.5 hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={firstAidActions.ice}
                  onChange={(e) => setFirstAidActions(prev => ({ ...prev, ice: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-300">{t("Ice Applied")}</span>
              </label>

              <label className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/30 p-2.5 hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={firstAidActions.cutWound}
                  onChange={(e) => setFirstAidActions(prev => ({ ...prev, cutWound: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-300">{t("Wound Cut / Sucked")}</span>
              </label>
            </div>

            {/* Warn Banner if Contraindications are selected */}
            {(firstAidActions.tourniquet || firstAidActions.ice || firstAidActions.cutWound) && (
              <div className="rounded-lg bg-red-950/45 border border-red-500/30 p-3 text-red-200/90 text-xs leading-relaxed space-y-1.5 animate-in fade-in duration-300">
                <p className="font-bold flex items-center gap-1 text-red-400">
                  <AlertTriangle className="h-4 w-4 text-red-500 animate-bounce" />
                  {t("CRITICAL FIRST AID WARNING:")}
                </p>
                {firstAidActions.tourniquet && (
                  <p>
                    {isAr ? (
                      <>• <strong>لا تستخدم رباطاً ضاغطاً (عاصبة).</strong> تقييد تدفق الدم يحبس السم في الطرف المصاب، مما يزيد من موت الأنسجة وخطر البتر دون وقف انتشار السم في الجسم.</>
                    ) : (
                      <>• <strong>Do NOT use tourniquets.</strong> Restricting blood flow traps venom in the limb, dramatically increasing tissue necrosis and risk of amputation without halting systemic spread.</>
                    )}
                  </p>
                )}
                {firstAidActions.ice && (
                  <p>
                    {isAr ? (
                      <>• <strong>لا تضع ثلجاً.</strong> البرودة الشديدة تقبض الأوعية الدموية وتسرع تلف الأنسجة الموضعية.</>
                    ) : (
                      <>• <strong>Do NOT apply ice.</strong> Extreme cold constricts blood vessels and accelerates localized tissue damage.</>
                    )}
                  </p>
                )}
                {firstAidActions.cutWound && (
                  <p>
                    {isAr ? (
                      <>• <strong>لا تشق الجرح أو تحاول مص السم.</strong> هذا الإجراء غير فعال ويزيد من خطر الإصابة بالعدوى وتفاقم النزيف.</>
                    ) : (
                      <>• <strong>Do NOT cut the wound or try to suck venom.</strong> This is ineffective and introduces severe infection risk while increasing bleeding.</>
                    )}
                  </p>
                )}
                <p className="mt-1 font-semibold text-red-300">{t("Please release any tourniquets and stop icing or cutting immediately.")}</p>
              </div>
            )}
          </div>

          {/* Bite Time Tracker UI */}
          <div className="space-y-4 rounded-xl border border-slate-850 bg-slate-950/20 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  {t("Bite Time Tracker")}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("Specify when the incident occurred to calculate envenomation windows.")}
                </p>
              </div>
              
              {/* Dynamic Stopwatch Counter */}
              <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/30 rounded-lg px-3 py-1.5 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-bold tracking-wider text-indigo-300 font-mono">
                  {formatElapsed(elapsedSeconds)} {t("elapsed")}
                </span>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "just_now", label: "Just Now" },
                { id: "5m", label: "5m ago" },
                { id: "15m", label: "15m ago" },
                { id: "30m", label: "30m ago" },
                { id: "1h", label: "1h ago" },
                { id: "2h", label: "2h+ ago" },
                { id: "custom", label: "Custom Time" },
              ].map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setBiteTimePreset(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-300 ${
                    biteTimePreset === preset.id
                      ? "bg-indigo-950/40 border-indigo-500 text-indigo-300"
                      : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-350"
                  }`}
                >
                  {t(preset.label)}
                </button>
              ))}
            </div>

            {/* Custom Time Picker */}
            {biteTimePreset === "custom" && (
              <div className="flex items-center gap-3 animate-in fade-in duration-300 mt-2">
                <span className="text-xs text-slate-400">{t("Specify Incident Time:")}</span>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Clinical Advisory Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("Clinical Advisory Timeline")} ({result ? `${t("Tailored for")} ${result.species}` : t("General Advisory")})
            </h4>
            <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-6">
              {timelinePhases.map((phase, idx) => {
                const isActive = idx === currentPhaseIndex;
                const isPast = idx < currentPhaseIndex;
                
                return (
                  <div key={idx} className="relative">
                    {/* Circle Indicator */}
                    <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                      isActive 
                        ? "bg-rose-500 border-rose-450 animate-ping" 
                        : isPast 
                          ? "bg-slate-700 border-slate-650" 
                          : "bg-slate-900 border-slate-850"
                    }`} />
                    <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                      isActive 
                        ? "bg-rose-600 border-rose-400" 
                        : isPast 
                          ? "bg-slate-700 border-slate-600" 
                          : "bg-slate-900 border-slate-800"
                    }`} />
                    
                    {/* Content */}
                    <div className={`rounded-lg p-3 transition-all duration-300 ${
                      isActive 
                        ? "bg-rose-950/20 border border-rose-500/30" 
                        : "bg-slate-950/20 border border-slate-900/50"
                    }`}>
                      <p className={`text-sm font-semibold ${isActive ? "text-rose-400" : isPast ? "text-slate-500" : "text-slate-400"}`}>
                        {phase.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        <span className="font-semibold text-slate-350">{t("Symptoms")}:</span> {phase.symptoms}
                      </p>
                      <p className="text-xs text-rose-200/80 mt-1.5 leading-relaxed">
                        <span className="font-semibold text-rose-300">{t("Action")}:</span> {phase.action}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Multimodal AI Identifier ───────────────────────── */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-200">
            <span className="text-2xl">🧬</span>
            {t("Multimodal AI Identifier")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("Identify species using a photo, symptoms, or both for highest accuracy.")}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ── Camera Capture Button ─────────────────────────────── */}
          {!imagePreview && (
            <label
              htmlFor="animal-capture"
              className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-950/20 p-6 transition-all hover:border-amber-400 hover:bg-amber-950/40 active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              <span className="text-base font-semibold text-amber-300">
                {modelLoading ? (isAr ? "⏳ جاري تحميل محرك الصور..." : "⏳ Loading Image Engine...") : t("Add Photo")}
              </span>
              <input
                ref={fileInputRef}
                id="animal-capture"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageCapture}
                disabled={modelLoading}
              />
            </label>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} className="hidden" />

          {/* ── Image Preview ────────────────────────────────────── */}
          {imagePreview && (
            <div className="relative overflow-hidden rounded-xl border border-amber-500/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt={t("Image Preview")} className="h-48 w-full object-cover" />
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="size-16 animate-ping rounded-full border-4 border-amber-400/50" />
                  <p className="mt-4 text-sm font-semibold text-amber-300 animate-pulse">{t("Analyzing Image…")}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Symptom Checklist ────────────────────────────────── */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <button 
              type="button"
              onClick={() => setShowSymptoms(!showSymptoms)}
              className="flex w-full items-center justify-between font-semibold text-slate-300"
            >
              <span>🩺 {selectedSymptoms.length > 0 ? (isAr ? `${selectedSymptoms.length} أعراض مضافة` : `${selectedSymptoms.length} Symptoms Added`) : t("Add Clinical Symptoms")}</span>
              <span className="text-amber-500">{showSymptoms ? "▲" : "▼"}</span>
            </button>
            
            {showSymptoms && (
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs text-muted-foreground mb-3">{t("Select any observed symptoms to refine the AI accuracy (Functions completely offline).")}</p>
                {SYMPTOMS_LIST.map(sym => (
                  <label key={sym.id} className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-3 hover:bg-slate-800 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedSymptoms.includes(sym.id)}
                      onChange={() => handleSymptomToggle(sym.id)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-500 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                    />
                    <span className="text-sm text-slate-200">{isAr ? t(sym.label) : sym.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ── Classification Results ───────────────────────────── */}
          {result && (
            <div className="space-y-3 rounded-xl border border-amber-500/20 bg-slate-800/80 p-4 animate-in fade-in duration-500">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("Identified Match")}
                  </p>
                  <p className="text-lg font-bold text-white">
                    {result.species}
                  </p>
                </div>
                <Badge className={result.dangerColor}>
                  {result.dangerLevel === "extreme" ? `☠️ ${t("Extreme")}` : result.dangerLevel === "high" ? `⚠️ ${t("High")}` : `✅ ${t("Low")}`}
                </Badge>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{t("Confidence")} ({imagePredictions && selectedSymptoms.length > 0 ? t("Image + Symptoms") : imagePredictions ? t("Image Only") : t("Symptoms Only")})</span>
                  <span className="font-mono font-bold text-amber-400">{result.confidence}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000" style={{ width: `${result.confidence}%` }} />
                </div>
              </div>

              <div className="rounded-lg bg-slate-900/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">{t("Recommended Action")}</p>
                <p className="mt-1 text-sm text-slate-200">{result.action}</p>
              </div>

              {/* Scan again button */}
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 w-full rounded-lg border border-amber-500/30 py-2.5 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/10 active:scale-[0.98]"
              >
                {t("Reset & Scan Another")}
              </button>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-center flex-col gap-1">
          <p className="text-center text-xs text-muted-foreground">{t("⚡ Multimodal AI Engine — Fully Offline")}</p>
          <p className="text-center text-[10px] text-amber-500/70 font-mono">
            {modelLoading ? t("Loading model weights (1.9MB)...") : modelError ? `${isAr ? "خطأ في المحرك" : "Engine error"}: ${modelError}` : t("AI Engine: Ready (Loaded Offline)")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

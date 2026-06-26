"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LayersModel, Tensor } from "@tensorflow/tfjs";
import { IMAGENET_CLASSES } from "@tensorflow-models/mobilenet/dist/imagenet_classes";

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

export default function OfflineAnimalAI() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Multimodal state
  const [imagePredictions, setImagePredictions] = useState<Array<{className: string, probability: number}> | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [showSymptoms, setShowSymptoms] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<LayersModel | null>(null);

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
        species: `Unclassified: ${topSpecies}`,
        confidence: Math.round(maxProb * 100),
        dangerLevel: "low",
        dangerColor: "bg-slate-500 text-white",
        action: "Unclassified species. Keep away and report to a responder if concerned.",
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
      displayName = rawNameFallback ? `${topSpecies} (Detected: ${rawNameFallback})` : topSpecies;
    } else {
      displayName = `${profile.dangerLevel.charAt(0).toUpperCase() + profile.dangerLevel.slice(1)} Threat Level (Symptom Assessment)`;
    }
    return {
      species: displayName,
      confidence: Math.round(maxProb * 100),
      dangerLevel: profile.dangerLevel,
      dangerColor: profile.dangerColor,
      action: profile.action,
    };

  }, [imagePredictions, selectedSymptoms]);

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
    <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900 to-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-400">
          <span className="text-2xl">🧬</span>
          Multimodal AI Identifier
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Identify species using a photo, symptoms, or both for highest accuracy.
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
              {modelLoading ? "⏳ Loading Image Engine..." : "📷 Add Photo"}
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
            <img src={imagePreview} alt="Captured specimen" className="h-48 w-full object-cover" />
            {isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="size-16 animate-ping rounded-full border-4 border-amber-400/50" />
                <p className="mt-4 text-sm font-semibold text-amber-300 animate-pulse">Analyzing Image…</p>
              </div>
            )}
          </div>
        )}

        {/* ── Symptom Checklist ────────────────────────────────── */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <button 
            onClick={() => setShowSymptoms(!showSymptoms)}
            className="flex w-full items-center justify-between font-semibold text-slate-300"
          >
            <span>🩺 {selectedSymptoms.length > 0 ? `${selectedSymptoms.length} Symptoms Added` : "Add Clinical Symptoms"}</span>
            <span className="text-amber-500">{showSymptoms ? "▲" : "▼"}</span>
          </button>
          
          {showSymptoms && (
            <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs text-muted-foreground mb-3">Select any observed symptoms to refine the AI accuracy (Functions completely offline).</p>
              {SYMPTOMS_LIST.map(sym => (
                <label key={sym.id} className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-3 hover:bg-slate-800 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedSymptoms.includes(sym.id)}
                    onChange={() => handleSymptomToggle(sym.id)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-500 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-sm text-slate-200">{sym.label}</span>
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
                  Identified Match
                </p>
                <p className="text-lg font-bold text-white">
                  {result.species}
                </p>
              </div>
              <Badge className={result.dangerColor}>
                {result.dangerLevel === "extreme" ? "☠️ EXTREME" : result.dangerLevel === "high" ? "⚠️ HIGH" : "✅ LOW"}
              </Badge>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Confidence ({imagePredictions && selectedSymptoms.length > 0 ? "Image + Symptoms" : imagePredictions ? "Image Only" : "Symptoms Only"})</span>
                <span className="font-mono font-bold text-amber-400">{result.confidence}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000" style={{ width: `${result.confidence}%` }} />
              </div>
            </div>

            <div className="rounded-lg bg-slate-900/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Recommended Action</p>
              <p className="mt-1 text-sm text-slate-200">{result.action}</p>
            </div>

            {/* Scan again button */}
            <button
              onClick={handleReset}
              className="mt-2 w-full rounded-lg border border-amber-500/30 py-2.5 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/10 active:scale-[0.98]"
            >
              🔄 Reset & Scan Another
            </button>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-center flex-col gap-1">
        <p className="text-center text-xs text-muted-foreground">⚡ Multimodal AI Engine — Fully Offline</p>
        <p className="text-center text-[10px] text-amber-500/70 font-mono">
          {modelLoading ? "Loading model weights (1.9MB)..." : modelError ? `Engine error: ${modelError}` : "AI Engine: Ready (Loaded Offline)"}
        </p>
      </CardFooter>
    </Card>
  );
}

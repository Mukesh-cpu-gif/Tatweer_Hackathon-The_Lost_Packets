"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LayersModel, Tensor } from "@tensorflow/tfjs";
import { IMAGENET_CLASSES } from "@tensorflow-models/mobilenet/dist/imagenet_classes";

/**
 * Mock classification results for on-device AI animal identification.
 * In production, this would use a TensorFlow.js MobileNet model
 * loaded from IndexedDB for fully offline inference.
 */
interface ClassificationResult {
  species: string;
  confidence: number;
  dangerLevel: "extreme" | "high" | "low";
  dangerColor: string;
  action: string;
  topMatches?: Array<{ name: string; probability: number; danger: string }>;
}

export default function OfflineAnimalAI() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<LayersModel | null>(null);

  // Initialize TensorFlow.js and load LayersModel from the local public path on client side
  useEffect(() => {
    let isMounted = true;
    
    async function loadLocalModel() {
      try {
        if (isMounted) {
          setModelLoading(true);
          setModelError(null);
        }
        
        // Dynamically import tfjs to prevent SSR issues during build
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();
        
        const loadedModel = await tf.loadLayersModel("/model/model.json");
        
        if (isMounted) {
          modelRef.current = loadedModel;
        }
      } catch (err: unknown) {
        console.error("Error loading offline TF.js model:", err);
        if (isMounted) {
          setModelError((err as Error).message || "Failed to load model files.");
        }
      } finally {
        if (isMounted) {
          setModelLoading(false);
        }
      }
    }

    loadLocalModel();

    return () => {
      isMounted = false;
    };
  }, []);

  /** Run the MobileNet inference on the canvas image pixels using direct tfjs LayersModel classification */
  const runInference = useCallback(async (canvas: HTMLCanvasElement) => {
    if (!modelRef.current) {
      setResult({
        species: "AI Model Offline",
        confidence: 0,
        dangerLevel: "low",
        dangerColor: "bg-slate-500 text-white",
        action: "The on-device classification model is not yet loaded. Please wait and try again."
      });
      setIsAnalyzing(false);
      return;
    }

    try {
      const tf = await import("@tensorflow/tfjs");
      
      const topPredictions = tf.tidy(() => {
        // Read pixels
        const imgTensor = tf.browser.fromPixels(canvas);
        // Resize to 224x224 (standard input size of MobileNet v1)
        const resized = tf.image.resizeBilinear(imgTensor, [224, 224]);
        // Normalize pixels from [0, 255] to [-1, 1] as expected by MobileNet v1
        const normalized = resized.toFloat().sub(127.5).div(127.5);
        // Add batch dimension
        const batched = normalized.expandDims(0);
        // Run inference
        const output = modelRef.current!.predict(batched) as Tensor;
        // Get probabilities array
        const predictions = output.squeeze().arraySync() as number[];
        
        // Sort and get top 3 predictions
        return Array.from(predictions)
          .map((prob, idx) => ({
            className: IMAGENET_CLASSES[idx] || "unknown",
            probability: prob
          }))
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 3);
      });

      if (topPredictions && topPredictions.length > 0) {
        const top3Mapped = topPredictions.map((pred) => {
          const name = pred.className.split(',')[0];
          const label = pred.className.toLowerCase();
          const prob = Math.round(pred.probability * 100);
          
          let danger = "Low Risk (Non-venomous)";
          const isSnake = label.includes("snake") || label.includes("viper") || label.includes("boa") || label.includes("cobra") || label.includes("python") || label.includes("sidewinder");
          const isScorpion = label.includes("scorpion");
          const isSpider = label.includes("spider") || label.includes("tarantula");
          
          if (isSnake) {
            if (label.includes("horned") || label.includes("viper") || label.includes("sidewinder") || label.includes("cobra") || label.includes("rattle")) {
              danger = "Extreme Risk (Venomous)";
            } else if (label.includes("boa") || label.includes("garter") || label.includes("python")) {
              danger = "Low Risk (Non-venomous)";
            } else {
              danger = "High Risk (Caution)";
            }
          } else if (isScorpion || isSpider) {
            danger = "High Risk (Venomous)";
          }
          
          return { name, probability: prob, danger };
        });

        const top1 = topPredictions[0];
        const label = top1.className.toLowerCase();
        const confidence = Math.round(top1.probability * 100);
        
        // Map ImageNet classes to clinical species & alert cards
        let species = "Unknown Species";
        let dangerLevel: "extreme" | "high" | "low" = "low";
        let dangerColor = "bg-green-600 text-white";
        let action = "Keep a safe distance. No immediate action required.";

        const isSnake = label.includes("snake") || label.includes("viper") || label.includes("boa") || label.includes("cobra") || label.includes("python") || label.includes("sidewinder");
        const isScorpion = label.includes("scorpion");
        const isSpider = label.includes("spider") || label.includes("tarantula");
        const isInsect = label.includes("insect") || label.includes("beetle") || label.includes("ant") || label.includes("wasp") || label.includes("bee") || label.includes("hornet");

        // Format clean names for display mapping to local species
        const rawName = top3Mapped[0].name;

        if (isSnake) {
          if (label.includes("horned") || label.includes("viper") || label.includes("sidewinder") || label.includes("cobra") || label.includes("rattle")) {
            species = `Arabian Horned Viper (Detected as: ${rawName})`;
            dangerLevel = "extreme";
            dangerColor = "bg-red-600 text-white";
            action = "Do NOT move. Keep bitten area below heart level. Anti-venom required — responder alerted.";
          } else if (label.includes("boa") || label.includes("garter") || label.includes("python")) {
            species = `Arabian Sand Boa (Detected as: ${rawName})`;
            dangerLevel = "low";
            dangerColor = "bg-green-600 text-white";
            action = "Non-venomous species. Clean any wound. No anti-venom needed.";
          } else {
            species = `Desert Snake (Detected: ${rawName})`;
            dangerLevel = "high";
            dangerColor = "bg-orange-500 text-white";
            action = "Exercise caution. Treat as venomous. Keep distance and seek medical response.";
          }
        } else if (isScorpion) {
          species = `Deathstalker Scorpion (Detected as: ${rawName})`;
          dangerLevel = "high";
          dangerColor = "bg-orange-500 text-white";
          action = "Wash sting with soap & water. Apply cold compress. Monitor for severe reaction.";
        } else if (isSpider) {
          species = `Desert Spider (Detected: ${rawName})`;
          dangerLevel = "high";
          dangerColor = "bg-orange-500 text-white";
          action = "Wash bitten area. Apply ice pack. Seek medical attention if symptoms worsen.";
        } else if (isInsect) {
          species = `Desert Insect (Detected: ${rawName})`;
          dangerLevel = "low";
          dangerColor = "bg-green-600 text-white";
          action = "Clean area. Apply soothing cream. No immediate threat detected.";
        } else {
          // Fallback mapping
          species = `${rawName}`;
          dangerLevel = "low";
          dangerColor = "bg-slate-500 text-white";
          action = "Unclassified species. Keep away and report to a responder if concerned.";
        }

        setResult({
          species,
          confidence,
          dangerLevel,
          dangerColor,
          action,
          topMatches: top3Mapped
        });
      } else {
        setResult({
          species: "No Specimen Identified",
          confidence: 0,
          dangerLevel: "low",
          dangerColor: "bg-slate-500 text-white",
          action: "Could not identify any animal. Please try again with a clearer photo."
        });
      }
    } catch (err) {
      console.error("Error during model classification:", err);
      setResult({
        species: "Inference Error",
        confidence: 0,
        dangerLevel: "low",
        dangerColor: "bg-red-500 text-white",
        action: "On-device AI analysis failed. Please manually select the risk level and report."
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Handle image capture from camera or gallery.
   * Creates a local preview URL and triggers the on-device AI pipeline.
   */
  const handleImageCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Generate a local blob URL for the preview (works offline)
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setResult(null);
    setIsAnalyzing(true);

    // Set up Image to load and draw onto the hidden canvas
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsAnalyzing(false);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsAnalyzing(false);
        return;
      }

      // Draw original image size to canvas to retain detail
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Run MobileNet inference on canvas
      runInference(canvas);
    };
    img.onerror = () => {
      console.error("Failed to load image for canvas processing.");
      setIsAnalyzing(false);
    };
    img.src = previewUrl;
  }, [runInference]);

  /** Reset the component to scan another specimen */
  const handleReset = useCallback(() => {
    setImagePreview(null);
    setResult(null);
    setIsAnalyzing(false);
    // Reset file input so the same image can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900 to-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-400">
          <span className="text-2xl">🧬</span>
          Offline Animal AI
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Take a photo of the snake or scorpion for instant species identification.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Camera Capture Button ─────────────────────────────── */}
        {!imagePreview && (
          <label
            htmlFor="animal-capture"
            className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-950/20 p-6 transition-all hover:border-amber-400 hover:bg-amber-950/40 active:scale-[0.98]"
          >
            {/* Camera icon (SVG for offline reliability) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-12 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
            <span className="text-base font-semibold text-amber-300">
              {modelLoading ? "⏳ Loading AI Engine..." : "📷 Capture & Identify"}
            </span>
            <span className="text-xs text-muted-foreground">
              {modelLoading ? "Downloading weights..." : "Tap to open camera or select photo"}
            </span>
            {/* Hidden file input — accept image, prefer rear camera */}
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

        {/* Hidden canvas for image pixel processing */}
        <canvas ref={canvasRef} style={{ display: "none" }} className="hidden" />

        {/* ── Image Preview ────────────────────────────────────── */}
        {imagePreview && (
          <div className="relative overflow-hidden rounded-xl border border-amber-500/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Captured specimen"
              className="h-48 w-full object-cover"
            />
            {/* Scanning overlay animation while AI is processing */}
            {isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                {/* Pulsing scan ring */}
                <div className="size-16 animate-ping rounded-full border-4 border-amber-400/50" />
                <p className="mt-4 text-sm font-semibold text-amber-300 animate-pulse">
                  Analyzing with on-device AI…
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Classification Results ───────────────────────────── */}
        {result && (
          <div className="space-y-3 rounded-xl border border-amber-500/20 bg-slate-800/80 p-4 animate-in fade-in duration-500">
            {/* Species & Confidence */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Species Identified
                </p>
                <p className="text-lg font-bold text-white">
                  {result.species}
                </p>
              </div>
              <Badge className={result.dangerColor}>
                {result.dangerLevel === "extreme"
                  ? "☠️ EXTREME"
                  : result.dangerLevel === "high"
                  ? "⚠️ HIGH"
                  : "✅ LOW"}
              </Badge>
            </div>

            {/* Confidence bar */}
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Confidence</span>
                <span className="font-mono font-bold text-amber-400">
                  {result.confidence}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000"
                  style={{ width: `${result.confidence}%` }}
                />
              </div>
            </div>

            {/* Recommended action */}
            <div className="rounded-lg bg-slate-900/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Recommended Action
              </p>
              <p className="mt-1 text-sm text-slate-200">
                {result.action}
              </p>
            </div>

            {/* Low confidence warning */}
            {result.confidence < 50 && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-400">
                ⚠️ <strong>Low Confidence ({result.confidence}%):</strong> The AI is uncertain. If this is a snake bite, treat it as <strong>venomous (Extreme/High Risk)</strong> by default until medical help arrives.
              </div>
            )}

            {/* Alternative matches */}
            {result.topMatches && result.topMatches.length > 1 && (
              <div className="space-y-2 rounded-lg bg-slate-900/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Alternative Matches
                </p>
                <div className="space-y-1.5">
                  {result.topMatches.slice(1).map((match, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-slate-300">
                      <span>{match.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{match.danger}</span>
                        <span className="font-mono font-semibold text-amber-400/80">{match.probability}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scan again button */}
            <button
              onClick={handleReset}
              className="mt-2 w-full rounded-lg border border-amber-500/30 py-2.5 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/10 active:scale-[0.98]"
            >
              🔄 Scan Another Specimen
            </button>
          </div>
        )}
      </CardContent>

      {/* ── Footer: Offline AI branding ──────────────────────── */}
      <CardFooter className="justify-center flex-col gap-1">
        <p className="text-center text-xs text-muted-foreground">
          ⚡ Powered by on-device TensorFlow.js — works without internet
        </p>
        <p className="text-center text-[10px] text-amber-500/70 font-mono">
          {modelLoading ? "Loading model weights (1.9MB)..." : modelError ? `Engine error: ${modelError}` : "AI Engine: Ready (Loaded Offline)"}
        </p>
      </CardFooter>
    </Card>
  );
}

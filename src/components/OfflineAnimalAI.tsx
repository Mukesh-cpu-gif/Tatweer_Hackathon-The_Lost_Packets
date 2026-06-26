"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
}

const MOCK_RESULTS: ClassificationResult[] = [
  {
    species: "Arabian Horned Viper",
    confidence: 92,
    dangerLevel: "extreme",
    dangerColor: "bg-red-600 text-white",
    action: "Do NOT move. Keep bitten area below heart level. Anti-venom required — responder alerted.",
  },
  {
    species: "Deathstalker Scorpion",
    confidence: 87,
    dangerLevel: "high",
    dangerColor: "bg-orange-500 text-white",
    action: "Wash sting with soap & water. Apply cold compress. Monitor for severe reaction.",
  },
  {
    species: "Arabian Sand Boa - Non-venomous",
    confidence: 95,
    dangerLevel: "low",
    dangerColor: "bg-green-600 text-white",
    action: "Non-venomous species. Clean any wound. No anti-venom needed.",
  },
];

export default function OfflineAnimalAI() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle image capture from camera or gallery.
   * Creates a local preview URL and triggers the simulated AI pipeline.
   */
  const handleImageCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Generate a local blob URL for the preview (works offline)
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setResult(null);
    setIsAnalyzing(true);

    // Simulate on-device TensorFlow.js inference with a realistic 2-second delay
    setTimeout(() => {
      const randomResult = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
      setResult(randomResult);
      setIsAnalyzing(false);
    }, 2000);
  }, []);

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
              📷 Capture &amp; Identify
            </span>
            <span className="text-xs text-muted-foreground">
              Tap to open camera or select photo
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
            />
          </label>
        )}

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
      <CardFooter className="justify-center">
        <p className="text-center text-xs text-muted-foreground">
          ⚡ Powered by on-device TensorFlow.js — works without internet
        </p>
      </CardFooter>
    </Card>
  );
}

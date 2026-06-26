"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, AlertTriangle, Cpu, Info } from "lucide-react";

type AIResult = {
  species: string;
  confidence: number;
  dangerLevel: "critical" | "high" | "low";
  action: string;
};

const MOCK_RESULTS: AIResult[] = [
  {
    species: "Arabian Horned Viper",
    confidence: 92,
    dangerLevel: "critical",
    action: "Do not move. Anti-venom required immediately.",
  },
  {
    species: "Deathstalker Scorpion",
    confidence: 87,
    dangerLevel: "high",
    action: "Apply cold compress. Medical attention needed.",
  },
  {
    species: "Arabian Sand Boa",
    confidence: 95,
    dangerLevel: "low",
    action: "Non-venomous. Wash wound thoroughly.",
  },
];

/**
 * OfflineAnimalAI — Deep Space Aesthetic
 */
export default function OfflineAnimalAI() {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        simulateAIScan();
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const simulateAIScan = () => {
    setIsScanning(true);
    setResult(null);
    
    setTimeout(() => {
      const randomResult = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
      setResult(randomResult);
      setIsScanning(false);
    }, 2000);
  };

  const resetCapture = () => {
    setImage(null);
    setResult(null);
    setIsScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const dangerColors = {
    critical: "bg-rose-950/40 text-rose-400 border-rose-500/30",
    high: "bg-orange-950/40 text-orange-400 border-orange-500/30",
    low: "bg-emerald-950/40 text-emerald-400 border-emerald-500/30",
  };

  return (
    <Card className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none relative overflow-hidden group">
      <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <CardHeader className="pb-3 border-b border-zinc-800/50">
        <CardTitle className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-indigo-400">
          <Cpu size={16} />
          Offline Threat ID
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-40 border-2 border-dashed border-zinc-700/50 hover:border-indigo-500/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-zinc-950/50 hover:bg-indigo-950/20 group/btn"
          >
            <Camera size={32} strokeWidth={1} className="text-zinc-500 group-hover/btn:text-indigo-400 mb-2 transition-colors duration-300" />
            <p className="text-sm font-medium tracking-wide text-zinc-400 uppercase">Tap to identify species</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageCapture}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Captured specimen" className="w-full h-full object-cover opacity-60" />
              
              {isScanning && (
                <div className="absolute inset-0 bg-indigo-950/40 flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin absolute" />
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 animate-pulse absolute" />
                  <Cpu size={20} className="text-indigo-300 animate-pulse" />
                  <p className="mt-8 text-xs font-bold tracking-widest uppercase text-indigo-300 animate-pulse">Running Neural Net...</p>
                </div>
              )}
            </div>

            {result && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg text-zinc-100 tracking-wide">{result.species}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${result.confidence}%` }} 
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">{result.confidence}% Match</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`${dangerColors[result.dangerLevel]} uppercase tracking-widest text-[10px] font-bold`}>
                    {result.dangerLevel}
                  </Badge>
                </div>

                <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-xl flex gap-2.5">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200/80 leading-relaxed">{result.action}</p>
                </div>

                <Button 
                  onClick={resetCapture}
                  variant="outline" 
                  className="w-full border-zinc-700/50 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 tracking-wide uppercase text-xs h-10 mt-2"
                >
                  <RefreshCw size={14} className="mr-2" /> Scan Another
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-zinc-950/50 border-t border-zinc-800/50 p-3 flex items-center justify-center gap-1.5">
        <Info size={12} className="text-zinc-600" />
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
          Powered by on-device TensorFlow.js
        </span>
      </CardFooter>
    </Card>
  );
}

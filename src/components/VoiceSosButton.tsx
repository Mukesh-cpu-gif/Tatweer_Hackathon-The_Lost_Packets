"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface VoiceSosButtonProps {
  onTranscriptionComplete: (text: string) => void;
  className?: string;
}

export default function VoiceSosButton({ onTranscriptionComplete, className }: VoiceSosButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>("");

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRecognition) {
      setSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
        latestTranscriptRef.current = "";
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        // Output the final accumulated transcription on stop
        const resultText = latestTranscriptRef.current.trim();
        if (resultText.length > 0) {
          onTranscriptionComplete(resultText);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setError("Microphone permission denied.");
        } else if (event.error === "network") {
          setError("Voice capture failed: Network connection required.");
        } else {
          setError(`Voice capture failed: ${event.error}`);
        }
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      };

      rec.onresult = (event: any) => {
        // Clear any active silence timer
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // Reconstruct the full text from the accumulated result chunks
        let accumulated = "";
        for (let i = 0; i < event.results.length; ++i) {
          accumulated += event.results[i][0].transcript + " ";
        }
        latestTranscriptRef.current = accumulated;

        // Auto-stop if user remains silent for 3 seconds
        silenceTimeoutRef.current = setTimeout(() => {
          console.log("Silence limit (3s) reached. Stopping recording.");
          rec.stop();
        }, 3000);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [onTranscriptionComplete]);

  const toggleListening = () => {
    if (!supported || !recognitionRef.current) {
      setError("Speech recognition not supported on this browser.");
      return;
    }

    if (isListening) {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  if (!supported) return null;

  return (
    <div className={`flex flex-col items-center gap-2 ${className || ""}`}>
      <div className="relative">
        {/* Pulsing rings when recording */}
        {isListening && (
          <>
            <span className="absolute -inset-2 rounded-full bg-red-500/30 animate-ping" />
            <span className="absolute -inset-4 rounded-full bg-red-500/10 animate-pulse" />
          </>
        )}

        <Button
          type="button"
          onClick={toggleListening}
          className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            isListening
              ? "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_30px_rgba(239,68,68,0.7)]"
              : "bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/30 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.1)] hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]"
          }`}
        >
          {isListening ? (
            <MicOff className="h-6 w-6 animate-pulse text-white" />
          ) : (
            <Mic className="h-6 w-6 text-indigo-300" />
          )}
        </Button>
      </div>

      {isListening && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 animate-pulse mt-1">
          Listening... State emergency clearly
        </span>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-semibold uppercase tracking-wider mt-1 text-center bg-rose-950/20 border border-rose-500/25 px-3 py-1 rounded-full">
          <AlertCircle size={12} className="shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

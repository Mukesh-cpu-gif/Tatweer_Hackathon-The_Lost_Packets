"use client";

import React, { createContext, useCallback, useContext, useState, useEffect, useMemo } from "react";
import { translations } from "@/lib/translations";

export type Language = "en" | "ar";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "ltr" | "rtl";
  toggleLanguage: () => void;
  t: (key: string) => string;
  isAr: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem("aounak-lang") as Language;
      if (saved === "en" || saved === "ar") {
        setLanguageState(saved);
        return;
      }
      setLanguageState(navigator.language.startsWith("ar") ? "ar" : "en");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const dir = useMemo<"ltr" | "rtl">(() => (language === "ar" ? "rtl" : "ltr"), [language]);
  const isAr = useMemo(() => language === "ar", [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("aounak-lang", lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => {
      const next = current === "en" ? "ar" : "en";
      if (typeof window !== "undefined") {
        localStorage.setItem("aounak-lang", next);
      }
      return next;
    });
  }, []);

  const t = useCallback((key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return language === "ar" ? entry.ar : entry.en;
  }, [language]);

  // Sync html attributes on mount and language changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
    }
  }, [language, dir]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      dir,
      toggleLanguage,
      t,
      isAr,
    }),
    [language, setLanguage, dir, toggleLanguage, t, isAr]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
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
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aounak-lang") as Language;
      if (saved === "en" || saved === "ar") return saved;
      // Default to Arabic if browser is Arabic, otherwise English
      return navigator.language.startsWith("ar") ? "ar" : "en";
    }
    return "en";
  });

  const dir = useMemo<"ltr" | "rtl">(() => (language === "ar" ? "rtl" : "ltr"), [language]);
  const isAr = useMemo(() => language === "ar", [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("aounak-lang", lang);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return language === "ar" ? entry.ar : entry.en;
  };

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
    [language, dir, isAr]
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

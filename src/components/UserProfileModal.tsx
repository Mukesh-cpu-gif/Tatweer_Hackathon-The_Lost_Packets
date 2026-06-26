"use client";

import { useState } from "react";
import { X, User, Phone, Car, Save, AlertCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export interface UserProfileData {
  name: string;
  phone: string;
  vehicle: string;
}

export default function UserProfileModal({ isOpen, onClose, onSave }: UserProfileModalProps) {
  const { t, isAr } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  // Initialize form states directly from localStorage (no useEffect required)
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("aounak-user-profile");
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.name || "";
        }
      } catch (err) {
        console.error("Error reading localStorage name", err);
      }
    }
    return "";
  });

  const [phone, setPhone] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("aounak-user-profile");
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.phone || "";
        }
      } catch (err) {
        console.error("Error reading localStorage phone", err);
      }
    }
    return "";
  });

  const [vehicle, setVehicle] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("aounak-user-profile");
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.vehicle || "";
        }
      } catch (err) {
        console.error("Error reading localStorage vehicle", err);
      }
    }
    return "";
  });

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedPhone) {
      setError(t("Please fill in Name and Phone Number."));
      return;
    }

    try {
      const profileData: UserProfileData = {
        name: trimmedName,
        phone: trimmedPhone,
        vehicle: vehicle.trim(),
      };
      localStorage.setItem("aounak-user-profile", JSON.stringify(profileData));
      
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (err) {
      console.error("Failed to save user profile", err);
      setError("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
      />

      {/* Modal Container */}
      <div 
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl transition-all duration-300 animate-in zoom-in-95"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Glow Orb */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 blur-[30px] rounded-full pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className={`absolute top-4 ${isAr ? "left-4" : "right-4"} rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all`}
          aria-label={t("Cancel")}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-5 space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-md">
            <User size={24} className="text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold tracking-wide uppercase text-zinc-100">
            {t("Setup Emergency Profile")}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
            {t("Fill in your contact details so responders can reach you in an emergency.")}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 flex items-start gap-2 animate-in slide-in-from-top-2 duration-300">
            <AlertCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
            <p className="text-xs text-rose-300/90 font-semibold">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-3">
            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <User size={12} className="text-indigo-400" /> {t("Full Name")}
              </label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? "أدخل اسمك الكامل" : "Enter your full name"}
                className="h-11 bg-zinc-950/40 border-zinc-800 text-zinc-100 focus:border-indigo-500 placeholder:text-zinc-600"
              />
            </div>

            {/* Phone Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Phone size={12} className="text-indigo-400" /> {t("Phone Number")}
              </label>
              <Input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={isAr ? "+971..." : "+97150..."}
                className="h-11 bg-zinc-950/40 border-zinc-800 text-zinc-100 focus:border-indigo-500 placeholder:text-zinc-600 font-mono"
              />
            </div>

            {/* Vehicle Details Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Car size={12} className="text-indigo-400" /> {t("Vehicle Details (e.g. White Patrol)")}
              </label>
              <Input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder={isAr ? "مثال: نيسان باترول أبيض" : "e.g. White Nissan Patrol"}
                className="h-11 bg-zinc-950/40 border-zinc-800 text-zinc-100 focus:border-indigo-500 placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 font-bold uppercase tracking-wider text-xs rounded-xl"
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            >
              <Save size={14} className={isAr ? "ml-1.5" : "mr-1.5"} />
              {t("Save Profile")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

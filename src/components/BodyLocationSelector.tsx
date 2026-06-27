"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Check } from "lucide-react";

interface BodyLocationSelectorProps {
  selectedPart: string;
  onSelectPart: (part: string) => void;
  title: string;
  themeColor?: "rose" | "indigo";
}

const BodyMap = ({ 
  selected, 
  onSelect,
  themeColor = "rose"
}: { 
  selected: string; 
  onSelect: (part: string) => void;
  themeColor?: "rose" | "indigo";
}) => {
  const { t } = useLanguage();
  const parts = [
    { id: "Head & Neck", label: t("Head & Neck"), path: "M 80,15 A 8,8 0 1,1 80,31 A 8,8 0 1,1 80,15 M 78,31 L 78,35 L 82,35 L 82,31 Z" },
    { id: "Torso", label: t("Torso"), path: "M 70,36 L 90,36 L 88,80 L 72,80 Z" },
    { id: "Right Arm", label: t("Right Arm"), path: "M 69,37 L 55,75 L 59,77 L 69,45 Z" },
    { id: "Left Arm", label: t("Left Arm"), path: "M 91,37 L 105,75 L 101,77 L 91,45 Z" },
    { id: "Right Leg", label: t("Right Leg"), path: "M 72,81 L 68,135 L 74,135 L 79,81 Z" },
    { id: "Left Leg", label: t("Left Leg"), path: "M 88,81 L 92,135 L 86,135 L 81,81 Z" },
    { id: "Right Foot", label: t("Right Foot"), path: "M 68,136 L 62,143 L 73,143 L 74,136 Z" },
    { id: "Left Foot", label: t("Left Foot"), path: "M 92,136 L 98,143 L 87,143 L 86,136 Z" },
  ];

  const highlightFill = themeColor === "rose" ? "fill-rose-500" : "fill-indigo-500";
  const highlightStroke = themeColor === "rose" ? "stroke-rose-300" : "stroke-indigo-300";
  const glowShadow = themeColor === "rose" 
    ? "drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" 
    : "drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]";

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl relative overflow-hidden h-[180px] w-[120px]">
      <svg viewBox="50 10 60 140" className="h-full w-auto filter drop-shadow-[0_0_8px_rgba(99,102,241,0.15)]">
        <g className="opacity-20">
          {parts.map(p => (
            <path key={`bg-${p.id}`} d={p.path} fill="#475569" stroke="#334155" strokeWidth="0.5" />
          ))}
        </g>
        {parts.map(p => {
          const isSelected = selected === p.id;
          return (
            <path
              key={p.id}
              d={p.path}
              className={`transition-all duration-300 cursor-pointer ${
                isSelected
                  ? `${highlightFill} ${highlightStroke} stroke-[1.2px] animate-pulse ${glowShadow}`
                  : "fill-zinc-800 hover:fill-zinc-700 stroke-zinc-700 stroke-[0.5px]"
              }`}
              onClick={() => onSelect(p.id)}
            >
              <title>{p.label}</title>
            </path>
          );
        })}
      </svg>
    </div>
  );
};

export default function BodyLocationSelector({
  selectedPart,
  onSelectPart,
  title,
  themeColor = "rose"
}: BodyLocationSelectorProps) {
  const { t } = useLanguage();
  const bodyParts = [
    { id: "Head & Neck", label: t("Head & Neck") },
    { id: "Torso", label: t("Torso") },
    { id: "Right Arm", label: t("Right Arm") },
    { id: "Left Arm", label: t("Left Arm") },
    { id: "Right Leg", label: t("Right Leg") },
    { id: "Left Leg", label: t("Left Leg") },
    { id: "Right Foot", label: t("Right Foot") },
    { id: "Left Foot", label: t("Left Foot") },
  ];

  const activeStyles = themeColor === "rose"
    ? "bg-rose-950/40 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
    : "bg-indigo-950/40 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]";
    
  const textIconColor = themeColor === "rose" ? "text-rose-400" : "text-indigo-400";

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
        {title}
      </h4>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-1/3 flex justify-center">
          <BodyMap selected={selectedPart} onSelect={onSelectPart} themeColor={themeColor} />
        </div>
        <div className="w-full sm:w-2/3 grid grid-cols-2 gap-2 content-center">
          {bodyParts.map(part => {
            const isSelected = selectedPart === part.id;
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => onSelectPart(part.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-300 ${
                  isSelected
                    ? activeStyles
                    : "bg-zinc-950/30 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                <span>{part.label}</span>
                {isSelected && <Check className={`h-3 w-3 ${textIconColor}`} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

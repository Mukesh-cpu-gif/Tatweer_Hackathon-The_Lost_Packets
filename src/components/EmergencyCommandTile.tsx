import * as React from "react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

type EmergencyCommandTileTone = "danger" | "warning" | "system" | "gps" | "neutral"

const toneStyles: Record<
  EmergencyCommandTileTone,
  { border: string; icon: string; accent: string; arrow: string }
> = {
  danger: {
    border: "border-rose-500/25 hover:border-rose-400/45",
    icon: "text-rose-400",
    accent: "bg-rose-500/10",
    arrow: "group-hover:text-rose-300",
  },
  warning: {
    border: "border-amber-500/25 hover:border-amber-400/45",
    icon: "text-amber-400",
    accent: "bg-amber-500/10",
    arrow: "group-hover:text-amber-300",
  },
  system: {
    border: "border-indigo-500/25 hover:border-indigo-400/45",
    icon: "text-indigo-400",
    accent: "bg-indigo-500/10",
    arrow: "group-hover:text-indigo-300",
  },
  gps: {
    border: "border-cyan-500/25 hover:border-cyan-400/45",
    icon: "text-cyan-400",
    accent: "bg-cyan-500/10",
    arrow: "group-hover:text-cyan-300",
  },
  neutral: {
    border: "border-white/10 hover:border-zinc-500/45",
    icon: "text-zinc-300",
    accent: "bg-white/5",
    arrow: "group-hover:text-zinc-200",
  },
}

function EmergencyCommandTile({
  icon: Icon,
  label,
  description,
  tone = "system",
  className,
  isRtl = false,
}: {
  icon: React.ElementType
  label: React.ReactNode
  description?: React.ReactNode
  tone?: EmergencyCommandTileTone
  className?: string
  isRtl?: boolean
}) {
  const styles = toneStyles[tone]

  return (
    <div
      data-slot="emergency-command-tile"
      className={cn(
        "group flex min-h-36 flex-col justify-between rounded-2xl border bg-zinc-950/45 p-4 text-left shadow-[0_12px_45px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900/55",
        styles.border,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("rounded-2xl border border-white/10 p-3", styles.accent)}>
          <Icon size={28} strokeWidth={1.6} className={styles.icon} />
        </div>
        <ArrowRight
          size={16}
          className={cn(
            "mt-1 shrink-0 text-zinc-600 transition-all duration-300 group-hover:translate-x-0.5",
            styles.arrow,
            isRtl && "rotate-180 group-hover:-translate-x-0.5 group-hover:translate-x-0"
          )}
        />
      </div>
      <div className="mt-5">
        <p className="text-sm font-bold uppercase tracking-wide text-zinc-100">{label}</p>
        {description ? (
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-zinc-500">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export { EmergencyCommandTile }

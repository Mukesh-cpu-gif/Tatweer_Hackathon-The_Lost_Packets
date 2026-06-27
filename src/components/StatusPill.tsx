import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusPillVariants = cva(
  "inline-flex h-7 w-fit shrink-0 items-center gap-2 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-widest",
  {
    variants: {
      tone: {
        neutral: "border-zinc-700/70 bg-zinc-900/55 text-zinc-300",
        live: "border-rose-500/35 bg-rose-950/35 text-rose-300",
        warning: "border-amber-500/35 bg-amber-950/30 text-amber-300",
        success: "border-emerald-500/35 bg-emerald-950/30 text-emerald-300",
        danger: "border-rose-500/35 bg-rose-950/30 text-rose-300",
        offline: "border-zinc-700/70 bg-zinc-950/60 text-zinc-500",
        system: "border-indigo-500/35 bg-indigo-950/30 text-indigo-300",
        gps: "border-cyan-500/35 bg-cyan-950/25 text-cyan-300",
      },
      pulse: {
        true: "[&_span[data-slot=status-dot]]:animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      tone: "neutral",
      pulse: false,
    },
  }
)

const dotTone: Record<NonNullable<VariantProps<typeof statusPillVariants>["tone"]>, string> = {
  neutral: "bg-zinc-400",
  live: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
  warning: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
  success: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]",
  danger: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
  offline: "bg-zinc-600",
  system: "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.7)]",
  gps: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.65)]",
}

function StatusPill({
  className,
  tone = "neutral",
  pulse,
  children,
  showDot = true,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof statusPillVariants> & {
    showDot?: boolean
  }) {
  return (
    <span className={cn(statusPillVariants({ tone, pulse }), className)} {...props}>
      {showDot && (
        <span
          data-slot="status-dot"
          className={cn("h-1.5 w-1.5 rounded-full", dotTone[tone ?? "neutral"])}
        />
      )}
      {children}
    </span>
  )
}

export { StatusPill, statusPillVariants }

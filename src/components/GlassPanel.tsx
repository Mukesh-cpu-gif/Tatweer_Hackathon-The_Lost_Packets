import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const glassPanelVariants = cva(
  "relative overflow-hidden rounded-2xl border bg-zinc-950/45 text-zinc-100 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl",
  {
    variants: {
      tone: {
        neutral: "border-white/10",
        system: "border-indigo-500/25 shadow-indigo-950/10",
        gps: "border-cyan-500/25 shadow-cyan-950/10",
        warning: "border-amber-500/30 shadow-amber-950/10",
        success: "border-emerald-500/30 shadow-emerald-950/10",
        danger: "border-rose-500/30 shadow-rose-950/10",
      },
      interactive: {
        true: "transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900/55 hover:shadow-[0_22px_70px_rgba(0,0,0,0.32)]",
        false: "",
      },
    },
    defaultVariants: {
      tone: "neutral",
      interactive: false,
    },
  }
)

function GlassPanel({
  className,
  tone,
  interactive,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof glassPanelVariants>) {
  return (
    <div
      data-slot="glass-panel"
      className={cn(glassPanelVariants({ tone, interactive }), className)}
      {...props}
    />
  )
}

export { GlassPanel, glassPanelVariants }

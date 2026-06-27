import * as React from "react"
import { CheckCircle2, ShieldAlert } from "lucide-react"

import { GlassPanel } from "@/components/GlassPanel"
import { StatusPill } from "@/components/StatusPill"
import { Progress } from "@/components/ui/progress"

function ProfileCompletionCard({
  title,
  subtitle,
  percentage,
  missingItems,
  completeLabel,
  incompleteLabel,
}: {
  title: string
  subtitle: string
  percentage: number
  missingItems: string[]
  completeLabel: string
  incompleteLabel: string
}) {
  const complete = percentage >= 100

  return (
    <GlassPanel tone={complete ? "success" : "warning"} className="p-4">
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/55 p-3 shrink-0">
            {complete ? (
              <CheckCircle2 size={20} className="text-emerald-400" />
            ) : (
              <ShieldAlert size={20} className="text-amber-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-100">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">{subtitle}</p>
          </div>
        </div>
        <StatusPill tone={complete ? "success" : "warning"} className="shrink-0" pulse={!complete}>
          {complete ? completeLabel : incompleteLabel}
        </StatusPill>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          <span>{percentage}%</span>
          <span>{complete ? completeLabel : incompleteLabel}</span>
        </div>
        <Progress
          value={percentage}
          className={complete ? "[&_div]:bg-emerald-400" : "[&_div]:bg-amber-400"}
        />
      </div>

      {!complete && missingItems.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {missingItems.map((item) => (
            <span
              key={item}
              className="rounded-full border border-amber-500/20 bg-amber-950/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-200/80"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </GlassPanel>
  )
}

export { ProfileCompletionCard }

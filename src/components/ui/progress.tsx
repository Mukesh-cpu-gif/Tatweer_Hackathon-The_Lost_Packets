import * as React from "react"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  max = 100,
  ...props
}: React.ComponentProps<"div"> & {
  value?: number | null
  max?: number
}) {
  const normalizedValue = typeof value === "number" ? Math.min(Math.max(value, 0), max) : null
  const percentage = normalizedValue === null ? 100 : (normalizedValue / max) * 100

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={normalizedValue ?? undefined}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-zinc-800/80", className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 rounded-full bg-indigo-400 transition-transform duration-500",
          normalizedValue === null && "animate-pulse"
        )}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  )
}

export { Progress }

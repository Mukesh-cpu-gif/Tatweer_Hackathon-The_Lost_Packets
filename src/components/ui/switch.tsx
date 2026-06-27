"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={(state) =>
        cn(
          "inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-50",
          state.checked
            ? "border-emerald-500/30 bg-emerald-500/80 shadow-[0_0_18px_rgba(16,185,129,0.28)]"
            : "border-zinc-700/60 bg-zinc-800/80",
          typeof className === "function" ? className(state) : className
        )
      }
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={(state) =>
          cn(
            "block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-300",
            state.checked ? "translate-x-7" : "translate-x-0"
          )
        }
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

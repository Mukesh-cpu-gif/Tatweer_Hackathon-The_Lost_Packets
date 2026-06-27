import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative grid w-full gap-1 rounded-2xl border px-4 py-3 text-sm backdrop-blur-xl",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-zinc-950/45 text-zinc-200",
        warning: "border-amber-500/30 bg-amber-950/20 text-amber-100",
        success: "border-emerald-500/30 bg-emerald-950/20 text-emerald-100",
        danger: "border-rose-500/30 bg-rose-950/20 text-rose-100",
        system: "border-indigo-500/30 bg-indigo-950/20 text-indigo-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role={variant === "danger" || variant === "warning" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("text-xs font-bold uppercase tracking-widest", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-xs leading-relaxed opacity-85", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }

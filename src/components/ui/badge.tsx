import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Generic-VERIS "Pill": monospace, uppercase, wide tracking, 2px radius,
// soft tonal fills with hairline borders.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-[2px] border px-2 py-[3.5px] font-mono text-[10px] leading-none tracking-[0.1em] uppercase whitespace-nowrap transition-[color,background-color] focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        // blue (design "accent")
        default:
          "border-accent-line bg-accent-soft text-primary [a&]:hover:bg-[color-mix(in_oklch,var(--accent-soft),black_4%)]",
        // neutral
        secondary:
          "border-rule bg-secondary text-ink-muted [a&]:hover:bg-[color-mix(in_oklch,var(--secondary),black_4%)]",
        // solid ink
        ink: "border-foreground bg-foreground text-background",
        // rose (danger, soft)
        destructive:
          "border-[oklch(0.88_0.04_25)] bg-[oklch(0.96_0.03_25)] text-[oklch(0.45_0.12_25)] dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive",
        outline: "border-rule bg-transparent text-foreground [a&]:hover:bg-secondary",
        // green (success/positive, soft)
        success:
          "border-[oklch(0.88_0.04_145)] bg-[oklch(0.96_0.03_145)] text-[oklch(0.38_0.08_145)] dark:border-[oklch(0.72_0.14_145)]/40 dark:bg-[oklch(0.72_0.14_145)]/15 dark:text-[oklch(0.82_0.16_145)]",
        // amber/gold (warning, soft)
        warning:
          "border-highlight-line bg-highlight-soft text-[oklch(0.4_0.1_60)] dark:border-highlight/40 dark:bg-highlight/15 dark:text-highlight",
        ghost: "border-transparent [a&]:hover:bg-secondary",
        link: "border-transparent text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

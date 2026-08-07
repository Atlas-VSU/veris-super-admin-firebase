import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Generic-VERIS buttons: flat, hairline-bordered, 4px radius, weight 500,
// slightly negative tracking, color-only transitions (no scale, no heavy shadow).
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-sm font-medium tracking-[-0.005em] leading-none transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Brand cobalt-blue CTA (design "accent")
        default:
          "bg-gradient-to-r from-[#030677] to-[#2563eb] text-white border-0 hover:opacity-90 shadow-sm",
        // Near-black ink action (design "primary")
        ink: "bg-foreground text-background border border-foreground hover:bg-[color-mix(in_oklch,var(--foreground),white_14%)]",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-300 text-white border-0 hover:opacity-90 shadow-sm focus-visible:ring-destructive/30",
        outline:
          "border border-rule-strong bg-transparent text-foreground hover:bg-secondary",
        secondary:
          "bg-secondary text-secondary-foreground border border-rule hover:bg-[color-mix(in_oklch,var(--secondary),black_5%)]",
        success:
          "bg-gradient-to-r from-green-600 to-green-300 text-white border-0 hover:opacity-90 shadow-sm",
        ghost:
          "border border-transparent text-foreground hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline hover:text-[color-mix(in_oklch,var(--primary),black_10%)]",
        icon: "p-0 rounded-[4px] border border-transparent text-ink-muted hover:bg-secondary hover:text-foreground focus-visible:ring-ring/40 data-[state=open]:bg-secondary",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3.5",
        sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

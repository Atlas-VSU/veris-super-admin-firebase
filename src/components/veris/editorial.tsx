import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Editorial design primitives ported from the generic-veris prototype.

   Eyebrow labels render in Geist Mono (wide-tracked uppercase) and headlines /
   stat values in the Fraunces serif, matching the design system tokens loaded
   in layout.tsx (--font-geist-mono / --font-fraunces).
   ────────────────────────────────────────────────────────────────────────── */

/** Small uppercase caption with an optional gold marker dot. */
export function Eyebrow({
  children,
  dot = false,
  className,
}: {
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {dot && (
        <span className="size-1.5 shrink-0 rounded-full bg-highlight" />
      )}
      <span className="veris-eyebrow">{children}</span>
    </span>
  );
}

/** Section divider: gold dot + eyebrow label + a thin rule filling the row. */
export function SectionLabel({
  children,
  rule = true,
  className,
}: {
  children: ReactNode;
  rule?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="size-1.5 shrink-0 rounded-full bg-highlight" />
      <span className="veris-eyebrow shrink-0">{children}</span>
      {rule && <span className="h-px flex-1 bg-border" />}
    </div>
  );
}

/** Editorial statistic: top rule, eyebrow caption, large number, sub-text. */
export function StatBlock({
  label,
  value,
  sub,
  accent = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("border-t border-rule pt-4", className)}>
      <div className="veris-eyebrow mb-3">{label}</div>
      <div
        className={cn(
          "font-serif text-[2.375rem] font-medium leading-none tracking-[-0.02em]",
          accent ? "text-primary" : "text-ink",
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-2.5 text-[0.8rem] leading-relaxed text-ink-muted">
          {sub}
        </div>
      )}
    </div>
  );
}

/** Bordered editorial card — flat 1px rule, near-square corners, white field. */
export function EditorialCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[4px] border border-rule bg-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Faculty of Computing × VERIS brand primitives.

   The faculty identity is a cobalt-blue circle holding a white chip-with-
   circuits and gold connection dots (public/images/foc-logo.png). These
   helpers reuse that DNA — the circuit motif, the wordmark lockup — so the
   blue + gold pairing shows up consistently and professionally across the app.
   ────────────────────────────────────────────────────────────────────────── */

/** The Faculty of Computing logo (circular cobalt mark). */
export function FocLogo({
  size = 36,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/images/foc-logo.png"
      alt="Faculty of Computing"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

/** VERIS wordmark — monospace, wide-tracked, with the gold faculty dot. */
export function VerisWordmark({
  className,
  dot = true,
}: {
  className?: string;
  dot?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="font-mono text-sm font-medium tracking-[0.28em] text-ink">
        VERIS
      </span>
    </span>
  );
}

/**
 * Decorative circuit-lines + connection dots, anchored to the top-right.
 * White lines + gold travelling pulses by default (for the cobalt brand panel);
 * pass `lineColor`/`dotColor` to retune for other surfaces.
 */
export function CircuitMotif({
  className,
  lineColor = "rgba(255,255,255,0.5)",
  dotColor = "#ffffff",
  pulseColor = "#fdc530",
  glowId = "verisCircuitGlow",
}: {
  className?: string;
  lineColor?: string;
  dotColor?: string;
  pulseColor?: string;
  glowId?: string;
}) {
  const lines = [
    { d: "M 380 140 H 200 V 240", end: [200, 240], dur: 4.5 },
    { d: "M 380 140 H 60", end: [60, 140], dur: 5.2 },
    { d: "M 380 140 V 320 H 220", end: [220, 320], dur: 4.0 },
    { d: "M 380 140 V 280 H 80", end: [80, 280], dur: 5.8 },
    { d: "M 380 140 V 460", end: [380, 460], dur: 5.4 },
    { d: "M 380 140 H 460 V 60", end: [460, 60], dur: 4.3 },
    { d: "M 380 140 V 380 H 460", end: [460, 380], dur: 6.0 },
  ];
  return (
    <svg
      viewBox="0 0 480 480"
      preserveAspectRatio="xMaxYMin meet"
      aria-hidden="true"
      className={cn("pointer-events-none", className)}
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={dotColor} stopOpacity="0.5" />
          <stop offset="60%" stopColor={dotColor} stopOpacity="0.1" />
          <stop offset="100%" stopColor={dotColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      {lines.map((l, i) => (
        <g key={i}>
          <path
            d={l.d}
            stroke={lineColor}
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="square"
          />
          <circle r="3.5" fill={pulseColor}>
            <animateMotion dur={`${l.dur}s`} repeatCount="indefinite" path={l.d} />
          </circle>
        </g>
      ))}
      {lines.map((l, i) => (
        <g key={`d${i}`}>
          <circle cx={l.end[0]} cy={l.end[1]} r="14" fill={`url(#${glowId})`} />
          <circle cx={l.end[0]} cy={l.end[1]} r="3.5" fill={dotColor} />
        </g>
      ))}
    </svg>
  );
}

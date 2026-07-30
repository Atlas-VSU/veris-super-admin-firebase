import { TemporaryLogin } from "./components/TemporaryLogin";

const FEATURES = [
  { n: "01", label: "Tenant Orchestration", desc: "Provision & manage tenant orgs" },
  { n: "02", label: "Access Governance", desc: "Control administrative credentials" },
  { n: "03", label: "Ecosystem Telemetry", desc: "Real-time tenant statistics" },
];

function VerisMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4l8 16 8-16M8 4l4 8 4-8" />
    </svg>
  );
}

/* Decorative circuit lines + connection dots anchored top-right. */
function CircuitMotif() {
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
      className="pointer-events-none absolute -right-10 -top-10 z-[1] size-[460px] sm:size-[600px] md:size-[800px] lg:size-[1000px] opacity-60"
    >
      <defs>
        <radialGradient id="whiteGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {lines.map((l, i) => (
        <g key={i}>
          <path
            d={l.d}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="square"
          />
          <circle r="3.5" fill="#fff">
            <animateMotion
              dur={`${l.dur}s`}
              repeatCount="indefinite"
              path={l.d}
            />
          </circle>
        </g>
      ))}
      {lines.map((l, i) => (
        <g key={`d${i}`}>
          <circle cx={l.end[0]} cy={l.end[1]} r="14" fill="url(#whiteGlow)" />
          <circle cx={l.end[0]} cy={l.end[1]} r="3.5" fill="#ffffff" />
        </g>
      ))}
    </svg>
  );
}

/* Decorative circuit lines + connection dots anchored bottom-left. */
function CircuitMotifLeft() {
  const lines = [
    { d: "M 100 340 H 280 V 240", end: [280, 240], dur: 4.5 },
    { d: "M 100 340 H 420", end: [420, 340], dur: 5.2 },
    { d: "M 100 340 V 160 H 260", end: [260, 160], dur: 4.0 },
    { d: "M 100 340 V 200 H 400", end: [400, 200], dur: 5.8 },
    { d: "M 100 340 V 20", end: [100, 20], dur: 5.4 },
    { d: "M 100 340 H 20 V 420", end: [20, 420], dur: 4.3 },
    { d: "M 100 340 V 100 H 20", end: [20, 100], dur: 6.0 },
  ];
  return (
    <svg
      viewBox="0 0 480 480"
      preserveAspectRatio="xMinYMax meet"
      className="pointer-events-none absolute -left-10 -bottom-10 z-[1] size-[460px] sm:size-[600px] md:size-[800px] lg:size-[1000px] opacity-60"
    >
      <defs>
        <radialGradient id="whiteGlowLeft" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {lines.map((l, i) => (
        <g key={i}>
          <path
            d={l.d}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="square"
          />
          <circle r="3.5" fill="#fff">
            <animateMotion
              dur={`${l.dur}s`}
              repeatCount="indefinite"
              path={l.d}
            />
          </circle>
        </g>
      ))}
      {lines.map((l, i) => (
        <g key={`d${i}`}>
          <circle cx={l.end[0]} cy={l.end[1]} r="14" fill="url(#whiteGlowLeft)" />
          <circle cx={l.end[0]} cy={l.end[1]} r="3.5" fill="#ffffff" />
        </g>
      ))}
    </svg>
  );
}

export function HomePageLayout() {
  return (
    <div
      className="relative flex min-h-svh w-full items-center justify-center overflow-hidden p-6 sm:p-10"
      style={{
        background:
          "linear-gradient(155deg, #1568dc 0%, #1a78f4 38%, #2589ff 100%)",
      }}
    >
      {/* Grid underlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Vignette glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,.18) 0%, transparent 70%), radial-gradient(circle at 20% 90%, rgba(11,49,103,.4) 0%, transparent 60%)",
        }}
      />
      <CircuitMotif />
      <CircuitMotifLeft />

      {/* Frosted Central Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-8 sm:p-10 flex flex-col gap-6"
        style={{
          background: "rgba(255, 255, 255, 0.96)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 8px 40px rgba(11, 49, 103, 0.25), 0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Wordmark logo */}
        <div className="flex flex-col items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <VerisMark className="size-6" />
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold tracking-[0.32em] text-foreground">
              VERIS
            </span>
          </div>
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Super Admin Console
          </span>
        </div>

        <TemporaryLogin />
      </div>
    </div>
  );
}

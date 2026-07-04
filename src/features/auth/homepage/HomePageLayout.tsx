import { TemporaryLogin } from "./components/TemporaryLogin";

const FEATURES = [
  { n: "01", label: "Member directory", desc: "Bulk import from CSV" },
  { n: "02", label: "Event scheduling", desc: "Major / minor designations" },
  { n: "03", label: "Live attendance log", desc: "Quick ID input" },
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
      className="pointer-events-none absolute -right-10 -top-10 z-[1] size-[460px]"
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
            stroke="rgba(255,255,255,0.5)"
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

export function HomePageLayout() {
  return (
    <div className="flex min-h-svh bg-card">
      {/* LEFT  */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex lg:w-[55%] xl:p-16"
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
              "radial-gradient(circle at 70% 30%, rgba(255,255,255,.18) 0%, transparent 50%), radial-gradient(circle at 20% 90%, rgba(11,49,103,.4) 0%, transparent 55%)",
          }}
        />
        <CircuitMotif />

        {/* Wordmark */}
        <div className="relative z-10 flex items-center gap-3.5">
          <span className="grid size-8 place-items-center rounded-full bg-white/15">
            <VerisMark className="size-4" />
          </span>
          <span className="font-mono text-sm font-medium tracking-[0.32em]">
            VERIS
          </span>
          <span className="size-1.5 rounded-full bg-highlight shadow-[0_0_12px_rgba(253,197,48,.7)]" />
        </div>

        {/* Center content */}
        <div className="relative z-10">
          {/* <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/[0.06] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]">
            <span className="size-1.5 rounded-full bg-[#ffffff]" />
            Basic Tier · Attendance Management
          </div> */}

          <h1 className="font-serif text-[clamp(2.5rem,3.6vw,3.5rem)] font-medium leading-[1.04] tracking-[-0.03em]">
            One hub.
            <br />
            Campus-wide.
            <br />
            Organization-ready.
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-white/75">
            An organization-wide system for managing members, events, and
            attendance — designed for every faculty&apos;s organizations to
            adopt as-is.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.n} className="border-t border-white/25 pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="size-1 rounded-full bg-highlight" />
                  <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-white/55">
                    {f.n}
                  </span>
                </div>
                <div className="text-sm font-medium">{f.label}</div>
                <div className="mt-1 text-xs text-white/55">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-white/55">
          <span>v · Basic · 2026</span>
          <span className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-highlight" />
            Faculty of Computing
          </span>
        </div>
      </div>

      {/* ── RIGHT — sign-in ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
        <div className="w-full max-w-md">
          {/* Mobile brand bar */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary">
              <VerisMark className="size-3.5" />
            </span>
            <span className="text-sm font-semibold tracking-[0.28em] text-foreground">
              VERIS
            </span>
            <span className="size-1.5 rounded-full bg-highlight" />
            <span className="text-sm font-semibold tracking-[0.28em] text-foreground">
              FACULTY OF COMPUTING
            </span>
          </div>

          <TemporaryLogin />

          {/* Student payment entry */}
          {/* <div className="mt-8 border-t border-border pt-6">
            <p className="veris-eyebrow mb-3">Student?</p>
            <Link
              href="/payment"
              className="flex items-center justify-between rounded-md border border-input px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <span>Make a payment without signing in</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}

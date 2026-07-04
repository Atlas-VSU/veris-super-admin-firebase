import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { FocLogo } from "@/components/veris/brand";

interface LoadingScreenProps {
  message?: string;
  className?: string;
  showDelayMessage?: boolean;
}

// Generic-VERIS loading screen: calm warm-paper field with a faint rule grid,
// a hairline-bordered card carrying the VERIS wordmark + gold dot, a cobalt
// spinner, and a monospace status line.
export function LoadingScreen({
  message = "Preparing your workspace…",
  className,
  showDelayMessage = true,
}: LoadingScreenProps) {
  const [showDelayed, setShowDelayed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDelayed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background",
        className
      )}
    >
      {/* Faint rule grid underlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(var(--rule) 1px, transparent 1px), linear-gradient(90deg, var(--rule) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(circle at center, black 0%, transparent 75%)",
        }}
      />

      <div className="relative mx-4 flex w-full max-w-sm flex-col items-center gap-6 rounded-[4px] border border-rule bg-card px-8 py-12 sm:mx-0 sm:w-auto sm:px-14">
        {/* Faculty logo */}
        <FocLogo size={52} className="size-13" priority />

        {/* Wordmark */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-medium tracking-[0.32em] text-ink">
            VERIS
          </span>
        </div>

        <Loader2 className="h-7 w-7 animate-spin text-primary" strokeWidth={1.6} />

        <div className="flex flex-col items-center gap-3">
          <p className="text-center text-sm text-ink-muted">{message}</p>
          {showDelayMessage && showDelayed && (
            <p className="veris-eyebrow animate-fade-in text-center text-ink-muted">
              Still working — hang tight
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

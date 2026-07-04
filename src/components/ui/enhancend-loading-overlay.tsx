import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface AuthLoadingOverlayProps {
  loading: boolean;
  message: string;
  className?: string;
}

export function AuthLoadingOverlay({
  loading,
  message,
  className,
}: AuthLoadingOverlayProps) {
  const [showDelayedMessage, setShowDelayedMessage] = useState(false);

  useEffect(() => {
    // After 3 seconds, show an additional message for slow connections
    const timer = setTimeout(() => {
      if (loading) {
        setShowDelayedMessage(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading]);

  if (!loading) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-[9999]", // Higher z-index
        className
      )}
      // Prevent any accidental clicks from dismissing the overlay
      onClick={(e) => e.preventDefault()}
    >
      <div className="mx-4 flex max-w-md flex-col items-center rounded-[4px] border border-rule bg-card p-8">
        <Loader2 className="mb-5 h-10 w-10 animate-spin text-primary" strokeWidth={1.6} />
        <p className="text-center text-base font-medium text-foreground">
          {message}
        </p>

        {showDelayedMessage && (
          <p className="mt-4 text-center text-sm text-ink-muted">
            This is taking longer than expected. Please wait…
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}

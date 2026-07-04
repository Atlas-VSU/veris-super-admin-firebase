import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  loading,
  message = "Please wait...",
  className,
}: LoadingOverlayProps) {
  if (!loading) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex flex-col items-center justify-center rounded-[4px] bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.6} />
      <p className="mt-3 text-sm text-ink-muted">{message}</p>
    </div>
  );
}

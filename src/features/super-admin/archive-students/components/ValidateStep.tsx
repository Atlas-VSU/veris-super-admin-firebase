import { AlertTriangle, ChevronRight, Loader2, RotateCcw } from "lucide-react";
import { ValidationSummary } from "../types";
import { StatCard } from "./StatCard";
import { Button } from "@/components/ui/button";

export default function ValidateStep({
  fileName,
  summary,
  isLoadingPreview,
  onProceed,
  onReset,
}: {
  fileName:         string;
  summary:          ValidationSummary;
  isLoadingPreview: boolean;
  onProceed:        () => void;
  onReset:          () => void;
}) {
  const hasValid = summary.valid > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Validation Summary</h2>
        <p className="text-sm text-slate-500">
          Parsed from <strong className="text-slate-700">{fileName}</strong>. Review the results
          before proceeding.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Rows"      value={summary.total}      accent="slate" />
        <StatCard label="Valid IDs"        value={summary.valid}      accent="green" />
        <StatCard label="Duplicates"       value={summary.duplicates} accent="amber" />
        <StatCard label="Invalid / Skipped" value={summary.invalid}   accent="red"   />
      </div>

      {/* Row breakdown — show up to 20 invalid/duplicate rows */}
      {(summary.invalid > 0 || summary.duplicates > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
            <AlertTriangle className="size-3.5" /> Skipped rows
          </p>
          <div className="max-h-36 overflow-y-auto space-y-1">
            {summary.rows
              .filter((r) => !r.valid)
              .slice(0, 50)
              .map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-amber-800">{r.raw || "(empty)"}</span>
                  <span className="text-amber-600 text-[10px]">{r.reason}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {!hasValid && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
          No valid student IDs were found in this file. Please upload a different file.
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="border-slate-200 text-slate-600 gap-1"
        >
          <RotateCcw className="size-3.5" /> Upload different file
        </Button>
        <Button
          onClick={onProceed}
          disabled={!hasValid || isLoadingPreview}
          className="gap-2"
        >
          {isLoadingPreview ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Fetching preview…
            </>
          ) : (
            <>
              Proceed to Preview <ChevronRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
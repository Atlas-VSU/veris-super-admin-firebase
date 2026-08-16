import { AlertTriangle, ShieldAlert } from "lucide-react";
import { DryRunPreview } from "../types";
import { StatCard } from "./StatCard";
import { Button } from "@/components/ui/button";

export default function PreviewStep({
  preview,
  onConfirm,
  onBack,
}: {
  preview:   DryRunPreview;
  onConfirm: () => void;
  onBack:    () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Dry Run Preview</h2>
        <p className="text-sm text-slate-500">
          No changes have been made yet. Review the summary below before confirming.
        </p>
      </div>

      {/* Active term banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-1">
          Active Academic Term
        </p>
        <p className="text-sm font-bold text-blue-800">
          {preview.activeTerm.AY} &mdash;{" "}
          {preview.activeTerm.semester === "1st" ? "First" : "Second"} Semester
        </p>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Students Uploaded"     value={preview.studentsUploaded}     accent="slate" />
        <StatCard label="Users to Archive"       value={preview.usersToArchive}       accent="blue"  />
        <StatCard label="Already Archived"       value={preview.usersAlreadyArchived} accent="slate" />
        <StatCard label="Matching Fee Records"   value={preview.matchingFees}         accent="amber" />
        <StatCard label="Matching Fine Records"  value={preview.matchingFines}        accent="amber" />
        <StatCard label="Matching Clearance"     value={preview.matchingClearance}    accent="amber" />
      </div>

      {preview.missingUserRecords > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1">
            <AlertTriangle className="size-3.5" /> Missing User Records: {preview.missingUserRecords}
          </p>
          <p className="text-[11px] text-amber-600">
            These student IDs were not found in the <code>users</code> collection and will be
            skipped. Fee/Fine/Clearance records with these IDs will still be deleted.
          </p>
          {preview.missingUserIds.length > 0 && (
            <div className="mt-2 font-mono text-[11px] text-amber-700 max-h-20 overflow-y-auto space-y-0.5">
              {preview.missingUserIds.map((id) => (
                <div key={id}>{id}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="border-slate-200 text-slate-600"
        >
          Back
        </Button>
        <Button
          onClick={onConfirm}
          variant="destructive" className="gap-2"
        >
          <ShieldAlert className="size-4" /> Confirm Archive
        </Button>
      </div>
    </div>
  );
}
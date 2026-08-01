"use client";

import { useRef } from "react";
import {
  Archive,
  Upload,
  CheckCircle2,
  Eye,
  ShieldAlert,
  Zap,
  ClipboardList,
  FileText,
  AlertTriangle,
  Copy,
  Download,
  RotateCcw,
  Loader2,
  ChevronRight,
  Users,
  Trash2,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

import {
  useArchiveStudents,
  type ValidationSummary,
  type DryRunPreview,
  type ExecutionLog,
} from "../hooks/useArchiveStudents";

// ── Step indicator labels ─────────────────────────────────────────────────────
const STEPS = [
  { key: "upload",   label: "Upload",   icon: Upload },
  { key: "validate", label: "Validate", icon: CheckCircle2 },
  { key: "preview",  label: "Preview",  icon: Eye },
  { key: "execute",  label: "Execute",  icon: Zap },
  { key: "complete", label: "Complete", icon: ClipboardList },
] as const;

type StepKey = typeof STEPS[number]["key"];

const STEP_ORDER: StepKey[] = ["upload", "validate", "preview", "execute", "complete"];

function getStepIndex(key: StepKey): number {
  return STEP_ORDER.indexOf(key);
}

// ── Step Progress Bar ─────────────────────────────────────────────────────────
function StepBar({ current }: { current: StepKey }) {
  const currentIdx = getStepIndex(current);
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const done   = idx < currentIdx;
        const active = idx === currentIdx;
        const Icon   = step.icon;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "flex size-8 items-center justify-center rounded-full border-2 transition-all",
                  done   ? "border-blue-600 bg-blue-600 text-white" : "",
                  active ? "border-blue-600 bg-white text-blue-600 shadow-sm" : "",
                  !done && !active ? "border-slate-200 bg-white text-slate-400" : "",
                ].join(" ")}
              >
                {done ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              <span
                className={[
                  "hidden sm:block text-[10px] font-medium whitespace-nowrap",
                  active ? "text-blue-600" : done ? "text-blue-500" : "text-slate-400",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className={[
                  "flex-1 h-0.5 mx-1 sm:mx-2 transition-colors",
                  idx < currentIdx ? "bg-blue-500" : "bg-slate-200",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  accent = "slate",
}: {
  label:  string;
  value:  number | string;
  accent?: "slate" | "blue" | "green" | "amber" | "red";
}) {
  const accents = {
    slate: "bg-slate-50 border-slate-200 text-slate-700",
    blue:  "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    red:   "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <div className={`rounded-lg border px-4 py-3 ${accents[accent]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
    </div>
  );
}

// ── Step 1: Upload ─────────────────────────────────────────────────────────────
function UploadStep({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Upload Student IDs</h2>
        <p className="text-sm text-slate-500">
          Upload a CSV or XLSX file containing a list of graduated student IDs that were
          mistakenly included in the active semester generation.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/40 px-6 py-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-blue-100">
          <Upload className="size-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Drop your file here, or{" "}
            <span className="text-blue-600 underline underline-offset-2">click to browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Supports .csv and .xlsx files</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {/* Format hint */}
      <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
        <Info className="size-3.5 shrink-0 mt-0.5 text-slate-400" />
        <div>
          <strong>Expected format:</strong> One student ID per row (or per cell), in{" "}
          <code className="bg-white border border-slate-200 px-1 rounded font-mono text-[11px]">YY-S-NNNNN</code> format.
          Plain 8-digit numbers are also accepted and will be auto-formatted.
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Validate ──────────────────────────────────────────────────────────
function ValidateStep({
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
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
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

// ── Step 3: Preview (Dry Run) ─────────────────────────────────────────────────
function PreviewStep({
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
          className="bg-red-600 hover:bg-red-700 text-white gap-2"
        >
          <ShieldAlert className="size-4" /> Confirm Archive
        </Button>
      </div>
    </div>
  );
}

// ── Step 5: Execute (in-progress) ─────────────────────────────────────────────
function ExecuteStep() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <div className="flex size-16 items-center justify-center rounded-full bg-blue-100">
        <Loader2 className="size-8 text-blue-600 animate-spin" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-base font-semibold text-slate-800">Executing Archive Operation</h2>
        <p className="text-sm text-slate-500">
          Archiving student accounts and permanently deleting generated records.
          Please do not close this page.
        </p>
      </div>
      <div className="w-full max-w-sm">
        <Progress value={undefined} className="h-2 animate-pulse" />
      </div>
    </div>
  );
}

// ── Step 6: Complete ──────────────────────────────────────────────────────────
function CompleteStep({
  log,
  onCopy,
  onDownload,
  onReset,
}: {
  log:        ExecutionLog;
  onCopy:     () => void;
  onDownload: () => void;
  onReset:    () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Success header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800">Execution Completed</h2>
          <p className="text-xs text-slate-500">
            {new Date(log.completedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Active term */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-1">
          Academic Term
        </p>
        <p className="text-sm font-bold text-blue-800">
          {log.activeTerm.AY} &mdash;{" "}
          {log.activeTerm.semester === "1st" ? "First" : "Second"} Semester
        </p>
      </div>

      {/* Result grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Students Uploaded"     value={log.studentsUploaded}     accent="slate" />
        <StatCard label="Users Archived"         value={log.usersArchived}         accent="blue"  />
        <StatCard label="Already Archived"       value={log.usersAlreadyArchived} accent="slate" />
        <StatCard label="Fees Deleted"           value={log.feesDeleted}           accent="green" />
        <StatCard label="Fines Deleted"          value={log.finesDeleted}          accent="green" />
        <StatCard label="Clearance Deleted"      value={log.clearanceDeleted}      accent="green" />
      </div>

      {log.missingUserRecords > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
            <AlertTriangle className="size-3.5" /> Missing User Records: {log.missingUserRecords}
          </p>
          {log.missingUserIds.length > 0 && (
            <div className="mt-1 font-mono text-[11px] text-amber-700 max-h-20 overflow-y-auto space-y-0.5">
              {log.missingUserIds.map((id) => (
                <div key={id}>{id}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="border-slate-200 text-slate-600 gap-1.5"
          >
            <Copy className="size-3.5" /> Copy Log
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="border-slate-200 text-slate-600 gap-1.5"
          >
            <Download className="size-3.5" /> Download Log
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="border-slate-200 text-slate-600 gap-1.5"
        >
          <RotateCcw className="size-3.5" /> Start New Archive
        </Button>
      </div>
    </div>
  );
}

// ── Confirmation Modal ────────────────────────────────────────────────────────
function ConfirmModal({
  open,
  preview,
  onOpenChange,
  onConfirm,
}: {
  open:         boolean;
  preview:      DryRunPreview | null;
  onOpenChange: (v: boolean) => void;
  onConfirm:    () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px] bg-white border border-slate-200">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-700">
            <ShieldAlert className="size-5" /> Confirm Archive Operation
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-slate-600 space-y-3">
              {preview && (
                <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div>
                    <span className="text-slate-400">Academic Year</span>
                    <p className="font-semibold text-slate-700">{preview.activeTerm.AY}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Semester</span>
                    <p className="font-semibold text-slate-700">
                      {preview.activeTerm.semester === "1st" ? "First" : "Second"} Semester
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Users to Archive</span>
                    <p className="font-semibold text-slate-700 flex items-center gap-1">
                      <Users className="size-3 text-blue-500" /> {preview.usersToArchive}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Records to Delete</span>
                    <p className="font-semibold text-slate-700 flex items-center gap-1">
                      <Trash2 className="size-3 text-red-500" />{" "}
                      {preview.matchingFees + preview.matchingFines + preview.matchingClearance}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                <strong>Warning:</strong> This operation will archive the uploaded student accounts
                by setting <code>isDeleted = true</code> and permanently delete all generated Fees,
                Fines, and Clearance Status records for the current active Academic Year and
                Semester. <strong>This action cannot be undone.</strong>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-slate-200 text-slate-600">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ArchiveStudentsPage() {
  const {
    step,
    fileName,
    validation,
    preview,
    executionLog,
    confirmOpen,
    isLoadingPreview,
    isExecuting,
    setConfirmOpen,
    handleFileSelected,
    handleProceedToPreview,
    handleConfirm,
    handleExecute,
    handleReset,
    handleCopyLog,
    handleDownloadLog,
  } = useArchiveStudents();

  // Map internal step key to the progress bar key
  const barStep = step === "confirm" ? "preview" : step;

  return (
    <div className="space-y-6 animate-page-enter">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Archive className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Archive Student Records</h1>
        </div>
        <p className="text-sm text-slate-500">
          Maintenance tool to archive graduated students and permanently remove erroneous
          Fees, Fines, and Clearance Status records for the active Academic Year and Semester.
        </p>
      </div>

      {/* ── Step Progress Bar ────────────────────────────────────────────── */}
      <StepBar current={barStep as StepKey} />

      {/* ── Step Content Card ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-blue-100 bg-white shadow-sm">
        <div className="px-6 py-6">
          {step === "upload" && (
            <UploadStep onFile={handleFileSelected} />
          )}

          {step === "validate" && validation && (
            <ValidateStep
              fileName={fileName}
              summary={validation}
              isLoadingPreview={isLoadingPreview}
              onProceed={handleProceedToPreview}
              onReset={handleReset}
            />
          )}

          {(step === "preview" || step === "confirm") && preview && (
            <PreviewStep
              preview={preview}
              onConfirm={handleConfirm}
              onBack={() => {
                // Go back to validate step
                handleReset();
              }}
            />
          )}

          {step === "execute" && <ExecuteStep />}

          {step === "complete" && executionLog && (
            <CompleteStep
              log={executionLog}
              onCopy={handleCopyLog}
              onDownload={handleDownloadLog}
              onReset={handleReset}
            />
          )}
        </div>
      </div>

      {/* ── Info footer ─────────────────────────────────────────────────── */}
      {(step === "upload" || step === "validate") && (
        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <FileText className="size-3.5 shrink-0 mt-0.5" />
          <p>
            This tool operates on the <strong>currently active</strong> Academic Year and Semester.
            To target a different term, update the active term in{" "}
            <strong>Terms Management</strong> first.
          </p>
        </div>
      )}

      {/* ── Confirmation Modal ───────────────────────────────────────────── */}
      <ConfirmModal
        open={confirmOpen}
        preview={preview}
        onOpenChange={setConfirmOpen}
        onConfirm={handleExecute}
      />
    </div>
  );
}

"use client";
import {
  Archive,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/features/super-admin/shared/components/PageHeader";

import {
  useArchiveStudents,
} from "../hooks/useArchiveStudents";
import { StepBar } from "./StepBar";
import { StepKey } from "../types";
import UploadStep from "./UploadStep";
import ValidateStep from "./ValidateStep";
import PreviewStep from "./PreviewStep";
import ExecuteStep from "./ExecuteStep";
import CompleteStep from "./CompleteStep";
import ConfirmModal from "./ConfirmModal";


export default function ArchiveStudentsPage() {
  const {
    step,
    fileName,
    validation,
    preview,
    executionLog,
    confirmOpen,
    isLoadingPreview,
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
    <div className="animate-page-enter flex flex-col">
      <PageHeader
        title="ARCHIVE STUDENT RECORDS"
        description="End-of-semester tool to revoke system access for students who are no longer enrolled the current semester."
      />

      <div className="mx-auto max-w-7xl w-full px-5 sm:px-6 xl:px-8 py-8 space-y-6">
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
    </div>
  );
}

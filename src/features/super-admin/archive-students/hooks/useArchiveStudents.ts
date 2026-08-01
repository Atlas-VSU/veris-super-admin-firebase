"use client";

/**
 * useArchiveStudents
 *
 * Manages the entire state machine for the "Archive Student Records" page.
 *
 * Steps:
 *   1  UPLOAD      — user selects a CSV or XLSX file
 *   2  VALIDATE    — file is parsed, IDs are validated and summarised
 *   3  PREVIEW     — dry-run API call; displays what would be changed
 *   4  CONFIRM     — confirmation modal; user reads the warning
 *   5  EXECUTE     — execute API call with live progress
 *   6  COMPLETE    — final log display + copy/download actions
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ArchiveStep, ParsedStudent, ValidationSummary, DryRunPreview, ExecutionLog } from "../types";
import { parseFile } from "../utils/parseFile";
import { validateId } from "../utils/validateId";
import { normaliseId } from "../utils/normaliseId";


// ── Hook ──────────────────────────────────────────────────────────────────────

export function useArchiveStudents() {
  const [step, setStep]                           = useState<ArchiveStep>("upload");
  const [fileName, setFileName]                   = useState<string>("");
  const [validation, setValidation]               = useState<ValidationSummary | null>(null);
  const [preview, setPreview]                     = useState<DryRunPreview | null>(null);
  const [executionLog, setExecutionLog]           = useState<ExecutionLog | null>(null);
  const [confirmOpen, setConfirmOpen]             = useState(false);
  const [isLoadingPreview, setIsLoadingPreview]   = useState(false);
  const [isExecuting, setIsExecuting]             = useState(false);

  // ── Step 1 → 2: Parse & validate uploaded file ───────────────────────────
  const handleFileSelected = useCallback(async (file: File) => {
    setFileName(file.name);

    let rawValues: string[] = [];
    try {
      rawValues = await parseFile(file);
    } catch (err: any) {
      toast.error("Failed to parse file", { description: err?.message });
      return;
    }

    // Filter empties from parsing
    const nonEmpty = rawValues.filter((v) => v.trim() !== "");

    // Detect duplicates before validation
    const seen = new Set<string>();
    const rows: ParsedStudent[] = [];

    for (const raw of nonEmpty) {
      const { valid, reason } = validateId(raw);
      const normalised = valid ? normaliseId(raw) : raw.trim();

      if (valid && seen.has(normalised)) {
        rows.push({ raw, valid: false, reason: "Duplicate" });
      } else {
        if (valid) seen.add(normalised);
        rows.push({ raw, valid, reason });
      }
    }

    const validIds   = rows
      .filter((r) => r.valid)
      .map((r) => normaliseId(r.raw));
    const duplicates = rows.filter((r) => r.reason === "Duplicate").length;
    const invalid    = rows.filter((r) => !r.valid && r.reason !== "Duplicate").length;

    const summary: ValidationSummary = {
      total:      rows.length,
      valid:      validIds.length,
      duplicates,
      invalid,
      validIds,
      rows,
    };

    setValidation(summary);
    setStep("validate");
  }, []);

  // ── Step 2 → 3: Dry-run preview ──────────────────────────────────────────
  const handleProceedToPreview = useCallback(async () => {
    if (!validation || validation.validIds.length === 0) return;

    setIsLoadingPreview(true);
    try {
      const res = await fetch("/api/archive-students", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ studentIds: validation.validIds, dryRun: true }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setPreview(data);
      setStep("preview");
    } catch (err: any) {
      toast.error("Dry-run preview failed", { description: err?.message });
    } finally {
      setIsLoadingPreview(false);
    }
  }, [validation]);

  // ── Step 3 → 4: Open confirmation modal ──────────────────────────────────
  const handleConfirm = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  // ── Step 4 → 5 → 6: Execute ──────────────────────────────────────────────
  const handleExecute = useCallback(async () => {
    if (!validation) return;

    setConfirmOpen(false);
    setStep("execute");
    setIsExecuting(true);

    try {
      const res = await fetch("/api/archive-students", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ studentIds: validation.validIds, dryRun: false }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data: ExecutionLog = await res.json();
      setExecutionLog(data);
      setStep("complete");
      toast.success("Archiving completed successfully!");
    } catch (err: any) {
      toast.error("Execution failed", { description: err?.message });
      // Stay on execute step so user can see the error state
    } finally {
      setIsExecuting(false);
    }
  }, [validation]);

  // ── Reset (start over) ────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setStep("upload");
    setFileName("");
    setValidation(null);
    setPreview(null);
    setExecutionLog(null);
    setConfirmOpen(false);
    setIsLoadingPreview(false);
    setIsExecuting(false);
  }, []);

  // ── Download/copy log ─────────────────────────────────────────────────────
  const buildLogText = useCallback((log: ExecutionLog): string => {
    const lines = [
      "VERIS — Archive Student Records — Execution Log",
      "═══════════════════════════════════════════════",
      "",
      `Completed At:              ${new Date(log.completedAt).toLocaleString()}`,
      `Active Academic Year:      ${log.activeTerm.AY}`,
      `Active Semester:           ${log.activeTerm.semester}`,
      "",
      `Students Uploaded:         ${log.studentsUploaded}`,
      `Users Archived:            ${log.usersArchived}`,
      `Users Already Archived:    ${log.usersAlreadyArchived}`,
      `Missing User Records:      ${log.missingUserRecords}`,
      "",
      `Fees Deleted:              ${log.feesDeleted}`,
      `Fines Deleted:             ${log.finesDeleted}`,
      `Clearance Status Deleted:  ${log.clearanceDeleted}`,
      "",
      "Execution completed successfully.",
    ];

    if (log.missingUserIds.length > 0) {
      lines.push("", "Missing User IDs:", ...log.missingUserIds.map((id) => `  - ${id}`));
    }

    return lines.join("\n");
  }, []);

  const handleCopyLog = useCallback(async () => {
    if (!executionLog) return;
    try {
      await navigator.clipboard.writeText(buildLogText(executionLog));
      toast.success("Log copied to clipboard!");
    } catch {
      toast.error("Failed to copy log to clipboard.");
    }
  }, [executionLog, buildLogText]);

  const handleDownloadLog = useCallback(() => {
    if (!executionLog) return;
    const text     = buildLogText(executionLog);
    const blob     = new Blob([text], { type: "text/plain" });
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement("a");
    a.href         = url;
    a.download     = `archive-log-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [executionLog, buildLogText]);

  return {
    // State
    step,
    fileName,
    validation,
    preview,
    executionLog,
    confirmOpen,
    isLoadingPreview,
    isExecuting,

    // Actions
    setConfirmOpen,
    handleFileSelected,
    handleProceedToPreview,
    handleConfirm,
    handleExecute,
    handleReset,
    handleCopyLog,
    handleDownloadLog,
  };
}

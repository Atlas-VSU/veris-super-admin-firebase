"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BaseModal } from "@/components/features/shared/BaseModal";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, RefreshCw, AlertTriangle } from "lucide-react";
import type { Term } from "../../types";
import type { CreateNewTermDialogProps } from "../types/dialogs.types";

// ── AY generation helper ──────────────────────────────────────────────────────
const currentYear = new Date().getFullYear();
const AY_OPTIONS: string[] = Array.from({ length: 6 }, (_, i) => {
  const start = currentYear - 1 + i;
  return `${start}-${start + 1}`;
});

const SEMESTER_OPTIONS = [
  { value: "1st", label: "1st Semester" },
  { value: "2nd", label: "2nd Semester" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function CreateNewTermDialog({
  open,
  onOpenChange,
  onSubmit,
  existingTerms = [],
}: CreateNewTermDialogProps) {
  const [ay, setAy] = useState<string>(AY_OPTIONS[1]);
  const [semester, setSemester] = useState<string>("1st");
  const [setActive, setSetActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isDuplicate = existingTerms.some(
    (t) => t.AY === ay && t.semester === semester
  );

  const hasActiveTerm = existingTerms.some((t) => t.isActive);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDuplicate) {
      toast.error(`Term ${ay} — ${semester} Semester already exists.`, {
        description: "Please choose a different Academic Year or Semester.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          AY: ay,
          semester,
          isActive: setActive,
          isDeleted: false,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        setActive
      );

      // Reset form
      setAy(AY_OPTIONS[1]);
      setSemester("1st");
      setSetActive(false);

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!isSubmitting) {
      if (!val) {
        // Reset on close
        setAy(AY_OPTIONS[1]);
        setSemester("1st");
        setSetActive(false);
      }
      onOpenChange(val);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={handleOpenChange}
      asForm={true}
      onSubmit={handleSubmit}
      title="Create New Term"
      description="Add a new academic term to the VERIS platform. You may optionally set it as the current active term right away."
      className="sm:max-w-[440px] bg-white border border-blue-100 rounded-lg"
      footer={
        <div className="flex justify-end gap-2 sm:gap-0 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="border-slate-200 text-slate-600 h-9 mr-2"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-9"
            disabled={isSubmitting || isDuplicate}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating...
              </>
            ) : (
              "Create Term"
            )}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 py-4 text-xs">
        {/* ── Academic Year ─────────────────────────────────────────── */}
        <div className="grid gap-2">
          <Label
            htmlFor="term-ay"
            className="text-xs font-semibold text-slate-600 uppercase"
          >
            Academic Year
          </Label>
          <Select value={ay} onValueChange={setAy}>
            <SelectTrigger id="term-ay" className="border-blue-100">
              <SelectValue placeholder="Select Academic Year" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              {AY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Semester ──────────────────────────────────────────────── */}
        <div className="grid gap-2">
          <Label
            htmlFor="term-semester"
            className="text-xs font-semibold text-slate-600 uppercase"
          >
            Semester
          </Label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger id="term-semester" className="border-blue-100 w-full">
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              {SEMESTER_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Duplicate warning ─────────────────────────────────────── */}
        {isDuplicate && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              A term for <strong>{ay}</strong> —{" "}
              <strong>{semester} Semester</strong> already exists. Please
              choose a different combination.
            </span>
          </div>
        )}

        {/* ── Divider ───────────────────────────────────────────────── */}
        <div className="border-t border-slate-100" />

        {/* ── Set Active checkbox ───────────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-md border border-blue-100 bg-blue-50/60 px-3 py-3">
          <Checkbox
            id="term-set-active"
            checked={setActive}
            onCheckedChange={(checked) => setSetActive(Boolean(checked))}
            className="mt-0.5 border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <div className="grid gap-0.5">
            <Label
              htmlFor="term-set-active"
              className="cursor-pointer text-xs font-semibold text-slate-700"
            >
              Set as Active Term
            </Label>
            <p className="text-[11px] leading-relaxed text-slate-500">
              {hasActiveTerm
                ? "Checking this will deactivate the current active term and set this new term as active immediately."
                : "Checking this will mark this term as the currently active term upon creation."}
            </p>
          </div>
        </div>

        {/* ── Preview card ──────────────────────────────────────────── */}
        <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Term Preview
          </p>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">
              {ay} &mdash;{" "}
              {SEMESTER_OPTIONS.find((s) => s.value === semester)?.label ??
                semester}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${setActive
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
                }`}
            >
              {setActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

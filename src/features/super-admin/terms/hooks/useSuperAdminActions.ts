"use client";

import { toast } from "sonner";
import { Term } from "@/features/super-admin/types";
import {
  addTerm,
  setActiveTerm,
  checkForDuplicateTerms,
} from "@/firebase/term";

interface Options {
  /** Optional callback invoked after a successful write so callers can refresh local state. */
  onTermsChanged?: () => void | Promise<void>;
}

export default function useSuperAdminActions({ onTermsChanged }: Options = {}) {

  // ── Set an existing term as the active term ───────────────────────────────
  const onSetNewActiveTerm = async (AY: string, semester: string) => {
    const toastId = toast.loading(`Setting ${AY} — ${semester} Semester as active…`);
    try {
      const result = await setActiveTerm(AY, semester);

      if (result === "not_found") {
        toast.error("Term not found", {
          id: toastId,
          description: `${AY} — ${semester} Semester does not exist yet. Please add it first before setting it as active.`,
        });
        return;
      }

      if (result === "already_active") {
        toast.info("Already active", {
          id: toastId,
          description: `${AY} — ${semester} Semester is already the active term.`,
        });
        return;
      }

      // result === "ok"
      toast.success("Active term updated", {
        id: toastId,
        description: `${AY} — ${semester} Semester is now the active term.`,
      });

      await onTermsChanged?.();
    } catch (error) {
      toast.error("Failed to update active term", {
        id: toastId,
        description: "An unexpected error occurred. Please try again.",
      });
      console.error("[onSetNewActiveTerm]", error);
    }
  };

  // ── Add a brand-new term ──────────────────────────────────────────────────
  const onAddTerm = async (term: Term, setActive?: boolean) => {
    const { AY, semester } = term;

    if (!AY?.trim() || !semester?.trim()) {
      toast.error("Invalid term data", {
        description: "Academic Year and Semester are required.",
      });
      return;
    }

    const toastId = toast.loading(`Creating term ${AY} — ${semester} Semester…`);
    try {
      // Guard: prevent duplicates at the hook level (dialog already checks,
      // but this ensures correctness if the hook is called directly)
      const duplicate = await checkForDuplicateTerms(AY, semester);
      if (duplicate) {
        toast.error("Duplicate term", {
          id: toastId,
          description: `${AY} — ${semester} Semester already exists.`,
        });
        return;
      }

      const result = await addTerm(AY, semester, setActive ?? false);
      if (!result) {
        toast.error("Failed to create term", {
          id: toastId,
          description: "Firestore write did not return a document ID.",
        });
        return;
      }

      toast.success("Term created", {
        id: toastId,
        description: setActive
          ? `${AY} — ${semester} Semester has been created and set as the active term.`
          : `${AY} — ${semester} Semester has been added successfully.`,
      });

      await onTermsChanged?.();
    } catch (error) {
      toast.error("Failed to create term", {
        id: toastId,
        description: "An unexpected error occurred. Please try again.",
      });
      console.error("[onAddTerm]", error);
    }
  };

  return {
    onSetNewActiveTerm,
    onAddTerm,
  };
}
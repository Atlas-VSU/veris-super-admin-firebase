import { ConfirmationDialog } from "@/components/features/shared/ConfirmationDialog";
import { DryRunPreview } from "../types";
import { ShieldAlert, Trash2, Users } from "lucide-react";
import React from "react";

export default function ConfirmModal({
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
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="danger"
      title={
        <React.Fragment>
          <ShieldAlert className="size-5" /> Confirm Archive Operation
        </React.Fragment>
      }
      confirmText="Confirm Archive"
      onConfirm={onConfirm}
      warningMessage={
        <React.Fragment>
          <strong>Warning:</strong> This operation will archive the uploaded student accounts
          by setting <code>isDeleted = true</code> and permanently delete all generated Fees,
          Fines, and Clearance Status records for the current active Academic Year and
          Semester. <strong>This action cannot be undone.</strong>
        </React.Fragment>
      }
    >
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
    </ConfirmationDialog>
  );
}
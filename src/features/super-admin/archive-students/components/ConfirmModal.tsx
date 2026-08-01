import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DryRunPreview } from "../types";
import { ShieldAlert, Trash2, Users } from "lucide-react";

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
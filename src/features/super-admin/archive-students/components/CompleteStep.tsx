import { CheckCircle2, AlertTriangle, RotateCcw, Download, Copy } from "lucide-react";
import { ExecutionLog } from "../types";
import { Button } from "@/components/ui/button";
import { StatCard } from "./StatCard";


export default function CompleteStep({
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
import { Info, Upload } from "lucide-react";
import { useRef } from "react";

export default function UploadStep({ onFile }: { onFile: (file: File) => void }) {
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
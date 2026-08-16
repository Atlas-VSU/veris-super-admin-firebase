import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

export function ImageUploadField({
  id,
  label,
  file,
  preview,
  onChange,
  onClear,
  icon,
  required = false,
}: {
  id: string;
  label: string;
  file: File | null;
  preview: string | null;
  onChange: (file: File | null) => void;
  onClear: () => void;
  icon?: React.ReactNode;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase">
        {label} {required ? "" : <span className="normal-case text-slate-400">(optional)</span>}
      </Label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      {preview ? (
        <div className="flex items-center gap-3">
          <img
            src={preview}
            alt={`${label} preview`}
            className="h-14 w-14 rounded-md object-cover border border-blue-100"
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 truncate max-w-[180px]">
              {file ? file.name : "Current image"}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs border-slate-200"
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs border-slate-200 text-red-500"
                onClick={onClear}
              >
                <X className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="border-dashed border-blue-200 text-slate-500 h-16 flex flex-col gap-1"
          onClick={() => inputRef.current?.click()}
        >
          {icon ?? <Upload className="h-4 w-4" />}
          <span className="text-xs">Click to upload {label.toLowerCase()}</span>
        </Button>
      )}
    </div>
  );
}

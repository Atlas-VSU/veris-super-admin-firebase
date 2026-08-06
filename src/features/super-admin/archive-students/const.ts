import { CheckCircle2, Upload, Eye, Zap, ClipboardList, ListChecks } from "lucide-react";

export const STEPS = [
  { key: "upload",   label: "Upload",   icon: Upload },
  { key: "validate", label: "Validate", icon: ListChecks },
  { key: "preview",  label: "Preview",  icon: Eye },
  { key: "execute",  label: "Execute",  icon: Zap },
  { key: "complete", label: "Complete", icon: ClipboardList },
] as const;

export const STUDENT_ID_RE = /^\d{2}-\d{1}-\d{5}$/;


import { STUDENT_ID_RE } from "../const";

export function validateId(raw: string): { valid: boolean; reason?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, reason: "Empty row" };
  if (STUDENT_ID_RE.test(trimmed)) return { valid: true };
  // Allow raw 8-digit numbers — format them
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 8) return { valid: true };
  return { valid: false, reason: `Invalid format: "${trimmed}"` };
}
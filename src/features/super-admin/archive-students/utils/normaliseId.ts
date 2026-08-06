export function normaliseId(raw: string): string {
  const digits = raw.trim().replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}-${digits[2]}-${digits.slice(3)}`;
  }
  return raw.trim();
}
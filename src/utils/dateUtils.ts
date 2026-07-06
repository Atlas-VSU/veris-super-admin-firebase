/**
 * Converts a date-like value (string, Date, Firestore Timestamp, or Timestamp-like object)
 * to an ISO string representation, or null if invalid.
 */
export function toISOString(value: any): string | null {
  if (!value) return null;
  // Handle Firestore Timestamp (both client and admin SDK structures)
  if (value && typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value && typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

/**
 * Server-side validation of the `/api/roster-sync` POST envelope.
 *
 * Re-validates every row — the client already validates before submission, but
 * the endpoint must never trust that: a request could be sent directly,
 * bypassing the UI entirely. The array-level checks (shape, size, per-row
 * validity, duplicate studentIds) are delegated to `validateRosterRows`; this
 * module owns only the envelope around them.
 *
 * Pure and Firestore-free, like the other validators here, so the request
 * contract can be unit tested without a database.
 */

import { MAX_ROSTER_ROWS, STUDENT_ID_RE } from "../const";
import { normaliseStudentId } from "./normaliseStudentId";
import { validateRosterRows } from "./validateRosterRows";
import type { RawRosterRow, RosterRow } from "../types";

export interface RosterSyncRequestBody {
  students:           RawRosterRow[];
  dryRun:             boolean;
  excludedStudentIds: string[];
  /** Create, update and transfer only — no student is ever deactivated and no
   *  record is archived. Lets an incomplete roster be applied safely. */
  additiveOnly:       boolean;
  /** Explicit acknowledgement required when the deactivation share exceeds
   *  MAX_DEACTIVATION_RATIO — the signature of a partial roster upload. */
  acknowledgeMassDeactivation: boolean;
}

/** The request as this endpoint will act on it: rows validated, studentIds
 *  normalised, optional flags resolved to concrete booleans. */
export interface ValidatedSyncRequest {
  rows:               RosterRow[];
  dryRun:             boolean;
  excludedStudentIds: string[];
  additiveOnly:       boolean;
  acknowledgeMassDeactivation: boolean;
}

export type SyncRequestValidation =
  | ({ ok: true } & ValidatedSyncRequest)
  | { ok: false; status: number; error: string; details?: string[] };

export function validateSyncRequest(body: unknown): SyncRequestValidation {
  if (typeof body !== "object" || body === null) {
    return { ok: false, status: 400, error: "Request body must be a JSON object." };
  }

  const { students, dryRun, excludedStudentIds, additiveOnly, acknowledgeMassDeactivation } =
    body as Partial<RosterSyncRequestBody>;

  if (typeof dryRun !== "boolean") {
    return { ok: false, status: 400, error: "dryRun must be a boolean." };
  }
  if (additiveOnly !== undefined && typeof additiveOnly !== "boolean") {
    return { ok: false, status: 400, error: "additiveOnly must be a boolean." };
  }
  if (acknowledgeMassDeactivation !== undefined && typeof acknowledgeMassDeactivation !== "boolean") {
    return { ok: false, status: 400, error: "acknowledgeMassDeactivation must be a boolean." };
  }

  // Exemptions decide who is spared deactivation, so they are format-checked
  // like any other studentId — a malformed entry must not quietly widen or
  // narrow the set of students protected from record deletion.
  const excluded: string[] = [];
  if (excludedStudentIds !== undefined) {
    if (!Array.isArray(excludedStudentIds)) {
      return { ok: false, status: 400, error: "excludedStudentIds must be an array." };
    }
    if (excludedStudentIds.length > MAX_ROSTER_ROWS) {
      return { ok: false, status: 400, error: `excludedStudentIds exceeds the maximum of ${MAX_ROSTER_ROWS} entries.` };
    }
    for (const raw of excludedStudentIds) {
      const studentId = normaliseStudentId(String(raw ?? "").trim());
      if (!STUDENT_ID_RE.test(studentId)) {
        return { ok: false, status: 400, error: `Invalid studentId in excludedStudentIds: "${String(raw)}"` };
      }
      excluded.push(studentId);
    }
  }

  const validated = validateRosterRows(students);
  if (!validated.ok) {
    return { ok: false, status: 400, error: validated.error, details: validated.details };
  }

  return {
    ok: true,
    rows: validated.rows,
    dryRun,
    excludedStudentIds: excluded,
    additiveOnly: additiveOnly === true,
    acknowledgeMassDeactivation: acknowledgeMassDeactivation === true,
  };
}

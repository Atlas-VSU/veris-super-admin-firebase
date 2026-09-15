/**
 * Archiving and restoring a student's term records.
 *
 * A student absent from the uploaded roster is soft-deleted, and their Fees,
 * Fines and Clearance Status for the active term are ARCHIVED — hidden, never
 * deleted. Every org-app read already filters on the archive flag, so the
 * effect matches deletion while remaining fully reversible, and the student's
 * financial history survives. A student who reappears gets those same records
 * back.
 *
 * Everything here is scoped to the active term, which is what keeps previous
 * semesters out of it: they fall outside the term filter and are never touched.
 */

import { adminDb } from "@/firebase/firebase-admin.config";
import { FieldValue, type WriteBatch } from "firebase-admin/firestore";
import { FIRESTORE_IN_QUERY_LIMIT } from "../const";

/**
 * Where each collection keeps its archive flag. These are not uniform: the org
 * app reads `isArchived` on fees and clearance but `metadata.isArchived` on
 * fines, so writing the wrong path would leave a record fully visible.
 *
 *   fees            → where("isArchived", "==", false)
 *   clearanceStatus → where("isArchived", "==", false)
 *   fines           → where("metadata.isArchived", "==", false)
 */
const ARCHIVE_FIELD: Record<string, string> = {
  fees:            "isArchived",
  fines:           "metadata.isArchived",
  clearanceStatus: "isArchived",
};

/**
 * Stamped on every record this endpoint archives, and the only marker it will
 * restore. A fee an organization archived deliberately carries a different
 * reason (or none) and is left alone — reviving it would overrule the treasurer
 * who put it away.
 */
const SYNC_ARCHIVE_REASON = "roster-sync: student absent from synchronized roster";

/** Reads a possibly-nested boolean (e.g. "metadata.isArchived") off a document. */
function readFlag(data: FirebaseFirestore.DocumentData, path: string): boolean {
  return path
    .split(".")
    .reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], data) === true;
}

/**
 * Finds every document in `collectionName` (fees/fines/clearanceStatus)
 * belonging to one of `studentIds` for the given Academic Year + Semester.
 *
 * Scoped to the active term only — records from previous semesters are never
 * matched and so are never touched, whatever happens to the student.
 *
 * Records already archived are excluded, so counts reflect real work and a
 * re-run of the same roster reports zero rather than re-archiving.
 */
export async function fetchMatchingTermRecordIds(
  collectionName: string,
  studentIds: string[],
  AY: string,
  semester: string
): Promise<string[]> {
  if (studentIds.length === 0) return [];
  const archiveField = ARCHIVE_FIELD[collectionName];
  const ids: string[] = [];

  for (let i = 0; i < studentIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunk = studentIds.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
    const snap = await adminDb
      .collection(collectionName)
      .where("studentId", "in", chunk)
      .where("academicYear", "==", AY)
      .where("semester", "==", semester)
      .get();
    // Filtered in memory rather than in the query: adding an inequality on the
    // archive flag would need a new composite index per collection.
    snap.docs.forEach((d) => {
      if (!archiveField || !readFlag(d.data(), archiveField)) ids.push(d.id);
    });
  }

  return ids;
}

/**
 * Finds the records a returning student should get back.
 *
 * The mirror of `fetchMatchingTermRecordIds`: same term scoping, opposite
 * archive state. Two conditions have to hold for a record to be restorable —
 * it is archived, and *this endpoint* is what archived it. Restoring anything
 * else would undo a deliberate decision made in the organization app.
 *
 * Term-scoped like everything else here, which is what keeps a previous
 * semester's fees and fines out of it: a student returning after a year away
 * gets this term's records back, not last year's dues.
 */
export async function fetchRestorableTermRecordIds(
  collectionName: string,
  studentIds: string[],
  AY: string,
  semester: string
): Promise<string[]> {
  if (studentIds.length === 0) return [];
  const archiveField = ARCHIVE_FIELD[collectionName];
  const ids: string[] = [];

  for (let i = 0; i < studentIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunk = studentIds.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
    const snap = await adminDb
      .collection(collectionName)
      .where("studentId", "in", chunk)
      .where("academicYear", "==", AY)
      .where("semester", "==", semester)
      .get();
    snap.docs.forEach((d) => {
      const data = d.data();
      if (!archiveField || !readFlag(data, archiveField)) return;
      if (data.archivedReason !== SYNC_ARCHIVE_REASON) return;
      ids.push(d.id);
    });
  }

  return ids;
}

/** Queues the archive write for one record, honouring that collection's flag path. */
export function queueArchive(batch: WriteBatch, collectionName: string, docId: string, now: Date): void {
  const archiveField = ARCHIVE_FIELD[collectionName];
  const update: Record<string, unknown> = {
    [archiveField]: true,
    archivedAt: now,
    archivedReason: SYNC_ARCHIVE_REASON,
  };
  if (archiveField.startsWith("metadata.")) update["metadata.updatedAt"] = now;
  else update.updatedAt = now;

  batch.update(adminDb.collection(collectionName).doc(docId), update);
}

/** Queues the un-archive write, clearing the markers so the record is
 *  indistinguishable from one that was never archived. */
export function queueRestore(batch: WriteBatch, collectionName: string, docId: string, now: Date): void {
  const archiveField = ARCHIVE_FIELD[collectionName];
  const update: Record<string, unknown> = {
    [archiveField]: false,
    archivedAt: FieldValue.delete(),
    archivedReason: FieldValue.delete(),
  };
  if (archiveField.startsWith("metadata.")) update["metadata.updatedAt"] = now;
  else update.updatedAt = now;

  batch.update(adminDb.collection(collectionName).doc(docId), update);
}

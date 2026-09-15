/**
 * The writes to the `users` collection itself: creating newly appearing
 * students, updating matched ones, and soft-deleting the ones the roster no
 * longer lists.
 */

import { adminDb } from "@/firebase/firebase-admin.config";
import { DERIVED_EMAIL_DOMAIN } from "../const";
import type { CreateOp, DeactivateOp, UpdateOp } from "../utils/diffRoster";
import type { QueuedOp } from "./writeBatches";

const usersCol = () => adminDb.collection("users");

/**
 * Address for a student the roster gives no email for.
 *
 * A student with no address cannot be contacted or later issued a login, so one
 * is always derived. Outside production the domain is deliberately fake, so a
 * test run can never deliver mail to a real student.
 */
export function derivedEmailFor(studentId: string): string {
  return `${studentId}@${DERIVED_EMAIL_DOMAIN}`.toLowerCase();
}

/**
 * Creates one `users` document per newly appearing student.
 *
 * The document ID is the studentId, which is what lets a student be
 * provisioned in the same run that creates them — and what makes a re-run
 * after a partial failure collide harmlessly rather than duplicate.
 */
export function buildStudentCreateOps(toCreate: CreateOp[], now: Date): QueuedOp[] {
  return toCreate.map(
    ({ row }) =>
      (batch) =>
        batch.create(usersCol().doc(row.studentId), {
          studentId: row.studentId,
          firstName: row.firstName,
          lastName: row.lastName,
          yearLevel: row.yearLevel,
          program: row.program,
          faculty: row.faculty,
          programId: row.programId,
          facultyId: row.facultyId,
          // "user" — not "student": every organization member query filters on
          // role === "user", so any other value hides the student entirely.
          role: "user",
          // Same trap as role: the member lists, fine generation, clearance
          // generation and dashboard counts all filter status == "approved",
          // and a document MISSING the field matches no equality filter. Left
          // unset, a created student is invisible to the whole org app.
          // A registrar roster is authoritative, so "approved" is correct here
          // and matches what bulk import writes.
          status: "approved",
          email: row.email || derivedEmailFor(row.studentId),
          isActive: true,
          isDeleted: false,
          metadata: { createdAt: now, updatedAt: now },
        })
  );
}

/**
 * Updates one `users` document per matched student, clearing `isDeleted` so a
 * returning student is reactivated rather than created again.
 *
 * Note the absence of `email` and `status`: an update must never overwrite
 * them. A student who self-registered has a verified address of their own,
 * and clobbering it with one derived from their Student ID would send their
 * login and update links to a mailbox they may not read.
 */
export function buildStudentUpdateOps(toUpdate: UpdateOp[], now: Date): QueuedOp[] {
  return toUpdate.map(
    (update) =>
      (batch) =>
        batch.update(usersCol().doc(update.docId), {
          firstName: update.firstName,
          lastName: update.lastName,
          yearLevel: update.yearLevel,
          program: update.program,
          faculty: update.faculty,
          programId: update.programId,
          facultyId: update.facultyId,
          isDeleted: false,
          "metadata.updatedAt": now,
        })
  );
}

/** Soft-deletes the students the roster no longer lists. */
export function buildStudentDeactivateOps(toDeactivate: DeactivateOp[], now: Date): QueuedOp[] {
  return toDeactivate.map(
    (deactivate) =>
      (batch) =>
        batch.update(usersCol().doc(deactivate.docId), {
          isDeleted: true,
          "metadata.updatedAt": now,
        })
  );
}

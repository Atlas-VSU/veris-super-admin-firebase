/**
 * PROVISIONING NEW STUDENTS
 *
 * A newly created student is given, for each subscribed organization they
 * belong to, the same things the org app gives a self-registration it approves:
 * a clearance record AND that organization's existing fees for the active term.
 *
 * The two must happen together. An earlier revision created clearance alone,
 * which was silently harmful: the org app writes clearance and *immediately*
 * assigns fees, so blockingItems are populated and the status is recalculated.
 * A clearance record with no fees reads as "cleared" while the student owes
 * money — and because the org app's bulk clearance generator skips anyone who
 * already has a record for the term, that empty record permanently prevented
 * the correct one from ever being generated.
 *
 * Fees are never duplicated: a fee is only written when the student does not
 * already hold one for that same fee template, so re-running a roster, or
 * recovering from a partially failed one, cannot charge anybody twice.
 *
 * Only newly CREATED students are provisioned. A transfer moves an existing
 * student between organizations, and what they then owe their new organization
 * — and whether they still owe the old one — is a decision for that
 * organization, not a side effect of a roster upload.
 *
 * This module holds the reads those decisions are made from: what each
 * organization charges, and what each student already holds.
 */

import { adminDb } from "@/firebase/firebase-admin.config";
import { CLEARANCE_READ_CHUNK, FIRESTORE_IN_QUERY_LIMIT } from "../const";
import type { FeeItemRef, FineEventRef } from "../utils/provisionPlan";
import type { ActiveTerm } from "../types";

/** Fee templates per organization for the active term, non-archived only. */
export async function fetchFeeItemsByOrg(
  orgIds: string[],
  term: ActiveTerm
): Promise<Map<string, FeeItemRef[]>> {
  const byOrg = new Map<string, FeeItemRef[]>();

  for (const orgId of orgIds) {
    const snap = await adminDb
      .collection("feeItems")
      .where("orgId", "==", orgId)
      .where("isArchived", "==", false)
      .where("academicYear", "==", term.AY)
      .where("semester", "==", term.semester)
      .get();

    if (snap.empty) continue;

    byOrg.set(
      orgId,
      snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          orgId,
          title: String(d.title ?? ""),
          feeType: String(d.feeType ?? ""),
          amount: Number(d.amount ?? 0),
          description: String(d.description ?? ""),
          eventId: (d.eventId as string) ?? null,
          dueDate: d.dueDate ?? null,
          isRequiredForClearance: d.isRequiredForClearance === true,
          academicYear: String(d.academicYear ?? term.AY),
          semester: String(d.semester ?? term.semester),
        };
      })
    );
  }

  return byOrg;
}

/**
 * The events each organization has already generated fines for, priced from
 * their fine type.
 *
 * Mirrors the org app's `assignExistingFinesToStudent`: a student who joins
 * after generation has run missed those events, and the org app charges them on
 * arrival. Doing the same here keeps a roster-created student consistent with
 * one added through the members page.
 *
 * `requiresTimeOut` doubles the amount, matching how the org app prices an
 * absence from an event that needed both a time-in and a time-out.
 */
export async function fetchFineEventsByOrg(
  orgIds: string[],
  term: ActiveTerm
): Promise<Map<string, FineEventRef[]>> {
  const byOrg = new Map<string, FineEventRef[]>();
  // Fine types are shared across events; resolved once and reused.
  const fineTypeCache = new Map<string, { name: string; amount: number } | null>();

  const resolveFineType = async (fineTypeId: string) => {
    if (fineTypeCache.has(fineTypeId)) return fineTypeCache.get(fineTypeId)!;
    const doc = await adminDb.collection("fineTypes").doc(fineTypeId).get();
    const data = doc.data();
    const resolved = doc.exists
      ? {
          name: String(data?.name ?? ""),
          amount:
            Number(data?.defaultAmount ?? 0) * (data?.requiresTimeOut === true ? 2 : 1),
        }
      : null;
    fineTypeCache.set(fineTypeId, resolved);
    return resolved;
  };

  for (const orgId of orgIds) {
    const snap = await adminDb
      .collection("events")
      .where("orgId", "==", orgId)
      .where("finesGenerated", "==", true)
      .where("isDeleted", "==", false)
      .where("academicYear", "==", term.AY)
      .where("semester", "==", term.semester)
      .get();

    if (snap.empty) continue;

    const events: FineEventRef[] = [];
    for (const doc of snap.docs) {
      const d = doc.data();
      const fineTypeId = String(d.fineTypeId ?? "");
      if (!fineTypeId) continue;

      const fineType = await resolveFineType(fineTypeId);
      // An event whose fine type has been deleted cannot be priced. Skipping is
      // the only safe option — inventing an amount would charge students money
      // nobody set.
      if (!fineType) continue;

      events.push({
        eventId: doc.id,
        orgId,
        eventName: String(d.name ?? "Unknown Event"),
        eventDate: d.date ?? null,
        fineTypeId,
        fineTypeName: fineType.name,
        amount: fineType.amount,
        academicYear: String(d.academicYear ?? term.AY),
        semester: String(d.semester ?? term.semester),
      });
    }

    if (events.length > 0) byOrg.set(orgId, events);
  }

  return byOrg;
}

/**
 * Which events each student has already been fined for, and the parent `fines`
 * document holding them.
 *
 * Fine items live in a subcollection of the parent, so both come from the same
 * read: the parent identifies where new items go, and its existing items say
 * which events to skip.
 */
export async function fetchExistingFineState(
  userIds: string[],
  term: ActiveTerm
): Promise<{
  parentFineIds: Map<string, string>;
  finedEventIds: Map<string, Set<string>>;
}> {
  const parentFineIds = new Map<string, string>();
  const finedEventIds = new Map<string, Set<string>>();
  if (userIds.length === 0) return { parentFineIds, finedEventIds };

  for (let i = 0; i < userIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunk = userIds.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
    const snap = await adminDb
      .collection("fines")
      .where("userId", "in", chunk)
      .where("academicYear", "==", term.AY)
      .get();

    for (const doc of snap.docs) {
      const d = doc.data();
      // The org app writes the semester both bare and suffixed, so both forms
      // have to be accepted or a student gets a second parent document.
      const semester = String(d.semester ?? "");
      if (semester !== term.semester && semester !== `${term.semester} Semester`) continue;

      const userId = String(d.userId ?? "");
      const orgId = String(d.orgId ?? "");
      if (!userId || !orgId) continue;

      parentFineIds.set(`${userId}::${orgId}`, doc.id);

      const itemsSnap = await doc.ref.collection("fineItems").get();
      const seen = finedEventIds.get(userId) ?? new Set<string>();
      itemsSnap.docs.forEach((item) => {
        const eventId = item.data().eventId;
        if (eventId) seen.add(String(eventId));
      });
      finedEventIds.set(userId, seen);
    }
  }

  return { parentFineIds, finedEventIds };
}

/**
 * Which fee templates each student already holds, so none is written twice.
 *
 * Keyed by `userId` rather than `studentId`: a duplicated student would
 * otherwise pool both records' fees together and suppress a legitimate charge.
 */
export async function fetchExistingFeeItemIds(
  userIds: string[],
  term: ActiveTerm
): Promise<Map<string, Set<string>>> {
  const held = new Map<string, Set<string>>();

  for (let i = 0; i < userIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunk = userIds.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
    const snap = await adminDb
      .collection("fees")
      .where("userId", "in", chunk)
      .where("academicYear", "==", term.AY)
      .where("semester", "==", term.semester)
      .get();

    snap.docs.forEach((doc) => {
      const d = doc.data();
      const userId = String(d.userId ?? "");
      const feeItemId = String(d.feeItemId ?? "");
      if (!userId || !feeItemId) return;
      held.set(userId, (held.get(userId) ?? new Set<string>()).add(feeItemId));
    });
  }

  return held;
}

/** Which of the candidate clearance records already exist. */
export async function fetchExistingClearanceIds(ids: string[]): Promise<Set<string>> {
  const existing = new Set<string>();

  for (let i = 0; i < ids.length; i += CLEARANCE_READ_CHUNK) {
    const chunk = ids.slice(i, i + CLEARANCE_READ_CHUNK);
    const snaps = await adminDb.getAll(
      ...chunk.map((id) => adminDb.collection("clearanceStatus").doc(id))
    );
    snaps.forEach((snap) => {
      if (snap.exists) existing.add(snap.id);
    });
  }

  return existing;
}

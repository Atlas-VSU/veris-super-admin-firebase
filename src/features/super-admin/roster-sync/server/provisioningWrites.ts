/**
 * The writes that give a newly created or returning student what the org app
 * would have given them: this term's clearance record, their organization's
 * fees, and fines for events they missed by not being in the system.
 *
 * Clearance and fees are written TOGETHER. A clearance record whose
 * blockingItems were never populated reads as a cleared student who in fact
 * owes money, and it permanently blocks the org app from generating the
 * correct one.
 *
 * Op order matters — it decides which batch each write lands in, and so what a
 * partial failure leaves behind. Within a provision: fines, then fees, then
 * clearance. Across the run: every provision, then the fee-template counters,
 * then the per-organization stats.
 */

import { adminDb } from "@/firebase/firebase-admin.config";
import { FieldValue } from "firebase-admin/firestore";
import { clearanceStatusFor, type PlannedProvision } from "../utils/provisionPlan";
import type { ActiveTerm } from "../types";
import type { QueuedOp } from "./writeBatches";

/**
 * Due date stamped on a newly created clearance record. Mirrors the constant
 * the org app uses when it approves a self-registration, so a student
 * provisioned here is not given a different deadline from one provisioned
 * there. (The org app's bulk generator uses a *different* hardcoded date —
 * an inconsistency in that codebase, not one to propagate.)
 */
const CLEARANCE_DEFAULT_DUE_DATE = new Date("2026-12-30");

/** Days out to fall back to once the configured due date is in the past. */
const CLEARANCE_FALLBACK_WINDOW_DAYS = 120;

/**
 * The due date a newly created clearance record should carry.
 *
 * Mirrors `resolveClearanceDueDate` in the organization apps, including the
 * guard: once the configured date has passed, every clearance created after it
 * would otherwise be born overdue. Both applications write to the same
 * `clearanceStatus` collection, so a student provisioned by a roster sync must
 * not end up with a different deadline from one provisioned by the org app.
 */
export function resolveClearanceDueDate(): Date {
  if (CLEARANCE_DEFAULT_DUE_DATE.getTime() > Date.now()) return CLEARANCE_DEFAULT_DUE_DATE;

  console.warn(
    `[roster-sync] CLEARANCE_DEFAULT_DUE_DATE (${CLEARANCE_DEFAULT_DUE_DATE
      .toISOString()
      .slice(0, 10)}) has passed — defaulting to ${CLEARANCE_FALLBACK_WINDOW_DAYS} days out so ` +
      `new clearances are not created overdue. Update it for the current academic calendar.`
  );

  return new Date(Date.now() + CLEARANCE_FALLBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

interface ProvisioningContext {
  provisions: PlannedProvision[];
  /** Keyed `userId::orgId` — where an existing parent fines document was
   *  found, new items are added to it rather than a second one being created. */
  existingParentFineIds: Map<string, string>;
  activeTerm: ActiveTerm | null;
  now: Date;
}

/**
 * Every provisioning write for the run: per-student fines, fees and clearance,
 * then the aggregated fee-template and organization counters.
 *
 * With no active term there is nothing to provision — `planProvisions` is only
 * ever run for a term, so `provisions` is empty and the counters have nothing
 * to count.
 */
export function buildProvisioningOps(ctx: ProvisioningContext): QueuedOp[] {
  const { provisions, activeTerm, now } = ctx;
  if (!activeTerm) return [];

  const ops: QueuedOp[] = [];
  // How many students each fee template was assigned to this run.
  const feeItemAssignments = new Map<string, number>();

  for (const provision of provisions) {
    ops.push(...buildOneProvisionOps(provision, ctx, activeTerm, feeItemAssignments));
  }

  ops.push(...buildFeeTemplateCounterOps(feeItemAssignments, now));
  ops.push(...buildOrgStatsOps(provisions, activeTerm));

  return ops;
}

function buildOneProvisionOps(
  provision: PlannedProvision,
  ctx: ProvisioningContext,
  activeTerm: ActiveTerm,
  feeItemAssignments: Map<string, number>
): QueuedOp[] {
  const { existingParentFineIds, now } = ctx;
  const { subject, orgId, clearanceId, clearanceExists, fees, fines } = provision;

  const ops: QueuedOp[] = [];
  // Accumulated by the fines and fees below, then handed to the clearance
  // record — which is why the three cannot be queued independently.
  const blockingItems: Record<string, unknown> = {};

  if (fines.length > 0) {
    // One parent `fines` document per student, organization and term, with
    // the individual charges as items beneath it — the shape the org app
    // reads. An existing parent is reused so a student never ends up with
    // two.
    const parentKey = `${subject.userId}::${orgId}`;
    const existingParentId = existingParentFineIds.get(parentKey);
    const parentRef = existingParentId
      ? adminDb.collection("fines").doc(existingParentId)
      : adminDb.collection("fines").doc();

    const total = fines.reduce((sum, f) => sum + f.event.amount, 0);
    const earliest = fines[0].event.eventDate ?? null;
    const latest = fines[fines.length - 1].event.eventDate ?? null;

    if (!existingParentId) {
      ops.push((batch) =>
        batch.create(parentRef, {
          orgId,
          userId: subject.userId,
          studentId: subject.studentId,
          userName: subject.userName,
          academicYear: activeTerm.AY,
          semester: activeTerm.semester,
          accumulatedAmount: total,
          paidAmount: 0,
          balance: total,
          status: "unpaid",
          fineItemsCount: fines.length,
          firstFineIssuedAt: earliest,
          lastFineIssuedAt: latest,
          dueDate: null,
          waivedAmount: null,
          waivedBy: null,
          waivedReason: null,
          waivedAt: null,
          remarks: null,
          metadata: { createdAt: now, updatedAt: now, isArchived: false },
        })
      );
    } else {
      // Increments rather than assignment: the parent already carries
      // charges this run knows nothing about.
      ops.push((batch) =>
        batch.update(parentRef, {
          accumulatedAmount: FieldValue.increment(total),
          balance: FieldValue.increment(total),
          fineItemsCount: FieldValue.increment(fines.length),
          lastFineIssuedAt: latest,
          "metadata.updatedAt": now,
        })
      );
    }

    fines.forEach(({ event }, index) => {
      const itemRef = parentRef.collection("fineItems").doc();
      ops.push((batch) =>
        batch.create(itemRef, {
          itemNumber: index + 1,
          fineTypeId: event.fineTypeId,
          fineTypeName: event.fineTypeName,
          eventId: event.eventId,
          eventName: event.eventName,
          eventDate: event.eventDate ?? null,
          amount: event.amount,
          reason: `Fine for being absent in event ${event.eventName}`,
          issuedBy: "Roster Synchronization",
          issuedAt: now,
          isWaived: false,
          waivedBy: null,
          waivedReason: null,
          waivedAt: null,
          appealNotes: null,
          appealedAt: null,
          appealStatus: null,
          appealResolvedAt: null,
          appealResolvedBy: null,
          metadata: { createdAt: now, updatedAt: now, isArchived: false },
          isPaid: false,
          isArchived: false,
          isPending: false,
          academicYear: event.academicYear,
          semester: event.semester,
          parentFineId: parentRef.id,
          userId: subject.userId,
          studentId: subject.studentId,
          userName: subject.userName,
          orgId,
        })
      );

      // Every fine blocks clearance — the org app files them all as
      // blocking items without asking whether they are required.
      blockingItems[itemRef.id] = {
        type: "fines",
        referenceId: itemRef.id,
        parentFineId: parentRef.id,
        title: event.eventName,
        balance: event.amount,
        status: "unpaid",
        paymentHistory: [],
        pendingReview: false,
        isRequiredForClearance: true,
        academicYear: event.academicYear,
        semester: event.semester,
      };
    });
  }

  for (const { feeItem } of fees) {
    const feeRef = adminDb.collection("fees").doc();

    ops.push((batch) =>
      batch.create(feeRef, {
        orgId,
        userId: subject.userId,
        userName: subject.userName,
        studentId: subject.studentId,
        feeItemId: feeItem.id,
        feeType: feeItem.feeType,
        title: feeItem.title,
        amount: feeItem.amount,
        paidAmount: 0,
        balance: feeItem.amount,
        status: "unpaid",
        academicYear: feeItem.academicYear,
        semester: feeItem.semester,
        description: feeItem.description,
        eventId: feeItem.eventId,
        dueDate: feeItem.dueDate ?? null,
        isRequiredForClearance: feeItem.isRequiredForClearance,
        createdBy: orgId,
        createdAt: now,
        updatedAt: now,
        isArchived: false,
      })
    );

    if (feeItem.isRequiredForClearance) {
      blockingItems[feeRef.id] = {
        type: "fees",
        referenceId: feeRef.id,
        title: feeItem.title,
        balance: feeItem.amount,
        status: "unpaid",
        paymentHistory: [],
        pendingReview: false,
        isRequiredForClearance: true,
        academicYear: feeItem.academicYear,
        semester: feeItem.semester,
      };
    }

    feeItemAssignments.set(feeItem.id, (feeItemAssignments.get(feeItem.id) ?? 0) + 1);
  }

  const clearanceRef = adminDb.collection("clearanceStatus").doc(clearanceId);

  if (clearanceExists) {
    // Merge only — an existing record carries live status and blocking
    // items that a re-run must not reset.
    if (Object.keys(blockingItems).length > 0) {
      ops.push((batch) =>
        batch.set(clearanceRef, { blockingItems, updatedAt: now }, { merge: true })
      );
    }
  } else {
    ops.push((batch) =>
      batch.create(clearanceRef, {
        id: clearanceId,
        orgId,
        userId: subject.userId,
        userName: subject.userName,
        studentId: subject.studentId,
        academicYear: activeTerm.AY,
        semester: activeTerm.semester,
        status: clearanceStatusFor(fees, fines),
        visibility: "public",
        blockingItems,
        clearanceDate: null,
        lastCalculatedAt: now,
        startDate: now,
        dueDate: resolveClearanceDueDate(),
        createdAt: now,
        updatedAt: now,
        isArchived: false,
      })
    );
  }

  return ops;
}

/**
 * One increment per template, not one per student: the org app increments
 * `totalStudents` per assignment, which is fine for a single approval but
 * would mean thousands of writes to the same document here — far past
 * Firestore's sustained per-document write limit.
 */
function buildFeeTemplateCounterOps(
  feeItemAssignments: Map<string, number>,
  now: Date
): QueuedOp[] {
  return [...feeItemAssignments].map(
    ([feeItemId, count]) =>
      (batch) =>
        batch.update(adminDb.collection("feeItems").doc(feeItemId), {
          totalStudents: FieldValue.increment(count),
          updatedAt: now,
        })
  );
}

/**
 * Per-organization student counts, matching what `onboardNewStudent` keeps
 * up to date in the organization apps. Without this the roster sync — by
 * far the highest-volume way a student is created — is the one path that
 * leaves the dashboards under-counting.
 *
 * Aggregated per organization for the same reason as the fee templates
 * above: one increment rather than one per student.
 *
 * `set` with merge, not `update`: the organization apps create the stats
 * document lazily on first use, so it may legitimately not exist yet and an
 * `update` would fail the whole batch. The other counters are seeded to
 * zero rather than left absent, so a document created here has the same
 * shape as one the org app would have written.
 */
function buildOrgStatsOps(provisions: PlannedProvision[], activeTerm: ActiveTerm): QueuedOp[] {
  const studentsPerOrg = new Map<string, number>();
  for (const provision of provisions) {
    if (provision.clearanceExists) continue; // already counted on a previous run
    studentsPerOrg.set(provision.orgId, (studentsPerOrg.get(provision.orgId) ?? 0) + 1);
  }

  return [...studentsPerOrg].map(([orgId, count]) => {
    const statsId = `${activeTerm.AY}-${activeTerm.semester}-${orgId}`;
    return (batch) =>
      batch.set(
        adminDb.collection("stats").doc(statsId),
        {
          id: statsId,
          orgId,
          totalStudents: FieldValue.increment(count),
          totalFines: FieldValue.increment(0),
          totalFees: FieldValue.increment(0),
          totalCollectedFines: FieldValue.increment(0),
          totalCollectedFees: FieldValue.increment(0),
          totalUnpaidFines: FieldValue.increment(0),
          totalUnpaidFees: FieldValue.increment(0),
        },
        { merge: true }
      );
  });
}

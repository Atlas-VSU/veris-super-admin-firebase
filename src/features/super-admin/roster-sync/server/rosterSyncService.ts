/**
 * The roster synchronization itself: read the current state, diff the uploaded
 * roster against it, and either report the diff (dry run) or apply it.
 *
 * The route handler owns HTTP; everything below owns the synchronization.
 * Guard failures are returned as outcomes rather than thrown, so the handler
 * can map them to a status code without knowing why they were raised.
 */

import {
  planProvisions,
  buildClearanceId,
  studentBelongsToOrg,
  type PlannedProvision,
} from "../utils/provisionPlan";
import {
  deactivationRatio,
  exceedsDeactivationThreshold,
} from "../utils/deactivationGuard";
import { diffRoster, type RosterDiffPlan, type UpdateOp } from "../utils/diffRoster";
import {
  resolveRosterReferences,
  type ReferenceResolution,
} from "../utils/resolveRosterReferences";
import type { ValidatedSyncRequest } from "../utils/validateSyncRequest";
import type { ActiveTerm, RosterSyncPreview, RosterSyncResult } from "../types";
import {
  fetchExistingRoster,
  fetchReferenceData,
  fetchSubscribedOrgs,
  getActiveTerm,
} from "./rosterQueries";
import {
  fetchExistingClearanceIds,
  fetchExistingFeeItemIds,
  fetchExistingFineState,
  fetchFeeItemsByOrg,
  fetchFineEventsByOrg,
} from "./provisioningQueries";
import {
  fetchMatchingTermRecordIds,
  fetchRestorableTermRecordIds,
  queueArchive,
  queueRestore,
} from "./termRecordArchive";
import {
  buildStudentCreateOps,
  buildStudentDeactivateOps,
  buildStudentUpdateOps,
} from "./studentWrites";
import { buildProvisioningOps } from "./provisioningWrites";
import { buildBatches, commitBatches, type QueuedOp } from "./writeBatches";
import { recordSyncRun } from "./syncLog";

/** How many entries each truncated preview list carries. */
const PREVIEW_LIMIT = 500;

/** How many colliding Student IDs the 409 lists. */
const COLLISION_DETAIL_LIMIT = 50;

export interface SyncActor {
  uid:       string;
  actorName: string;
}

export type RosterSyncOutcome =
  | { ok: true; body: RosterSyncPreview | RosterSyncResult }
  | { ok: false; status: number; error: string; details?: string[] };

/** Everything both a dry run and an execution need, computed once. */
interface RosterSyncPlan {
  plan:                  RosterDiffPlan;
  resolution:            ReferenceResolution;
  activeTerm:            ActiveTerm | null;
  transfers:             UpdateOp[];
  activeStudentCount:    number;
  massDeactivation:      boolean;
  /** Term records to hide for students leaving the roster. */
  archiveIds:            TermRecordIds;
  /** Term records to bring back for students returning to it. */
  restoreIds:            TermRecordIds;
  reactivatedStudentIds: string[];
  provisions:            PlannedProvision[];
  existingParentFineIds: Map<string, string>;
}

interface TermRecordIds {
  fees:      string[];
  fines:     string[];
  clearance: string[];
}

const noTermRecords = (): TermRecordIds => ({ fees: [], fines: [], clearance: [] });

/**
 * Runs the synchronization end to end.
 *
 * Throws only on unexpected failure — every anticipated refusal comes back as
 * `{ ok: false }` with the status the caller should send.
 */
export async function runRosterSync(
  request: ValidatedSyncRequest,
  actor: SyncActor
): Promise<RosterSyncOutcome> {
  const planned = await planRosterSync(request);
  if (!planned.ok) return planned;

  return request.dryRun
    ? { ok: true, body: buildPreview(request, planned.plan) }
    : { ok: true, body: await executeSync(request, planned.plan, actor) };
}

// ── Planning ─────────────────────────────────────────────────────────────────

async function planRosterSync(
  request: ValidatedSyncRequest
): Promise<
  | { ok: true; plan: RosterSyncPlan }
  | { ok: false; status: number; error: string; details?: string[] }
> {
  const { rows, dryRun, excludedStudentIds, additiveOnly, acknowledgeMassDeactivation } = request;

  const [{ map: existing, collisions }, activeTerm, reference, subscribedOrgs] = await Promise.all([
    fetchExistingRoster(),
    getActiveTerm(),
    fetchReferenceData(),
    fetchSubscribedOrgs(),
  ]);

  // Ambiguous identity is never resolved by guessing: whichever record lost
  // the collision would be seen as departed and have its records archived.
  if (collisions.length > 0) {
    return {
      ok: false,
      status: 409,
      error:
        "Duplicate student records detected. Two or more ACTIVE accounts share the same " +
        "Student ID, so the roster cannot be matched unambiguously. Resolve these before " +
        "synchronizing. (An archived record from a previous enrolment is not counted here.)",
      details: collisions
        .slice(0, COLLISION_DETAIL_LIMIT)
        .map((c) => `${c.studentId}: ${c.docIds.length} records (${c.docIds.join(", ")})`),
    };
  }

  // Names → IDs before anything is diffed or written. A row naming an
  // unknown program/faculty is skipped rather than written, and its student
  // joins the exemption set below so the skip cannot be mistaken for a
  // departure.
  const resolution = resolveRosterReferences(rows, reference);

  const exemptStudentIds = new Set<string>([
    ...excludedStudentIds,
    ...resolution.unresolvable.map((u) => u.studentId),
  ]);

  const rawPlan = diffRoster(resolution.rows, existing, exemptStudentIds);

  // Additive-only drops the entire destructive half of the plan: nobody is
  // deactivated, so nothing is archived either. An incomplete roster can then
  // be applied to fix transfers and add new students without betting on the
  // file being exhaustive.
  const plan = additiveOnly ? { ...rawPlan, toDeactivate: [] } : rawPlan;

  const deactivateStudentIds = plan.toDeactivate.map((op) => op.studentId);

  // A roster that would retire a large share of the student body is far more
  // likely to be a partial upload than a real graduation event.
  const activeStudentCount = [...existing.values()].filter((s) => !s.isDeleted).length;
  const massDeactivation = exceedsDeactivationThreshold(
    plan.toDeactivate.length,
    activeStudentCount
  );

  if (massDeactivation && !dryRun && !acknowledgeMassDeactivation) {
    const percent = Math.round(
      deactivationRatio(plan.toDeactivate.length, activeStudentCount) * 100
    );
    return {
      ok: false,
      status: 409,
      error:
        `Refusing to run: ${plan.toDeactivate.length} of ${activeStudentCount} active students ` +
        `(${percent}%) would be deactivated, which usually means the uploaded roster is ` +
        `incomplete. Re-check the file, or re-submit with acknowledgeMassDeactivation to ` +
        `proceed deliberately.`,
    };
  }

  const transfers: UpdateOp[] = plan.toUpdate.filter((op) => op.transferred);

  // Term-scoped cleanup only applies to students being deactivated this run
  // — mirrors archive-students, whose fee/fine/clearance cleanup applies to
  // the same set of students it archives.
  const archiveIds = await fetchTermRecordIds(
    fetchMatchingTermRecordIds,
    deactivateStudentIds,
    activeTerm
  );

  // ── Restoring returning students ──────────────────────────────────────
  // A student who reappears in the roster is reactivated rather than created
  // afresh — `fetchExistingRoster` matches them by Student ID even while
  // archived. Their records come back with them, so the student is not left
  // live but stripped of the term's fees, fines and clearance.
  //
  // Only this term's records, and only ones this endpoint archived. Restoring
  // runs in additive-only mode too: giving a returning student their records
  // back retires nobody, which is the only thing that mode withholds.
  const reactivatedStudentIds = plan.toUpdate
    .filter((op) => op.reactivated)
    .map((op) => op.studentId);

  const restoreIds = await fetchTermRecordIds(
    fetchRestorableTermRecordIds,
    reactivatedStudentIds,
    activeTerm
  );

  const { provisions, existingParentFineIds } = await planStudentProvisioning(
    plan,
    subscribedOrgs,
    activeTerm
  );

  return {
    ok: true,
    plan: {
      plan,
      resolution,
      activeTerm,
      transfers,
      activeStudentCount,
      massDeactivation,
      archiveIds,
      restoreIds,
      reactivatedStudentIds,
      provisions,
      existingParentFineIds,
    },
  };
}

/** Runs one of the term-record lookups across all three collections at once. */
async function fetchTermRecordIds(
  lookup: (collection: string, studentIds: string[], AY: string, semester: string) => Promise<string[]>,
  studentIds: string[],
  activeTerm: ActiveTerm | null
): Promise<TermRecordIds> {
  if (!activeTerm) return noTermRecords();

  const [fees, fines, clearance] = await Promise.all([
    lookup("fees", studentIds, activeTerm.AY, activeTerm.semester),
    lookup("fines", studentIds, activeTerm.AY, activeTerm.semester),
    lookup("clearanceStatus", studentIds, activeTerm.AY, activeTerm.semester),
  ]);

  return { fees, fines, clearance };
}

/**
 * Plans what newly created and returning students should be given.
 *
 * A create's document ID is its studentId (see `buildStudentCreateOps`), so a
 * student can be provisioned in the same run that creates them.
 */
async function planStudentProvisioning(
  plan: RosterDiffPlan,
  subscribedOrgs: Awaited<ReturnType<typeof fetchSubscribedOrgs>>,
  activeTerm: ActiveTerm | null
): Promise<{ provisions: PlannedProvision[]; existingParentFineIds: Map<string, string> }> {
  const subjects = [
    ...plan.toCreate.map(({ row }) => ({
      userId: row.studentId,
      studentId: row.studentId,
      userName: `${row.firstName} ${row.lastName}`.trim(),
      programId: row.programId,
      facultyId: row.facultyId,
    })),
    // Returning students are provisioned on the same terms as new ones.
    // Restoring their archived records is not enough on its own: a student
    // retired before their organization issued this term's dues has nothing
    // to restore, and the portal reads "not enrolled for the current term"
    // because that judgement is made on whether any clearance, fee, fine or
    // payment record exists for the term.
    //
    // Their document ID is the existing one, not the Student ID — only
    // created students are keyed by Student ID. `planProvisions` skips
    // anything they already hold, so a student whose records were restored a
    // moment ago is not charged for them twice.
    ...plan.toUpdate
      .filter((op) => op.reactivated)
      .map((op) => ({
        userId: op.docId,
        studentId: op.studentId,
        userName: `${op.firstName} ${op.lastName}`.trim(),
        programId: op.programId,
        facultyId: op.facultyId,
      })),
  ];

  if (!activeTerm || subjects.length === 0 || subscribedOrgs.length === 0) {
    return { provisions: [], existingParentFineIds: new Map() };
  }

  const relevantOrgIds = subscribedOrgs.map((o) => o.id);
  const [feeItemsByOrg, fineEventsByOrg, fineState] = await Promise.all([
    fetchFeeItemsByOrg(relevantOrgIds, activeTerm),
    fetchFineEventsByOrg(relevantOrgIds, activeTerm),
    fetchExistingFineState(subjects.map((s) => s.userId), activeTerm),
  ]);

  // Both lookups guard against writing something the student already has:
  // fees they already hold, and clearance records already in place.
  const [heldFeeItemIds, existingClearanceIds] = await Promise.all([
    fetchExistingFeeItemIds(
      subjects.map((s) => s.userId),
      activeTerm
    ),
    fetchExistingClearanceIds(
      subjects.flatMap((s) =>
        subscribedOrgs
          .filter((o) => studentBelongsToOrg(o, s.programId, s.facultyId))
          .map((o) => buildClearanceId(s.userId, o.id, activeTerm))
      )
    ),
  ]);

  return {
    provisions: planProvisions(
      subjects,
      subscribedOrgs,
      feeItemsByOrg,
      heldFeeItemIds,
      existingClearanceIds,
      activeTerm,
      fineEventsByOrg,
      fineState.finedEventIds
    ),
    // Keyed `userId::orgId` — where an existing parent fines document was
    // found, new items are added to it rather than a second one being created.
    existingParentFineIds: fineState.parentFineIds,
  };
}

// ── Counts shared by the preview and the result ──────────────────────────────

function provisioningCounts(provisions: PlannedProvision[]) {
  return {
    clearanceCreated: provisions.filter((p) => !p.clearanceExists).length,
    feesAssigned: provisions.reduce((n, p) => n + p.fees.length, 0),
    finesAssigned: provisions.reduce((n, p) => n + p.fines.length, 0),
  };
}

function countRecords(ids: TermRecordIds): number {
  return ids.fees.length + ids.fines.length + ids.clearance.length;
}

// ── Dry run ──────────────────────────────────────────────────────────────────

function buildPreview(request: ValidatedSyncRequest, planned: RosterSyncPlan): RosterSyncPreview {
  const { plan, resolution, transfers, archiveIds, restoreIds } = planned;
  const { clearanceCreated, feesAssigned, finesAssigned } = provisioningCounts(planned.provisions);

  return {
    dryRun: true,
    activeTerm: planned.activeTerm,
    rosterRowsSubmitted: request.rows.length,
    toCreate: plan.toCreate.length,
    toUpdate: plan.toUpdate.length,
    toTransfer: transfers.length,
    toDeactivate: plan.toDeactivate.length,
    unchanged: plan.unchanged.length,
    exempted: plan.exempted.length,
    additiveOnly: request.additiveOnly,
    massDeactivation: planned.massDeactivation,
    activeStudentCount: planned.activeStudentCount,
    clearanceToCreate: clearanceCreated,
    feesToAssign: feesAssigned,
    finesToAssign: finesAssigned,
    reactivated: planned.reactivatedStudentIds.length,
    recordsToRestore: countRecords(restoreIds),
    unresolvedRows: resolution.unresolvable.slice(0, PREVIEW_LIMIT),
    referenceWarnings: resolution.warnings.slice(0, PREVIEW_LIMIT),
    createPreview: plan.toCreate
      .slice(0, PREVIEW_LIMIT)
      .map((op) => ({ studentId: op.row.studentId, fullName: `${op.row.firstName} ${op.row.lastName}`.trim() })),
    // Every new student's id, uncapped — `createPreview` is truncated for
    // display, but the export must cover the whole set. Ids only: the
    // client still holds the uploaded rows and rebuilds the file from
    // those, so the exported columns are the imported ones by construction.
    createStudentIds: plan.toCreate.map((op) => op.row.studentId),
    updatePreview: plan.toUpdate
      .slice(0, PREVIEW_LIMIT)
      .map((op) => ({ studentId: op.studentId, fullName: `${op.firstName} ${op.lastName}`.trim(), reactivated: op.reactivated })),
    transferPreview: transfers.slice(0, PREVIEW_LIMIT).map((op) => ({
      studentId: op.studentId,
      fullName: `${op.firstName} ${op.lastName}`.trim(),
      fromProgram: op.fromProgram,
      toProgram: op.program,
    })),
    deactivatePreview: plan.toDeactivate
      .slice(0, PREVIEW_LIMIT)
      .map((op) => ({ studentId: op.studentId, fullName: op.fullName })),
    matchingFees: archiveIds.fees.length,
    matchingFines: archiveIds.fines.length,
    matchingClearance: archiveIds.clearance.length,
  };
}

// ── Execution ────────────────────────────────────────────────────────────────

async function executeSync(
  request: ValidatedSyncRequest,
  planned: RosterSyncPlan,
  actor: SyncActor
): Promise<RosterSyncResult> {
  const { plan, resolution, activeTerm, transfers, archiveIds, restoreIds } = planned;
  const now = new Date();

  const ops = buildSyncOps(planned, now);
  const batches = buildBatches(ops);

  const { completed, error } = await commitBatches(batches);
  const partial = completed < batches.length;

  if (error) {
    console.error("[roster-sync API] batch commit failed partway through", {
      actingUid: actor.uid,
      batchesCompleted: completed,
      batchesTotal: batches.length,
      error,
    });
  }

  const completedAt = new Date();
  const { clearanceCreated, feesAssigned, finesAssigned } = provisioningCounts(planned.provisions);
  const recordsRestored = countRecords(restoreIds);

  const summary = {
    rosterRowsSubmitted: request.rows.length,
    toCreate: plan.toCreate.length,
    toUpdate: plan.toUpdate.length,
    toTransfer: transfers.length,
    toDeactivate: plan.toDeactivate.length,
    unchanged: plan.unchanged.length,
    exempted: plan.exempted.length,
    unresolvable: resolution.unresolvable.length,
    feesArchived: archiveIds.fees.length,
    finesArchived: archiveIds.fines.length,
    clearanceArchived: archiveIds.clearance.length,
    clearanceCreated,
    feesAssigned,
    finesAssigned,
    reactivated: planned.reactivatedStudentIds.length,
    recordsRestored,
  };

  console.log("[roster-sync API] sync executed", { actingUid: actor.uid, ...summary, partial });

  await recordSyncRun({
    ...summary,
    completedAt,
    actingUid: actor.uid,
    actorName: actor.actorName,
    additiveOnly: request.additiveOnly,
    acknowledgedMassDeactivation:
      planned.massDeactivation && request.acknowledgeMassDeactivation,
    activeTerm: activeTerm ?? null,
    activeStudentCount: planned.activeStudentCount,
    partial,
    batchesCompleted: completed,
    batchesTotal: batches.length,
    errorMessage: error ? String((error as Error)?.message ?? error) : null,
  });

  return {
    dryRun: false,
    activeTerm,
    rosterRowsSubmitted: request.rows.length,
    toCreate: plan.toCreate.length,
    toUpdate: plan.toUpdate.length,
    toTransfer: transfers.length,
    toDeactivate: plan.toDeactivate.length,
    unchanged: plan.unchanged.length,
    exempted: plan.exempted.length,
    additiveOnly: request.additiveOnly,
    feesArchived: archiveIds.fees.length,
    finesArchived: archiveIds.fines.length,
    clearanceArchived: archiveIds.clearance.length,
    clearanceCreated,
    feesAssigned,
    finesAssigned,
    reactivated: planned.reactivatedStudentIds.length,
    recordsRestored,
    completedAt: new Date().toISOString(),
    partial,
    batchesCompleted: completed,
    batchesTotal: batches.length,
    error: error
      ? "One or more batches failed to commit. Re-submitting the same roster is safe and will complete the remaining changes."
      : undefined,
  };
}

/**
 * The run's complete write set, in commit order.
 *
 * Order is load-bearing: ops are chunked into batches in sequence, so it
 * decides what a partial failure leaves behind. Students first, then their
 * provisioning, then deactivations, then the archive and restore sweeps.
 */
function buildSyncOps(planned: RosterSyncPlan, now: Date): QueuedOp[] {
  const { plan, provisions, existingParentFineIds, activeTerm, archiveIds, restoreIds } = planned;

  return [
    ...buildStudentCreateOps(plan.toCreate, now),
    ...buildStudentUpdateOps(plan.toUpdate, now),
    // Clearance and fees for newly created and returning students.
    ...buildProvisioningOps({ provisions, existingParentFineIds, activeTerm, now }),
    ...buildStudentDeactivateOps(plan.toDeactivate, now),
    // Archived, never deleted. The org app already filters every fee, fine and
    // clearance read on these flags, so archiving hides the record exactly as
    // deletion did — but a wrong deactivation is now fully reversible, and the
    // student's financial history survives.
    ...archiveIds.fees.map((id): QueuedOp => (batch) => queueArchive(batch, "fees", id, now)),
    ...archiveIds.fines.map((id): QueuedOp => (batch) => queueArchive(batch, "fines", id, now)),
    ...archiveIds.clearance.map((id): QueuedOp => (batch) => queueArchive(batch, "clearanceStatus", id, now)),
    // Returning students get this term's records back.
    ...restoreIds.fees.map((id): QueuedOp => (batch) => queueRestore(batch, "fees", id, now)),
    ...restoreIds.fines.map((id): QueuedOp => (batch) => queueRestore(batch, "fines", id, now)),
    ...restoreIds.clearance.map((id): QueuedOp => (batch) => queueRestore(batch, "clearanceStatus", id, now)),
  ];
}

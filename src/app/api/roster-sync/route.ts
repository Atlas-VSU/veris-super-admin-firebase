/**
 * /api/roster-sync
 *
 * GET                       — recent synchronization history, newest first.
 * POST { students, dryRun } — synchronizes the student roster against a newly
 *                             uploaded roster.
 *
 * This file owns the HTTP lifecycle only: authenticate, parse, validate,
 * delegate, and turn the outcome into a response. The synchronization itself
 * lives in `features/super-admin/roster-sync/server` —
 * `rosterSyncService.runRosterSync` is the entry point, and the module headers
 * there carry the rules for matching, provisioning, archiving and restoring.
 *
 * Summary of what a run does:
 *   - studentId already present  → update firstName/lastName/yearLevel/
 *                                   program/faculty and the resolved
 *                                   programId/facultyId, clear isDeleted if
 *                                   set.
 *   - studentId not present      → create a new student record.
 *   - studentId missing from the
 *     uploaded roster            → soft-delete plus archive that student's
 *                                   Fees, Fines and Clearance Status for the
 *                                   active term. Skipped entirely in
 *                                   additive-only mode.
 *
 * Runs entirely on the server using the Firebase Admin SDK — no client-side
 * Firestore writes are ever made by the UI for this operation.
 *
 * Restricted to authenticated super-admins: the session cookie is verified
 * (including revocation) and the caller's own `users/{uid}` document must
 * have role === "super-admin".
 *
 * DRY RUN (dryRun: true)   — computes the diff, writes nothing.
 * EXECUTE (dryRun: false)  — applies the diff in chunked batches.
 *
 * An active term is looked up the same way `/api/archive-students` does,
 * but — unlike that endpoint — its absence does not block the sync: roster
 * creates/updates still proceed, only the Fees/Fines/Clearance Status
 * cleanup for deactivated students is skipped (there being no term to scope
 * that cleanup to). `activeTerm: null` in the response signals this.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/features/super-admin/roster-sync/server/requireSuperAdmin";
import { fetchRecentSyncRuns } from "@/features/super-admin/roster-sync/server/syncLog";
import { runRosterSync } from "@/features/super-admin/roster-sync/server/rosterSyncService";
import { validateSyncRequest } from "@/features/super-admin/roster-sync/utils/validateSyncRequest";

/** Recent synchronization history, newest first. */
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    return NextResponse.json({ entries: await fetchRecentSyncRuns() });
  } catch (error: any) {
    console.error("[roster-sync API] history read failed", error);
    return NextResponse.json(
      { error: "Failed to load synchronization history.", detail: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const validated = validateSyncRequest(body);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error, details: validated.details },
      { status: validated.status }
    );
  }

  try {
    const outcome = await runRosterSync(validated, { uid: auth.uid, actorName: auth.actorName });

    if (!outcome.ok) {
      return NextResponse.json(
        { error: outcome.error, details: outcome.details },
        { status: outcome.status }
      );
    }

    return NextResponse.json(outcome.body, { status: 200 });
  } catch (error: any) {
    console.error("[roster-sync API]", error);
    return NextResponse.json(
      { error: "Internal server error.", detail: error?.message ?? "Unknown error." },
      { status: 500 }
    );
  }
}

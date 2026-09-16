/**
 * Synchronization history — one document per executed run.
 *
 * Dry runs are never recorded: they change nothing, so they are not part of
 * the history.
 */

import { adminDb } from "@/firebase/firebase-admin.config";

/** Collection holding one document per executed synchronization. */
const SYNC_LOG_COLLECTION = "rosterSyncLogs";

/** How many past runs the history endpoint returns. */
const SYNC_LOG_PAGE_SIZE = 20;

/**
 * Records a completed run.
 *
 * Written after the batches are committed, and deliberately outside the batch:
 * a partial failure still produced real changes, so the history must record
 * what happened rather than disappearing with the transaction. A failure to
 * write the log is swallowed — losing the audit entry is bad, but failing the
 * response after the data has already changed would be worse and would invite
 * an operator to re-run a sync that already succeeded.
 */
export async function recordSyncRun(entry: Record<string, unknown>): Promise<void> {
  try {
    await adminDb.collection(SYNC_LOG_COLLECTION).add(entry);
  } catch (error) {
    console.error("[roster-sync API] failed to write synchronization log", error);
  }
}

/** Recent synchronization history, newest first. */
export async function fetchRecentSyncRuns(): Promise<{ id: string }[]> {
  const snap = await adminDb
    .collection(SYNC_LOG_COLLECTION)
    .orderBy("completedAt", "desc")
    .limit(SYNC_LOG_PAGE_SIZE)
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

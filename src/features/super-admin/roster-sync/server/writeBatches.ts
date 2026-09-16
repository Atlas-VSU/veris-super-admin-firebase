/**
 * Batching and committing the synchronization's writes.
 *
 * BATCH LIMIT: Firestore max 500 ops/batch — chunked at 499 to be safe.
 * All writes (creates, updates, provisioning, deactivations, archives and
 * restores) are queued into ONE combined op list before batching, so a failure
 * partway through is reported precisely via `partial`/`batchesCompleted`/
 * `batchesTotal`.
 *
 * Because new-student creation keys off the normalized studentId and every
 * other op is recomputed from a fresh read each run, re-submitting the same
 * roster after a partial failure is safe and will only apply what didn't
 * already land. Op ORDER therefore matters and is preserved exactly as the
 * caller queued it.
 */

import { adminDb } from "@/firebase/firebase-admin.config";
import type { WriteBatch } from "firebase-admin/firestore";
import { BATCH_LIMIT } from "../const";
import { chunkArray } from "../utils/chunkArray";

/** One queued write, applied to whichever batch it lands in. */
export type QueuedOp = (batch: WriteBatch) => void;

/** Chunks the queued ops into commit-ready batches, preserving order. */
export function buildBatches(ops: QueuedOp[]): WriteBatch[] {
  return chunkArray(ops, BATCH_LIMIT).map((chunk) => {
    const batch = adminDb.batch();
    chunk.forEach((apply) => apply(batch));
    return batch;
  });
}

/**
 * Commits the batches in order, stopping at the first failure.
 *
 * Partial completion is intentionally supported rather than rolled back: the
 * write set routinely exceeds what a single Firestore transaction can hold, so
 * the recovery path is re-running the sync (which is idempotent) rather than
 * undoing what already committed.
 */
export async function commitBatches(batches: WriteBatch[]): Promise<{ completed: number; error?: unknown }> {
  let completed = 0;
  for (const batch of batches) {
    try {
      await batch.commit();
      completed++;
    } catch (error) {
      return { completed, error };
    }
  }
  return { completed };
}

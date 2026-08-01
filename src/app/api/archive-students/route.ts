/**
 * /api/archive-students
 *
 * POST body: { studentIds: string[], dryRun: boolean }
 *
 * Runs entirely on the server using Firebase Admin SDK — no client-side
 * Firestore writes are ever made by the UI for this maintenance operation.
 *
 * DRY RUN (dryRun: true)
 *   Counts matching documents across users, fees, fines, clearanceStatus.
 *   Returns a summary. No writes.
 *
 * EXECUTE (dryRun: false)
 *   1. Batch-updates `users` → isDeleted = true (skips already-archived).
 *   2. Batch-deletes matching `fees`, `fines`, `clearanceStatus` records.
 *   Returns a final execution log.
 *
 * BATCH LIMIT: Firestore max 500 ops/batch — we chunk at 499 to be safe.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/firebase-admin.config";
import type { WriteBatch } from "firebase-admin/firestore";

const BATCH_LIMIT = 499;

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArchiveRequestBody {
  studentIds: string[];
  dryRun:     boolean;
}

interface ActiveTerm {
  id:       string;
  AY:       string;
  semester: string;
}

interface DryRunResult {
  dryRun:               true;
  activeTerm:           ActiveTerm;
  studentsUploaded:     number;
  usersToArchive:       number;
  usersAlreadyArchived: number;
  missingUserRecords:   number;
  missingUserIds:       string[];
  matchingFees:         number;
  matchingFines:        number;
  matchingClearance:    number;
}

interface ExecuteResult {
  dryRun:               false;
  activeTerm:           ActiveTerm;
  studentsUploaded:     number;
  usersArchived:        number;
  usersAlreadyArchived: number;
  missingUserRecords:   number;
  missingUserIds:       string[];
  feesDeleted:          number;
  finesDeleted:         number;
  clearanceDeleted:     number;
  completedAt:          string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getActiveTerm(): Promise<ActiveTerm | null> {
  const snap = await adminDb
    .collection("terms")
    .where("isActive",  "==", true)
    .where("isDeleted", "==", false)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc  = snap.docs[0];
  const data = doc.data();
  return { id: doc.id, AY: data.AY as string, semester: data.semester as string };
}

/**
 * Chunks an array of items, runs `applyOp` per item on a Firestore WriteBatch,
 * and collects the ready-to-commit batches.
 */
function buildBatches<T>(
  items:   T[],
  applyOp: (batch: WriteBatch, item: T) => void
): WriteBatch[] {
  const batches: WriteBatch[] = [];
  let current:  WriteBatch | null = null;
  let opsCount  = 0;

  for (const item of items) {
    if (!current || opsCount >= BATCH_LIMIT) {
      current = adminDb.batch();
      batches.push(current);
      opsCount = 0;
    }
    applyOp(current, item);
    opsCount++;
  }

  return batches;
}

async function commitBatches(batches: WriteBatch[]): Promise<void> {
  for (const batch of batches) {
    await batch.commit();
  }
}

/**
 * Checks each student ID against the `users` collection (doc ID = student ID).
 * Returns three buckets: to-archive, already-archived, missing.
 */
async function inspectUsers(studentIds: string[]): Promise<{
  toArchive:       string[];
  alreadyArchived: string[];
  missing:         string[];
}> {
  const toArchive:       string[] = [];
  const alreadyArchived: string[] = [];
  const missing:         string[] = [];

  // getAll() has no documented size cap but we chunk at 500 for safety
  const CHUNK = 500;
  for (let i = 0; i < studentIds.length; i += CHUNK) {
    const chunk   = studentIds.slice(i, i + CHUNK);
    const docRefs = chunk.map((id) => adminDb.collection("users").doc(id));
    const snaps   = await adminDb.getAll(...docRefs);

    for (const snap of snaps) {
      if (!snap.exists) {
        missing.push(snap.id);
      } else if (snap.data()?.isDeleted === true) {
        alreadyArchived.push(snap.id);
      } else {
        toArchive.push(snap.id);
      }
    }
  }

  return { toArchive, alreadyArchived, missing };
}

/**
 * Counts (or deletes) all documents in `collectionName` matching the student
 * IDs and the active term AY + semester.
 */
async function handleCollection(
  collectionName: string,
  studentIds:     string[],
  AY:             string,
  semester:       string,
  execute:        boolean
): Promise<number> {
  // Firestore `in` queries cap at 30 values
  const CHUNK = 30;
  let total   = 0;
  const docIdsToDelete: string[] = [];

  for (let i = 0; i < studentIds.length; i += CHUNK) {
    const chunk = studentIds.slice(i, i + CHUNK);

    const snap = await adminDb
      .collection(collectionName)
      .where("studentId",    "in",  chunk)
      .where("academicYear", "==",  AY)
      .where("semester",     "==",  semester)
      .get();

    total += snap.size;
    if (execute) {
      snap.docs.forEach((d) => docIdsToDelete.push(d.id));
    }
  }

  if (execute && docIdsToDelete.length > 0) {
    const batches = buildBatches(docIdsToDelete, (batch, id) => {
      batch.delete(adminDb.collection(collectionName).doc(id));
    });
    await commitBatches(batches);
  }

  return total;
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: ArchiveRequestBody = await req.json();
    const { studentIds, dryRun } = body;

    // ── Validate request ─────────────────────────────────────────────────────
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "studentIds must be a non-empty array." },
        { status: 400 }
      );
    }
    if (typeof dryRun !== "boolean") {
      return NextResponse.json(
        { error: "dryRun must be a boolean." },
        { status: 400 }
      );
    }

    // De-duplicate on the server side as a safety measure
    const uniqueIds = [...new Set(studentIds.map((id) => id.trim()).filter(Boolean))];

    // ── Fetch active term ────────────────────────────────────────────────────
    const activeTerm = await getActiveTerm();
    if (!activeTerm) {
      return NextResponse.json(
        { error: "No active term found. Please set an active Academic Year and Semester first." },
        { status: 422 }
      );
    }

    // ── Inspect users ────────────────────────────────────────────────────────
    const { toArchive, alreadyArchived, missing } = await inspectUsers(uniqueIds);

    // ── Count/delete records ─────────────────────────────────────────────────
    const execute = !dryRun;

    const [feesCount, finesCount, clearanceCount] = await Promise.all([
      handleCollection("fees",            uniqueIds, activeTerm.AY, activeTerm.semester, execute),
      handleCollection("fines",           uniqueIds, activeTerm.AY, activeTerm.semester, execute),
      handleCollection("clearanceStatus", uniqueIds, activeTerm.AY, activeTerm.semester, execute),
    ]);

    // ── Archive users (only on execute) ──────────────────────────────────────
    if (execute && toArchive.length > 0) {
      const now     = new Date();
      const batches = buildBatches(toArchive, (batch, id) => {
        batch.update(adminDb.collection("users").doc(id), {
          isDeleted:            true,
          "metadata.updatedAt": now,
        });
      });
      await commitBatches(batches);
    }

    // ── Return result ────────────────────────────────────────────────────────
    if (dryRun) {
      const result: DryRunResult = {
        dryRun:               true,
        activeTerm,
        studentsUploaded:     uniqueIds.length,
        usersToArchive:       toArchive.length,
        usersAlreadyArchived: alreadyArchived.length,
        missingUserRecords:   missing.length,
        missingUserIds:       missing,
        matchingFees:         feesCount,
        matchingFines:        finesCount,
        matchingClearance:    clearanceCount,
      };
      return NextResponse.json(result);
    }

    const result: ExecuteResult = {
      dryRun:               false,
      activeTerm,
      studentsUploaded:     uniqueIds.length,
      usersArchived:        toArchive.length,
      usersAlreadyArchived: alreadyArchived.length,
      missingUserRecords:   missing.length,
      missingUserIds:       missing,
      feesDeleted:          feesCount,
      finesDeleted:         finesCount,
      clearanceDeleted:     clearanceCount,
      completedAt:          new Date().toISOString(),
    };
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[archive-students API]", error);
    return NextResponse.json(
      { error: "Internal server error.", detail: error?.message ?? "Unknown error." },
      { status: 500 }
    );
  }
}

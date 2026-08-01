/**
 * archiveStudents.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone Firebase Admin maintenance script.
 *
 * PURPOSE
 *   Archive student user accounts and permanently delete erroneously generated
 *   Fees, Fines, and Clearance Status records for the active Academic Year and
 *   Semester.
 *
 * USAGE
 *   ts-node scripts/archiveStudents.ts --input <path-to-student-ids-file>
 *
 *   The input file can be:
 *     - A plain text file with one student ID per line
 *     - A JSON file containing an array of student ID strings
 *
 *   Options:
 *     --input  <file>   Path to the input file (required)
 *     --dry-run         Preview changes without writing to Firestore
 *     --log    <file>   Write the execution log to a JSON file (optional)
 *
 * EXAMPLES
 *   ts-node scripts/archiveStudents.ts --input students.txt
 *   ts-node scripts/archiveStudents.ts --input students.json --dry-run
 *   ts-node scripts/archiveStudents.ts --input students.txt --log output.json
 *
 * ENVIRONMENT
 *   Reads credentials from .env.local (same vars used by the Next.js app):
 *     FIREBASE_PROJECT_ID
 *     FIREBASE_CLIENT_EMAIL
 *     FIREBASE_PRIVATE_KEY
 *
 * BATCH LIMIT
 *   Firestore allows a maximum of 500 operations per batch. This script
 *   automatically chunks all operations into batches of 500.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as fs from "fs";
import * as path from "path";

// ── Load environment variables from .env.local ────────────────────────────────
// Manually parse .env.local without the dotenv package (not installed by default)
function loadEnvFile(filePath: string): void {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) return;
  const content = fs.readFileSync(absolutePath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key   = trimmed.slice(0, eqIdx).trim();
    let   value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
loadEnvFile(".env.local");

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, WriteBatch } from "firebase-admin/firestore";

// ── Firebase Admin Initialization ─────────────────────────────────────────────
const serviceAccount = {
  projectId:   process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

let app: App;
if (getApps().length === 0) {
  app = initializeApp({ credential: cert(serviceAccount as any) });
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

// ── Constants ─────────────────────────────────────────────────────────────────
const BATCH_LIMIT = 499; // Use 499 to stay safely under the 500-op Firestore limit

// ── Types ─────────────────────────────────────────────────────────────────────
interface ActiveTerm {
  id:       string;
  AY:       string;
  semester: string;
}

interface ExecutionLog {
  activeTerm:               ActiveTerm | null;
  studentIdsLoaded:         number;
  usersArchived:            number;
  usersAlreadyArchived:     number;
  usersMissing:             number;
  feesDeleted:              number;
  finesDeleted:             number;
  clearanceStatusDeleted:   number;
  missingUserIds:           string[];
  errors:                   string[];
  dryRun:                   boolean;
  completedAt:              string;
}

// ── CLI Argument Parsing ───────────────────────────────────────────────────────
function parseArgs(): { inputFile: string; dryRun: boolean; logFile: string | null } {
  const args = process.argv.slice(2);
  let inputFile:  string | null = null;
  let dryRun    = false;
  let logFile:    string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) {
      inputFile = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (args[i] === "--log" && args[i + 1]) {
      logFile = args[i + 1];
      i++;
    }
  }

  if (!inputFile) {
    console.error("ERROR: --input <file> is required.");
    console.error("Usage: ts-node scripts/archiveStudents.ts --input <path> [--dry-run] [--log <path>]");
    process.exit(1);
  }

  return { inputFile, dryRun, logFile };
}

// ── Input File Parsing ────────────────────────────────────────────────────────
function loadStudentIds(filePath: string): string[] {
  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`ERROR: Input file not found: ${absolutePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  const ext     = path.extname(absolutePath).toLowerCase();

  let ids: string[] = [];

  if (ext === ".json") {
    // JSON array of strings
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      console.error("ERROR: JSON input file must contain an array of student ID strings.");
      process.exit(1);
    }
    ids = parsed.map((id: any) => String(id).trim()).filter(Boolean);
  } else {
    // Plain text — one ID per line; tolerate commas (CSV-like)
    ids = content
      .split(/\r?\n/)
      .flatMap((line) => line.split(","))
      .map((id) => id.trim())
      .filter(Boolean);
  }

  // De-duplicate
  const unique = [...new Set(ids)];
  console.log(`  Loaded ${ids.length} student ID(s) from input file.`);
  if (unique.length !== ids.length) {
    console.log(`  Removed ${ids.length - unique.length} duplicate(s) → ${unique.length} unique ID(s).`);
  }
  return unique;
}

// ── Active Term Retrieval ─────────────────────────────────────────────────────
async function getActiveTerm(): Promise<ActiveTerm | null> {
  const snap = await db
    .collection("terms")
    .where("isActive",  "==", true)
    .where("isDeleted", "==", false)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  const data    = docSnap.data();
  return {
    id:       docSnap.id,
    AY:       data.AY      as string,
    semester: data.semester as string,
  };
}

// ── Batch Helper ──────────────────────────────────────────────────────────────
/** Commits an array of WriteBatch instances sequentially. */
async function commitBatches(batches: WriteBatch[]): Promise<void> {
  for (const batch of batches) {
    await batch.commit();
  }
}

/**
 * Chunks an array of items and applies `applyOp` to each item within
 * a series of Firestore batches, each capped at BATCH_LIMIT operations.
 * Returns an array of ready-to-commit batches.
 */
function buildBatches<T>(
  items: T[],
  applyOp: (batch: WriteBatch, item: T) => void
): WriteBatch[] {
  const batches: WriteBatch[] = [];
  let current: WriteBatch | null = null;
  let opsInCurrent = 0;

  for (const item of items) {
    if (!current || opsInCurrent >= BATCH_LIMIT) {
      current = db.batch();
      batches.push(current);
      opsInCurrent = 0;
    }
    applyOp(current, item);
    opsInCurrent++;
  }

  return batches;
}

// ── Step 1 — Archive User Accounts ───────────────────────────────────────────
async function archiveUsers(
  studentIds: string[],
  dryRun: boolean
): Promise<{
  archived:       number;
  alreadyArchived: number;
  missing:        string[];
}> {
  console.log("\n▶ Step 1: Checking user accounts in `users` collection…");

  const missing:         string[] = [];
  const toArchive:       string[] = [];
  const alreadyArchived: string[] = [];

  // Firestore `in` queries are limited to 30 values; chunk accordingly.
  const CHUNK_SIZE = 30;
  for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
    const chunk = studentIds.slice(i, i + CHUNK_SIZE);

    // The `users` collection uses the UID as the document ID.
    // Student accounts are expected to have their studentId stored as the document ID.
    // We'll fetch by document ID using individual gets for accuracy.
    const docRefs = chunk.map((id) => db.collection("users").doc(id));
    const snaps   = await db.getAll(...docRefs);

    for (const snap of snaps) {
      if (!snap.exists) {
        missing.push(snap.id);
        continue;
      }
      const data = snap.data()!;
      if (data.isDeleted === true) {
        alreadyArchived.push(snap.id);
      } else {
        toArchive.push(snap.id);
      }
    }
  }

  console.log(`    Users to archive:         ${toArchive.length}`);
  console.log(`    Users already archived:   ${alreadyArchived.length}`);
  console.log(`    Missing user records:     ${missing.length}`);
  if (missing.length > 0) {
    console.log(`    Missing IDs:              ${missing.join(", ")}`);
  }

  if (!dryRun && toArchive.length > 0) {
    console.log(`    Writing ${toArchive.length} archive update(s) in batches…`);
    const batches = buildBatches(toArchive, (batch, id) => {
      batch.update(db.collection("users").doc(id), {
        isDeleted: true,
        "metadata.updatedAt": new Date(),
      });
    });
    await commitBatches(batches);
    console.log(`    ✓ ${toArchive.length} user(s) archived.`);
  } else if (dryRun) {
    console.log(`    [DRY RUN] Would archive ${toArchive.length} user(s).`);
  }

  return {
    archived:        toArchive.length,
    alreadyArchived: alreadyArchived.length,
    missing,
  };
}

// ── Step 2 — Delete Records from a Collection ─────────────────────────────────
async function deleteRecordsFromCollection(
  collectionName: string,
  studentIds:     string[],
  AY:             string,
  semester:       string,
  dryRun:         boolean
): Promise<number> {
  console.log(`\n  Querying \`${collectionName}\`…`);

  // Firestore `in` queries support up to 30 values
  const CHUNK_SIZE   = 30;
  const docIdsToDelete: string[] = [];

  for (let i = 0; i < studentIds.length; i += CHUNK_SIZE) {
    const chunk = studentIds.slice(i, i + CHUNK_SIZE);

    const snap = await db
      .collection(collectionName)
      .where("studentId",    "in",  chunk)
      .where("academicYear", "==",  AY)
      .where("semester",     "==",  semester)
      .get();

    for (const doc of snap.docs) {
      docIdsToDelete.push(doc.id);
    }
  }

  console.log(`    Found ${docIdsToDelete.length} record(s) to delete.`);

  if (!dryRun && docIdsToDelete.length > 0) {
    console.log(`    Deleting in batches…`);
    const batches = buildBatches(docIdsToDelete, (batch, id) => {
      batch.delete(db.collection(collectionName).doc(id));
    });
    await commitBatches(batches);
    console.log(`    ✓ ${docIdsToDelete.length} record(s) deleted.`);
  } else if (dryRun) {
    console.log(`    [DRY RUN] Would delete ${docIdsToDelete.length} record(s).`);
  }

  return docIdsToDelete.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(" VERIS — Archive Student Records Maintenance Script");
  console.log("═══════════════════════════════════════════════════════════════");

  const { inputFile, dryRun, logFile } = parseArgs();

  if (dryRun) {
    console.log("\n⚠  DRY RUN MODE — No changes will be written to Firestore.");
  }

  // ── Load student IDs ─────────────────────────────────────────────────────
  console.log(`\n▶ Loading student IDs from: ${inputFile}`);
  const studentIds = loadStudentIds(inputFile);

  if (studentIds.length === 0) {
    console.error("ERROR: No valid student IDs found in the input file.");
    process.exit(1);
  }

  // ── Fetch active term ────────────────────────────────────────────────────
  console.log("\n▶ Fetching active Academic Year and Semester from Firestore…");
  const activeTerm = await getActiveTerm();

  if (!activeTerm) {
    console.error("ERROR: No active term found in Firestore. Cannot proceed.");
    process.exit(1);
  }

  console.log(`  Active Academic Year: ${activeTerm.AY}`);
  console.log(`  Active Semester:      ${activeTerm.semester}`);

  // ── Step 1: Archive user accounts ────────────────────────────────────────
  const userResults = await archiveUsers(studentIds, dryRun);

  // ── Step 2: Delete erroneous records ─────────────────────────────────────
  console.log("\n▶ Step 2: Deleting erroneously generated records…");

  const feesDeleted = await deleteRecordsFromCollection(
    "fees",
    studentIds,
    activeTerm.AY,
    activeTerm.semester,
    dryRun
  );

  const finesDeleted = await deleteRecordsFromCollection(
    "fines",
    studentIds,
    activeTerm.AY,
    activeTerm.semester,
    dryRun
  );

  const clearanceDeleted = await deleteRecordsFromCollection(
    "clearanceStatus",
    studentIds,
    activeTerm.AY,
    activeTerm.semester,
    dryRun
  );

  // ── Execution log ────────────────────────────────────────────────────────
  const log: ExecutionLog = {
    activeTerm,
    studentIdsLoaded:         studentIds.length,
    usersArchived:            userResults.archived,
    usersAlreadyArchived:     userResults.alreadyArchived,
    usersMissing:             userResults.missing.length,
    feesDeleted,
    finesDeleted,
    clearanceStatusDeleted:   clearanceDeleted,
    missingUserIds:           userResults.missing,
    errors:                   [],
    dryRun,
    completedAt:              new Date().toISOString(),
  };

  // ── Print summary ────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(dryRun ? " DRY RUN SUMMARY" : " EXECUTION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Active Academic Year:      ${activeTerm.AY}`);
  console.log(`  Active Semester:           ${activeTerm.semester}`);
  console.log(`  Students uploaded:         ${studentIds.length}`);
  console.log(`  Users archived:            ${userResults.archived}`);
  console.log(`  Users already archived:    ${userResults.alreadyArchived}`);
  console.log(`  Missing user records:      ${userResults.missing.length}`);
  console.log(`  Fees deleted:              ${feesDeleted}`);
  console.log(`  Fines deleted:             ${finesDeleted}`);
  console.log(`  Clearance Status deleted:  ${clearanceDeleted}`);
  if (dryRun) {
    console.log("\n  ⚠  DRY RUN — No changes were written to Firestore.");
  } else {
    console.log("\n  ✓  Execution completed successfully.");
  }
  console.log("═══════════════════════════════════════════════════════════════\n");

  // ── Write log file ────────────────────────────────────────────────────────
  if (logFile) {
    const logPath = path.resolve(process.cwd(), logFile);
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2), "utf-8");
    console.log(`Log written to: ${logPath}\n`);
  }
}

main().catch((err) => {
  console.error("\nFATAL ERROR:", err);
  process.exit(1);
});

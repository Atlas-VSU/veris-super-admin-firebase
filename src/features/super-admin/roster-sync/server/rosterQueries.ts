/**
 * Reads the current state the roster is diffed against: the existing student
 * roster, the program/faculty lookup tables, the subscribed organizations, and
 * the active term.
 *
 * Uses the Admin SDK rather than the client-SDK helpers in `src/firebase/`,
 * since this runs server-side.
 */

import { adminDb } from "@/firebase/firebase-admin.config";
import { readStoredYearLevel } from "../utils/parseYearLevel";
import { normaliseStudentId } from "../utils/normaliseStudentId";
import { referenceKey, type RosterReferenceData } from "../utils/resolveRosterReferences";
import type { ExistingStudent } from "../utils/diffRoster";
import type { OrgRef } from "../utils/provisionPlan";
import type { ActiveTerm } from "../types";

/** Two *live* records whose studentIds normalize to the same value — the
 *  database cannot say which one the roster row refers to. An archived record
 *  alongside a live one is not a collision: see `fetchExistingRoster`. */
export interface StudentIdCollision {
  studentId: string;
  docIds:    string[];
}

/**
 * Reads the entire current roster in one query — every `users` doc that has a
 * `studentId` field is a student record; org/super-admin accounts never set
 * that field, so this naturally scopes to students without a role flag.
 *
 * IDENTITY MATCHING: the stored studentId is normalized with the *same*
 * function applied to roster rows before it is used as the lookup key.
 * Normalizing only one side made matching an exact-string comparison between a
 * canonical value and a raw one, so a stored id in any other shape (a stray
 * space, a different dash) missed its roster row — which created a second
 * document for that student AND treated the original as departed, archiving
 * their records. Normalizing both sides closes that path.
 *
 * ARCHIVED PREDECESSORS ARE NOT COLLISIONS. A student can legitimately hold
 * the same Student ID twice: they graduate, their record is archived, and the
 * registrar re-enrols them under the same ID in a new program. The org app
 * creates a fresh record because its duplicate guard filters on
 * `isDeleted == false`, so the archived one is invisible to it — by design.
 *
 * Only two *live* records for one ID are genuinely ambiguous. Those are
 * reported so the caller can refuse to run rather than guess. An archived
 * predecessor alongside a live record is unambiguous: the live one is current,
 * and it is the one matched. Counting archived records here would block a sync
 * over ordinary graduate re-enrolment.
 *
 * The live record also always wins the map. Document order is arbitrary, so
 * letting the last write win could seat the *archived* record as the match —
 * `diffRoster` would then see `isDeleted: true`, mark it reactivated, and the
 * sync would revive the graduate's old record while leaving the student's real
 * one untouched.
 */
export async function fetchExistingRoster(): Promise<{
  map: Map<string, ExistingStudent>;
  collisions: StudentIdCollision[];
}> {
  const snap = await adminDb.collection("users").where("studentId", "!=", "").get();
  const map = new Map<string, ExistingStudent>();
  const liveDocIds = new Map<string, string[]>();

  snap.docs.forEach((doc) => {
    const d = doc.data();
    const raw = String(d.studentId ?? "").trim();
    if (!raw) return;
    const studentId = normaliseStudentId(raw);
    const isDeleted = d.isDeleted === true;

    if (!isDeleted) {
      liveDocIds.set(studentId, [...(liveDocIds.get(studentId) ?? []), doc.id]);
    }

    // A live record always displaces an archived one; never the reverse.
    const seated = map.get(studentId);
    if (seated && !seated.isDeleted && isDeleted) return;

    // Read as a number, and flagged when not already an integer. Comparing the
    // stringified value would make every integer-stored student look "changed"
    // now that the roster side is a number; see `readStoredYearLevel`.
    const storedYearLevel = readStoredYearLevel(d.yearLevel);

    map.set(studentId, {
      docId: doc.id,
      studentId,
      firstName: String(d.firstName ?? ""),
      lastName: String(d.lastName ?? ""),
      yearLevel: storedYearLevel.value,
      yearLevelIsCanonical: storedYearLevel.canonical,
      program: String(d.program ?? ""),
      faculty: String(d.faculty ?? ""),
      programId: String(d.programId ?? ""),
      facultyId: String(d.facultyId ?? ""),
      isDeleted,
    });
  });

  const collisions: StudentIdCollision[] = [];
  for (const [studentId, docIds] of liveDocIds) {
    if (docIds.length > 1) collisions.push({ studentId, docIds });
  }

  return { map, collisions };
}

/**
 * Loads the programs/faculties lookup tables, keyed by both name and acronym
 * (rosters are hand-exported and use either form).
 */
export async function fetchReferenceData(): Promise<RosterReferenceData> {
  const [programsSnap, facultiesSnap] = await Promise.all([
    adminDb.collection("programs").get(),
    adminDb.collection("faculties").get(),
  ]);

  const programs = new Map<string, { id: string; facultyId: string }>();
  programsSnap.docs.forEach((doc) => {
    const d = doc.data();
    const entry = { id: doc.id, facultyId: String(d.facultyId ?? "") };
    for (const label of [d.name, d.acronym]) {
      const key = referenceKey(String(label ?? ""));
      if (key) programs.set(key, entry);
    }
  });

  const faculties = new Map<string, { id: string }>();
  facultiesSnap.docs.forEach((doc) => {
    const d = doc.data();
    const entry = { id: doc.id };
    for (const label of [d.name, d.acronym]) {
      const key = referenceKey(String(label ?? ""));
      if (key) faculties.set(key, entry);
    }
  });

  return { programs, faculties };
}

/** Loads subscribed organizations. Unsubscribed orgs track no clearance. */
export async function fetchSubscribedOrgs(): Promise<OrgRef[]> {
  const snap = await adminDb.collection("organizations").get();
  return snap.docs
    .filter((doc) => doc.data().subscribed === true)
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        programId: (d.programId as string) ?? null,
        facultyId: (d.facultyId as string) ?? null,
        accessLevel: Number(d.accessLevel ?? 0),
      };
    });
}

/** Mirrors `/api/archive-students`' active-term lookup exactly. */
export async function getActiveTerm(): Promise<ActiveTerm | null> {
  const snap = await adminDb
    .collection("terms")
    .where("isActive", "==", true)
    .where("isDeleted", "==", false)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data();
  return { id: doc.id, AY: data.AY as string, semester: data.semester as string };
}

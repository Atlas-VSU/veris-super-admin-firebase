/**
 * Server-side super-admin gate for the roster-sync endpoint.
 *
 * Mirrors the check the client-side route guard already performs, but
 * re-asserted here since this endpoint can create, modify, and soft-delete
 * student records directly.
 */

import type { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/firebase/firebase-admin.config";
import { isSuperAdminRole } from "../utils/isSuperAdminRole";

export type SuperAdminAuth =
  | { ok: true; uid: string; actorName: string }
  | { ok: false; status: number; error: string };

export async function requireSuperAdmin(req: NextRequest): Promise<SuperAdminAuth> {
  const sessionCookie = req.cookies.get("session")?.value;
  if (!sessionCookie) {
    return { ok: false, status: 401, error: "Not authenticated." };
  }

  try {
    // checkRevoked so a signed-out/revoked super-admin can't keep using a
    // stale cookie against this endpoint.
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const data = userDoc.data();

    if (!userDoc.exists || !isSuperAdminRole(data?.role, data?.isDeleted)) {
      return { ok: false, status: 403, error: "Forbidden. Super-admin role required." };
    }

    // Captured for the synchronization log — an audit entry naming only a uid
    // is far less useful months later than one naming a person.
    const actorName =
      `${String(data?.firstName ?? "").trim()} ${String(data?.lastName ?? "").trim()}`.trim() ||
      String(data?.email ?? "").trim() ||
      decoded.uid;

    return { ok: true, uid: decoded.uid, actorName };
  } catch {
    return { ok: false, status: 401, error: "Invalid or expired session." };
  }
}

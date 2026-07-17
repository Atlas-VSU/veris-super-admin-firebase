import { db } from "@/firebase/firebase.config";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import type { OrgSubscription, SubscriptionTier } from "@/features/super-admin/types";
import { toISOString } from "@/utils/dateUtils";
import { metadata } from "@/app/super-admin/dashboard/page";

const subsCollection = collection(db, "subscriptions");

/**
 * Derives the display status of a subscription from the expiry date at read-time.
 * This means the status in Firestore is never stale — every fetch re-evaluates it.
 *
 * Windows:
 *   - No tier              → "not_subscribed"
 *   - No expiresAt         → "active"  (assumed indefinite)
 *   - expiresAt < now      → "expired"
 *   - expiresAt < now+30d  → "expiring_soon"
 *   - else                 → "active"
 */
export function deriveSubscriptionStatus(
  tier: string | null | undefined,
  expiresAt: string | null | undefined
): OrgSubscription["subscriptionStatus"] {
  if (!tier) return "not_subscribed";
  if (!expiresAt) return "active";

  const now = new Date();
  const expiry = new Date(expiresAt);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (expiry < now) return "expired";
  if (expiry < thirtyDaysFromNow) return "expiring_soon";
  return "active";
}

export async function getSubscriptionsForTerm(termId: string): Promise<OrgSubscription[]> {
  try {
    const q = query(subsCollection, where("termId", "==", termId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const d = doc.data();
      // Only derive status for active docs; inactive stays inactive
      const storedStatus = d.status ?? d.subscriptionStatus ?? "not_subscribed";
      const tier = d.tier ?? d.subscriptionTier ?? null;
      const expiresAt = toISOString(d.validUntil ?? d.expiresAt);
      const derivedStatus = storedStatus === "inactive"
        ? "inactive"
        : deriveSubscriptionStatus(tier, expiresAt);
      return {
        id: doc.id,
        organizationId: d.orgId ?? d.organizationId ?? "",
        termId: d.termId ?? "",
        subscriptionTier: tier,
        subscriptionStatus: derivedStatus,
        startsAt: toISOString(d.startsAt),
        expiresAt: expiresAt,
        renewedAt: toISOString(d.renewedAt),
        renewedBy: d.renewedBy ?? null,
        notes: d.notes ?? null,
        createdAt: toISOString(d.createdAt ?? d.updatedAt) ?? new Date().toISOString(),
        updatedAt: toISOString(d.updatedAt) ?? new Date().toISOString(),
        amountPaid: d.amountPaid ?? 0,
        paymentReference: d.paymentReference ?? null,
        paymentMethod: d.paymentMethod ?? null,
      };
    });
  } catch (error) {
    console.error(`Error fetching subscriptions for term ${termId}:`, error);
    return [];
  }
}

export async function updateTier(
  orgId: string,
  newTier: SubscriptionTier | "none",
  termId: string,
  expiresAt?: string,
  amountPaid?: number,
  referenceId?: string,
  paymentMethod?: string
) {
  try {
    if (newTier === "none") {
      // Soft-delete: mark existing active subscription inactive instead of hard delete
      const q = query(
        subsCollection,
        where("orgId", "==", orgId),
        where("termId", "==", termId),
        where("status", "==", "active")
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const subDocRef = doc(subsCollection, snapshot.docs[0].id);
        await updateDoc(subDocRef, {
          status: "inactive",
          updatedAt: Timestamp.now(),
        });
      }

      await updateDoc(doc(collection(db, "organizations"), orgId), {
        subscriptionId: null,
        subscribed: false,
        "metadata.updatedAt": Timestamp.now(),
      })
      return "success";
    }

    // Deactivate the currently active subscription for this org+term
    const q = query(
      subsCollection,
      where("orgId", "==", orgId),
      where("termId", "==", termId),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const subDocRef = doc(subsCollection, snapshot.docs[0].id);
      await updateDoc(subDocRef, {
        status: "inactive",
        updatedAt: Timestamp.now(),
      });
    }

    // Create the new active subscription with payment details
    const subId = await addDoc(subsCollection, {
      orgId,
      termId,
      tier: newTier,
      status: "active",
      startsAt: Timestamp.now(),
      validUntil: expiresAt ?? null,
      amountPaid: amountPaid ?? 0,
      paymentReference: referenceId ?? null,
      paymentMethod: paymentMethod ?? null,
      notes: "Tier updated by super admin.",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await updateDoc(doc(collection(db, "organizations"), orgId), {
      subscriptionId: subId.id,
      subscriptionTier: newTier,
      subscribed: true,
      "metadata.updatedAt": Timestamp.now(),
    })

    return "success";
  } catch (error) {
    console.error(`Error updating tier for organization ${orgId}:`, error);
    throw new Error("Failed to update tier.");
  }
}

export async function saveSubscription(
  termId: string,
  orgId: string,
  subData: Omit<OrgSubscription, "termId" | "organizationId" | "updatedAt">
) {
  try {
    const payload = {
      orgId,
      termId,
      tier: subData.subscriptionTier,
      status: subData.subscriptionStatus,
      startsAt: subData.startsAt ?? null,
      validUntil: subData.expiresAt,
      renewedAt: subData.renewedAt ?? null,
      renewedBy: subData.renewedBy ?? null,
      notes: subData.notes ?? null,
      createdAt: subData.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      amountPaid: subData.amountPaid ?? 0,
      paymentReference: subData.paymentReference ?? null,
      paymentMethod: subData.paymentMethod ?? null,
    };

    // Find the active subscription doc for this org+term; mark it inactive first
    const q = query(
      subsCollection,
      where("orgId", "==", orgId),
      where("termId", "==", termId),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Retire the existing active sub, then create a new one
      await updateDoc(doc(subsCollection, snapshot.docs[0].id), {
        status: "inactive",
        updatedAt: Timestamp.now(),
      });
    }

    // Always create a fresh active subscription record
    const subId = await addDoc(subsCollection, {
      ...payload,
      status: "active",
      startsAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update the org with the subscription ID
    await updateDoc(doc(collection(db, "organizations"), orgId), {
      subscriptionId: subId.id,
      subscriptionTier: subData.subscriptionTier,
      subscribed: true,
      "metadata.updatedAt": Timestamp.now(),
    })
  } catch (error) {
    console.error(`Error saving subscription for term ${termId} and org ${orgId}:`, error);
    throw new Error("Failed to save subscription.");
  }
}

export async function getSubscriptionHistoryForOrg(orgId: string): Promise<OrgSubscription[]> {
  try {
    const q = query(subsCollection, where("orgId", "==", orgId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const d = doc.data();
      const storedStatus = d.status ?? d.subscriptionStatus ?? "not_subscribed";
      const tier = d.tier ?? d.subscriptionTier ?? null;
      const expiresAt = toISOString(d.validUntil ?? d.expiresAt);
      const derivedStatus = storedStatus === "inactive"
        ? "inactive"
        : deriveSubscriptionStatus(tier, expiresAt);
      return {
        id: doc.id,
        organizationId: d.orgId ?? d.organizationId ?? "",
        termId: d.termId ?? "",
        subscriptionTier: tier,
        subscriptionStatus: derivedStatus,
        startsAt: toISOString(d.startsAt),
        expiresAt: expiresAt,
        renewedAt: toISOString(d.renewedAt),
        renewedBy: d.renewedBy ?? null,
        notes: d.notes ?? null,
        createdAt: toISOString(d.createdAt ?? d.updatedAt) ?? new Date().toISOString(),
        updatedAt: toISOString(d.updatedAt) ?? new Date().toISOString(),
        amountPaid: d.amountPaid ?? 0,
        paymentReference: d.paymentReference ?? null,
        paymentMethod: d.paymentMethod ?? null,
      };
    });
  } catch (error) {
    console.error(`Error fetching subscription history for org ${orgId}:`, error);
    return [];
  }
}

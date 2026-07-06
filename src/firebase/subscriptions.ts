import { db } from "@/firebase/firebase.config";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import type { OrgSubscription } from "@/features/super-admin/types";
import { toISOString } from "@/utils/dateUtils";

const subsCollection = collection(db, "subscriptions");

export async function getSubscriptionsForTerm(termId: string): Promise<OrgSubscription[]> {
  try {
    const q = query(subsCollection, where("termId", "==", termId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        organization_id: d.orgId ?? d.organizationId ?? "",
        term_id: d.termId ?? "",
        subscription_tier: d.tier ?? d.subscriptionTier ?? null,
        subscription_status: d.status ?? d.subscriptionStatus ?? "not_subscribed",
        starts_at: toISOString(d.startsAt),
        expires_at: toISOString(d.validUntil ?? d.expiresAt),
        renewed_at: toISOString(d.renewedAt),
        renewed_by: d.renewedBy ?? null,
        notes: d.notes ?? null,
        created_at: toISOString(d.createdAt ?? d.updatedAt) ?? new Date().toISOString(),
        updated_at: toISOString(d.updatedAt) ?? new Date().toISOString(),
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

export async function saveSubscription(
  termId: string,
  orgId: string,
  subData: Omit<OrgSubscription, "term_id" | "organization_id" | "updated_at">
) {
  try {
    const subDocId = `${termId}_${orgId}`;
    const subDocRef = doc(db, "subscriptions", subDocId);

    const payload = {
      orgId: orgId,
      termId: termId,
      tier: subData.subscription_tier,
      status: subData.subscription_status,
      startsAt: subData.starts_at ?? null,
      validUntil: subData.expires_at,
      renewedAt: subData.renewed_at ?? null,
      renewedBy: subData.renewed_by ?? null,
      notes: subData.notes ?? null,
      createdAt: subData.created_at ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      amountPaid: subData.amountPaid ?? 0,
      paymentReference: subData.paymentReference ?? null,
      paymentMethod: subData.paymentMethod ?? null,
    };

    await setDoc(subDocRef, payload);
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
      return {
        id: doc.id,
        organization_id: d.orgId ?? d.organizationId ?? "",
        term_id: d.termId ?? "",
        subscription_tier: d.tier ?? d.subscriptionTier ?? null,
        subscription_status: d.status ?? d.subscriptionStatus ?? "not_subscribed",
        starts_at: toISOString(d.startsAt),
        expires_at: toISOString(d.validUntil ?? d.expiresAt),
        renewed_at: toISOString(d.renewedAt),
        renewed_by: d.renewedBy ?? null,
        notes: d.notes ?? null,
        created_at: toISOString(d.createdAt ?? d.updatedAt) ?? new Date().toISOString(),
        updated_at: toISOString(d.updatedAt) ?? new Date().toISOString(),
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

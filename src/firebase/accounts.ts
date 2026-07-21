import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "./firebase.config";
import { SuperAdminOrg, SuperAdminOrgAccount } from "@/features/super-admin/types";
import { toISOString } from "@/utils/dateUtils";


const accountsCollection = collection(db, "users");

export async function getOrgAccounts(
  orgMap: Map<string, SuperAdminOrg>
): Promise<SuperAdminOrgAccount[]> {
  const q = query(accountsCollection, where("role", "==", "admin"), where("isDeleted", "==", false));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const d = doc.data();
    const orgId: string = d.orgId ?? "";
    const org = orgId ? orgMap.get(orgId) ?? null : null;

    return {
      id: doc.id,
      orgId: orgId,
      orgName: org?.name ?? null,
      positionName: d.name,
      firstName: d.firstName ?? "",
      lastName: d.lastName ?? "",
      fullName: (`${d.firstName ?? ""} ${d.lastName ?? ""}`.trim()) || "Admin User",
      email: d.email ?? "",
      isActive: d.isActive ?? d.isActive ?? true,
      isDeleted: d.isDeleted ?? false,
      createdAt: toISOString(d.createdAt),
    };
  });
}

export async function getAccountsByOrgId(orgId: string): Promise<SuperAdminOrgAccount[]>{
  const q = query(accountsCollection, where("orgId", "==", orgId));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      orgId: d.orgId ?? "",
      orgName: null,
      positionName: d.name,
      firstName: d.firstName ?? "",
      lastName: d.lastName ?? "",
      fullName: (`${d.firstName ?? ""} ${d.lastName ?? ""}`.trim()) || "Admin User",
      email: d.email ?? "",
      isActive: d.isActive ?? true,
      isDeleted: d.isDeleted ?? false,
      createdAt: toISOString(d.createdAt),
    };
  });
}

export const updateAccount = async (accountId: string, accountData: any) => {
  try {
    const accountDocRef = doc(accountsCollection, accountId);
    await updateDoc(accountDocRef, accountData);
  }catch (error) {
    console.error("Error updating account:", error);
    throw error;
  }
}

export const batchUpdateAccounts = async (accounts: SuperAdminOrgAccount[], accountData: any) => {
  try {
    const updatePromises = accounts.map((account) => {
      const accountDocRef = doc(accountsCollection, account.id);
      return updateDoc(accountDocRef, accountData);
    });
    await Promise.all(updatePromises);
  }catch (error) {
    console.error("Error batch updating accounts:", error);
    throw error;
  }
 }
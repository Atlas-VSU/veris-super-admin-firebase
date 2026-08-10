import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "./firebase.config";
import { firebaseConfig } from "./firebase.config";
import { SuperAdminOrg, SuperAdminOrgAccount } from "@/features/super-admin/types";
import { toISOString } from "@/utils/dateUtils";
import { initializeApp, deleteApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import type { CreateOrgAccountFormData } from "@/features/super-admin/org-accounts/types/dialogs.types";


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

/**
 * Creates a new Firebase Auth user account with the given email and temporary
 * password, then writes the user document to the `users` Firestore collection.
 *
 * Uses a **secondary Firebase app instance** so the primary app's auth state
 * (the super-admin session) is never touched.
 */
export async function createOrgAccount(
  data: CreateOrgAccountFormData,
  org: SuperAdminOrg
): Promise<string> {
  // Derive the numeric access level from the linked org
  let accessLevel = 3;
  if (org.level === "department" || (org.level as unknown as number) === 1) {
    accessLevel = 1;
  } else if (org.level === "faculty" || (org.level as unknown as number) === 2) {
    accessLevel = 2;
  }

  // Spin up a temporary secondary Firebase app so that calling
  // createUserWithEmailAndPassword doesn't displace the super-admin's
  // session in the primary app's auth instance.
  const SECONDARY_APP_NAME = "veris-account-creator";
  const existingSecondary = getApps().find((a) => a.name === SECONDARY_APP_NAME);
  
  let secondaryApp = existingSecondary;
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, SECONDARY_APP_NAME);
    if (typeof window !== "undefined") {
      initializeAppCheck(secondaryApp, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
        isTokenAutoRefreshEnabled: true,
      });
    }
  }

  const secondaryAuth = getAuth(secondaryApp);

  let uid: string;
  try {
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      data.email,
      data.tempPassword
    );
    uid = userCredential.user.uid;

    // Sign out of the secondary app immediately — we only needed it to
    // create the Auth user without affecting the primary session.
    await secondaryAuth.signOut();
  } finally {
    await deleteApp(secondaryApp);
  }

  // Write the Firestore document via the primary db (no auth required here).
  const userDocRef = doc(accountsCollection, uid);
  await setDoc(userDocRef, {
    accessLevel,
    createdAt: serverTimestamp(),
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    name: data.name || `${data.firstName} ${data.lastName}`.trim(),
    orgId: data.orgId,
    role: "admin",
    isActive: true,
    isDeleted: false,
  });

  return uid;
}

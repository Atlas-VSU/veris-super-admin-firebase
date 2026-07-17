import type { OrgLevel, SubscriptionTier, SuperAdminOrg, SuperAdminOrgAccount } from "@/features/super-admin/types";
import { addDoc, collection, doc, getCountFromServer, getDocs, limit, orderBy, query, startAfter, updateDoc, where } from "firebase/firestore";
import { db } from "./firebase.config";
import { toISOString } from "@/utils/dateUtils";

export interface CreateOrgPayload {
  name: string;
  shortName: string;
  level: OrgLevel;
  adviser: string;
  president: string;
  contactEmail: string;
  description: string;
  facultyName: string | null;
  facultyAcronym: string | null;
  facultyId: string | null;
  programId: string | null;
  programName: string | null;
  programAcronym: string | null;
}


const orgCollection = collection(db, "organizations");

export async function createOrganization(orgData: CreateOrgPayload): Promise<string> {

  try {
    let level = 1;
    if (orgData.level === "faculty") level = 2;
    else if (orgData.level === "council") level = 3;

    console.log("Creating organization with data:", orgData, "and level:", level);
    const newOrg = {
      accessLevel: level,
      facultyId: orgData.facultyId ? orgData.facultyId : null,
      isArchived: false,
      name: orgData.name,
      adviser: orgData.adviser,
      president: orgData.president,
      contactEmail: orgData.contactEmail,
      description: orgData.description,
      orgAuditorName: "",
      orgAuditorNumber: "",
      orgAuditorUrl: "",
      orgLogoUrl: "",
      orgTreasurerName: "",
      orgTreasurerNumber: "",
      orgTreasurerUrl: "",
      programId: orgData.programId ? orgData.programId : null,
      shortName: orgData.shortName,
      subscribed: false,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    };
    const newDocRef = await addDoc(orgCollection, newOrg);
    return newDocRef.id;
  } catch (error) {
    console.error("Error creating organization:", error);
    throw error;
   }
}

export async function updateOrganization(orgId: string, orgData: any): Promise<void> {
  try {
    const orgDocRef = doc(orgCollection, orgId);
    await updateDoc(orgDocRef, orgData);
  } catch (error) {
    console.error("Error updating organization:", error);
    throw error;
   }

}

export async function getOrgAccounts(
  orgMap: Map<string, SuperAdminOrg>
): Promise<SuperAdminOrgAccount[]> {
  const q = query(collection(db, "users"), where("role", "==", "admin"), where("isDeleted", "==", false));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const d = doc.data();
    const orgId: string = d.orgId ?? "";
    const org = orgId ? orgMap.get(orgId) ?? null : null;

    return {
      id: doc.id,
      orgId: orgId,
      orgName: org?.name ?? null,
      fullName: (`${d.firstName ?? ""} ${d.lastName ?? ""}`.trim()) || "Admin User",
      email: d.email ?? "",
      isActive: d.isActive ?? d.isActive ?? true,
      isDeleted: d.isDeleted ?? false,
      createdAt: toISOString(d.createdAt),
    };
  });
}


export const fetchOrganizationsPaginated = async (
  pageSize: number = 10,
  lastVisibleDoc: any = null,
  searchTerm: string = "",
  sortBy: string = "name-asc",
  lvlFilter: string = "3",
  statFilter: string = "all",
  tierFilter: string = "all",
) => {
  let constraints: any[] = []; 
  if (statFilter === "all") {
      constraints.push(where("isArchived", "==", false));
   }
  if(statFilter === "archived") {
    constraints.push(where("isArchived", "==", true));
  }
  if(statFilter === "active") {
    constraints.push(where("isArchived", "==", false), where("subscribed", "==", true));
  }
  if(statFilter === "inactive") {
    constraints.push(where("isArchived", "==", false), where("subscribed", "==", false));
  }
  
  if (sortBy === "name-asc") {
    constraints.push(orderBy("name", "asc"));
  }
  if (sortBy === "name-desc") {
    constraints.push(orderBy("name", "desc"));
  }
  if (sortBy === "date-newest") { 
    constraints.push(orderBy("metadata.updatedAt", "desc"));
  }
  if (sortBy === "date-oldest") { 
    constraints.push(orderBy("metadata.updatedAt", "asc"));
  }
  if (lvlFilter !== "all") {
    if (lvlFilter === "department") {
    constraints.push(where("accessLevel", "==", 1));
  }
  if (lvlFilter === "faculty") {
    constraints.push(where("accessLevel", "==", 2));
  }
  if (lvlFilter === "council") {
    constraints.push(where("accessLevel", "==", 3));
  }
}
  
  if (tierFilter !== "all") {
    if (tierFilter === "basic") {
      constraints.push(where("subscriptionTier", "==", "basic"));
    }
    if (tierFilter === "plus") {
      constraints.push(where("subscriptionTier", "==", "plus"));
    }
    if (tierFilter === "premium") {
      constraints.push(where("subscriptionTier", "==", "premium"));
    }
   }

  
  constraints.push(limit(pageSize));
  if (lastVisibleDoc) {
    constraints.push(startAfter(lastVisibleDoc));
  }

  let results: any[] = [];
  let totalCount = 0;
  const rawSearch = searchTerm.trim();
  if (searchTerm && rawSearch !== "") {

    const qName = query(orgCollection, ...constraints,
      where("name", ">=", rawSearch),
      where("name", "<=", rawSearch + "\uf8ff")
    );

    const qShortName = query(orgCollection, ...constraints,
      where("shortName", ">=", rawSearch),
      where("shortName", "<=", rawSearch + "\uf8ff")
    );
    try {
      const [nameSnap, shortNameSnap] = await Promise.all([getDocs(qName), getDocs(qShortName)]);

      const resultsMap = new Map();

      nameSnap.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      shortNameSnap.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      results = Array.from(resultsMap.values());
    } catch (error) {
      console.error("Error fetching organizations with search:", error);
      results = [];
     }

  }
  else {
    try {
      const q = query(orgCollection, ...constraints);
      const snap = await getDocs(q);
      results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      totalCount = (await getCountFromServer(q)).data().count;
    }catch (error) {
      console.error("Error fetching organizations:", error);
      results = [];
    }
    
  }
  let accounts : SuperAdminOrgAccount[] = [];
  try {
      const orgMap = new Map(results.map((o) => [o.id, o]));
    // Fetch accounts (needs org map for resolution)
      accounts = await getOrgAccounts(orgMap);
  }catch (error) {
    console.error("Error fetching organization accounts:", error);
  }


  return {
    results,
    totalCount,
    lastVisible: results.length > 0 ? results[results.length - 1] : null,
    accounts,
    hasMore: results.length === pageSize,
  }
}
  

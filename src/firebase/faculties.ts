import { db } from "@/firebase/firebase.config";
import { collection, getDocs } from "firebase/firestore";
import type { SuperAdminFaculty } from "@/features/super-admin/types";

const facultiesCollection = collection(db, "faculties");

export async function getFaculties(): Promise<SuperAdminFaculty[]> {
  try {
    const snapshot = await getDocs(facultiesCollection);
    return snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name ?? "",
        acronym: d.acronym ?? "",
      };
    });
  } catch (error) {
    console.error("Error fetching faculties from Firestore:", error);
    return [];
  }
}

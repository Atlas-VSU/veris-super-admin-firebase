import { db } from "@/firebase/firebase.config";
import { collection, getDocs } from "firebase/firestore";
import type { SuperAdminProgram } from "@/features/super-admin/types";

const programsCollection = collection(db, "programs");

export async function getPrograms(): Promise<SuperAdminProgram[]> {
  try {
    const snapshot = await getDocs(programsCollection);
    return snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name ?? "",
        acronym: d.acronym ?? "",
        faculty_id: d.facultyId ?? "",
      };
    });
  } catch (error) {
    console.error("Error fetching programs from Firestore:", error);
    return [];
  }
}



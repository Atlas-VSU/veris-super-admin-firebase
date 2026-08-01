import type { Metadata } from "next";
import ArchiveStudentsPage from "@/features/super-admin/archive-students/components/ArchiveStudentsPage";

export const metadata: Metadata = {
  title: "Archive Student Records — Super Admin | VERIS",
  description:
    "Maintenance tool to archive graduated student accounts and permanently remove erroneously generated Fees, Fines, and Clearance Status records for the active Academic Year and Semester.",
};

export default function Page() {
  return <ArchiveStudentsPage />;
}

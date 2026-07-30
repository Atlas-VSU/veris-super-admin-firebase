import type { Metadata } from "next";
import SuperAdminOrganizationsPage from "@/features/super-admin/organizations/components/SuperAdminOrganizationsPage";

export const metadata: Metadata = {
  title: "Organizations — Super Admin | VERIS",
  description:
    "Read-only view of all registered organizations on VERIS (VERIS).",
};

export default function Page() {
  return <SuperAdminOrganizationsPage />;
}

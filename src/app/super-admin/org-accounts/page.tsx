import type { Metadata } from "next";
import SuperAdminOrgAccountsPage from "@/features/super-admin/org-accounts/components/SuperAdminOrgAccountsPage";

export const metadata: Metadata = {
  title: "Org Accounts — Super Admin | VERIS",
  description:
    "Read-only view of all organization admin accounts on VERIS (VERIS).",
};

export default function Page() {
  return <SuperAdminOrgAccountsPage />;
}

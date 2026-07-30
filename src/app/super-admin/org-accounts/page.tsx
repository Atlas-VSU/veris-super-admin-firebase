import type { Metadata } from "next";
import SuperAdminOrgAccountsPage from "@/features/super-admin/org-accounts/components/SuperAdminOrgAccountsPage";
import { fetchSuperAdminData } from "@/firebase/super-admin";

export const metadata: Metadata = {
  title: "Org Accounts — Super Admin | VERIS",
  description:
    "Read-only view of all organization admin accounts on VERIS (VERIS).",
};

export default async function Page() {
  const { accounts, orgs } = await fetchSuperAdminData();
  return <SuperAdminOrgAccountsPage accounts={accounts} orgs={orgs} />;
}

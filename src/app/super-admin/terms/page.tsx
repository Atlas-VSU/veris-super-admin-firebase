import type { Metadata } from "next";
import SuperAdminTermsPage from "@/features/super-admin/terms/components/SuperAdminTermsPage";
import { fetchSuperAdminData } from "@/firebase/super-admin";

export const metadata: Metadata = {
  title: "Terms & Subscriptions — Super Admin | VERIS",
  description:
    "Manage organization subscription tiers and renewals for each academic term on VERIS.",
};

export default async function Page() {
  const { orgs } = await fetchSuperAdminData();
  return <SuperAdminTermsPage orgs={orgs} />;
}

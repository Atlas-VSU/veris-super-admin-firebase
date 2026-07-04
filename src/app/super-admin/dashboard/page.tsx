import type { Metadata } from "next";
import SuperAdminDashboardPage from "@/features/super-admin/components/SuperAdminDashboardPage";

export const metadata: Metadata = {
  title: "Dashboard — Super Admin | VERIS",
  description:
    "Platform-level overview of all subscribing organizations on VERIS (VERIS).",
};

export default function Page() {
  return <SuperAdminDashboardPage />;
}

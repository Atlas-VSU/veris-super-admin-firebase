import { fetchSuperAdminData } from "@/firebase/super-admin";
import { DashboardOverview } from "@/features/super-admin/dashboard/components/DashboardOverview";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/features/super-admin/shared/components/PageHeader";

export default async function SuperAdminDashboardPage() {
  const { stats } = await fetchSuperAdminData();

  return (
    <div className="animate-page-enter flex flex-col">
      <PageHeader
        title="PLATFORM OVERVIEW"
        description="Read-only view of all subscribing organizations and their accounts on VERIS (VERIS)."
      />

      <div className="mx-auto max-w-7xl w-full px-5 sm:px-6 xl:px-8 py-8 space-y-8">
        {/* Stats */}
        <DashboardOverview stats={stats} />
      </div>
    </div>
  );
}

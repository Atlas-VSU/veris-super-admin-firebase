
import { OrgsTable } from "@/features/super-admin/organizations/components/OrgsTable";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/features/super-admin/shared/components/PageHeader";

export default async function SuperAdminOrganizationsPage() {

  return (
    <div className="animate-page-enter flex flex-col">
      <PageHeader
        title="ORGANIZATIONS"
        description="All registered organizations across the platform."
      />

      <div className="mx-auto max-w-7xl w-full px-5 sm:px-6 xl:px-8 py-8 space-y-6">
        {/* Table */}
        <OrgsTable />
      </div>
    </div>
  );
}
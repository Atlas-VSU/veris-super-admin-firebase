"use client";

import { OrgAccountsTable } from "@/features/super-admin/org-accounts/components/OrgAccountsTable";
import { CreateOrgAccountDialog } from "@/features/super-admin/org-accounts/components/CreateOrgAccountDialog";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/super-admin/shared/components/PageHeader";
import { useOrgAccounts } from "../hooks/useOrgAccounts";
import type { SuperAdminOrgAccountsPageProps } from "@/features/super-admin/types";



/**
 * Client-side page shell for the Org Accounts section.
 * Receives server-fetched initial data as props (from the parent page.tsx),
 * then manages local state for the "Add Account" dialog.
 */
export default function SuperAdminOrgAccountsPage({
  accounts,
  orgs,
}: SuperAdminOrgAccountsPageProps) {
  const {
    addOrgAccountOpen,
    setAddOrgAccountOpen,
    orgs: dialogOrgs,
    isLoadingOrgs,
    localAccounts,
    setLocalAccounts,
    handleCreateOrgAccount,
  } = useOrgAccounts();

  const mergedAccounts = [
    ...localAccounts.filter(
      (la) => !accounts.some((a) => a.id === la.id)
    ),
    ...accounts,
  ];

  return (
    <div className="animate-page-enter flex flex-col">
      <PageHeader
        title="ORGANIZATION ACCOUNTS"
        description="All organization admin accounts linked to subscribing organizations. Click a row to view full details."
      >
        <Button
          onClick={() => setAddOrgAccountOpen(true)}
          variant="success"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Org Account
        </Button>
      </PageHeader>

      <div className="mx-auto max-w-7xl w-full px-5 sm:px-6 xl:px-8 py-8 space-y-6">
        {/* Table */}
        <OrgAccountsTable accounts={mergedAccounts} orgs={orgs} />
      </div>

      {/* Create dialog */}
      <CreateOrgAccountDialog
        open={addOrgAccountOpen}
        onOpenChange={setAddOrgAccountOpen}
        onCreate={handleCreateOrgAccount}
        orgs={dialogOrgs.length > 0 ? dialogOrgs : orgs}
      />
    </div>
  );
}

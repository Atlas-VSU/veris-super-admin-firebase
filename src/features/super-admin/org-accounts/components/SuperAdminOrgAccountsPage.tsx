"use client";

import { OrgAccountsTable } from "@/features/super-admin/org-accounts/components/OrgAccountsTable";
import { CreateOrgAccountDialog } from "@/features/super-admin/org-accounts/components/CreateOrgAccountDialog";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrgAccounts } from "../hooks/useOrgAccounts";
import type { SuperAdminOrgAccount, SuperAdminOrg } from "@/features/super-admin/types";

interface SuperAdminOrgAccountsPageProps {
  accounts: SuperAdminOrgAccount[];
  orgs: SuperAdminOrg[];
}

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
    <div className="space-y-6 animate-page-enter">
      {/* Page header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-800">Org Accounts</h1>
          </div>
          <Button
            onClick={() => setAddOrgAccountOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Org Account
          </Button>
        </div>
        <p className="text-sm text-slate-500">
          All organization admin accounts linked to subscribing organizations.
          Click a row to view full details.
        </p>
      </div>

      {/* Table */}
      <OrgAccountsTable accounts={mergedAccounts} orgs={orgs} />

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

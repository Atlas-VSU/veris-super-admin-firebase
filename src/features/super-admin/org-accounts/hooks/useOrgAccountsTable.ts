import { useState, useMemo } from "react";
import type { SuperAdminOrgAccount, SuperAdminOrg } from "@/features/super-admin/types";

export function useOrgAccountsTable(accounts: SuperAdminOrgAccount[], orgs: SuperAdminOrg[]) {
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [deletedFilter, setDeletedFilter] = useState<"all" | "not_deleted" | "deleted">("all");
  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<SuperAdminOrgAccount | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const orgMap = useMemo(
    () => new Map(orgs.map((o) => [o.id, o])),
    [orgs]
  );

  const filtered = useMemo(() => {
    return accounts.filter((acc) => {
      if (activeFilter === "active" && !acc.is_active) return false;
      if (activeFilter === "inactive" && acc.is_active) return false;
      if (deletedFilter === "not_deleted" && acc.is_deleted) return false;
      if (deletedFilter === "deleted" && !acc.is_deleted) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          acc.full_name.toLowerCase().includes(q) ||
          acc.email.toLowerCase().includes(q) ||
          (acc.org_name?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [accounts, activeFilter, deletedFilter, search]);

  const linkedOrg = selectedAccount
    ? orgMap.get(selectedAccount.org_id) ?? null
    : null;

  const handleRowClick = (account: SuperAdminOrgAccount) => {
    setSelectedAccount(account);
    setSheetOpen(true);
  };

  return {
    activeFilter,
    setActiveFilter,
    deletedFilter,
    setDeletedFilter,
    search,
    setSearch,
    selectedAccount,
    setSelectedAccount,
    sheetOpen,
    setSheetOpen,
    filtered,
    linkedOrg,
    handleRowClick,
  };
}

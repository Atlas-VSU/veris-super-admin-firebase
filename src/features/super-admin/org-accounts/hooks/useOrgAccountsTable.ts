import { useState, useMemo, useEffect } from "react";
import type { SuperAdminOrgAccount, SuperAdminOrg } from "@/features/super-admin/types";
import { EditAccountFormData } from "../components/EditAccountDialog";
import { updateAccount } from "@/firebase/accounts";
import { toast } from "sonner";

export function useOrgAccountsTable(accounts: SuperAdminOrgAccount[], orgs: SuperAdminOrg[]) {
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [deletedFilter, setDeletedFilter] = useState<"all" | "notDeleted" | "deleted">("all");
  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<SuperAdminOrgAccount | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [localAccounts, setLocalAccounts] = useState(accounts);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const orgMap = useMemo(
    () => new Map(orgs.map((o) => [o.id, o])),
    [orgs]
  );

  useEffect(() => {
    setLocalAccounts(accounts);
  }, [accounts]);

  const filtered = useMemo(() => {
    return localAccounts.filter((acc) => {
      if (activeFilter === "active" && !acc.isActive) return false;
      if (activeFilter === "inactive" && acc.isActive) return false;
      if (deletedFilter === "notDeleted" && acc.isDeleted) return false;
      if (deletedFilter === "deleted" && !acc.isDeleted) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          acc.fullName.toLowerCase().includes(q) ||
          acc.email.toLowerCase().includes(q) ||
          (acc.orgName?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [accounts,localAccounts, activeFilter, deletedFilter, search]);

  const linkedOrg = selectedAccount
    ? orgMap.get(selectedAccount.orgId) ?? null
    : null;

  const handleRowClick = (account: SuperAdminOrgAccount) => {
    setSelectedAccount(account);
    setSheetOpen(true);
  };

  const handleEditAccount = async (accountId: string, account: EditAccountFormData) => { 
    if (account) {
      try {
        await updateAccount(accountId, account);
        setLocalAccounts((prev) =>
          prev.map((acc) => {
            if (acc.id === accountId) {
              const updated = {
                ...acc,
                ...account,
              };
              if (selectedAccount && selectedAccount.id === accountId) {
                setSelectedAccount(updated);
              }
              return updated;
            }
            return acc;
          })
        );
        toast.success("Account details updated successfully!");
      }
      catch (error) {
        console.error("Error updating organization:", error);
        toast.error("Failed to update account details. Please try again.");
      }
    }

  }

  const handleToggleDeleteSubmit = async () => {
    if (!selectedAccount) return;

    try {
      const isDeleted = !selectedAccount.isDeleted;

      await updateAccount(selectedAccount.id, {isDeleted, isActive: !isDeleted});

      setLocalAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === selectedAccount.id) {
            const updated = {
              ...acc,
              isDeleted,
              isActive: !isDeleted
            };
            setSelectedAccount(updated);
            return updated;
          }
          return acc;
        })
      );

      toast.success(
        `Account ${isDeleted? "deleted":"restored"} successfully!`
      );
    } catch (error) {
      console.error("Error updating account:", error);
      toast.error(
        `Failed to ${selectedAccount.isDeleted? "deleted":"restored"}  account. Please try again.`
      );
    } finally {
      setDeleteConfirmOpen(false);
    }
   }

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
    editOpen,
    setEditOpen,
    handleEditAccount,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    handleToggleDeleteSubmit
  };
}

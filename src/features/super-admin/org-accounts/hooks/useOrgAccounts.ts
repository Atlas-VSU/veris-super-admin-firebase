"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { SuperAdminOrg, SuperAdminOrgAccount } from "@/features/super-admin/types";
import { createOrgAccount } from "@/firebase/accounts";
import { fetchOrganizationsPaginated } from "@/firebase/organizations";
import type { CreateOrgAccountFormData } from "../types/dialogs.types";

export function useOrgAccounts() {
  const [addOrgAccountOpen, setAddOrgAccountOpen] = useState(false);
  const [orgs, setOrgs] = useState<SuperAdminOrg[]>([]);
  const [localAccounts, setLocalAccounts] = useState<SuperAdminOrgAccount[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  useEffect(() => {
    async function loadOrgs() {
      setIsLoadingOrgs(true);
      try {
        const { results } = await fetchOrganizationsPaginated(
          200,   
          null,
          "",
          "name-asc",
          "all",
          "all",
          "all"
        );
        setOrgs(
          results.map((o: any) => ({
            id: o.id,
            name: o.name ?? "",
            shortName: o.shortName ?? "",
            level: o.accessLevel === 1 ? "department" : o.accessLevel === 2 ? "faculty" : "council",
            facultyId: o.facultyId ?? null,
            facultyName: null,
            facultyAcronym: null,
            programId: o.programId ?? null,
            programName: null,
            programAcronym: null,
            isArchived: o.isArchived ?? false,
            subscribed: o.subscribed ?? false,
            subscriptionTier: o.subscriptionTier ?? null,
          } as SuperAdminOrg))
        );
      } catch (err) {
        console.error("useOrgAccounts: failed to load orgs", err);
      } finally {
        setIsLoadingOrgs(false);
      }
    }
    loadOrgs();
  }, []);

  const handleCreateOrgAccount = async (data: CreateOrgAccountFormData) => {
    const linkedOrg = orgs.find((o) => o.id === data.orgId);
    if (!linkedOrg) {
      toast.error("Selected organization not found.");
      return;
    }

    try {
      const newUid = await createOrgAccount(data, linkedOrg);

      const newAccount: SuperAdminOrgAccount = {
        id: newUid,
        orgId: data.orgId,
        orgName: linkedOrg.name,
        positionName: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        isActive: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      };

      setLocalAccounts((prev) => [newAccount, ...prev]);

      toast.success(
        `Account for ${data.firstName} ${data.lastName} created successfully!`
      );
    } catch (err: any) {
      console.error("handleCreateOrgAccount error:", err);

      if (err?.code === "auth/email-already-in-use") {
        toast.error("An account with this email already exists.");
      } else if (err?.code === "auth/weak-password") {
        toast.error("Password is too weak. Please use at least 6 characters.");
      } else if (err?.code === "auth/invalid-email") {
        toast.error("The email address is invalid.");
      } else {
        toast.error("Failed to create account. Please try again.");
      }

      throw err;
    }
  };

  return {
    addOrgAccountOpen,
    setAddOrgAccountOpen,
    orgs,
    isLoadingOrgs,
    localAccounts,
    setLocalAccounts,
    handleCreateOrgAccount,
  };
}
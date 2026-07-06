import { useState, useMemo, useEffect } from "react";
import type { SuperAdminOrg, SuperAdminOrgAccount, OrgLevel, SubscriptionTier, SuperAdminFaculty, SuperAdminProgram } from "@/features/super-admin/types";
import { createOrganization, updateOrganization } from "@/firebase/organizations";
import { getFaculties } from "@/firebase/faculties";
import { getPrograms } from "@/firebase/programs";
import { toast } from "sonner";

export function useOrgsTable(orgs: SuperAdminOrg[], accounts: SuperAdminOrgAccount[]) {
  const [localOrgs, setLocalOrgs] = useState<SuperAdminOrg[]>([]);
  const [faculties, setFaculties] = useState<SuperAdminFaculty[]>([]);
  const [programs, setPrograms] = useState<SuperAdminProgram[]>([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<OrgLevel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "archived">("all");
  const [tierFilter, setTierFilter] = useState<SubscriptionTier | "all">("all");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "date-newest" | "date-oldest">("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [selectedOrg, setSelectedOrg] = useState<SuperAdminOrg | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [archiveTargetOrg, setArchiveTargetOrg] = useState<SuperAdminOrg | null>(null);

  useEffect(() => {
    setLocalOrgs(orgs);
  }, [orgs]);

  useEffect(() => {
    async function loadData() {
      try {
        const [facList, progList] = await Promise.all([
          getFaculties(),
          getPrograms(),
        ]);
        setFaculties(facList);
        setPrograms(progList);
      } catch (error) {
        console.error("Error loading faculties or programs:", error);
      }
    }
    loadData();
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, levelFilter, statusFilter, tierFilter, sortBy]);

  const handleCreateOrg = async (orgData: {
    name: string;
    short_name: string;
    level: OrgLevel;
    adviser: string;
    president: string;
    contact_email: string;
    description: string;
    faculty_name: string | null;
    faculty_acronym: string | null;
    faculty_id: string | null;
    program_id: string | null;
    program_name: string | null;
    program_acronym: string | null;
  }) => {
    try {
      const newId = await createOrganization(orgData);

      const newOrg: SuperAdminOrg = {
        id: newId,
        name: orgData.name,
        short_name: orgData.short_name,
        level: orgData.level,
        faculty_id: orgData.faculty_id,
        faculty_name: orgData.faculty_name,
        faculty_acronym: orgData.faculty_acronym,
        program_id: orgData.program_id,
        program_name: orgData.program_name,
        program_acronym: orgData.program_acronym,
        is_archived: false,
        subscribed: false,
        subscription_tier: null,
        adviser: orgData.adviser,
        president: orgData.president,
        contact_email: orgData.contact_email,
        description: orgData.description,
        created_at: new Date().toISOString().split("T")[0],
      };

      setLocalOrgs((prev) => [newOrg, ...prev]);
      toast.success(`Organization "${newOrg.name}" has been created!`);
    } catch (err) {
      toast.error("Failed to create organization.");
    }
  };

  const handleEditOrg = async (
    orgId: string,
    orgData: {
      name: string;
      short_name: string;
      level: OrgLevel;
      adviser: string;
      president: string;
      contact_email: string;
      description: string;
      faculty_name: string | null;
      faculty_acronym: string | null;
      faculty_id: string | null;
      program_id: string | null;
      program_name: string | null;
      program_acronym: string | null;
    }
  ) => {
    try {
      await updateOrganization(orgId, orgData);

      setLocalOrgs((prev) =>
        prev.map((org) => {
          if (org.id === orgId) {
            const updated = {
              ...org,
              ...orgData,
            };
            if (selectedOrg && selectedOrg.id === orgId) {
              setSelectedOrg(updated);
            }
            return updated;
          }
          return org;
        })
      );
      toast.success("Organization details updated successfully!");
    } catch (err) {
      toast.error("Failed to update organization.");
    }
  };

  const handleToggleArchiveConfirm = (org: SuperAdminOrg) => {
    setArchiveTargetOrg(org);
    setArchiveConfirmOpen(true);
  };

  const handleToggleArchiveSubmit = async () => {
    if (!archiveTargetOrg) return;

    try {
      const nextArchiveState = !archiveTargetOrg.is_archived;
      await updateOrganization(archiveTargetOrg.id, {
        is_archived: nextArchiveState,
      });

      setLocalOrgs((prev) =>
        prev.map((org) => {
          if (org.id === archiveTargetOrg.id) {
            const updated = {
              ...org,
              is_archived: nextArchiveState,
            };
            if (selectedOrg && selectedOrg.id === org.id) {
              setSelectedOrg(updated);
            }
            return updated;
          }
          return org;
        })
      );

      const actionText = nextArchiveState ? "archived" : "reactivated";
      toast.success(`Organization "${archiveTargetOrg.name}" has been ${actionText}.`);
      setArchiveConfirmOpen(false);
    } catch (err) {
      toast.error("Failed to update organization archive status.");
    }
  };

  const filteredAndSortedOrgs = useMemo(() => {
    let result = localOrgs.filter((org) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = org.name.toLowerCase().includes(q) || org.short_name.toLowerCase().includes(q);
        const matchesAcronym = org.faculty_acronym?.toLowerCase().includes(q) || org.program_acronym?.toLowerCase().includes(q);
        const matchesAdviser = org.adviser?.toLowerCase().includes(q);
        if (!matchesName && !matchesAcronym && !matchesAdviser) return false;
      }

      if (levelFilter !== "all" && org.level !== levelFilter) return false;

      if (statusFilter !== "all") {
        if (statusFilter === "archived" && !org.is_archived) return false;
        if (statusFilter === "active" && (org.is_archived || !org.subscribed)) return false;
        if (statusFilter === "inactive" && (org.is_archived || org.subscribed)) return false;
      }

      if (tierFilter !== "all" && org.subscription_tier !== tierFilter) return false;

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "date-newest") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortBy === "date-oldest") {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      return 0;
    });

    return result;
  }, [localOrgs, search, levelFilter, statusFilter, tierFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedOrgs.length / itemsPerPage);
  const paginatedOrgs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedOrgs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedOrgs, currentPage]);

  return {
    localOrgs,
    search,
    setSearch,
    levelFilter,
    setLevelFilter,
    statusFilter,
    setStatusFilter,
    tierFilter,
    setTierFilter,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    selectedOrg,
    setSelectedOrg,
    sheetOpen,
    setSheetOpen,
    createOpen,
    setCreateOpen,
    editOpen,
    setEditOpen,
    archiveConfirmOpen,
    setArchiveConfirmOpen,
    archiveTargetOrg,
    filteredAndSortedOrgs,
    totalPages,
    paginatedOrgs,
    handleCreateOrg,
    handleEditOrg,
    handleToggleArchiveConfirm,
    handleToggleArchiveSubmit,
    itemsPerPage,
    faculties,
    programs,
  };
}

"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/features/super-admin/shared/components/TierBadge";
import { StatusBadge } from "@/features/super-admin/shared/components/StatusBadge";
import { OrgDetailSheet } from "./OrgDetailSheet";
import { TableSkeleton } from "@/features/super-admin/shared/components/TableSkeleton";
import { CreateOrgDialog } from "./CreateOrgDialog";
import { EditOrgDialog } from "./EditOrgDialog";
import type {
  SuperAdminOrg,
  SuperAdminOrgAccount,
  OrgLevel,
  SubscriptionTier,
} from "@/features/super-admin/types";
import {
  Building2,
  Search,
  Plus,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Archive,
  Eye,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { createOrganization, updateOrganization } from "@/firebase/organizations";

interface OrgsTableProps {
  orgs: SuperAdminOrg[];
  accounts: SuperAdminOrgAccount[];
  isLoading?: boolean;
}

const levelLabels: Record<OrgLevel, string> = {
  department: "Department",
  faculty: "Faculty",
  council: "Council",
};

export function OrgsTable({ orgs, accounts, isLoading = false }: OrgsTableProps) {
  // --- STATE ---
  const [localOrgs, setLocalOrgs] = useState<SuperAdminOrg[]>([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<OrgLevel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "archived">("all");
  const [tierFilter, setTierFilter] = useState<SubscriptionTier | "all">("all");
  
  // Sorting: name-asc, name-desc, date-newest, date-oldest
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "date-newest" | "date-oldest">("name-asc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected Target for Details Sheet
  const [selectedOrg, setSelectedOrg] = useState<SuperAdminOrg | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Modal Triggers
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [archiveTargetOrg, setArchiveTargetOrg] = useState<SuperAdminOrg | null>(null);

  // Initialize state with Firestore loaded orgs
  useEffect(() => {
    setLocalOrgs(orgs);
  }, [orgs]);

  // --- ACTIONS HANDLERS ---
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
  }) => {
    try {
      const newId = await createOrganization(orgData);

      const newOrg: SuperAdminOrg = {
        id: newId,
        name: orgData.name,
        short_name: orgData.short_name,
        level: orgData.level,
        faculty_id: null,
        faculty_name: orgData.faculty_name,
        faculty_acronym: orgData.faculty_acronym,
        program_id: null,
        program_name: null,
        program_acronym: null,
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

  // --- FILTER & SORT LOGIC ---
  const filteredAndSortedOrgs = useMemo(() => {
    // 1. Filtering
    let result = localOrgs.filter((org) => {
      // Search term
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = org.name.toLowerCase().includes(q) || org.short_name.toLowerCase().includes(q);
        const matchesAcronym = org.faculty_acronym?.toLowerCase().includes(q) || org.program_acronym?.toLowerCase().includes(q);
        const matchesAdviser = org.adviser?.toLowerCase().includes(q);
        if (!matchesName && !matchesAcronym && !matchesAdviser) return false;
      }

      // Level
      if (levelFilter !== "all" && org.level !== levelFilter) return false;

      // Status: active, inactive, archived
      if (statusFilter !== "all") {
        if (statusFilter === "archived" && !org.is_archived) return false;
        if (statusFilter === "active" && (org.is_archived || !org.subscribed)) return false;
        if (statusFilter === "inactive" && (org.is_archived || org.subscribed)) return false;
      }

      // Subscription Tier
      if (tierFilter !== "all" && org.subscription_tier !== tierFilter) return false;

      return true;
    });

    // 2. Sorting
    result.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === "date-newest") {
        const dateA = a.created_at || "";
        const dateB = b.created_at || "";
        return dateB.localeCompare(dateA);
      }
      if (sortBy === "date-oldest") {
        const dateA = a.created_at || "";
        const dateB = b.created_at || "";
        return dateA.localeCompare(dateB);
      }
      return 0;
    });

    return result;
  }, [localOrgs, search, levelFilter, statusFilter, tierFilter, sortBy]);

  // --- PAGINATION CALCULATION ---
  const totalPages = Math.ceil(filteredAndSortedOrgs.length / itemsPerPage);
  const paginatedOrgs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedOrgs.slice(start, start + itemsPerPage);
  }, [filteredAndSortedOrgs, currentPage]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, levelFilter, statusFilter, tierFilter, sortBy]);

  const linkedAccounts = selectedOrg
    ? accounts.filter((a) => a.org_id === selectedOrg.id)
    : [];

  const handleRowClick = (org: SuperAdminOrg) => {
    setSelectedOrg(org);
    setSheetOpen(true);
  };

  const handleTriggerEdit = (org: SuperAdminOrg) => {
    setSelectedOrg(org);
    setEditOpen(true);
  };

  return (
    <>
      {/* Search and Action Header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search organizations or advisers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm border-blue-100 focus-visible:ring-blue-300 bg-white"
          />
        </div>

        {/* Level filter */}
        <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as OrgLevel | "all")}>
          <SelectTrigger className="w-[140px] h-9 text-sm border-blue-100 bg-white">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="department">Department</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
            <SelectItem value="council">Council</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[140px] h-9 text-sm border-blue-100 bg-white">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
            <SelectItem value="archived">Archived Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Sorting controls */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[160px] h-9 text-sm border-blue-100 bg-white flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="date-newest">Newest Created</SelectItem>
            <SelectItem value="date-oldest">Oldest Created</SelectItem>
          </SelectContent>
        </Select>

        {/* Create Button */}
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 shadow-sm flex items-center gap-1.5 ml-auto text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Create Org
        </Button>
      </div>

      {/* Main Table */}
      <div className="rounded-lg border border-blue-50 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-blue-50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 pl-4">
                Logo / Name
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">
                Acronym
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">
                Level
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 hidden md:table-cell">
                Adviser
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 hidden lg:table-cell">
                President
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 hidden sm:table-cell">
                Created
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 pr-4 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <TableSkeleton rows={itemsPerPage} cols={8} />
          ) : paginatedOrgs.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Building2 className="h-10 w-10 text-slate-200 mb-3" />
                    <p className="text-sm font-medium text-slate-500">
                      No organizations found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search queries or category filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {paginatedOrgs.map((org) => {
                const isOrgActive = !org.is_archived && org.subscribed;
                const isOrgInactive = !org.is_archived && !org.subscribed;

                return (
                  <TableRow
                    key={org.id}
                    className="cursor-pointer hover:bg-blue-50/20 transition-colors border-b border-slate-50 last:border-0"
                    onClick={() => handleRowClick(org)}
                  >
                    {/* Logo/Name */}
                    <TableCell className="py-3 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs shrink-0 border border-blue-200">
                          {org.short_name ? org.short_name.substring(0, 3).toUpperCase() : org.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">
                          {org.name}
                        </span>
                      </div>
                    </TableCell>

                    {/* Acronym */}
                    <TableCell className="py-3 font-mono text-xs text-slate-500 font-medium">
                      {org.short_name || "—"}
                    </TableCell>

                    {/* Level */}
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium bg-blue-50 text-blue-700 border-blue-100"
                      >
                        {levelLabels[org.level] ?? org.level}
                      </Badge>
                    </TableCell>

                    {/* Adviser */}
                    <TableCell className="py-3 hidden md:table-cell text-xs text-slate-600 font-medium">
                      {org.adviser || "—"}
                    </TableCell>

                    {/* President */}
                    <TableCell className="py-3 hidden lg:table-cell text-xs text-slate-600 font-medium">
                      {org.president || "—"}
                    </TableCell>

                    {/* Status indicator */}
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold border ${
                          org.is_archived
                            ? "bg-gray-100 text-gray-500 border-gray-200"
                            : org.subscribed
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {org.is_archived ? "Archived" : org.subscribed ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    {/* Created Date */}
                    <TableCell className="py-3 hidden sm:table-cell text-xs text-slate-500 font-mono">
                      {org.created_at || "—"}
                    </TableCell>

                    {/* Actions column */}
                    <TableCell className="py-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border border-slate-100 text-xs">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRowClick(org)} className="flex items-center gap-2">
                            <Eye className="h-3.5 w-3.5 text-slate-400" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTriggerEdit(org)} className="flex items-center gap-2">
                            <Edit2 className="h-3.5 w-3.5 text-slate-400" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleArchiveConfirm(org)} className="flex items-center gap-2 text-amber-600 focus:text-amber-700">
                            <Archive className="h-3.5 w-3.5 text-amber-400" />
                            {org.is_archived ? "Reactivate Org" : "Archive Org"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          )}
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-xs text-slate-500 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 text-xs border-slate-200"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-8 text-xs border-slate-200"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Sheet */}
      <OrgDetailSheet
        org={selectedOrg}
        linkedAccounts={linkedAccounts}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onEdit={handleTriggerEdit}
        onToggleArchive={handleToggleArchiveConfirm}
      />

      {/* CREATE DIALOG */}
      <CreateOrgDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreateOrg}
      />

      {/* EDIT DIALOG */}
      <EditOrgDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        org={selectedOrg}
        onSave={handleEditOrg}
      />

      {/* ARCHIVE CONFIRM DIALOG */}
      <AlertDialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <AlertDialogContent className="bg-white border border-slate-100 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-500" /> Confirm Action
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Are you sure you want to {archiveTargetOrg?.is_archived ? "reactivate" : "archive"} the organization{" "}
              <span className="font-bold text-slate-700">"{archiveTargetOrg?.name}"</span>?
              {!archiveTargetOrg?.is_archived && " Archiving will hide the organization from typical listings."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-slate-200 text-slate-600 text-xs h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleArchiveSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

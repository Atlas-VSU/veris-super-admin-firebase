"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import type { SuperAdminOrg } from "@/features/super-admin/types";

// Subcomponents
import { TermStatsCards } from "./TermStatsCards";
import { TermFilterCard } from "./TermFilterCard";
import { OrgSubscriptionsTable } from "./TermSubscriptionsTable";
import { SetActiveTermDialog } from "./SetActiveTermDialog";
import { RenewSubscriptionDialog } from "./RenewSubscriptionDialog";
import { ChangeTierDialog } from "./ChangeTierDialog";
import { SubscriptionHistorySheet } from "./SubscriptionHistorySheet";

// Hook
import { useSuperAdminTerms } from "../hooks/useSuperAdminTerms";
import useSuperAdminActions from "../hooks/useSuperAdminActions";
import { Term } from "@/constants/types";
import { CreateNewTermDialog } from "./CreateNewTermDialog";

export default function SuperAdminTermsPage({ orgs }: { orgs: SuperAdminOrg[] }) {
  const {
    terms,
    selectedTermId,
    setSelectedTermId,
    searchQuery,
    setSearchQuery,
    tierFilter,
    setTierFilter,
    statusFilter,
    setStatusFilter,
    selectedTerm,
    filteredOrgs,
    termStats,
    selectedOrg,
    setActiveTermOpen,
    setSetActiveTermOpen,
    addTermOpen,
    setAddTermOpen,
    renewOpen,
    setRenewOpen,
    changeTierOpen,
    setChangeTierOpen,
    historyOpen,
    setHistoryOpen,
    orgSubscriptionHistory,
    activeSubForSelected,
    handleOpenRenew,
    handleOpenChangeTier,
    handleOpenHistory,
    handleRenew,
    handleChangeTier,
  } = useSuperAdminTerms(orgs);

  const {
    onAddTerm,
    onSetNewActiveTerm,
  } = useSuperAdminActions();

  const handleCreateTerm = async (newAY: string, newSemester: string) => {
    await onSetNewActiveTerm(newAY, newSemester);
    setSetActiveTermOpen(false);
  }

  const handleAddNewTerm = async (term: Term, setActive: boolean) => {
    await onAddTerm(term, setActive);
    setAddTermOpen(false);
  }

  return (
    <div className="space-y-6 animate-page-enter">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-800">Terms & Subscriptions</h1>
          </div>
          <p className="text-sm text-slate-500">
            Manage organization subscription tiers and renewal processes independently for each academic term.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => setSetActiveTermOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" /> Set New Active Term
          </Button>
          <Button
            onClick={() => setAddTermOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add a New Term
          </Button>
        </div>
      </div>

      {/* OVERVIEW STATS ROW */}
      <TermStatsCards
        totalSubscribed={termStats.totalSubscribed}
        totalOrgs={orgs.length}
        needsRenewalCount={termStats.needsRenewalCount}
        expiringCount={termStats.expiringCount}
        expiredCount={termStats.expiredCount}
        totalRevenue={termStats.totalRevenue}
        selectedTerm={selectedTerm}
      />

      {/* SEARCH AND FILTERS */}
      <TermFilterCard
        terms={terms}
        selectedTermId={selectedTermId}
        setSelectedTermId={setSelectedTermId}
        selectedTerm={selectedTerm}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        tierFilter={tierFilter}
        setTierFilter={setTierFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        filteredCount={filteredOrgs.length}
      />

      {/* SUBSCRIPTIONS TABLE */}
      <OrgSubscriptionsTable
        filteredOrgs={filteredOrgs}
        selectedTerm={selectedTerm}
        onOpenChangeTier={handleOpenChangeTier}
        onOpenRenew={handleOpenRenew}
        onOpenHistory={handleOpenHistory}
      />

      {/* --- MODAL DIALOGS --- */}

      {/* SET ACTIVE TERM DIALOG */}
      <SetActiveTermDialog
        open={setActiveTermOpen}
        onOpenChange={setSetActiveTermOpen}
        onSubmit={handleCreateTerm}
        terms={terms}
      />

      <CreateNewTermDialog
        open={addTermOpen}
        onOpenChange={setAddTermOpen}
        onSubmit={handleAddNewTerm}
        existingTerms={terms}
      />

      {/* RENEW SUBSCRIPTION DIALOG */}
      <RenewSubscriptionDialog
        open={renewOpen}
        onOpenChange={setRenewOpen}
        org={selectedOrg}
        selectedTerm={selectedTerm}
        currentSub={activeSubForSelected}
        onRenew={handleRenew}
      />

      {/* CHANGE TIER DIALOG */}
      <ChangeTierDialog
        open={changeTierOpen}
        onOpenChange={setChangeTierOpen}
        org={selectedOrg}
        currentSub={activeSubForSelected}
        onChangeTier={handleChangeTier}
        isNew={activeSubForSelected?.subscriptionStatus == "inactive"}
      />

      {/* SUBSCRIPTION HISTORY DRAWERS SHEET */}
      <SubscriptionHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        org={selectedOrg}
        historyList={orgSubscriptionHistory}
      />
    </div>
  );
}

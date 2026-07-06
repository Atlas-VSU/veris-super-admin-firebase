import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import type { SuperAdminOrg, SubscriptionTier, Term, OrgSubscription } from "@/features/super-admin/types";
import { getAllTerms } from "@/firebase/term";
import { getSubscriptionsForTerm, getSubscriptionHistoryForOrg } from "@/firebase/subscriptions";

export interface MappedOrg extends SuperAdminOrg {
  termSub: OrgSubscription;
}

export function useSuperAdminTerms(orgs: SuperAdminOrg[]) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<OrgSubscription[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<SubscriptionTier | "all" | "none">("all");
  const [statusFilter, setStatusFilter] = useState<OrgSubscription["subscription_status"] | "all" | "needs_renewal">("all");

  const [createTermOpen, setCreateTermOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [changeTierOpen, setChangeTierOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [selectedOrg, setSelectedOrg] = useState<SuperAdminOrg | null>(null);

  // Initialize: Load terms on mount from Database
  useEffect(() => {
    let active = true;
    async function loadTerms() {
      const firebasePromise = getAllTerms();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 4000)
      );

      try {
        const allTerms = await Promise.race([firebasePromise, timeoutPromise]);
        if (!active) return;
        if (allTerms && allTerms.length > 0) {
          setTerms(allTerms);
          const activeTerm = allTerms.find((t) => t.isActive);
          if (activeTerm) {
            setSelectedTermId(activeTerm.id || "");
          } else {
            setSelectedTermId(allTerms[0].id || "");
          }
        }
      } finally {
        if (active) {
          setIsInitializing(false);
        }
      }
    }
    loadTerms();
    return () => {
      active = false;
    };
  }, []);

  // Fetch subscriptions for selected term from Database
  useEffect(() => {
    if (!selectedTermId) return;
    let active = true;
    async function loadSubscriptions() {
      const firebasePromise = getSubscriptionsForTerm(selectedTermId);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 4000)
      );

      try {
        const subs = await Promise.race([firebasePromise, timeoutPromise]);
        if (!active) return;
        if (subs && subs.length > 0) {
          setSubscriptions(subs);
        }
      } catch (err) {
        if (!active) return;
        console.warn("Subscriptions load failed or timed out.", err);
      }
    }
    loadSubscriptions();
    return () => {
      active = false;
    };
  }, [selectedTermId]);

  // Selected term details helper
  const selectedTerm = useMemo(() => terms.find((t) => t.id === selectedTermId), [terms, selectedTermId]);

  const mappedOrganizations = useMemo(() => {
    return orgs.map((org) => {
      const sub = subscriptions.find((s) => s.organization_id === org.id && s.term_id === selectedTermId) || {
        organization_id: org.id,
        term_id: selectedTermId,
        subscription_tier: null,
        subscription_status: "not_subscribed" as const,
        expires_at: null,
        amountPaid: 0,
        paymentReference: null,
        paymentMethod: null,
      };
      return {
        ...org,
        termSub: sub,
      };
    });
  }, [orgs, subscriptions, selectedTermId]);

  const filteredOrgs = useMemo(() => {
    return mappedOrganizations.filter((org) => {
      if (org.is_archived) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = org.name.toLowerCase().includes(q) || org.short_name?.toLowerCase().includes(q);
        const matchesFaculty = org.faculty_name?.toLowerCase().includes(q) || org.faculty_acronym?.toLowerCase().includes(q);
        if (!matchesName && !matchesFaculty) return false;
      }

      if (tierFilter !== "all") {
        if (tierFilter === "none") {
          if (org.termSub.subscription_tier !== null) return false;
        } else {
          if (org.termSub.subscription_tier !== tierFilter) return false;
        }
      }

      if (statusFilter !== "all") {
        if (statusFilter === "needs_renewal") {
          const needs = ["expiring_soon", "expired", "pending_renewal"].includes(org.termSub.subscription_status);
          if (!needs) return false;
        } else {
          if (org.termSub.subscription_status !== statusFilter) return false;
        }
      }

      return true;
    });
  }, [mappedOrganizations, searchQuery, tierFilter, statusFilter]);

  // --- STATS AGGREGATION ---
  const termStats = useMemo(() => {
    let activeCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    let pendingCount = 0;
    let totalRevenue = 0;

    subscriptions.forEach((sub) => {
      if (sub.subscription_status === "active") activeCount++;
      if (sub.subscription_status === "expiring_soon") expiringCount++;
      if (sub.subscription_status === "expired") expiredCount++;
      if (sub.subscription_status === "pending_renewal") pendingCount++;
      totalRevenue += sub.amountPaid;
    });

    return {
      activeCount,
      expiringCount,
      expiredCount,
      pendingCount,
      needsRenewalCount: expiringCount + expiredCount + pendingCount,
      totalSubscribed: activeCount + expiringCount + expiredCount,
      totalRevenue,
    };
  }, [subscriptions]);

  const handleOpenRenew = (org: SuperAdminOrg, currentSub: OrgSubscription) => {
    setSelectedOrg(org);
    setRenewOpen(true);
  };

  const handleOpenChangeTier = (org: SuperAdminOrg, currentSub: OrgSubscription) => {
    setSelectedOrg(org);
    setChangeTierOpen(true);
  };

  const handleOpenHistory = (org: SuperAdminOrg) => {
    setSelectedOrg(org);
    setHistoryOpen(true);
  };

  const handleRenew = async (
    orgId: string,
    tier: SubscriptionTier,
    validUntil: string,
    amount: number,
    refNum: string,
    method: string
  ) => {
    if (!selectedOrg) return;

    const newSub: OrgSubscription = {
      organization_id: orgId,
      term_id: selectedTermId,
      subscription_tier: tier,
      subscription_status: "active",
      expires_at: validUntil,
      amountPaid: amount,
      paymentReference: refNum,
      paymentMethod: method,
    };

    setSubscriptions((prev) => {
      const index = prev.findIndex((s) => s.organization_id === orgId && s.term_id === selectedTermId);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = newSub;
        return updated;
      } else {
        return [...prev, newSub];
      }
    });

    toast.success(`Subscription for ${selectedOrg.name} renewed successfully!`);
  };

  const handleChangeTier = async (orgId: string, newTier: SubscriptionTier | "none") => {
    if (!selectedOrg) return;

    const tierVal = newTier === "none" ? null : newTier;

    setSubscriptions((prev) => {
      const existing = prev.find((s) => s.organization_id === orgId && s.term_id === selectedTermId);
      const updatedSub: OrgSubscription = {
        organization_id: orgId,
        term_id: selectedTermId,
        subscription_tier: tierVal,
        subscription_status: tierVal === null ? "not_subscribed" : (existing?.subscription_status || "pending_renewal"),
        expires_at: existing?.expires_at || null,
        amountPaid: existing?.amountPaid || 0,
        paymentReference: existing?.paymentReference || null,
        paymentMethod: existing?.paymentMethod || null,
      };

      const index = prev.findIndex((s) => s.organization_id === orgId && s.term_id === selectedTermId);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = updatedSub;
        return updated;
      } else {
        return [...prev, updatedSub];
      }
    });

    toast.success(`Subscription tier for ${selectedOrg.name} updated.`);
  };

  // Get specific organization history dynamically from Database
  const [orgSubscriptionHistory, setOrgSubscriptionHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedOrg || !historyOpen) return;
    const orgId = selectedOrg.id;
    async function loadHistory() {
      try {
        const history = await getSubscriptionHistoryForOrg(orgId);
        if (history && history.length > 0) {
          const matched = history.map((sub: OrgSubscription) => {
            const term = terms.find((t) => t.id === sub.term_id);
            return {
              term: term || { AY: "Unknown", semester: "Unknown", isActive: false },
              sub,
            };
          });
          setOrgSubscriptionHistory(matched);
        } else {
          // Fallback to local subscriptions matching orgId
          const fallbackHistory = subscriptions.filter((s) => s.organization_id === orgId);
          const matched = fallbackHistory.map((sub: OrgSubscription) => {
            const term = terms.find((t) => t.id === sub.term_id);
            return {
              term: term || { AY: "Unknown", semester: "Unknown", isActive: false },
              sub,
            };
          });
          setOrgSubscriptionHistory(matched);
        }
      } catch (err) {
        const fallbackHistory = subscriptions.filter((s) => s.organization_id === orgId);
        const matched = fallbackHistory.map((sub: OrgSubscription) => {
          const term = terms.find((t) => t.id === sub.term_id);
          return {
            term: term || { AY: "Unknown", semester: "Unknown", isActive: false },
            sub,
          };
        });
        setOrgSubscriptionHistory(matched);
      }
    }
    loadHistory();
  }, [selectedOrg, historyOpen, terms, subscriptions]);

  const activeSubForSelected = useMemo(() => {
    if (!selectedOrg) return null;
    return subscriptions.find((s) => s.organization_id === selectedOrg.id && s.term_id === selectedTermId) || null;
  }, [selectedOrg, subscriptions, selectedTermId]);

  return {
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
    createTermOpen,
    setCreateTermOpen,
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
    isInitializing,
    auditLogs
  };
}

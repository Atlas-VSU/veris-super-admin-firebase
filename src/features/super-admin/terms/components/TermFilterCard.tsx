"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Info, AlertTriangle } from "lucide-react";
import type { SubscriptionTier, Term } from "../../types";

interface TermFilterCardProps {
  terms: Term[];
  selectedTermId: string;
  setSelectedTermId: (id: string) => void;
  selectedTerm: Term | undefined;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tierFilter: SubscriptionTier | "all" | "none";
  setTierFilter: (tier: SubscriptionTier | "all" | "none") => void;
  statusFilter: string;
  setStatusFilter: (status: any) => void;
  filteredCount: number;
}

export function TermFilterCard({
  terms,
  selectedTermId,
  setSelectedTermId,
  selectedTerm,
  searchQuery,
  setSearchQuery,
  tierFilter,
  setTierFilter,
  statusFilter,
  setStatusFilter,
  filteredCount,
}: TermFilterCardProps) {
  return (
    <Card className="border border-blue-50 shadow-sm p-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

        {/* Term Selector */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">Academic Term:</span>
          <Select value={selectedTermId} onValueChange={setSelectedTermId}>
            <SelectTrigger className="w-full sm:w-[260px] h-9 border-blue-200 focus-visible:ring-blue-300 font-medium">
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((t) => (
                <SelectItem key={t.id || ""} value={t.id || ""} className="font-medium">
                  AY {t.AY} — {t.semester} {t.isActive && "(Active)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Stats Indicator Banner */}
        {selectedTerm && !selectedTerm.isActive && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg p-2 text-xs font-medium w-full md:w-auto">
            <Info className="h-4 w-4 shrink-0" />
            <span>You are viewing a historical semester. Changes will not impact the active live environment.</span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 my-4" />

      {/* Search & Badges Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search bar */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm border-blue-100 focus-visible:ring-blue-300 bg-white"
          />
        </div>

        {/* Tier filter */}
        <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as any)}>
          <SelectTrigger className="w-[150px] h-9 text-xs border-blue-100 bg-white">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="plus">Plus</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="none">Unsubscribed</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[170px] h-9 text-xs border-blue-100 bg-white">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired Only</SelectItem>
            <SelectItem value="not_subscribed">Not Subscribed</SelectItem>
          </SelectContent>
        </Select>


        {/* Result Count */}
        <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
          {filteredCount} result{filteredCount !== 1 ? "s" : ""}
        </span>
      </div>
    </Card>
  );
}

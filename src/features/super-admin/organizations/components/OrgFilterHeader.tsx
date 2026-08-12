import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import type { OrgLevel, SubscriptionTier } from "@/features/super-admin/types";

interface OrgFilterHeaderProps {
  search: string;
  setSearch: (search: string) => void;
  levelFilter: OrgLevel | "all";
  setLevelFilter: (level: OrgLevel | "all") => void;
  statusFilter: "all" | "active" | "inactive" | "archived";
  setStatusFilter: (status: "all" | "active" | "inactive" | "archived") => void;
  tierFilter: SubscriptionTier | "all";
  setTierFilter: (tier: SubscriptionTier | "all") => void;
  sortBy: "name-asc" | "name-desc" | "date-newest" | "date-oldest";
  setSortBy: (sort: "name-asc" | "name-desc" | "date-newest" | "date-oldest") => void;
  onCreateClick: () => void;
}

export function OrgFilterHeader({
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
  onCreateClick,
}: OrgFilterHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm border-blue-100 focus-visible:ring-blue-300"
          />
        </div>

        {/* Level Filter */}
        <Select
          value={levelFilter}
          onValueChange={(value) => setLevelFilter(value as OrgLevel | "all")}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm border-blue-100">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="department">Department</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
            <SelectItem value="council">Council</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm border-blue-100">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Tier Filter */}
        <Select
          value={tierFilter}
          onValueChange={(value) => setTierFilter(value as SubscriptionTier | "all")}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm border-blue-100">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="basic">Basic Tier</SelectItem>
            <SelectItem value="plus">Plus Tier</SelectItem>
            <SelectItem value="premium">Premium Tier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort and Create Button */}
      <div className="flex items-center gap-3">
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as typeof sortBy)}
        >
          <SelectTrigger className="w-[195px] h-9 text-sm border-blue-100">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 text-xs">
            <SelectItem value="name-asc">Alphabetical (A-Z)</SelectItem>
            <SelectItem value="name-desc">Alphabetical (Z-A)</SelectItem>
            <SelectItem value="date-newest">Date Created (Newest)</SelectItem>
            <SelectItem value="date-oldest">Date Created (Oldest)</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={onCreateClick}
          size="sm"
          className="h-9 px-3 text-xs shadow-sm font-semibold flex items-center gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Organization
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, AlertTriangle, Calendar } from "lucide-react";
import type { Term } from "../../types";

interface TermStatsCardsProps {
  totalSubscribed: number;
  totalOrgs: number;
  needsRenewalCount: number;
  pendingCount: number;
  expiringCount: number;
  expiredCount: number;
  totalRevenue: number;
  selectedTerm: Term | undefined;
}

export function TermStatsCards({
  totalSubscribed,
  totalOrgs,
  needsRenewalCount,
  pendingCount,
  expiringCount,
  expiredCount,
  totalRevenue,
  selectedTerm,
}: TermStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Subscribed Orgs Card */}
      <Card className="border border-blue-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Subscribed Organizations
          </CardTitle>
          <Building2 className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">
            {totalSubscribed} <span className="text-sm font-medium text-slate-400">/ {totalOrgs}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Active subscriptions in selected term
          </p>
        </CardContent>
      </Card>

      {/* Expired Card */}
      <Card className="border border-amber-100 bg-amber-50/20 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
            Expired Subscriptions
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-700">
            {expiredCount}
          </div>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            {pendingCount} pending · {expiringCount} expiring 
          </p>
        </CardContent>
      </Card>

      {/* Revenue Card */}
      <Card className="border border-emerald-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            Revenue Generated
          </CardTitle>
          <span className="text-xs font-bold text-emerald-600">PHP</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-700">
            ₱{totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total subscription income collected
          </p>
        </CardContent>
      </Card>

      {/* Term Status Card */}
      <Card className="border border-blue-200 bg-blue-50/10 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Current Term Status
          </CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800 truncate max-w-[170px]">
              {selectedTerm?.AY} ({selectedTerm?.semester})
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            {selectedTerm?.isActive ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active Term</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Historical Record</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

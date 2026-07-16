"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { History, CreditCard } from "lucide-react";
import { TierBadge } from "@/features/super-admin/shared/components/TierBadge";
import type { SuperAdminOrg, Term, OrgSubscription } from "../../types";
import { format, parseISO } from "date-fns";

interface HistoryItem {
  term: Term;
  sub: OrgSubscription | undefined;
}

interface SubscriptionHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  org: SuperAdminOrg | null;
  historyList: HistoryItem[];
}

export function SubscriptionHistorySheet({
  open,
  onOpenChange,
  org,
  historyList,
}: SubscriptionHistorySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-white border-l border-blue-100 p-6 flex flex-col overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <SheetTitle className="text-base font-bold text-slate-800 leading-tight">
              Subscription History
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-slate-500 mt-1">
            Historical view of subscriptions across academic terms for <span className="font-semibold text-slate-700">{org?.name}</span>.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 space-y-4">
          {historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-10 w-10 text-slate-200 mb-2" />
              <p className="text-sm font-semibold text-slate-400">No Historical Records</p>
              <p className="text-xs text-slate-400">This organization does not have any subscriptions recorded.</p>
            </div>
          ) : (
            historyList.map(({ term, sub }, i) => {
              if (!sub) return null;
              const isActiveSub = sub.subscription_status === "active";
              return (
                <div
                  key={sub.id ?? `${term.id}-${i}`}
                  className="border border-slate-100 rounded-lg p-4 bg-slate-50/50 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        AY {term.AY} — {term.semester}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Record updated: {format(new Date(sub.updated_at || sub.created_at || new Date()), "PP")}
                      </p>
                    </div>
                    {isActiveSub ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[9px] font-bold uppercase tracking-wider">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-200 text-slate-600 border-slate-300 text-[9px] font-bold uppercase tracking-wider">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-3 bg-white border border-slate-100 rounded-md p-2.5 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tier</p>
                      <TierBadge tier={sub.subscription_tier} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Expiration</p>
                      <span className="font-semibold text-slate-700">
                        {sub.expires_at ? format(parseISO(sub.expires_at), "MMM dd, yyyy") : "—"}
                      </span>
                    </div>
                    <div className="col-span-2 border-t border-slate-50 pt-2 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Paid Amount</p>
                        <span className="font-bold text-emerald-700">₱{sub.amountPaid.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Reference ID</p>
                        <span className="font-mono text-[10px] font-bold text-slate-600">
                          {sub.paymentReference || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

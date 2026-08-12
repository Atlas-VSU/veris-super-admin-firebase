"use client";

import { useState, useEffect } from "react";
import { BaseModal } from "@/components/features/shared/BaseModal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, RefreshCw } from "lucide-react";
import type { SuperAdminOrg, SubscriptionTier, Term, OrgSubscription } from "../../types";
import { format, addMonths } from "date-fns";
import type { RenewSubscriptionDialogProps } from "../types/dialogs.types";

export function RenewSubscriptionDialog({
  open,
  onOpenChange,
  org,
  selectedTerm,
  currentSub,
  onRenew,
}: RenewSubscriptionDialogProps) {
  const [renewTier, setRenewTier] = useState<SubscriptionTier>("basic");
  const [renewValidUntil, setRenewValidUntil] = useState("");
  const [renewPaymentMethod, setRenewPaymentMethod] = useState("GCash");
  const [renewAmount, setRenewAmount] = useState(5000);
  const [renewRefNum, setRenewRefNum] = useState("");
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);

  // Initialize values when dialog opens
  useEffect(() => {
    if (org && currentSub) {
      const initialTier = currentSub.subscriptionTier || "basic";
      setRenewTier(initialTier);

      const standardAmount = initialTier === "premium" ? 15000 : initialTier === "plus" ? 10000 : 5000;
      setRenewAmount(standardAmount);

      const endOfSem = format(addMonths(new Date(), 6), "yyyy-MM-dd");
      setRenewValidUntil(endOfSem);
      setRenewRefNum("");
      setRenewPaymentMethod("GCash");
    }
  }, [org, currentSub, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setIsSubmittingRenewal(true);
    try {
      await onRenew(
        org.id,
        renewTier,
        renewValidUntil || format(addMonths(new Date(), 6), "yyyy-MM-dd"),
        Number(renewAmount),
        renewRefNum || `MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
        renewPaymentMethod
      );
      onOpenChange(false);
    } finally {
      setIsSubmittingRenewal(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      asForm={true}
      onSubmit={handleSubmit}
      title="Renew Subscription"
      description="Process billing and activate subscription status for this organization."
      className="sm:max-w-[450px] bg-white border border-blue-100 rounded-lg"
      footer={
        <div className="flex justify-end gap-2 sm:gap-0 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-200 text-slate-600 h-9 mr-2"
            disabled={isSubmittingRenewal}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-9"
            disabled={isSubmittingRenewal}
          >
            {isSubmittingRenewal ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Verifying...
              </>
            ) : (
              "Confirm Renewal"
            )}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 py-4">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Organization</p>
              <p className="text-sm font-bold text-slate-700">{org?.name}</p>
              <p className="text-xs text-slate-500 font-medium">Term: {selectedTerm?.AY} - {selectedTerm?.semester}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="renew-tier" className="text-xs font-semibold text-slate-600 uppercase">
                  Tier Select
                </Label>
                <Select value={renewTier} onValueChange={(v) => {
                  setRenewTier(v as any);
                  const standardAmount = v === "premium" ? 15000 : v === "plus" ? 10000 : 5000;
                  setRenewAmount(standardAmount);
                }}>
                  <SelectTrigger id="renew-tier" className="border-blue-100">
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Tier</SelectItem>
                    <SelectItem value="plus">Plus Tier</SelectItem>
                    <SelectItem value="premium">Premium Tier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="renew-valid" className="text-xs font-semibold text-slate-600 uppercase">
                  Valid Until
                </Label>
                <Input
                  type="date"
                  id="renew-valid"
                  value={renewValidUntil}
                  onChange={(e) => setRenewValidUntil(e.target.value)}
                  className="border-blue-100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="renew-payment" className="text-xs font-semibold text-slate-600 uppercase">
                  Payment Method
                </Label>
                <Select value={renewPaymentMethod} onValueChange={setRenewPaymentMethod}>
                  <SelectTrigger id="renew-payment" className="border-blue-100">
                    <SelectValue placeholder="Select Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GCash">GCash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="renew-amount" className="text-xs font-semibold text-slate-600 uppercase">
                  Amount Paid (PHP)
                </Label>
                <Input
                  type="number"
                  id="renew-amount"
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(Number(e.target.value))}
                  className="border-blue-100 font-medium"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="renew-ref" className="text-xs font-semibold text-slate-600 uppercase">
                Payment Reference Number
              </Label>
              <Input
                type="text"
                id="renew-ref"
                placeholder="e.g. GCash Ref / Bank Txn ID"
                value={renewRefNum}
                onChange={(e) => setRenewRefNum(e.target.value)}
                className="border-blue-100 font-mono"
                required
              />
            </div>
      </div>
    </BaseModal>
  );
}

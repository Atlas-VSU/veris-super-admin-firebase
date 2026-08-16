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
import { Edit2, RefreshCw } from "lucide-react";
import { format, addMonths } from "date-fns";
import type { SubscriptionTier } from "../../types";
import type { ChangeTierDialogProps } from "../types/dialogs.types";

export function ChangeTierDialog({
  open,
  onOpenChange,
  org,
  currentSub,
  onChangeTier,
  isNew
}: ChangeTierDialogProps) {
  const [newTier, setNewTier] = useState<SubscriptionTier | "none">("basic");
  const [expiresAt, setExpiresAt] = useState("");
  const [amountPaid, setAmountPaid] = useState(5000);
  const [referenceId, setReferenceId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form state when dialog opens / org changes
  useEffect(() => {
    if (open) {
      const initialTier = currentSub?.subscriptionTier ?? "basic";
      setNewTier(initialTier || "basic");
      setAmountPaid(
        initialTier === "premium" ? 15000 : initialTier === "plus" ? 10000 : 5000
      );
      setExpiresAt(format(addMonths(new Date(), 6), "yyyy-MM-dd"));
      setReferenceId("");
      setPaymentMethod("GCash");
    }
  }, [open, currentSub]);

  // Auto-adjust suggested amount when tier changes
  const handleTierChange = (val: string) => {
    setNewTier(val as SubscriptionTier | "none");
    if (val !== "none") {
      const suggested =
        val === "premium" ? 15000 : val === "plus" ? 10000 : 5000;
      setAmountPaid(suggested);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setIsSubmitting(true);
    try {
      await onChangeTier(
        org.id,
        newTier,
        newTier !== "none"
          ? expiresAt || format(addMonths(new Date(), 6), "yyyy-MM-dd")
          : "",
        newTier !== "none" ? Number(amountPaid) : 0,
        newTier !== "none" ? referenceId : "",
        newTier !== "none" ? paymentMethod : ""
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      asForm={true}
      onSubmit={handleSubmit}
      title={isNew ? "Activate Subscription Tier" : "Change Subscription Tier"}
      description={`${isNew ? "Activate a new subscription" : "Update the subscription"} pricing category and record the associated payment details.`}
      className="sm:max-w-[450px] bg-white border border-blue-100 rounded-lg"
      footer={
        <div className="flex justify-end gap-2 sm:gap-0 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-200 text-slate-600 h-9 mr-2"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-9"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Updating...
              </>
            ) : (
              isNew ? "Activate Subscription" : "Update Tier"
            )}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 py-4">
            {/* Org card */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-0.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Organization
              </p>
              <p className="text-sm font-bold text-slate-700">{org?.name}</p>
              {currentSub?.subscriptionTier && (
                <p className="text-xs text-slate-500 font-medium capitalize">
                  Current tier: {currentSub.subscriptionTier}
                </p>
              )}
            </div>

            {/* Tier + Expiration row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ct-tier" className="text-xs font-semibold text-slate-600 uppercase">
                  New Tier
                </Label>
                <Select value={newTier} onValueChange={handleTierChange}>
                  <SelectTrigger id="ct-tier" className="border-blue-100">
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unsubscribed (Remove)</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="plus">Plus</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ct-expires" className="text-xs font-semibold text-slate-600 uppercase">
                  Expiration Date
                </Label>
                <Input
                  type="date"
                  id="ct-expires"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="border-blue-100"
                  disabled={newTier === "none"}
                  required={newTier !== "none"}
                />
              </div>
            </div>

            {/* Payment method + Amount row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ct-method" className="text-xs font-semibold text-slate-600 uppercase">
                  Payment Method
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  disabled={newTier === "none"}
                >
                  <SelectTrigger id="ct-method" className="border-blue-100">
                    <SelectValue placeholder="Select Method" />
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
                <Label htmlFor="ct-amount" className="text-xs font-semibold text-slate-600 uppercase">
                  Amount Paid (PHP)
                </Label>
                <Input
                  type="number"
                  id="ct-amount"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="border-blue-100 font-medium"
                  min="0"
                  disabled={newTier === "none"}
                  required={newTier !== "none"}
                />
              </div>
            </div>

            {/* Reference ID */}
            <div className="grid gap-2">
              <Label htmlFor="ct-ref" className="text-xs font-semibold text-slate-600 uppercase">
                Payment Reference ID
              </Label>
              <Input
                type="text"
                id="ct-ref"
                placeholder="e.g. GCash Ref / Bank Txn ID"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="border-blue-100 font-mono"
                disabled={newTier === "none"}
                required={newTier !== "none"}
              />
            </div>

            {/* Remove-tier notice */}
            {newTier === "none" && (
              <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                Selecting <strong>Unsubscribed</strong> will remove the active subscription record for this organization.
              </div>
            )}
      </div>
    </BaseModal>
  );
}

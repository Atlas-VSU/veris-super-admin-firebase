"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Info } from "lucide-react";
import type { SuperAdminOrg, SubscriptionTier, OrgSubscription } from "../../types";

interface ChangeTierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  org: SuperAdminOrg | null;
  currentSub: OrgSubscription | null;
  onChangeTier: (orgId: string, newTier: SubscriptionTier | "none") => Promise<void> | void;
}

export function ChangeTierDialog({
  open,
  onOpenChange,
  org,
  currentSub,
  onChangeTier,
}: ChangeTierDialogProps) {
  const [newTier, setNewTier] = useState<SubscriptionTier | "none">("basic");
  const [isSubmittingTier, setIsSubmittingTier] = useState(false);

  // Initialize values when dialog opens
  useEffect(() => {
    if (currentSub) {
      setNewTier(currentSub.subscription_tier || "none");
    }
  }, [currentSub, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setIsSubmittingTier(true);
    try {
      await onChangeTier(org.id, newTier);
      onOpenChange(false);
    } finally {
      setIsSubmittingTier(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white border border-blue-100 rounded-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-600" /> Change Subscription Tier
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update the subscription pricing category assigned to this organization.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Organization</p>
              <p className="text-sm font-bold text-slate-700">{org?.name}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-tier" className="text-xs font-semibold text-slate-600 uppercase">
                Select New Tier
              </Label>
              <Select value={newTier} onValueChange={setNewTier as any}>
                <SelectTrigger id="new-tier" className="border-blue-100">
                  <SelectValue placeholder="Select Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unsubscribed (Remove Tier)</SelectItem>
                  <SelectItem value="basic">Basic Tier (₱2 / student / yr)</SelectItem>
                  <SelectItem value="plus">Plus Tier (₱3 / student / yr)</SelectItem>
                  <SelectItem value="premium">Premium Tier (₱4 / student / yr)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newTier !== "none" && (
              <div className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg p-2.5 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Changing the tier modifies the billing scheme. The organization will need to be renewed to activate the tier for this term.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 text-slate-600 h-9"
              disabled={isSubmittingTier}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white h-9"
              disabled={isSubmittingTier}
            >
              {isSubmittingTier ? "Updating..." : "Update Tier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

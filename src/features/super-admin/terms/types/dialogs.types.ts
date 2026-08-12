import type { Term, SuperAdminOrg, SubscriptionTier, OrgSubscription } from "@/features/super-admin/types";

export interface CreateNewTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called when the user submits the form.
   * `setActive` indicates whether the newly created term should immediately
   * become the active term (deactivating any currently active one).
   */
  onSubmit: (term: Term, setActive: boolean) => Promise<void> | void;
  /** All existing terms — used to check for duplicates. */
  existingTerms?: Term[];
}

export interface SetActiveTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (AY: string, semester: string) => Promise<void> | void;
  terms: Term[]
}

export interface RenewSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  org: SuperAdminOrg | null;
  selectedTerm: Term | undefined;
  currentSub: OrgSubscription | null;
  onRenew: (
    orgId: string,
    tier: SubscriptionTier,
    validUntil: string,
    amount: number,
    refNum: string,
    paymentMethod: string
  ) => Promise<void> | void;
}

export interface ChangeTierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  org: SuperAdminOrg | null;
  currentSub: OrgSubscription | null;
  onChangeTier: (
    orgId: string,
    newTier: SubscriptionTier | "none",
    expiresAt: string,
    amountPaid: number,
    referenceId: string,
    paymentMethod: string
  ) => Promise<void> | void;
  isNew: boolean;
}

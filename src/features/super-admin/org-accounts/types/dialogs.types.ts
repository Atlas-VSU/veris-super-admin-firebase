import type { SuperAdminOrg, SuperAdminOrgAccount } from "@/features/super-admin/types";

export interface CreateOrgAccountFormData {
  email: string;
  tempPassword: string;
  firstName: string;
  lastName: string;
  /** Display name — e.g. "President - Kyle" or auto-combined first+last */
  name: string;
  orgId: string;
}

export interface CreateOrgAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateOrgAccountFormData) => Promise<void> | void;
  orgs: SuperAdminOrg[];
}

export interface EditAccountFormData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SuperAdminOrgAccount | null;
  onSave: (
    accountId: string,
    accountData: EditAccountFormData
  ) => Promise<void> | void;
}

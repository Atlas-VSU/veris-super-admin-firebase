import type { OrgLevel, SuperAdminFaculty, SuperAdminProgram, SuperAdminOrg } from "@/features/super-admin/types";

export interface CreateOrgFormData {
  name: string;
  shortName: string;
  level: OrgLevel;
  adviser: string;
  president: string;
  contactEmail: string;
  description: string;
  facultyName: string | null;
  facultyAcronym: string | null;
  facultyId: string | null;
  programId: string | null;
  programName: string | null;
  programAcronym: string | null;
  logoFile: File | null;
  treasurer: string;
  treasurerNumber: string;
  treasurerQrFile: File | null;
  auditor: string | null;
  auditorNumber: string | null;
  auditorQrFile: File | null;
}

export interface CreateOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (orgData: CreateOrgFormData) => Promise<void> | void;
  faculties: SuperAdminFaculty[];
  programs: SuperAdminProgram[];
}

export interface EditOrgFormData {
  name: string;
  shortName: string;
  level: OrgLevel;
  adviser: string;
  president: string;
  contactEmail: string;
  description: string;
  facultyName: string | null;
  facultyAcronym: string | null;
  facultyId: string | null;
  programId: string | null;
  programName: string | null;
  programAcronym: string | null;
  logoFile: File | null;
  existingLogoUrl?: string | null;
  treasurer: string;
  treasurerNumber: string;
  treasurerQrFile: File | null;
  existingTreasurerQrUrl?: string | null;
  auditor: string | null;
  auditorNumber: string | null;
  auditorQrFile: File | null;
  existingAuditorQrUrl?: string | null;
  changedLogo?: boolean;
  changedTreasurerQr?: boolean;
  changedAuditorQr?: boolean;
  removeLogo?: boolean;
  removeTreasurerQr?: boolean;
  removeAuditorQr?: boolean;
}

export interface EditOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  org: SuperAdminOrg | null;
  onSave: (
    orgId: string,
    orgData: EditOrgFormData
  ) => Promise<void> | void;
  faculties: SuperAdminFaculty[];
  programs: SuperAdminProgram[];
}

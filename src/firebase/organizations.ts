import type { OrgLevel, SubscriptionTier } from "@/features/super-admin/types";

export interface CreateOrgPayload {
  name: string;
  short_name: string;
  level: OrgLevel;
  adviser: string;
  president: string;
  contact_email: string;
  description: string;
  faculty_name: string | null;
  faculty_acronym: string | null;
  faculty_id: string | null;
  program_id: string | null;
  program_name: string | null;
  program_acronym: string | null;
}

export interface UpdateOrgPayload {
  name?: string;
  short_name?: string;
  level?: OrgLevel;
  adviser?: string;
  president?: string;
  contact_email?: string;
  description?: string;
  faculty_name?: string | null;
  faculty_acronym?: string | null;
  faculty_id?: string | null;
  program_id?: string | null;
  program_name?: string | null;
  program_acronym?: string | null;
  is_archived?: boolean;
  subscribed?: boolean;
  subscription_tier?: SubscriptionTier | null;
}

export async function createOrganization(orgData: CreateOrgPayload): Promise<string> {
  console.log("Mock createOrganization called with:", orgData);
  // Return a mock document ID
  return `mock-org-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function updateOrganization(orgId: string, orgData: UpdateOrgPayload): Promise<void> {
  console.log(`Mock updateOrganization called for ${orgId} with:`, orgData);
  // No-op for frontend demonstration
  return;
}

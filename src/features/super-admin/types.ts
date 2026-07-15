// Super Admin Types 
// All data shapes are read-only mirrors of Firestore documents.

export type OrgLevel = "department" | "faculty" | "council";
export type SubscriptionTier = "basic" | "plus" | "premium";

export interface SuperAdminOrg {
  id: string;
  name: string;
  short_name: string;
  level: OrgLevel;
  faculty_id: string | null;
  faculty_name: string | null;
  faculty_acronym: string | null;
  program_id: string | null;
  program_name: string | null;
  program_acronym: string | null;
  is_archived: boolean;
  subscribed: boolean;
  subscription_tier: SubscriptionTier | null;
  adviser?: string | null;
  president?: string | null;
  contact_email?: string | null;
  description?: string | null;
  created_at?: string | null;
}

export interface SuperAdminOrgAccount {
  id: string;
  org_id: string;
  org_name: string | null;
  full_name: string;
  email: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string | null;
}

export interface SuperAdminFaculty {
  id: string;
  name: string;
  acronym: string;
}

export interface SuperAdminProgram {
  id: string;
  name: string;
  acronym: string;
  faculty_id: string;
}

// Dashboard aggregate stats 
export interface DashboardStats {
  total_subscribed: number;
  tier_counts: {
    basic: number;
    plus: number;
    premium: number;
  };
  total_active_accounts: number;
  total_archived: number;
  total_orgs: number;
}

export interface Term {
  id?: string;
  AY: string;
  semester: string;
  isActive: boolean;
  isDeleted?: boolean;
  metadata?: {
    createdAt: Date | string;
    updatedAt: Date | string;
  };
}

export interface OrgSubscription {
  id?: string;
  organization_id: string;
  term_id: string;
  subscription_tier: SubscriptionTier | null;
  subscription_status: "active" | "expiring_soon" | "expired" | "pending_renewal" | "not_subscribed" | "inactive" | "grace_period";
  starts_at?: string | null;
  expires_at: string | null;
  renewed_at?: string | null;
  renewed_by?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;

  // Payments integration properties retained for frontend demonstration
  amountPaid: number;
  paymentReference: string | null;
  paymentMethod: string | null;
}

//  Full data payload returned by the server data layer 
export interface SuperAdminPageData {
  orgs: SuperAdminOrg[];
  accounts: SuperAdminOrgAccount[];
  stats: DashboardStats;
}

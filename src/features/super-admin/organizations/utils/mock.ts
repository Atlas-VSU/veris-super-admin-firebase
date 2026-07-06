import type { SuperAdminOrg, SuperAdminFaculty } from "@/features/super-admin/types";

export type EnhancedOrg = SuperAdminOrg;

export const facultiesList: SuperAdminFaculty[] = [
  { id: "fac-1", name: "Faculty of Computing", acronym: "FOC" },
  { id: "fac-2", name: "Faculty of Engineering", acronym: "FOE" },
  { id: "fac-3", name: "Faculty of Management", acronym: "FOM" },
];

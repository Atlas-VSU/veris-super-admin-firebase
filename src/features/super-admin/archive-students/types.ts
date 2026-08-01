import { STEPS } from "./const";

export type StepKey = typeof STEPS[number]["key"];

export type ArchiveStep =
  | "upload"
  | "validate"
  | "preview"
  | "confirm"
  | "execute"
  | "complete";

export interface ParsedStudent {
  raw:     string;
  valid:   boolean;
  reason?: string;
}

export interface ValidationSummary {
  total:      number;
  valid:      number;
  duplicates: number;
  invalid:    number;
  validIds:   string[];
  rows:       ParsedStudent[];
}

export interface ActiveTerm {
  id:       string;
  AY:       string;
  semester: string;
}

export interface DryRunPreview {
  activeTerm:           ActiveTerm;
  studentsUploaded:     number;
  usersToArchive:       number;
  usersAlreadyArchived: number;
  missingUserRecords:   number;
  missingUserIds:       string[];
  matchingFees:         number;
  matchingFines:        number;
  matchingClearance:    number;
}

export interface ExecutionLog {
  activeTerm:           ActiveTerm;
  studentsUploaded:     number;
  usersArchived:        number;
  usersAlreadyArchived: number;
  missingUserRecords:   number;
  missingUserIds:       string[];
  feesDeleted:          number;
  finesDeleted:         number;
  clearanceDeleted:     number;
  completedAt:          string;
}
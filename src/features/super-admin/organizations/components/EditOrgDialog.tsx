"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Edit2, QrCode, RefreshCw, Upload, X } from "lucide-react";
import type { SuperAdminOrg, OrgLevel, SuperAdminFaculty, SuperAdminProgram } from "../../types";
import { CreateOrgFormData } from "./CreateOrgDialog";

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

interface EditOrgDialogProps {
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

function ImageUploadField({
  id,
  label,
  file,
  preview,
  onChange,
  onClear,
  icon,
  required = false,
}: {
  id: string;
  label: string;
  file: File | null;
  preview: string | null;
  onChange: (file: File | null) => void;
  onClear: () => void;
  icon?: React.ReactNode;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-xs font-semibold text-slate-600 uppercase">
        {label} {required ? "" : <span className="normal-case text-slate-400">(optional)</span>}
      </Label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      {preview ? (
        <div className="flex items-center gap-3">
          <img
            src={preview}
            alt={`${label} preview`}
            className="h-14 w-14 rounded-md object-cover border border-blue-100"
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 truncate max-w-[180px]">
              {file ? file.name : "Current image"}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs border-slate-200"
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs border-slate-200 text-red-500"
                onClick={onClear}
              >
                <X className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="border-dashed border-blue-200 text-slate-500 h-16 flex flex-col gap-1"
          onClick={() => inputRef.current?.click()}
        >
          {icon ?? <Upload className="h-4 w-4" />}
          <span className="text-xs">Click to upload {label.toLowerCase()}</span>
        </Button>
      )}
    </div>
  );
}

// Tracks the three possible states for a single image field during an edit:
// 1. untouched -- show the existing saved URL, submit nothing (keep as-is)
// 2. replaced  -- a new File was picked, show its local preview, submit the File
// 3. removed   -- user cleared it, show nothing, submit a "remove" flag
function useImageUploadState() {
  const [file, setFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [existingUrl, setExistingUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [changed, setChanged] = useState(false);
  const newPreviewRef = useRef<string | null>(null);
  useEffect(() => {
    newPreviewRef.current = newPreview;
  }, [newPreview]);

  // Revoke any outstanding object URL when this field unmounts
  useEffect(() => {
    return () => {
      if (newPreviewRef.current) URL.revokeObjectURL(newPreviewRef.current);
    };
  }, []);

  const selectFile = (f: File | null) => {
    if (newPreview) URL.revokeObjectURL(newPreview);
    setFile(f);
    setNewPreview(f ? URL.createObjectURL(f) : null);
    if (f) {
      setRemoved(false)
      setChanged(true)
    };
  };

  const remove = () => {
    if (newPreview) URL.revokeObjectURL(newPreview);
    setFile(null);
    setNewPreview(null);
    setRemoved(true);
    setChanged(false)
  };

  // Called when the dialog opens for a (possibly new) org -- resets to
  // whatever URL is already saved for that org, clearing any pending edits.
  const reset = (url: string | null) => {
    if (newPreview) URL.revokeObjectURL(newPreview);
    setFile(null);
    setNewPreview(null);
    setExistingUrl(url);
    setRemoved(false);
  };

  const displayPreview = file ? newPreview : removed ? null : existingUrl;

  return { file, displayPreview, removed, changed, selectFile, remove, reset };
}

export function EditOrgDialog({
  open,
  onOpenChange,
  org,
  onSave,
  faculties,
  programs,
}: EditOrgDialogProps) {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [level, setLevel] = useState<OrgLevel>("department");
  const [adviser, setAdviser] = useState("");
  const [president, setPresident] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [description, setDescription] = useState("");
  const [faculty, setFaculty] = useState("none");
  const [programId, setProgramId] = useState("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Treasurer (required)
  const [treasurer, setTreasurer] = useState("");
  const [treasurerNumber, setTreasurerNumber] = useState("");

  // Auditor (optional)
  const [auditor, setAuditor] = useState("");
  const [auditorNumber, setAuditorNumber] = useState("");

  // Images -- each tracks new-file / existing-url / removed state independently
  const logo = useImageUploadState();
  const treasurerQr = useImageUploadState();
  const auditorQr = useImageUploadState();

  // Load details when org changes
  useEffect(() => {
    if (org && open) {
      setName(org.name || "");
      setShortName(org.shortName || "");
      setLevel(org.level || "department");
      setAdviser(org.adviser || "");
      setPresident(org.president || "");
      setContactEmail(org.contactEmail || "");
      setDescription(org.description || "");
      setFaculty(org.facultyAcronym || "none");
      setProgramId(org.programId || "none");
      setTreasurer(org.orgTreasurerName || "");
      setTreasurerNumber(org.orgTreasurerNumber || "");
      setAuditor(org.orgAuditorName || "");
      setAuditorNumber(org.orgAuditorNumber || "");

      // Reset image state to whatever is already saved for this org
      logo.reset(org.orgLogoUrl || null);
      treasurerQr.reset(org.orgTreasurerUrl || null);
      auditorQr.reset(org.orgAuditorUrl || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !name.trim()) return;

    if (level === "department" && programId === "none") {
      toast.error("Please select a Program for department-level organization.");
      return;
    }

    if (!treasurer.trim() || !treasurerNumber.trim()) {
      toast.error("Please provide the treasurer's name and contact number.");
      return;
    }

    setIsSubmitting(true);

    try {
      let resolvedFacultyId: string | null = null;
      let resolvedFacultyName: string | null = null;
      let resolvedFacultyAcronym: string | null = null;
      let resolvedProgramId: string | null = null;
      let resolvedProgramName: string | null = null;
      let resolvedProgramAcronym: string | null = null;

      if (level === "department") {
        const selectedProg = programs.find((p) => p.id === programId);
        if (selectedProg) {
          resolvedProgramId = selectedProg.id;
          resolvedProgramName = selectedProg.name;
          resolvedProgramAcronym = selectedProg.acronym;

          const selectedFac = faculties.find((f) => f.id === selectedProg.facultyId);
          if (selectedFac) {
            resolvedFacultyId = selectedFac.id;
            resolvedFacultyName = selectedFac.name;
            resolvedFacultyAcronym = selectedFac.acronym;
          }
        }
      } else if (level === "faculty") {
        const selectedFac = faculties.find((f) => f.acronym === faculty);
        if (selectedFac) {
          resolvedFacultyId = selectedFac.id;
          resolvedFacultyName = selectedFac.name;
          resolvedFacultyAcronym = selectedFac.acronym;
        }
      }

      await onSave(org.id, {
        name,
        shortName,
        level,
        adviser,
        president,
        contactEmail,
        description,
        facultyName: resolvedFacultyName,
        facultyAcronym: resolvedFacultyAcronym,
        facultyId: resolvedFacultyId,
        programId: resolvedProgramId,
        programName: resolvedProgramName,
        programAcronym: resolvedProgramAcronym,
        logoFile: logo.file,
        existingLogoUrl: org.orgLogoUrl || null,
        removeLogo: logo.removed,
        changedLogo: logo.changed,
        treasurer,
        treasurerNumber,
        treasurerQrFile: treasurerQr.file,
        existingTreasurerQrUrl: org.orgTreasurerUrl || null,
        removeTreasurerQr: treasurerQr.removed,
        changedTreasurerQr: treasurerQr.changed,
        auditor: auditor.trim() ? auditor : null,
        auditorNumber: auditorNumber.trim() ? auditorNumber : null,
        auditorQrFile: auditorQr.file,
        existingAuditorQrUrl: org.orgAuditorUrl || null,
        removeAuditorQr: auditorQr.removed,
        changedAuditorQr: auditorQr.changed,
      });

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white border border-blue-100 rounded-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-600" /> Edit Organization Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modify the general profile configuration for this organization.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
            <ImageUploadField
              id="org-logo"
              label="Organization Logo"
              file={logo.file}
              preview={logo.displayPreview}
              onChange={logo.selectFile}
              onClear={logo.remove}
              icon={<Building2 className="h-4 w-4" />}
            />

            <div className="grid gap-2">
              <Label htmlFor="org-name" className="text-xs font-semibold text-slate-600 uppercase">
                Organization Name
              </Label>
              <Input
                id="org-name"
                placeholder="e.g. Computer Science Society"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-blue-100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="org-acronym" className="text-xs font-semibold text-slate-600 uppercase">
                  Acronym / Short Name
                </Label>
                <Input
                  id="org-acronym"
                  placeholder="e.g. CSS"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="border-blue-100"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="org-level" className="text-xs font-semibold text-slate-600 uppercase">
                  Access Level
                </Label>
                <Select value={level} onValueChange={(v) => setLevel(v as OrgLevel)}>
                  <SelectTrigger id="org-level" className="border-blue-100">
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="council">Council</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {level === "department" && (
              <div className="grid gap-2">
                <Label htmlFor="org-program" className="text-xs font-semibold text-slate-600 uppercase">
                  Academic Program / Course
                </Label>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger id="org-program" className="border-blue-100">
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="none">Select Program...</SelectItem>
                    {programs.map((prog) => (
                      <SelectItem key={prog.id} value={prog.id}>
                        {prog.name} ({prog.acronym})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {level === "faculty" && (
              <div className="grid gap-2">
                <Label htmlFor="org-faculty" className="text-xs font-semibold text-slate-600 uppercase">
                  Faculty Association
                </Label>
                <Select value={faculty} onValueChange={setFaculty}>
                  <SelectTrigger id="org-faculty" className="border-blue-100">
                    <SelectValue placeholder="Select Faculty" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="none">None / Independent</SelectItem>
                    {faculties.map((fac) => (
                      <SelectItem key={fac.acronym} value={fac.acronym}>
                        {fac.name} ({fac.acronym})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="org-adviser" className="text-xs font-semibold text-slate-600 uppercase">
                  Faculty Adviser
                </Label>
                <Input
                  id="org-adviser"
                  placeholder="e.g. Dr. John Doe"
                  value={adviser}
                  onChange={(e) => setAdviser(e.target.value)}
                  className="border-blue-100"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="org-president" className="text-xs font-semibold text-slate-600 uppercase">
                  Current President
                </Label>
                <Input
                  id="org-president"
                  placeholder="e.g. Jane Smith"
                  value={president}
                  onChange={(e) => setPresident(e.target.value)}
                  className="border-blue-100"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="org-email" className="text-xs font-semibold text-slate-600 uppercase">
                Contact Email Address
              </Label>
              <Input
                type="email"
                id="org-email"
                placeholder="e.g. css.org@university.edu"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="border-blue-100"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="org-desc" className="text-xs font-semibold text-slate-600 uppercase">
                About / Description
              </Label>
              <Textarea
                id="org-desc"
                placeholder="Describe the organization's goals and scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-blue-100 min-h-[70px] resize-none"
                required
              />
            </div>

            {/* Treasurer -- required */}
            <div className="border-t border-blue-50 pt-4 mt-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                Treasurer Details
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="grid gap-2">
                  <Label htmlFor="treasurer-name" className="text-xs font-semibold text-slate-600 uppercase">
                    Treasurer Name
                  </Label>
                  <Input
                    id="treasurer-name"
                    placeholder="e.g. Maria Santos"
                    value={treasurer}
                    onChange={(e) => setTreasurer(e.target.value)}
                    className="border-blue-100"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="treasurer-number" className="text-xs font-semibold text-slate-600 uppercase">
                    Contact Number
                  </Label>
                  <Input
                    id="treasurer-number"
                    placeholder="e.g. 09171234567"
                    value={treasurerNumber}
                    onChange={(e) => setTreasurerNumber(e.target.value)}
                    className="border-blue-100"
                    required
                  />
                </div>
              </div>

              <ImageUploadField
                id="treasurer-qr"
                label="Treasurer's GCash QR Code"
                file={treasurerQr.file}
                preview={treasurerQr.displayPreview}
                onChange={treasurerQr.selectFile}
                onClear={treasurerQr.remove}
                icon={<QrCode className="h-4 w-4" />}
                required
              />
            </div>

            {/* Auditor -- optional */}
            <div className="border-t border-blue-50 pt-4 mt-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                Auditor Details <span className="normal-case font-normal text-slate-400">(optional)</span>
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="grid gap-2">
                  <Label htmlFor="auditor-name" className="text-xs font-semibold text-slate-600 uppercase">
                    Auditor Name
                  </Label>
                  <Input
                    id="auditor-name"
                    placeholder="e.g. Juan Dela Cruz"
                    value={auditor}
                    onChange={(e) => setAuditor(e.target.value)}
                    className="border-blue-100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="auditor-number" className="text-xs font-semibold text-slate-600 uppercase">
                    Contact Number
                  </Label>
                  <Input
                    id="auditor-number"
                    placeholder="e.g. 09171234567"
                    value={auditorNumber}
                    onChange={(e) => setAuditorNumber(e.target.value)}
                    className="border-blue-100"
                  />
                </div>
              </div>

              <ImageUploadField
                id="auditor-qr"
                label="Auditor's GCash QR Code"
                file={auditorQr.file}
                preview={auditorQr.displayPreview}
                onChange={auditorQr.selectFile}
                onClear={auditorQr.remove}
                icon={<QrCode className="h-4 w-4" />}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 text-slate-600 h-9"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white h-9"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

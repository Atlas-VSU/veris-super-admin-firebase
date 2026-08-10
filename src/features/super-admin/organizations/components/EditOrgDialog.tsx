"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { BaseModal } from "@/components/features/shared/BaseModal";
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
import { Building2, Edit2, QrCode, RefreshCw, X } from "lucide-react";
import { ImageUploadField } from "@/components/features/shared/ImageUploadField";
import { useImageUploadState } from "@/components/features/shared/hooks/useImageUploadState";
import type { OrgLevel } from "../../types";
import type { EditOrgFormData, EditOrgDialogProps } from "../types/dialogs.types";

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

  const isFormValid = Boolean(
    name.trim() &&
    shortName.trim() &&
    adviser.trim() &&
    president.trim() &&
    contactEmail.trim() &&
    description.trim() &&
    treasurer.trim() &&
    treasurerNumber.trim() &&
    (treasurerQr.file || (org?.orgTreasurerUrl && !treasurerQr.removed)) &&
    (level !== "department" || programId !== "none") &&
    (level !== "faculty" || faculty !== "none")
  );

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
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      asForm={true}
      onSubmit={handleSubmit}
      title="Edit Organization Details"
      description="Modify the general profile configuration for this organization."
      className="sm:max-w-[480px] bg-white border border-blue-100 rounded-lg max-h-[90vh] overflow-y-auto"
      footer={
        <div className="flex justify-end gap-2 w-full">
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
            className="h-9"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 text-xs">
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
              <SelectTrigger id="org-level" className="border-blue-100 w-full">
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
              <SelectTrigger id="org-program" className="border-blue-100 w-full">
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
              <SelectTrigger id="org-faculty" className="border-blue-100 w-full">
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
    </BaseModal>
  );
}

"use client";

import { useState } from "react";
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
import { Building2, RefreshCw } from "lucide-react";
import type { OrgLevel, SuperAdminFaculty, SuperAdminProgram } from "../../types";

interface CreateOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (orgData: {
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
  }) => Promise<void> | void;
  faculties: SuperAdminFaculty[];
  programs: SuperAdminProgram[];
}

export function CreateOrgDialog({
  open,
  onOpenChange,
  onCreate,
  faculties,
  programs,
}: CreateOrgDialogProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (level === "department" && programId === "none") {
      toast.error("Please select a Program for department-level organization.");
      return;
    }

    setIsSubmitting(true);

    try {
      let faculty_id: string | null = null;
      let faculty_name: string | null = null;
      let faculty_acronym: string | null = null;
      let program_id: string | null = null;
      let program_name: string | null = null;
      let program_acronym: string | null = null;

      if (level === "department") {
        const selectedProg = programs.find((p) => p.id === programId);
        if (selectedProg) {
          program_id = selectedProg.id;
          program_name = selectedProg.name;
          program_acronym = selectedProg.acronym;

          const selectedFac = faculties.find((f) => f.id === selectedProg.faculty_id);
          if (selectedFac) {
            faculty_id = selectedFac.id;
            faculty_name = selectedFac.name;
            faculty_acronym = selectedFac.acronym;
          }
        }
      } else if (level === "faculty") {
        const selectedFac = faculties.find((f) => f.acronym === faculty);
        if (selectedFac) {
          faculty_id = selectedFac.id;
          faculty_name = selectedFac.name;
          faculty_acronym = selectedFac.acronym;
        }
      }

      await onCreate({
        name,
        short_name: shortName,
        level,
        adviser,
        president,
        contact_email: contactEmail,
        description,
        faculty_name,
        faculty_acronym,
        faculty_id,
        program_id,
        program_name,
        program_acronym,
      });

      // Reset Form
      setName("");
      setShortName("");
      setLevel("department");
      setAdviser("");
      setPresident("");
      setContactEmail("");
      setDescription("");
      setFaculty("none");
      setProgramId("none");

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
              <Building2 className="h-5 w-5 text-blue-600" /> Create Student Organization
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Register a new student organization profile on the VERIS platform.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
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
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
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
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

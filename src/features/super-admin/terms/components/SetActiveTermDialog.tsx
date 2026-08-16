"use client";

import { useState } from "react";
import { BaseModal } from "@/components/features/shared/BaseModal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, RefreshCw } from "lucide-react";
import { Term } from "@/constants/types";
import type { SetActiveTermDialogProps } from "../types/dialogs.types";

export function SetActiveTermDialog({
  open,
  onOpenChange,
  onSubmit,
  terms,
}: SetActiveTermDialogProps) {
  const [newAY, setNewAY] = useState(terms[0]?.AY);
  const [newSemester, setNewSemester] = useState(terms[0]?.semester);
  const [isSettingANewActiveTerm, setIsSettingANewActiveTerm] = useState(false);

  const isFormValid = Boolean(newAY && newSemester);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingANewActiveTerm(true);
    try {
      await onSubmit(newAY, newSemester);
      onOpenChange(false);
    } finally {
      setIsSettingANewActiveTerm(false);
    }
  };

  const uniqueAYs = [...new Set(terms.map((term: Term) => term.AY))];

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      asForm={true}
      onSubmit={handleSubmit}
      title="Set New Active Term"
      description="Set a new active term. This will deactivate the current active term."
      className="sm:max-w-[425px] bg-white border border-blue-100 rounded-lg"
      footer={
        <div className="flex justify-end gap-2 sm:gap-0 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-200 text-slate-600 h-9 mr-2"
            disabled={isSettingANewActiveTerm}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-9"
            disabled={isSettingANewActiveTerm || !isFormValid}
          >
            {isSettingANewActiveTerm ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Setting...
              </>
            ) : (
              "Set as New Active Term"
            )}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="academic-year" className="text-xs font-semibold text-slate-600 uppercase">
                Academic Year
              </Label>
              <Select value={newAY} onValueChange={setNewAY}>
                <SelectTrigger id="academic-year" className="border-blue-100">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueAYs.map((ay: string) => (
                    <SelectItem key={ay} value={ay}>
                      {ay}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="semester" className="text-xs font-semibold text-slate-600 uppercase">
                Semester
              </Label>
              <Select value={newSemester} onValueChange={setNewSemester}>
                <SelectTrigger id="semester" className="border-blue-100">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">1st Semester</SelectItem>
                  <SelectItem value="2nd">2nd Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
      </div>
    </BaseModal>
  );
}

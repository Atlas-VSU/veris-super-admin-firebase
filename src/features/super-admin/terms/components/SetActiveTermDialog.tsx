"use client";

import { useState } from "react";
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

interface SetActiveTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (AY: string, semester: string) => Promise<void> | void;
  terms: Term[]
}

export function SetActiveTermDialog({
  open,
  onOpenChange,
  onSubmit,
  terms,
}: SetActiveTermDialogProps) {
  const [newAY, setNewAY] = useState(terms[0]?.AY);
  const [newSemester, setNewSemester] = useState(terms[0]?.semester);
  const [isSettingANewActiveTerm, setIsSettingANewActiveTerm] = useState(false);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white border border-blue-100 rounded-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" /> Set New Active Term
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Set a new active term. This will deactivate the current active term.
            </DialogDescription>
          </DialogHeader>

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

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 text-slate-600 h-9"
              disabled={isSettingANewActiveTerm}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white h-9"
              disabled={isSettingANewActiveTerm}
            >
              {isSettingANewActiveTerm ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Setting...
                </>
              ) : (
                "Set as New Active Term"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

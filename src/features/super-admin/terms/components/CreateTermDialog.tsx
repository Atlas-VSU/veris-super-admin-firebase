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

interface CreateTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (AY: string, semester: string, setActive: boolean) => Promise<void> | void;
}

export function CreateTermDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateTermDialogProps) {
  const [newAY, setNewAY] = useState("2026-2027");
  const [newSemester, setNewSemester] = useState("1st Semester");
  const [setNewAsActive, setSetNewAsActive] = useState(true);
  const [isCreatingTerm, setIsCreatingTerm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTerm(true);
    try {
      await onSubmit(newAY, newSemester, setNewAsActive);
      onOpenChange(false);
    } finally {
      setIsCreatingTerm(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white border border-blue-100 rounded-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" /> Create Academic Term
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Setup a new semester record. This will initialize subscription statuses for all organizations.
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
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                  <SelectItem value="2026-2027">2026-2027</SelectItem>
                  <SelectItem value="2027-2028">2027-2028</SelectItem>
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
                  <SelectItem value="1st Semester">1st Semester</SelectItem>
                  <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="set-active"
                checked={setNewAsActive}
                onCheckedChange={(checked) => setSetNewAsActive(!!checked)}
              />
              <Label htmlFor="set-active" className="text-xs font-medium text-slate-600 cursor-pointer">
                Set as Active Term (Deactivates current active term)
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 text-slate-600 h-9"
              disabled={isCreatingTerm}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white h-9"
              disabled={isCreatingTerm}
            >
              {isCreatingTerm ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Create Term"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

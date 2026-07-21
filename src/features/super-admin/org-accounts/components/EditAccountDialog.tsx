"use client";

import { useState, useEffect } from "react";
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
import { Edit2, RefreshCw } from "lucide-react";
import type { SuperAdminOrgAccount } from "../../types";


export interface EditAccountFormData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
 }

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SuperAdminOrgAccount | null;
  onSave: (
    accountId: string,
    accountData: EditAccountFormData
  ) => Promise<void> | void;
}

export function EditAccountDialog({
  open,
  onOpenChange,
  account,
  onSave,
}: EditAccountDialogProps) {
  const [positionName, setPositionName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load details when account changes
  useEffect(() => {
    console.log("EditAccountDialog: useEffect triggered with account:", account, "and open:", open);
    if (account && open) {
      setPositionName(account.positionName ?? "");
      setFirstName(account.firstName);
      setLastName(account.lastName);
      setContactEmail(account.email ?? "");
    } 
  }, [account, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setIsSubmitting(true);

    try {

      await onSave(account.id, {
        name: positionName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: contactEmail.trim(),
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
              <Edit2 className="h-5 w-5 text-blue-600" /> Edit Account Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modify the details for this account.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">



            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-firstname" className="text-xs font-semibold text-slate-600 uppercase">
                  First Name
                </Label>
                <Input
                  id="edit-firstname"
                  placeholder="e.g. Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border-blue-100"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-lastname" className="text-xs font-semibold text-slate-600 uppercase">
                  Last Name
                </Label>
                <Input
                  id="edit-lastname"
                  placeholder="e.g. Dela Cruz"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border-blue-100"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-position" className="text-xs font-semibold text-slate-600 uppercase">
                Position Name
              </Label>
              <Input
                id="edit-position"
                placeholder="e.g. USSC Treasurer"
                value={positionName}
                onChange={(e) => setPositionName(e.target.value)}
                className="border-blue-100"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-email" className="text-xs font-semibold text-slate-600 uppercase">
                Contact Email Address
              </Label>
              <Input
                type="email"
                id="edit-email"
                placeholder="e.g. css.org@university.edu"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="border-blue-100"
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

"use client";

import { useState, useEffect } from "react";
import { BaseModal } from "@/components/features/shared/BaseModal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, RefreshCw } from "lucide-react";
import type { EditAccountFormData, EditAccountDialogProps } from "../types/dialogs.types";

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
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      asForm={true}
      onSubmit={handleSubmit}
      title="Edit Account Details"
      description="Modify the details for this account."
      className="sm:max-w-[480px] bg-white border border-blue-100 rounded-lg max-h-[90vh] overflow-y-auto"
      footer={
        <div className="flex justify-end gap-2 sm:gap-0 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-200 text-slate-600 h-9 mr-2"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-9"
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
        </div>
      }
    >
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
    </BaseModal>
  );
}

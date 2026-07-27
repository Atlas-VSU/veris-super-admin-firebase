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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, RefreshCw, Eye, EyeOff } from "lucide-react";
import type { SuperAdminOrg } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateOrgAccountFormData {
  email: string;
  tempPassword: string;
  firstName: string;
  lastName: string;
  /** Display name — e.g. "President - Kyle" or auto-combined first+last */
  name: string;
  orgId: string;
}

interface CreateOrgAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateOrgAccountFormData) => Promise<void> | void;
  orgs: SuperAdminOrg[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateOrgAccountDialog({
  open,
  onOpenChange,
  onCreate,
  orgs,
}: CreateOrgAccountDialogProps) {
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [name, setName] = useState("");
  const [orgId, setOrgId] = useState("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-populate the display name when first/last name changes,
  // but only if the user hasn't manually edited it yet.
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);

  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    if (!nameManuallyEdited) {
      setName(`${value} ${lastName}`.trim());
    }
  };

  const handleLastNameChange = (value: string) => {
    setLastName(value);
    if (!nameManuallyEdited) {
      setName(`${firstName} ${value}`.trim());
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setNameManuallyEdited(true);
  };

  const resetForm = () => {
    setEmail("");
    setTempPassword("");
    setShowPassword(false);
    setFirstName("");
    setLastName("");
    setName("");
    setOrgId("none");
    setNameManuallyEdited(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please provide the account's email address.");
      return;
    }
    if (!tempPassword.trim() || tempPassword.length < 6) {
      toast.error("Temporary password must be at least 6 characters.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please provide the account holder's first and last name.");
      return;
    }
    if (orgId === "none") {
      toast.error("Please select an organization to link this account to.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        email: email.trim(),
        tempPassword: tempPassword.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: name.trim() || `${firstName.trim()} ${lastName.trim()}`,
        orgId,
      });
      resetForm();
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
              <UserPlus className="h-5 w-5 text-blue-600" /> Create Org Account
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Register a new organization admin account on the VERIS platform.
              A temporary password will be issued to the account holder.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">

            {/* ── Identity section ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="account-firstname"
                  className="text-xs font-semibold text-slate-600 uppercase"
                >
                  First Name
                </Label>
                <Input
                  id="account-firstname"
                  placeholder="e.g. Juan"
                  value={firstName}
                  onChange={(e) => handleFirstNameChange(e.target.value)}
                  className="border-blue-100"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="account-lastname"
                  className="text-xs font-semibold text-slate-600 uppercase"
                >
                  Last Name
                </Label>
                <Input
                  id="account-lastname"
                  placeholder="e.g. Dela Cruz"
                  value={lastName}
                  onChange={(e) => handleLastNameChange(e.target.value)}
                  className="border-blue-100"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="account-name"
                className="text-xs font-semibold text-slate-600 uppercase"
              >
                Display Name{" "}
                <span className="normal-case text-slate-400">
                  (auto-filled — you may customise)
                </span>
              </Label>
              <Input
                id="account-name"
                placeholder="e.g. President - Kyle or Juan Dela Cruz"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="border-blue-100"
              />
              <p className="text-[11px] text-slate-400 -mt-1">
                Leave blank to use the combined first + last name. You can also
                write a role-based name like &quot;President - Kyle&quot;.
              </p>
            </div>

            {/* ── Credentials section ── */}
            <div className="border-t border-blue-50 pt-4 mt-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                Account Credentials
              </p>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="account-email"
                    className="text-xs font-semibold text-slate-600 uppercase"
                  >
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    id="account-email"
                    placeholder="e.g. admin@cssorg.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-blue-100"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="account-password"
                    className="text-xs font-semibold text-slate-600 uppercase"
                  >
                    Temporary Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="account-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      className="border-blue-100 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 -mt-1">
                    The account holder should change this on first login.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Organization link ── */}
            <div className="border-t border-blue-50 pt-4 mt-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                Linked Organization
              </p>

              <div className="grid gap-2">
                <Label
                  htmlFor="account-org"
                  className="text-xs font-semibold text-slate-600 uppercase"
                >
                  Organization
                </Label>
                <Select value={orgId} onValueChange={setOrgId}>
                  <SelectTrigger id="account-org" className="border-blue-100">
                    <SelectValue placeholder="Select Organization" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 max-h-56">
                    <SelectItem value="none">Select Organization...</SelectItem>
                    {orgs.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                        {org.shortName ? ` (${org.shortName})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400 -mt-1">
                  The account will be assigned as admin for the selected
                  organization.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
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
                "Create Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

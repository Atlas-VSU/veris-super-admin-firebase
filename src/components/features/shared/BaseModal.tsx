import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BaseModalProps } from "./types/modals.types";
import { cn } from "@/lib/utils";

export function BaseModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  usePrimaryGradient = true,
  className = "sm:max-w-lg",
  showCloseButton = true,
  asForm = false,
  onSubmit,
}: BaseModalProps) {
  const content = (
    <>
      <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-white rounded-t-[4px]">
        <DialogTitle
          className={cn(
            usePrimaryGradient
              ? "bg-gradient-to-r from-[#030677] to-[#2563eb] bg-clip-text text-transparent uppercase font-extrabold"
              : ""
          )}
        >
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription
            className={cn(
              "mt-1.5",
              usePrimaryGradient
                ? "bg-gradient-to-r from-[#2563eb] to-[#93c5fd] bg-clip-text text-transparent"
                : ""
            )}
          >
            {description}
          </DialogDescription>
        )}
      </DialogHeader>
      
      <div className="px-6 py-5 flex-1 overflow-y-auto min-h-0">
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-[4px]">
          <DialogFooter>{footer}</DialogFooter>
        </div>
      )}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("flex flex-col p-0 gap-0 overflow-hidden", className)} showCloseButton={showCloseButton}>
        {asForm ? (
          <form onSubmit={onSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {content}
          </form>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {content}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

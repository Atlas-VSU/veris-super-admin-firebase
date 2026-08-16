import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConfirmationDialogProps } from "./types/dialogs.types";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConfirmationDialog({
  open,
  onOpenChange,
  variant,
  title,
  description,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  warningMessage,
  isLoading = false,
}: ConfirmationDialogProps) {
  
  const getActionVariant = () => {
    switch (variant) {
      case "danger":
        return "destructive";
      case "success":
        return "success";
      case "warning":
        return "warning";
      default:
        return "default";
    }
  };

  const getWarningStyles = () => {
    switch (variant) {
      case "danger":
        return "border-red-200 bg-red-50 text-red-700";
      case "success":
        return "border-green-200 bg-green-50 text-green-700";
      case "warning":
        return "border-amber-200 bg-amber-50 text-amber-700";
      default:
        return "border-blue-200 bg-blue-50 text-blue-700";
    }
  };
  
  const getTitleColor = () => {
    switch (variant) {
      case "danger":
        return "text-red-700";
      case "success":
        return "text-green-700";
      case "warning":
        return "text-amber-700";
      default:
        return "text-[#030677]";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="flex flex-col sm:max-w-[500px] bg-white border border-slate-200 p-0 gap-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <AlertDialogHeader className="px-6 py-5 border-b border-slate-100 bg-white rounded-t-[4px] shrink-0">
            <AlertDialogTitle className={cn("flex items-center gap-2", getTitleColor())}>
              {title}
            </AlertDialogTitle>
            
            {description && (
              <AlertDialogDescription asChild>
                <div className="text-sm text-slate-600 mt-1.5">
                  <p>{description}</p>
                </div>
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          
          {(children || warningMessage) && (
            <div className="px-6 py-5 flex-1 overflow-y-auto min-h-0 space-y-4">
              {children && <div>{children}</div>}

              {warningMessage && (
                <div className={cn("rounded-md border px-3 py-2.5 text-xs", getWarningStyles())}>
                  {warningMessage}
                </div>
              )}
            </div>
          )}
          
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-[4px] shrink-0">
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading} className="border-slate-200 text-slate-600">
                {cancelText}
              </AlertDialogCancel>
              
              <Button
                variant={getActionVariant()}
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {confirmText}
              </Button>
            </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { ReactNode } from "react";

export type ConfirmationDialogVariant = "danger" | "success" | "warning" | "default";

export interface ConfirmationDialogProps {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;

  /**
   * Callback when the dialog's open state changes.
   */
  onOpenChange: (open: boolean) => void;

  /**
   * The semantic variant of the dialog which dictates the styling (Action button colors, etc).
   */
  variant: ConfirmationDialogVariant;

  /**
   * The title of the dialog.
   */
  title: ReactNode;

  /**
   * Optional description text below the title.
   */
  description?: ReactNode;

  /**
   * The custom content (children) of the dialog, inserted above the warning box (if any).
   */
  children?: ReactNode;

  /**
   * Optional text for the confirm action button.
   * Default: "Confirm"
   */
  confirmText?: string;

  /**
   * Optional text for the cancel button.
   * Default: "Cancel"
   */
  cancelText?: string;

  /**
   * Callback triggered when the confirm button is clicked.
   */
  onConfirm: () => void;

  /**
   * Optional warning message to display in an alert box within the dialog.
   * Styled according to the variant (e.g., red background for danger).
   */
  warningMessage?: ReactNode;

  /**
   * Disables the confirm button and shows a loading state if true.
   * Default: false
   */
  isLoading?: boolean;
}

import { ReactNode } from "react";

export interface BaseModalProps {
  /**
   * Whether the modal is currently open.
   */
  open: boolean;

  /**
   * Callback when the modal's open state changes.
   */
  onOpenChange: (open: boolean) => void;

  /**
   * The title of the modal. 
   * If `usePrimaryGradient` is true, this title will be rendered with the primary brand gradient.
   */
  title: ReactNode;

  /**
   * Optional description text below the title.
   */
  description?: ReactNode;

  /**
   * The content of the modal.
   */
  children?: ReactNode;

  /**
   * Optional footer content (e.g., action buttons).
   */
  footer?: ReactNode;

  /**
   * Whether to apply the primary text gradient to the title.
   * Default: true
   */
  usePrimaryGradient?: boolean;

  /**
   * Optional maximum width for the modal content (e.g., 'sm:max-w-[425px]', 'sm:max-w-md').
   * Default: 'sm:max-w-lg'
   */
  className?: string;

  /**
   * Whether to show the close button.
   * Default: true
   */
  showCloseButton?: boolean;

  /**
   * Whether to wrap the content in a form element.
   * Default: false
   */
  asForm?: boolean;

  /**
   * Form submission handler, used if asForm is true.
   */
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
}

import { useEffect, useRef, type ReactNode } from 'react';

/** Props for the Modal component. */
interface ModalProps {
  /** Whether the modal is currently open. */
  open: boolean;
  /** Title displayed at the top of the modal. */
  title: string;
  /** Body content of the modal. */
  children?: ReactNode;
  /** Label for the confirm / primary action button. Defaults to 'Confirm'. */
  confirmLabel?: string;
  /** Label for the cancel button. Defaults to 'Cancel'. */
  cancelLabel?: string;
  /** Visual variant of the confirm button. */
  confirmVariant?: 'danger' | 'primary';
  /**
   * Which button receives focus when the modal opens.
   * - `'cancel'` (default for danger actions) prevents accidental destructive confirms.
   * - `'confirm'` is appropriate for non-destructive primary actions.
   */
  initialFocus?: 'cancel' | 'confirm';
  /** Called when the user clicks the confirm button. */
  onConfirm: () => void;
  /** Called when the user clicks cancel or presses Escape. */
  onCancel: () => void;
}

/**
 * Accessible modal dialog that replaces native `confirm()`.
 * Traps focus within the dialog, returns focus on close, and handles Escape.
 */
export function Modal({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  initialFocus = confirmVariant === 'danger' ? 'cancel' : 'confirm',
  onConfirm,
  onCancel,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save focus target and move focus into dialog on open
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const selector = initialFocus === 'confirm' ? '.modal-btn-confirm' : '.modal-btn-cancel';
      const btn = dialogRef.current?.querySelector<HTMLButtonElement>(selector);
      btn?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open, initialFocus]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      // Basic focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" className="modal-title">
          {title}
        </h2>
        {children && <div className="modal-body">{children}</div>}
        <div className="modal-actions">
          <button className="modal-btn modal-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`modal-btn modal-btn-confirm modal-btn-${confirmVariant}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

import { createContext, useCallback, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** The visual variant of a toast notification. */
export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  /**
   * Displays a toast notification.
   * @param message - The text to show.
   * @param type - Visual variant: 'success' | 'error' | 'info'.
   */
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Duration (ms) before a toast auto-dismisses. */
const TOAST_DURATION = 3500;

/**
 * Provider component that supplies `showToast` to its subtree and renders
 * the live toast stack.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="toast-container"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Individual animated toast item. */
function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), TOAST_DURATION);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [toast.id, onDismiss]);

  return (
    <div className={`toast toast-${toast.type}`} role="status">
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Hook that provides access to the toast notification system.
 * Must be used inside a `ToastProvider`.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

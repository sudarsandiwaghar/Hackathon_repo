import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, variant, duration = 4000 }: Omit<Toast, 'id'>) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, title, message, variant, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const getVariantStyles = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
          progress: 'bg-emerald-500',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
          progress: 'bg-amber-500',
        };
      case 'error':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          icon: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
          progress: 'bg-rose-500',
        };
      case 'info':
      default:
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-900',
          icon: <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />,
          progress: 'bg-sky-500',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div
        id="toast-container"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const styles = getVariantStyles(t.variant);
          return (
            <div
              key={t.id}
              id={`toast-${t.id}`}
              className={`pointer-events-auto border rounded-xl p-3.5 shadow-lg flex items-start gap-3 transition-all duration-300 transform translate-y-0 ${styles.bg}`}
            >
              {styles.icon}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{t.title}</p>
                {t.message && <p className="text-xs mt-1 text-gray-600 leading-normal">{t.message}</p>}
              </div>
              <button
                id={`toast-close-${t.id}`}
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

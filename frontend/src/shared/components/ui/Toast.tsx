/**
 * ===== TOAST COMPONENT =====
 *
 * Simple toast notification system.
 * Shows success/error messages that auto-dismiss.
 *
 * @module shared/components/ui/Toast
 */

import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/utils/cn';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={cn(
        'px-6 py-3 font-bold uppercase text-sm animate-in slide-in-from-top-2 fade-in duration-200 pointer-events-auto',
        'border shadow-lg',
        toast.type === 'success' && 'bg-yes text-black border-yes',
        toast.type === 'error' && 'bg-no text-white border-no',
        toast.type === 'info' && 'bg-cyber text-black border-cyber'
      )}
    >
      <span className="flex items-center gap-2">
        {toast.type === 'success' && '✓'}
        {toast.type === 'error' && '✕'}
        {toast.type === 'info' && 'ℹ'}
        {toast.message}
      </span>
    </div>
  );
}

export default ToastProvider;

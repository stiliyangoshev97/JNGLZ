/**
 * ===== MODAL COMPONENT =====
 *
 * Brutalist modal/dialog component.
 * Dark overlay, harsh borders, NO rounded corners.
 *
 * Uses React Portal to render outside the DOM hierarchy.
 *
 * @module shared/components/ui/Modal
 */

import {
  useEffect,
  useCallback,
  type ReactNode,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Prevent closing by clicking backdrop or pressing Escape */
  preventClose?: boolean;
  /** Modal size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Additional class names for the modal content */
  className?: string;
  /** Show close button in header */
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  preventClose = false,
  size = 'md',
  className,
  showCloseButton = true,
}: ModalProps) {
  // Handle Escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !preventClose) {
        onClose();
      }
    },
    [onClose, preventClose]
  );

  // Add/remove escape listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  // Handle backdrop click
  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !preventClose) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={cn(
          'relative z-10 w-full bg-dark-900 border border-dark-600',
          'animate-in fade-in zoom-in-95 duration-200',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-dark-600 px-6 py-4">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-white uppercase tracking-wide"
              >
                {title}
              </h2>
            )}
            {showCloseButton && !preventClose && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'p-2 text-dark-400 hover:text-white transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-cyber/50',
                  !title && 'ml-auto'
                )}
                aria-label="Close modal"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  // Render into portal
  return createPortal(modalContent, document.body);
}

// Simple X icon component
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={2}
        d="M6 6l12 12M6 18L18 6"
      />
    </svg>
  );
}

// Sub-components for flexible composition
export function ModalHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('border-b border-dark-600 px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('border-t border-dark-600 px-6 py-4 flex justify-end gap-3', className)}>
      {children}
    </div>
  );
}

export default Modal;

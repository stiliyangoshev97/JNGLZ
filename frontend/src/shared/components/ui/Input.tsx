/**
 * ===== INPUT COMPONENT =====
 *
 * Brutalist input field with terminal-style aesthetics.
 * Monospace font, harsh borders, neon focus states.
 *
 * @module shared/components/ui/Input
 */

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            // Base styles - BRUTALIST
            'w-full px-4 py-3',
            'bg-black border text-white',
            'font-mono placeholder-dark-400',
            'focus:outline-none transition-colors duration-150',
            // NO rounded corners
            'rounded-none',
            // Border color based on error state
            error
              ? 'border-no focus:border-no'
              : 'border-dark-600 focus:border-cyber',
            // Disabled state
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-no font-mono">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

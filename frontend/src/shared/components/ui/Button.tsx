/**
 * ===== BUTTON COMPONENT =====
 *
 * Brutalist button component with harsh styling.
 * NO rounded corners, NO shadows - just harsh borders and neon colors.
 *
 * VARIANTS:
 * - yes: Electric Lime for bullish/buy YES actions
 * - no: Neon Crimson for bearish/buy NO actions
 * - cyber: Cyber Blue for general actions
 * - ghost: Transparent with border for secondary actions
 *
 * SIZES:
 * - sm: Compact buttons
 * - md: Default size
 * - lg: Large CTAs
 *
 * @module shared/components/ui/Button
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

type ButtonVariant = 'yes' | 'no' | 'cyber' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  yes: `
    bg-yes/10 text-yes border-yes
    hover:bg-yes hover:text-black
    focus:ring-yes/50
    disabled:hover:bg-yes/10 disabled:hover:text-yes
  `,
  no: `
    bg-no/10 text-no border-no
    hover:bg-no hover:text-black
    focus:ring-no/50
    disabled:hover:bg-no/10 disabled:hover:text-no
  `,
  cyber: `
    bg-cyber/10 text-cyber border-cyber
    hover:bg-cyber hover:text-black
    focus:ring-cyber/50
    disabled:hover:bg-cyber/10 disabled:hover:text-cyber
  `,
  ghost: `
    bg-transparent text-text-secondary border-dark-600
    hover:bg-dark-800 hover:text-white hover:border-dark-500
    focus:ring-dark-500
    disabled:hover:bg-transparent disabled:hover:text-text-secondary
  `,
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'cyber',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles - BRUTALIST
          'inline-flex items-center justify-center gap-2',
          'font-semibold border transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-black',
          // NO rounded corners
          'rounded-none',
          // Variant
          variants[variant],
          // Size
          sizes[size],
          // Disabled state
          isDisabled && 'opacity-50 cursor-not-allowed',
          // Custom classes
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="animate-pulse">■</span>
            <span>LOADING...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

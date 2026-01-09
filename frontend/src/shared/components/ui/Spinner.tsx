/**
 * ===== SPINNER COMPONENT =====
 *
 * Matrix/terminal-style loading spinner.
 * Multiple variants for different loading states.
 *
 * @module shared/components/ui/Spinner
 */

import { cn } from '@/shared/utils/cn';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerVariant = 'cyber' | 'yes' | 'no' | 'white';

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  /** Show loading text */
  label?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

const variantClasses: Record<SpinnerVariant, string> = {
  cyber: 'border-cyber/20 border-t-cyber',
  yes: 'border-yes/20 border-t-yes',
  no: 'border-no/20 border-t-no',
  white: 'border-white/20 border-t-white',
};

const textVariantClasses: Record<SpinnerVariant, string> = {
  cyber: 'text-cyber',
  yes: 'text-yes',
  no: 'text-no',
  white: 'text-white',
};

export function Spinner({
  size = 'md',
  variant = 'cyber',
  className,
  label,
}: SpinnerProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
        style={{ borderStyle: 'solid' }}
        role="status"
        aria-label="Loading"
      />
      {label && (
        <span
          className={cn(
            'font-mono text-sm uppercase tracking-wider animate-pulse',
            textVariantClasses[variant]
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Matrix-style loading dots
 * Shows animated dots like a terminal
 */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={cn('font-mono text-cyber', className)}>
      <span className="animate-[pulse_1s_ease-in-out_0s_infinite]">.</span>
      <span className="animate-[pulse_1s_ease-in-out_0.2s_infinite]">.</span>
      <span className="animate-[pulse_1s_ease-in-out_0.4s_infinite]">.</span>
    </span>
  );
}

/**
 * Full-screen loading overlay
 * Used during major data fetches or transactions
 */
export function LoadingOverlay({
  message = 'LOADING',
  subMessage,
  variant = 'cyber',
}: {
  message?: string;
  subMessage?: string;
  variant?: SpinnerVariant;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
      <Spinner size="xl" variant={variant} />
      <p
        className={cn(
          'mt-4 font-mono text-lg uppercase tracking-[0.3em]',
          textVariantClasses[variant]
        )}
      >
        {message}
        <LoadingDots />
      </p>
      {subMessage && (
        <p className="mt-2 font-mono text-sm text-text-secondary">
          {subMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Skeleton loader for content placeholders
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-dark-700',
        className
      )}
    />
  );
}

/**
 * Card skeleton for market cards
 */
export function MarketCardSkeleton() {
  return (
    <div className="card space-y-4">
      {/* Image skeleton */}
      <Skeleton className="w-full h-40" />
      
      {/* Title skeleton */}
      <Skeleton className="h-6 w-3/4" />
      
      {/* Chance display skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
      
      {/* Heat bar skeleton */}
      <Skeleton className="h-1 w-full" />
      
      {/* Footer skeleton */}
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export default Spinner;

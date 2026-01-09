/**
 * ===== CHANCE DISPLAY COMPONENT =====
 *
 * Big, bold, glowing percentage display for market probability.
 * Features the signature "neon sign flicker" animation.
 *
 * This is THE hero element on market cards and detail pages.
 *
 * @module shared/components/ui/ChanceDisplay
 */

import { cn } from '@/shared/utils/cn';

interface ChanceDisplayProps {
  /** Probability value (0-100 or 0-1 depending on isDecimal) */
  value: number;
  /** Is the value a decimal (0-1) or percentage (0-100)? */
  isDecimal?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  /** Show the % suffix */
  showPercent?: boolean;
  /** Enable flicker animation */
  animate?: boolean;
  /** Force a specific color variant */
  variant?: 'auto' | 'yes' | 'no' | 'neutral';
  /** Additional class names */
  className?: string;
  /** Label text (e.g., "YES", "CHANCE") */
  label?: string;
}

const sizeClasses = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl md:text-6xl',
  xl: 'text-6xl md:text-7xl',
  hero: 'text-7xl md:text-8xl lg:text-9xl',
};

const labelSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
  hero: 'text-xl',
};

export function ChanceDisplay({
  value,
  isDecimal = false,
  size = 'lg',
  showPercent = true,
  animate = true,
  variant = 'auto',
  className,
  label,
}: ChanceDisplayProps) {
  // Convert to percentage if needed
  const percentage = isDecimal ? value * 100 : value;
  
  // Determine color based on value or forced variant
  const getColorClasses = () => {
    if (variant === 'yes') return 'text-yes text-glow-yes';
    if (variant === 'no') return 'text-no text-glow-no';
    if (variant === 'neutral') return 'text-cyber text-glow-cyber';
    
    // Auto: YES if > 50%, NO if < 50%, neutral at 50%
    if (percentage > 50) return 'text-yes text-glow-yes';
    if (percentage < 50) return 'text-no text-glow-no';
    return 'text-cyber text-glow-cyber';
  };

  // Format the number for display
  const displayValue = percentage.toFixed(0);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {label && (
        <span
          className={cn(
            'font-mono uppercase tracking-[0.2em] text-text-secondary mb-1',
            labelSizeClasses[size]
          )}
        >
          {label}
        </span>
      )}
      <div
        className={cn(
          'font-mono font-bold tracking-tight leading-none',
          sizeClasses[size],
          getColorClasses(),
          animate && 'animate-flicker'
        )}
      >
        {displayValue}
        {showPercent && (
          <span className="text-[0.6em] ml-0.5 opacity-80">%</span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact chance display for cards
 * Shows percentage only (no cents)
 */
interface CompactChanceProps {
  value: number;
  isDecimal?: boolean;
  variant?: 'yes' | 'no' | 'auto';
  className?: string;
}

export function CompactChance({
  value,
  isDecimal = false,
  variant = 'auto',
  className,
}: CompactChanceProps) {
  const percentage = isDecimal ? value * 100 : value;
  
  const getColorClass = () => {
    if (variant === 'yes') return 'text-yes';
    if (variant === 'no') return 'text-no';
    return percentage >= 50 ? 'text-yes' : 'text-no';
  };

  return (
    <span className={cn('font-mono font-bold', getColorClass(), className)}>
      {percentage.toFixed(0)}%
    </span>
  );
}

/**
 * Price display for YES/NO shares
 * Shows prices in cents only (no percentage)
 */
interface PriceDisplayProps {
  yesPrice: number;
  noPrice: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceDisplay({
  yesPrice,
  noPrice,
  size = 'md',
  className,
}: PriceDisplayProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  // Convert decimal (0-1) to percentage (0-100) which equals cents
  const yesCents = Math.round(yesPrice * 100);
  const noCents = Math.round(noPrice * 100);

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* YES Price */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-mono text-text-secondary uppercase">YES</span>
        <span className={cn('font-mono font-bold text-yes', textSizes[size])}>
          {yesCents}¢
        </span>
      </div>

      {/* NO Price */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-mono text-text-secondary uppercase">NO</span>
        <span className={cn('font-mono font-bold text-no', textSizes[size])}>
          {noCents}¢
        </span>
      </div>
    </div>
  );
}

/**
 * Live updating chance with change indicator
 */
interface LiveChanceProps {
  value: number;
  previousValue?: number;
  isDecimal?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
}

export function LiveChance({
  value,
  previousValue,
  isDecimal = false,
  size = 'lg',
  className,
}: LiveChanceProps) {
  const percentage = isDecimal ? value * 100 : value;
  const prevPercentage = previousValue 
    ? (isDecimal ? previousValue * 100 : previousValue)
    : percentage;
  
  const change = percentage - prevPercentage;
  const hasChange = Math.abs(change) > 0.01;

  return (
    <div className={cn('flex items-end gap-3', className)}>
      <ChanceDisplay
        value={percentage}
        size={size}
        animate={hasChange}
      />
      {hasChange && (
        <span
          className={cn(
            'font-mono text-lg mb-2',
            change > 0 ? 'text-yes' : 'text-no'
          )}
        >
          {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
        </span>
      )}
    </div>
  );
}

export default ChanceDisplay;

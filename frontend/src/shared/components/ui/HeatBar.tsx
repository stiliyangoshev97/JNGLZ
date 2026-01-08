/**
 * ===== HEAT BAR COMPONENT =====
 *
 * Liquidity/activity gauge bar component.
 * Shows relative activity or liquidity with a gradient fill.
 *
 * The bar goes from green (low) → yellow (medium) → red (high/hot)
 * like a heat sensor.
 *
 * @module shared/components/ui/HeatBar
 */

import { cn } from '@/shared/utils/cn';

interface HeatBarProps {
  /** Value between 0 and 100 */
  value: number;
  /** Optional label to show */
  label?: string;
  /** Show percentage value */
  showValue?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional max value for scaling */
  max?: number;
  /** Additional class names */
  className?: string;
}

const sizeClasses = {
  sm: 'h-0.5',
  md: 'h-1',
  lg: 'h-2',
};

export function HeatBar({
  value,
  label,
  showValue = false,
  size = 'md',
  max = 100,
  className,
}: HeatBarProps) {
  // Clamp value between 0 and max
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = (clampedValue / max) * 100;

  return (
    <div className={cn('space-y-1', className)}>
      {/* Label row */}
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs font-mono">
          {label && <span className="text-text-secondary uppercase">{label}</span>}
          {showValue && (
            <span className="text-text-primary">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}

      {/* Bar container */}
      <div className={cn('bg-dark-700 overflow-hidden', sizeClasses[size])}>
        {/* Gradient fill */}
        <div
          className={cn('h-full transition-all duration-500 ease-out', sizeClasses[size])}
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, 
              #39FF14 0%, 
              #7FFF00 25%,
              #FFD700 50%, 
              #FF8C00 75%,
              #FF3131 100%
            )`,
            backgroundSize: '400% 100%',
            backgroundPosition: `${percentage}% 0`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * YES/NO Split Heat Bar
 * Shows the distribution between YES and NO positions
 */
interface SplitHeatBarProps {
  yesPercent: number;
  noPercent: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SplitHeatBar({
  yesPercent,
  noPercent,
  showLabels = true,
  size = 'md',
  className,
}: SplitHeatBarProps) {
  // Normalize to ensure they add up to 100
  const total = yesPercent + noPercent;
  const normalizedYes = total > 0 ? (yesPercent / total) * 100 : 50;
  const normalizedNo = total > 0 ? (noPercent / total) * 100 : 50;

  return (
    <div className={cn('space-y-1', className)}>
      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-yes">{normalizedYes.toFixed(0)}% YES</span>
          <span className="text-no">{normalizedNo.toFixed(0)}% NO</span>
        </div>
      )}

      {/* Split bar */}
      <div className={cn('flex overflow-hidden', sizeClasses[size])}>
        {/* YES side */}
        <div
          className="bg-yes transition-all duration-500 ease-out"
          style={{ width: `${normalizedYes}%` }}
        />
        {/* NO side */}
        <div
          className="bg-no transition-all duration-500 ease-out"
          style={{ width: `${normalizedNo}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Volume Heat Indicator
 * Shows volume relative to a threshold with pulsing animation when hot
 */
interface VolumeHeatProps {
  volume: number;
  hotThreshold?: number;
  label?: string;
  className?: string;
}

export function VolumeHeat({
  volume,
  hotThreshold = 10, // 10 BNB default
  label = 'VOLUME',
  className,
}: VolumeHeatProps) {
  const isHot = volume >= hotThreshold;
  const percentage = Math.min((volume / hotThreshold) * 100, 100);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs font-mono text-text-secondary uppercase">{label}</span>
      <div className="flex-1">
        <HeatBar value={percentage} size="sm" />
      </div>
      {isHot && (
        <span className="text-xs font-mono text-no animate-pulse">🔥</span>
      )}
    </div>
  );
}

export default HeatBar;

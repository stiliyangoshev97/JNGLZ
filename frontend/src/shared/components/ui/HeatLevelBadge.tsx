/**
 * ===== HEAT LEVEL BADGE COMPONENT =====
 *
 * Displays the market's heat level (tier) with appropriate styling.
 * Can be compact (just emoji + name) or detailed (full info).
 *
 * @module shared/components/ui/HeatLevelBadge
 */

import { useState } from 'react';
import { getHeatLevel, type HeatLevelConfig } from '@/shared/utils/heatLevel';
import { cn } from '@/shared/utils/cn';

interface HeatLevelBadgeProps {
  heatLevel: number | string | undefined;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export function HeatLevelBadge({ 
  heatLevel, 
  size = 'sm',
  showTooltip = true,
  className 
}: HeatLevelBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = getHeatLevel(heatLevel);
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1 font-mono font-bold uppercase border',
          config.bgColor,
          config.borderColor,
          config.textColor,
          sizeClasses[size],
          className
        )}
      >
        <span>{config.shortName}</span>
      </span>
      
      {/* Tooltip on hover */}
      {showTooltip && isHovered && (
        <div className="absolute z-50 left-0 top-full mt-2 w-64">
          <HeatLevelTooltip config={config} />
        </div>
      )}
    </div>
  );
}

/**
 * Detailed heat level info panel (for market detail page)
 */
interface HeatLevelInfoProps {
  heatLevel: number | string | undefined;
  className?: string;
}

export function HeatLevelInfo({ heatLevel, className }: HeatLevelInfoProps) {
  const config = getHeatLevel(heatLevel);
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div>
          <h3 className={cn('font-bold text-lg', config.textColor)}>{config.name}</h3>
          <p className="text-xs text-text-muted">{config.vibe}</p>
        </div>
      </div>
      
      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Trade Range:</span>
          <span className="text-white font-mono">{config.tradeRange}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Target:</span>
          <span className="text-white font-medium">{config.targetUser}</span>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-xs text-text-secondary border-t border-dark-600 pt-3">
        {config.vibeDescription}
      </p>
    </div>
  );
}

/**
 * Compact tooltip for heat level badge
 */
function HeatLevelTooltip({ config }: { config: HeatLevelConfig }) {
  return (
    <div className={cn(
      'bg-dark-900 border shadow-xl p-3 space-y-2',
      config.borderColor
    )}>
      <div className="flex items-center gap-2">
        <span className={cn('font-bold', config.textColor)}>{config.name}</span>
      </div>
      
      <div className="text-xs space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-text-muted">Trade Range:</span>
          <span className="font-mono text-white">{config.tradeRange}</span>
        </div>
      </div>
      
      <p className="text-[10px] text-text-secondary border-t border-dark-600 pt-2">
        {config.vibeDescription}
      </p>
    </div>
  );
}

export default HeatLevelBadge;

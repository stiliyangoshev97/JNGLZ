/**
 * ===== MARKET CARD COMPONENT =====
 *
 * Card component for displaying a market in the grid.
 * Features:
 * - Grayscale → color image on hover
 * - Big glowing chance percentage
 * - Heat bar for liquidity
 * - Hype flash animation on trade
 *
 * @module features/markets/components/MarketCard
 */

import { Link } from 'react-router-dom';
import { Card } from '@/shared/components/ui/Card';
import { CompactChance } from '@/shared/components/ui/ChanceDisplay';
import { HeatBar } from '@/shared/components/ui/HeatBar';
import { Badge } from '@/shared/components/ui/Badge';
import { formatTimeRemaining, calculateYesPercent } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { Market } from '@/shared/schemas';

interface MarketCardProps {
  market: Market;
  className?: string;
}

export function MarketCard({ market, className }: MarketCardProps) {
  // Calculate YES price percentage using bonding curve formula
  const yesPercent = calculateYesPercent(market.yesShares, market.noShares);

  // Calculate time remaining
  const expirationTimestamp = Number(market.expiryTimestamp); // Unix timestamp in seconds
  const isExpired = expirationTimestamp * 1000 < Date.now();
  const timeRemaining = formatTimeRemaining(expirationTimestamp);

  // Calculate liquidity for heat bar (0-100 scale)
  // poolBalance from subgraph is BigDecimal (already in BNB)
  const poolBalanceBNB = parseFloat(market.poolBalance || '0');
  const heatValue = Math.min(poolBalanceBNB * 10, 100); // 10 BNB = 100%

  // Volume display - totalVolume from subgraph is BigDecimal (already in BNB)
  const volumeBNB = parseFloat(market.totalVolume || '0');
  const volumeDisplay = volumeBNB >= 1000 
    ? `${(volumeBNB / 1000).toFixed(1)}K` 
    : volumeBNB.toFixed(2);

  // Status badge
  const getStatusBadge = () => {
    if (market.status === 'Resolved') return <Badge variant="active">RESOLVED</Badge>;
    if (market.status === 'Disputed') return <Badge variant="disputed">⚠ DISPUTED</Badge>;
    if (isExpired) return <Badge variant="expired">EXPIRED</Badge>;
    return null;
  };

  return (
    <Link to={`/market/${market.id}`} className="block">
      <Card
        variant="hover"
        className={cn(
          'group h-full flex flex-col overflow-hidden',
          'hover:border-cyber/50 transition-all duration-200',
          className
        )}
      >
        {/* Image */}
        {market.imageUrl && (
          <div className="relative h-40 -mx-4 -mt-4 mb-4 overflow-hidden border-b border-dark-600">
            <img
              src={market.imageUrl}
              alt=""
              className="w-full h-full object-cover market-image"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-800 to-transparent" />
            
            {/* Status badge overlay */}
            {getStatusBadge() && (
              <div className="absolute top-2 right-2">
                {getStatusBadge()}
              </div>
            )}
          </div>
        )}

        {/* Question */}
        <h3 className="text-base font-semibold text-white line-clamp-2 mb-3 group-hover:text-cyber transition-colors">
          {market.question}
        </h3>

        {/* Chance Display */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-mono text-text-muted block mb-1">YES CHANCE</span>
            <CompactChance value={yesPercent} className="text-3xl" />
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-text-muted block mb-1">VOLUME</span>
            <span className="font-mono text-lg text-white">{volumeDisplay}</span>
            <span className="text-xs text-text-muted ml-1">BNB</span>
          </div>
        </div>

        {/* Heat Bar */}
        <HeatBar
          value={heatValue}
          label="LIQUIDITY"
          size="sm"
          className="mb-3"
        />

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-dark-700 flex items-center justify-between text-xs font-mono">
          {/* Time remaining */}
          <span className={cn(
            isExpired ? 'text-no' : 'text-text-secondary'
          )}>
            {isExpired ? 'EXPIRED' : timeRemaining}
          </span>

          {/* Activity indicator */}
          {volumeBNB > 5 && (
            <span className="text-yes animate-pulse">🔥 HOT</span>
          )}
        </div>
      </Card>
    </Link>
  );
}

export default MarketCard;

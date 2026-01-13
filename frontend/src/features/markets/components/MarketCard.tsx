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
import { HeatLevelBadge } from '@/shared/components/ui/HeatLevelBadge';
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
  const now = Date.now();
  const expiryMs = expirationTimestamp * 1000;
  const isExpired = expiryMs < now;
  const timeRemaining = formatTimeRemaining(expirationTimestamp);

  // Emergency refund eligibility (24h after expiry, not resolved)
  const EMERGENCY_REFUND_DELAY = 24 * 60 * 60 * 1000; // 24 hours
  const emergencyRefundTime = expiryMs + EMERGENCY_REFUND_DELAY;
  const isUnresolved = isExpired && !market.resolved && now > emergencyRefundTime;

  // Calculate liquidity for heat bar (0-100 scale)
  // poolBalance from subgraph is BigInt in wei, need to convert to BNB
  const poolBalanceWei = BigInt(market.poolBalance || '0');
  const poolBalanceBNB = Number(poolBalanceWei) / 1e18;
  const heatValue = Math.min(poolBalanceBNB * 10, 100); // 10 BNB = 100%

  // Volume for HOT indicator - totalVolume from subgraph is BigDecimal (already in BNB)
  const volumeBNB = parseFloat(market.totalVolume || '0');

  // Status badge
  const getStatusBadge = () => {
    if (market.status === 'Resolved') return <Badge variant="yes">RESOLVED</Badge>;
    if (market.status === 'Disputed') return <Badge variant="disputed">⚠ DISPUTED</Badge>;
    if (isUnresolved) return <Badge variant="no">UNRESOLVED</Badge>;
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
            
            {/* Heat level badge (top left) */}
            <div className="absolute top-2 left-2">
              <HeatLevelBadge heatLevel={market.heatLevel} size="sm" />
            </div>
            
            {/* Status badge overlay (top right) */}
            {getStatusBadge() && (
              <div className="absolute top-2 right-2">
                {getStatusBadge()}
              </div>
            )}
          </div>
        )}

        {/* Heat level badge (if no image, show above question) */}
        {!market.imageUrl && (
          <div className="flex items-center gap-2 mb-2">
            <HeatLevelBadge heatLevel={market.heatLevel} size="sm" />
            {getStatusBadge()}
          </div>
        )}

        {/* Question - fixed min-height for consistent layout across cards */}
        <h3 className="text-base font-semibold text-white line-clamp-2 mb-3 min-h-[48px] group-hover:text-cyber transition-colors">
          {market.question}
        </h3>

        {/* Market ID */}
        <div className="text-[10px] font-mono text-text-muted mb-2">
          ID: #{market.marketId}
        </div>

        {/* Chance Display + Prices */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-mono text-text-muted block mb-1">CHANCE</span>
            <CompactChance value={yesPercent} className="text-3xl" />
          </div>
          {/* YES/NO Prices in cents */}
          <div className="text-right">
            <div className="flex items-center gap-3 text-sm font-mono">
              <div>
                <span className="text-text-muted text-xs">YES </span>
                <span className="text-yes font-bold">{Math.round(yesPercent)}¢</span>
              </div>
              <div>
                <span className="text-text-muted text-xs">NO </span>
                <span className="text-no font-bold">{Math.round(100 - yesPercent)}¢</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heat Bar with Pool Size */}
        <div className="mb-3">
          <div className="flex justify-between items-center text-xs font-mono mb-1">
            <span className="text-text-secondary uppercase">POOL SIZE</span>
            <span className="text-text-muted">{poolBalanceBNB.toFixed(2)} BNB</span>
          </div>
          <HeatBar
            value={heatValue}
            size="sm"
          />
        </div>

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

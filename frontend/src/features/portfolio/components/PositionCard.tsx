/**
 * ===== POSITION CARD COMPONENT =====
 *
 * Card showing a user's position in a market.
 * Displays shares held, current value, and P/L.
 *
 * @module features/portfolio/components/PositionCard
 */

import { Link } from 'react-router-dom';
import { Card } from '@/shared/components/ui/Card';
import { Badge, YesHolderBadge, NoHolderBadge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { CompactChance } from '@/shared/components/ui/ChanceDisplay';
import { cn } from '@/shared/utils/cn';
import type { Position, Market } from '@/shared/schemas';

interface PositionWithMarket extends Position {
  market?: Market;
}

interface PositionCardProps {
  position: PositionWithMarket;
}

export function PositionCard({ position }: PositionCardProps) {
  const market = position.market;
  
  // Parse share amounts
  const yesShares = Number(position.yesShares || '0') / 1e18;
  const noShares = Number(position.noShares || '0') / 1e18;
  const invested = Number(position.totalInvested || '0') / 1e18;
  
  // Determine position type
  const hasYes = yesShares > 0;
  const hasNo = noShares > 0;
  
  // Calculate current prices from market
  let yesPercent = 50;
  let currentValue = 0;
  
  if (market) {
    const marketYes = BigInt(market.yesShares || '0');
    const marketNo = BigInt(market.noShares || '0');
    const total = marketYes + marketNo;
    
    if (total > 0n) {
      yesPercent = Number((marketNo * 100n) / total);
      const yesPrice = Number(marketNo) / Number(total);
      const noPrice = Number(marketYes) / Number(total);
      
      currentValue = (yesShares * yesPrice) + (noShares * noPrice);
    }
  }
  
  const pnl = currentValue - invested;
  const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
  
  // Status checks
  const isResolved = market?.status === 'Resolved';
  const canClaim = isResolved && (hasYes || hasNo);

  return (
    <Card variant="hover" className="flex flex-col">
      {/* Market Question */}
      <Link 
        to={`/market/${position.marketId}`}
        className="block mb-3 group"
      >
        <h3 className="font-semibold text-white line-clamp-2 group-hover:text-cyber transition-colors">
          {market?.question || `Market #${position.marketId}`}
        </h3>
      </Link>

      {/* Position badges */}
      <div className="flex items-center gap-2 mb-3">
        {hasYes && <YesHolderBadge />}
        {hasNo && <NoHolderBadge />}
        {isResolved && <Badge variant="active">RESOLVED</Badge>}
      </div>

      {/* Position details */}
      <div className="space-y-2 mb-4">
        {hasYes && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-muted">YES Shares</span>
            <span className="font-mono text-yes">{yesShares.toFixed(4)}</span>
          </div>
        )}
        {hasNo && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-muted">NO Shares</span>
            <span className="font-mono text-no">{noShares.toFixed(4)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-dark-700">
          <span className="text-sm text-text-muted">Invested</span>
          <span className="font-mono text-white">{invested.toFixed(4)} BNB</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Current Value</span>
          <span className="font-mono text-white">{currentValue.toFixed(4)} BNB</span>
        </div>
      </div>

      {/* P/L Display */}
      <div className={cn(
        'p-3 mb-4 border',
        pnl >= 0 ? 'bg-yes/10 border-yes/30' : 'bg-no/10 border-no/30'
      )}>
        <div className="flex justify-between items-center">
          <span className="text-sm font-mono text-text-muted">P/L</span>
          <div className="text-right">
            <span className={cn(
              'font-mono font-bold',
              pnl >= 0 ? 'text-yes' : 'text-no'
            )}>
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(4)} BNB
            </span>
            <span className={cn(
              'text-xs ml-2 font-mono',
              pnl >= 0 ? 'text-yes/70' : 'text-no/70'
            )}>
              ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Current market price */}
      {!isResolved && (
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-text-muted">Market Price</span>
          <CompactChance value={yesPercent} />
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex gap-2">
        {canClaim ? (
          <Button variant="yes" size="sm" className="flex-1">
            CLAIM
          </Button>
        ) : (
          <Link to={`/market/${position.marketId}`} className="flex-1">
            <Button variant="cyber" size="sm" className="w-full">
              TRADE
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

export default PositionCard;

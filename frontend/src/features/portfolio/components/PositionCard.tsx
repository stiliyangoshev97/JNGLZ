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
import { Spinner } from '@/shared/components/ui/Spinner';
import { CompactChance } from '@/shared/components/ui/ChanceDisplay';
import { useSmartClaim } from '@/shared/hooks';
import { cn } from '@/shared/utils/cn';
import { calculateYesPercent } from '@/shared/utils/format';

interface PositionWithMarket {
  id: string;
  user: { id: string; address: string };
  market: {
    id: string;
    marketId?: string;
    question: string;
    status: string;
    resolved: boolean;
    outcome?: boolean | null;
    expiryTimestamp: string;
    imageUrl?: string;
    yesShares?: string;
    noShares?: string;
    proposer?: string;
    proposalTimestamp?: string;
    disputer?: string;
    disputeTimestamp?: string;
  };
  yesShares: string;
  noShares: string;
  totalInvested: string;
  claimed: boolean;
}

// Time constants (from contract)
const DISPUTE_WINDOW = 30 * 60 * 1000; // 30 minutes
const VOTING_WINDOW = 60 * 60 * 1000; // 1 hour

interface PositionCardProps {
  position: PositionWithMarket;
}

export function PositionCard({ position }: PositionCardProps) {
  const market = position.market;
  
  // Smart claim hook for auto-finalize + claim
  const { smartClaim, step, isPending, isConfirming, isSuccess } = useSmartClaim();
  
  // Parse share amounts - subgraph returns BigInt strings for shares
  const yesShares = Number(BigInt(position.yesShares || '0')) / 1e18;
  const noShares = Number(BigInt(position.noShares || '0')) / 1e18;
  // totalInvested is BigDecimal (already in BNB from subgraph)
  const invested = parseFloat(position.totalInvested || '0');
  
  // Determine position type
  const hasYes = yesShares > 0;
  const hasNo = noShares > 0;
  
  // Calculate current prices from market using bonding curve
  let yesPercent = 50;
  let currentValue = 0;
  
  if (market) {
    // Use proper bonding curve calculation with virtual liquidity
    yesPercent = calculateYesPercent(market.yesShares || '0', market.noShares || '0');
    // Price is a fraction of UNIT_PRICE (0.01 BNB), not 1 BNB
    // YES price = 0.01 * yesPercent / 100, NO price = 0.01 * (100 - yesPercent) / 100
    const UNIT_PRICE = 0.01; // BNB
    const yesPrice = UNIT_PRICE * yesPercent / 100;
    const noPrice = UNIT_PRICE * (100 - yesPercent) / 100;
    
    currentValue = (yesShares * yesPrice) + (noShares * noPrice);
  }
  
  const pnl = currentValue - invested;
  const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
  
  // Status checks
  const isResolved = market?.status === 'Resolved';
  const alreadyClaimed = position.claimed || isSuccess;
  const canClaim = isResolved && (hasYes || hasNo) && !alreadyClaimed;

  // Check if market needs finalization before claiming
  // This happens when proposal exists but market not yet resolved
  const now = Date.now();
  const proposalMs = market.proposalTimestamp ? Number(market.proposalTimestamp) * 1000 : 0;
  const disputeMs = market.disputeTimestamp ? Number(market.disputeTimestamp) * 1000 : 0;
  const hasProposal = market.proposer && market.proposer !== '0x0000000000000000000000000000000000000000';
  const hasDispute = market.disputer && market.disputer !== '0x0000000000000000000000000000000000000000';
  
  const disputeWindowEnd = proposalMs + DISPUTE_WINDOW;
  const votingWindowEnd = disputeMs + VOTING_WINDOW;
  
  // Can finalize when: has proposal, not resolved, and either:
  // - No dispute AND dispute window ended
  // - Has dispute AND voting window ended  
  const canFinalize = hasProposal && !isResolved && (
    (hasDispute && now > votingWindowEnd) || 
    (!hasDispute && now > disputeWindowEnd)
  );

  // Handle claim action (smart claim will auto-finalize if needed)
  const handleClaim = () => {
    const marketId = BigInt(market.marketId || market.id);
    smartClaim(marketId);
  };

  // Get claim button state
  const getClaimButtonContent = () => {
    if (alreadyClaimed) return '✓ CLAIMED';
    if (isPending) return (
      <span className="flex items-center justify-center gap-2">
        <Spinner size="sm" variant="yes" />
        {step === 'finalizing' ? 'FINALIZING...' : 'CONFIRM...'}
      </span>
    );
    if (isConfirming) return (
      <span className="flex items-center justify-center gap-2">
        <Spinner size="sm" variant="yes" />
        {step === 'finalizing' ? 'FINALIZING...' : 'CLAIMING...'}
      </span>
    );
    return 'CLAIM';
  };

  return (
    <Card variant="hover" className="group flex flex-col overflow-hidden">
      {/* Market Image */}
      {market.imageUrl && (
        <div className="relative h-32 -mx-4 -mt-4 mb-4 overflow-hidden border-b border-dark-600">
          <img
            src={market.imageUrl}
            alt=""
            className="w-full h-full object-cover market-image"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-800 to-transparent" />
        </div>
      )}

      {/* Market Question */}
      <Link 
        to={`/market/${market.id}`}
        className="block mb-3"
      >
        <h3 className="font-semibold text-white line-clamp-2 group-hover:text-cyber transition-colors">
          {market.question || `Market #${market.id}`}
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
          <div className="text-right">
            <CompactChance value={yesPercent} />
            <span className="text-xs text-text-muted ml-1">({Math.round(yesPercent)}¢)</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex gap-2">
        {canClaim ? (
          <Button 
            variant="yes" 
            size="sm" 
            className="flex-1"
            onClick={handleClaim}
            disabled={isPending || isConfirming || isSuccess}
          >
            {getClaimButtonContent()}
          </Button>
        ) : canFinalize && (hasYes || hasNo) ? (
          // Market needs finalization before claiming
          <Button 
            variant="cyber" 
            size="sm" 
            className="flex-1 !bg-yellow-500/20 !border-yellow-500 !text-yellow-500 hover:!bg-yellow-500 hover:!text-black"
            onClick={handleClaim}
            disabled={isPending || isConfirming}
          >
            {isPending || isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                {step === 'finalizing' ? 'FINALIZING...' : 'PROCESSING...'}
              </span>
            ) : (
              'FINALIZE TO CLAIM'
            )}
          </Button>
        ) : (
          <Link to={`/market/${market.id}`} className="flex-1">
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

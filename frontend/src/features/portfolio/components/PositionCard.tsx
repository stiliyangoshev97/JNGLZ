/**
 * ===== POSITION CARD COMPONENT =====
 *
 * Card showing a user's position in a market.
 * Displays shares held, current value, and P/L.
 *
 * @module features/portfolio/components/PositionCard
 */

import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Card } from '@/shared/components/ui/Card';
import { Badge, YesHolderBadge, NoHolderBadge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { CompactChance } from '@/shared/components/ui/ChanceDisplay';
import { useFinalizeMarket, useClaim } from '@/shared/hooks';
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
    creatorAddress?: string;
  };
  yesShares: string;
  noShares: string;
  totalInvested: string;
  claimed: boolean;
}

// Time constants (from contract)
const CREATOR_PRIORITY_WINDOW = 10 * 60 * 1000; // 10 minutes
const DISPUTE_WINDOW = 30 * 60 * 1000; // 30 minutes
const VOTING_WINDOW = 60 * 60 * 1000; // 1 hour

interface PositionCardProps {
  position: PositionWithMarket;
}

export function PositionCard({ position }: PositionCardProps) {
  const { address } = useAccount();
  const market = position.market;
  
  // Separate hooks for finalize and claim
  const { 
    finalizeMarket, 
    isPending: isFinalizePending, 
    isConfirming: isFinalizeConfirming, 
    isSuccess: isFinalizeSuccess 
  } = useFinalizeMarket();
  
  const { 
    claim, 
    isPending: isClaimPending, 
    isConfirming: isClaimConfirming, 
    isSuccess: isClaimSuccess 
  } = useClaim();
  
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
  
  // Time and status checks
  const now = Date.now();
  const expiryMs = Number(market.expiryTimestamp) * 1000;
  const isExpired = now > expiryMs;
  
  // Check resolved status - also consider local finalize success
  const isResolvedFromData = market?.status === 'Resolved' || market?.resolved;
  const isResolved = isResolvedFromData || isFinalizeSuccess;
  
  const alreadyClaimed = position.claimed || isClaimSuccess;
  
  // Proposal and dispute status
  const proposalMs = market.proposalTimestamp ? Number(market.proposalTimestamp) * 1000 : 0;
  const disputeMs = market.disputeTimestamp ? Number(market.disputeTimestamp) * 1000 : 0;
  const hasProposal = market.proposer && market.proposer !== '0x0000000000000000000000000000000000000000';
  const hasDispute = market.disputer && market.disputer !== '0x0000000000000000000000000000000000000000';
  
  // Time windows
  const creatorPriorityEnd = expiryMs + CREATOR_PRIORITY_WINDOW;
  const disputeWindowEnd = proposalMs + DISPUTE_WINDOW;
  const votingWindowEnd = disputeMs + VOTING_WINDOW;
  
  // Check if user is creator
  const isCreator = address?.toLowerCase() === market.creatorAddress?.toLowerCase();
  
  // Can finalize when: has proposal, not resolved (from data), and either:
  // - No dispute AND dispute window ended
  // - Has dispute AND voting window ended  
  const canFinalize = hasProposal && !isResolvedFromData && !isFinalizeSuccess && (
    (hasDispute && now > votingWindowEnd) || 
    (!hasDispute && now > disputeWindowEnd)
  );
  
    // Can claim only if resolved AND has winning shares AND not already claimed
  const winningShares = market.outcome ? yesShares : noShares;
  const canClaim = isResolved && winningShares > 0 && !alreadyClaimed;
  // After we finalize locally, show claim button (user has shares)
  const canClaimAfterFinalize = isFinalizeSuccess && (hasYes || hasNo) && !alreadyClaimed;
  
  // Determine market phase for display
  const getMarketPhase = (): { 
    status: string; 
    badge: 'active' | 'expired' | 'disputed' | 'yes' | 'no' | 'neutral' | 'whale';
    action?: string;
    actionColor?: string;
  } => {
    // Already claimed
    if (alreadyClaimed) {
      return { status: 'CLAIMED', badge: market.outcome ? 'yes' : 'no' };
    }
    
    // Resolved (from data or local finalize)
    if (isResolved) {
      return { status: 'RESOLVED', badge: market.outcome ? 'yes' : 'no' };
    }
    
    // Not expired yet - active trading
    if (!isExpired) {
      return { status: 'ACTIVE', badge: 'active', action: 'VIEW MARKET' };
    }
    
    // Expired but no proposal yet
    if (!hasProposal) {
      const inCreatorPriority = now < creatorPriorityEnd;
      if (inCreatorPriority && isCreator) {
        return { status: 'AWAITING PROPOSAL', badge: 'expired', action: 'PROPOSE NOW', actionColor: 'yellow' };
      } else if (inCreatorPriority) {
        return { status: 'CREATOR PRIORITY', badge: 'expired', action: 'VIEW MARKET' };
      }
      return { status: 'AWAITING PROPOSAL', badge: 'expired', action: 'VIEW MARKET' };
    }
    
    // Has proposal, check if disputed
    if (hasDispute) {
      // In voting window
      if (now < votingWindowEnd) {
        return { status: 'VOTING', badge: 'disputed', action: 'VIEW MARKET' };
      }
      // Voting ended, needs finalization
      return { status: 'READY TO FINALIZE', badge: 'whale', action: 'FINALIZE' };
    }
    
    // Has proposal, no dispute yet
    if (now < disputeWindowEnd) {
      return { status: 'CAN DISPUTE', badge: 'expired', action: 'VIEW MARKET' };
    }
    
    // Dispute window ended, needs finalization
    return { status: 'READY TO FINALIZE', badge: 'whale', action: 'FINALIZE' };
  };
  
  const phase = getMarketPhase();

  // Handle finalize action
  const handleFinalize = () => {
    const marketId = BigInt(market.marketId || market.id);
    finalizeMarket(marketId);
  };

  // Handle claim action
  const handleClaim = () => {
    const marketId = BigInt(market.marketId || market.id);
    claim(marketId);
  };

  return (
    <Card variant="hover" className="group h-full flex flex-col overflow-hidden">
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

      {/* Market Question - fixed height for consistent layout */}
      <Link 
        to={`/market/${market.id}`}
        className="block mb-3 min-h-[48px]"
      >
        <h3 className="font-semibold text-white line-clamp-2 group-hover:text-cyber transition-colors">
          {market.question || `Market #${market.id}`}
        </h3>
      </Link>

      {/* Position badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {hasYes && <YesHolderBadge />}
        {hasNo && <NoHolderBadge />}
        <Badge variant={phase.badge}>{phase.status}</Badge>
      </div>

      {/* Position details - fixed structure for consistent alignment */}
      <div className="space-y-2 mb-4 flex-1">
        {/* Always show YES shares row (even if 0, keeps alignment) */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">YES Shares</span>
          <span className={cn("font-mono", hasYes ? "text-yes" : "text-text-muted")}>
            {yesShares > 0 ? yesShares.toFixed(4) : '—'}
          </span>
        </div>
        {/* Always show NO shares row */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">NO Shares</span>
          <span className={cn("font-mono", hasNo ? "text-no" : "text-text-muted")}>
            {noShares > 0 ? noShares.toFixed(4) : '—'}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-dark-700">
          <span className="text-sm text-text-muted">Total Spent</span>
          <span className="font-mono text-white">{invested.toFixed(4)} BNB</span>
        </div>
      </div>

      {/* P/L Display - only show if user has shares */}
      {(hasYes || hasNo) && (
        <div className={cn(
          'p-3 mb-4 border',
          pnl >= 0 ? 'bg-yes/10 border-yes/30' : 'bg-no/10 border-no/30'
        )}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-mono text-text-muted">Unrealized P/L</span>
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
      )}
      
      {/* Fully exited position notice */}
      {!hasYes && !hasNo && invested > 0 && (
        <div className="p-3 mb-4 border bg-dark-800 border-dark-600">
          <p className="text-xs text-text-muted text-center">
            Position closed - all shares sold
          </p>
        </div>
      )}

      {/* Current market chance */}
      {!isResolved && (
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-text-muted">CHANCE</span>
          <div className="text-right">
            <CompactChance value={yesPercent} />
            <span className="text-xs text-text-muted ml-1">({Math.round(yesPercent)}¢)</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex gap-2">
        {/* Already claimed */}
        {alreadyClaimed ? (
          <Button 
            variant="yes" 
            size="sm" 
            className="flex-1"
            disabled
          >
            ✓ CLAIMED
          </Button>
        ) : canClaim || canClaimAfterFinalize ? (
          /* Can claim - market is resolved */
          <Button 
            variant="yes" 
            size="sm" 
            className="flex-1"
            onClick={handleClaim}
            disabled={isClaimPending || isClaimConfirming}
          >
            {isClaimPending ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" variant="yes" />
                CONFIRM...
              </span>
            ) : isClaimConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" variant="yes" />
                CLAIMING...
              </span>
            ) : (
              'CLAIM'
            )}
          </Button>
        ) : canFinalize && (hasYes || hasNo) ? (
          /* Can finalize - market needs finalization first */
          <Button 
            variant="cyber" 
            size="sm" 
            className="flex-1 !bg-yellow-500/20 !border-yellow-500 !text-yellow-500 hover:!bg-yellow-500 hover:!text-black"
            onClick={handleFinalize}
            disabled={isFinalizePending || isFinalizeConfirming}
          >
            {isFinalizePending ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                CONFIRM...
              </span>
            ) : isFinalizeConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                FINALIZING...
              </span>
            ) : (
              'FINALIZE'
            )}
          </Button>
        ) : (
          /* Default - view market */
          <Link to={`/market/${market.id}`} className="flex-1">
            <Button 
              variant={phase.actionColor === 'yellow' ? 'cyber' : 'cyber'} 
              size="sm" 
              className={cn(
                "w-full",
                phase.actionColor === 'yellow' && "!bg-yellow-500/20 !border-yellow-500 !text-yellow-500 hover:!bg-yellow-500 hover:!text-black"
              )}
            >
              {phase.action || 'VIEW MARKET'}
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

export default PositionCard;

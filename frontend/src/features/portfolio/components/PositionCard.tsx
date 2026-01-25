/**
 * ===== POSITION CARD COMPONENT =====
 *
 * Card showing a user's position in a market.
 * Displays shares held, current value, and P/L.
 *
 * @module features/portfolio/components/PositionCard
 */

import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Card } from '@/shared/components/ui/Card';
import { Badge, YesHolderBadge, NoHolderBadge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { CompactChance } from '@/shared/components/ui/ChanceDisplay';
import { HeatLevelBadge } from '@/shared/components/ui/HeatLevelBadge';
import { useFinalizeMarket, useClaim, useEmergencyRefund } from '@/shared/hooks';
import { cn } from '@/shared/utils/cn';
import { calculateYesPercent, formatBNB } from '@/shared/utils/format';
import type { Trade } from '@/shared/schemas';

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
    proposedOutcome?: boolean | null;
    expiryTimestamp: string;
    imageUrl?: string;
    yesShares?: string;
    noShares?: string;
    poolBalance?: string;
    totalVolume?: string;
    proposer?: string;
    proposalTimestamp?: string;
    disputer?: string;
    disputeTimestamp?: string;
    creatorAddress?: string;
    virtualLiquidity?: string;
    heatLevel?: number;
  };
  yesShares: string;
  noShares: string;
  totalInvested: string;
  totalReturned?: string;
  netCostBasis?: string;
  claimed: boolean;
  claimedAmount?: string;
  emergencyRefunded?: boolean;
  refundedAmount?: string;
}

// Time constants (from contract)
const CREATOR_PRIORITY_WINDOW = 10 * 60 * 1000; // 10 minutes
const DISPUTE_WINDOW = 30 * 60 * 1000; // 30 minutes
const VOTING_WINDOW = 60 * 60 * 1000; // 1 hour
const EMERGENCY_REFUND_DELAY = 24 * 60 * 60 * 1000; // 24 hours

interface PositionCardProps {
  position: PositionWithMarket;
  trades?: Trade[]; // All user's trades - we'll filter by market
  onActionSuccess?: () => void; // Callback when claim/refund/finalize succeeds
}

/**
 * Calculate realized P/L for a specific market from trades
 * 
 * IMPORTANT: P/L is only "realized" when position is fully exited.
 * While still holding shares, the value is unrealized and shouldn't be shown as P/L.
 */
function calculateMarketRealizedPnl(
  trades: Trade[],
  marketId: string,
  walletAddress: string,
  currentYesShares: number,
  currentNoShares: number,
  isMarketResolved: boolean = false
): { realizedPnlBNB: number; realizedPnlPercent: number; hasSells: boolean; isFullyExited: boolean } {
  const address = walletAddress.toLowerCase();
  const marketIdLower = marketId.toLowerCase();
  
  // Track buys and sells per side for this market only
  const data = {
    yes: { bought: 0, sold: 0, sharesBought: 0, sharesSold: 0 },
    no: { bought: 0, sold: 0, sharesBought: 0, sharesSold: 0 },
  };

  // Filter trades for this wallet and this market
  trades.forEach(trade => {
    const tradeAddress = trade.traderAddress?.toLowerCase() || '';
    const tradeMarketId = trade.market?.id?.toLowerCase() || '';
    
    if (tradeAddress !== address || tradeMarketId !== marketIdLower) return;

    const bnbAmount = parseFloat(trade.bnbAmount || '0');
    const shares = Number(BigInt(trade.shares || '0')) / 1e18;
    const side = trade.isYes ? 'yes' : 'no';

    if (trade.isBuy) {
      data[side].bought += bnbAmount;
      data[side].sharesBought += shares;
    } else {
      data[side].sold += bnbAmount;
      data[side].sharesSold += shares;
    }
  });

  const hasYesSells = data.yes.sharesSold > 0;
  const hasNoSells = data.no.sharesSold > 0;
  const hasSells = hasYesSells || hasNoSells;
  
  // Position is "fully exited" only when you have 0 shares remaining
  // This is when P/L becomes "realized" and accurate to display
  const isFullyExited = currentYesShares === 0 && currentNoShares === 0;

  if (!hasSells) {
    return { realizedPnlBNB: 0, realizedPnlPercent: 0, hasSells: false, isFullyExited };
  }

  // Calculate realized P/L using average cost basis
  // Show Trading P/L when:
  // 1. Fully exited (0 remaining shares on that side), OR
  // 2. Market is resolved (trading is frozen, P/L from sells is finalized)
  let realizedPnlBNB = 0;
  let totalCostBasis = 0;

  // Count YES P/L if fully exited from YES position OR market is resolved
  if (hasYesSells && data.yes.sharesBought > 0 && (currentYesShares === 0 || isMarketResolved)) {
    const avgCostPerShare = data.yes.bought / data.yes.sharesBought;
    const costBasisOfSold = avgCostPerShare * data.yes.sharesSold;
    realizedPnlBNB += data.yes.sold - costBasisOfSold;
    totalCostBasis += costBasisOfSold;
  }

  // Count NO P/L if fully exited from NO position OR market is resolved
  if (hasNoSells && data.no.sharesBought > 0 && (currentNoShares === 0 || isMarketResolved)) {
    const avgCostPerShare = data.no.bought / data.no.sharesBought;
    const costBasisOfSold = avgCostPerShare * data.no.sharesSold;
    realizedPnlBNB += data.no.sold - costBasisOfSold;
    totalCostBasis += costBasisOfSold;
  }

  const realizedPnlPercent = totalCostBasis > 0 
    ? (realizedPnlBNB / totalCostBasis) * 100 
    : 0;

  return { realizedPnlBNB, realizedPnlPercent, hasSells, isFullyExited };
}

export function PositionCard({ position, trades = [], onActionSuccess }: PositionCardProps) {
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
  
  const {
    emergencyRefund,
    isPending: isRefundPending,
    isConfirming: isRefundConfirming,
    isSuccess: isRefundSuccess
  } = useEmergencyRefund();

  // Trigger parent refetch when any action succeeds
  useEffect(() => {
    if ((isClaimSuccess || isRefundSuccess || isFinalizeSuccess) && onActionSuccess) {
      onActionSuccess();
    }
  }, [isClaimSuccess, isRefundSuccess, isFinalizeSuccess, onActionSuccess]);
  
  // Parse share amounts - subgraph returns BigInt strings for shares
  const yesShares = Number(BigInt(position.yesShares || '0')) / 1e18;
  const noShares = Number(BigInt(position.noShares || '0')) / 1e18;
  // totalInvested is BigDecimal (already in BNB from subgraph)
  const invested = parseFloat(position.totalInvested || '0');
  
  // Determine position type
  const hasYes = yesShares > 0;
  const hasNo = noShares > 0;
  
  // Calculate current prices from market using bonding curve
  // For resolved markets, show 100%/0% based on outcome
  let yesPercent = 50;
  
  if (market) {
    if (market.resolved) {
      yesPercent = market.outcome ? 100 : 0;
    } else {
      // Use proper bonding curve calculation with market's virtual liquidity
      yesPercent = calculateYesPercent(market.yesShares || '0', market.noShares || '0', market.virtualLiquidity);
    }
  }
  
  // Calculate trading P/L for this market from trades (sells only)
  // After resolution, show Trading P/L even for partial sells (trading is frozen)
  const tradingPnl = useMemo(() => {
    if (!trades.length || !address) {
      return { realizedPnlBNB: 0, realizedPnlPercent: 0, hasSells: false, isFullyExited: false };
    }
    return calculateMarketRealizedPnl(trades, market.id, address, yesShares, noShares, market.resolved);
  }, [trades, market.id, address, yesShares, noShares, market.resolved]);
  
  // Resolution P/L = claimedAmount - netCostBasis (for resolved markets)
  // netCostBasis = totalInvested - totalReturned (what's still "at risk")
  // This correctly handles users who sold before resolution - their sold shares are NOT part of resolution P/L
  // Refunds are separate (capital recovery, not P/L)
  const resolutionStats = useMemo(() => {
    const claimedAmount = parseFloat(position.claimedAmount || '0');
    const refundedAmount = parseFloat(position.refundedAmount || '0');
    const isResolved = market.resolved;
    
    // Use netCostBasis which accounts for money already returned via sells
    // netCostBasis = totalInvested - totalReturned
    // If user sold all shares at profit, netCostBasis can be NEGATIVE (they got back more than invested)
    // In that case, they have nothing "at risk" for resolution - all their P/L is from trading
    const rawNetCostBasis = parseFloat(position.netCostBasis || position.totalInvested || '0');
    // Clamp to 0 - if netCostBasis is negative, user has no capital at risk for resolution
    const netCostBasis = Math.max(0, rawNetCostBasis);
    
    // Only calculate resolution P/L for resolved markets
    let resolutionPnl = 0;
    if (isResolved || claimedAmount > 0) {
      // Resolution P/L only applies to capital that was still at risk at resolution
      // If netCostBasis was negative (sold at profit), resolution P/L = claimedAmount - 0 = claimedAmount
      // If user had no shares (claimedAmount = 0) and negative netCostBasis, resolution P/L = 0
      resolutionPnl = claimedAmount - netCostBasis;
    }
    
    return {
      resolutionPnl,
      refundedAmount,
      hasClaimed: claimedAmount > 0,
      hasRefunded: refundedAmount > 0,
      isResolved,
    };
  }, [position.claimedAmount, position.refundedAmount, position.netCostBasis, position.totalInvested, market.resolved]);
  
  // Determine if position is "closed" for P/L purposes
  // Position is closed if: market is resolved OR user has no shares left (fully exited)
  const positionClosed = useMemo(() => {
    const isMarketResolved = market.resolved || market.status === 'Resolved';
    const hasNoShares = yesShares === 0 && noShares === 0;
    return isMarketResolved || hasNoShares;
  }, [market.resolved, market.status, yesShares, noShares]);
  
  // Total P/L for this position
  const totalPnl = useMemo(() => {
    // Trading P/L is valid when:
    // 1. Position is fully exited (0 shares remaining), OR
    // 2. Market is resolved (trading is frozen, partial sells are finalized)
    const canShowTradingPnl = tradingPnl.isFullyExited || resolutionStats.isResolved;
    const tradingPnlValue = canShowTradingPnl ? tradingPnl.realizedPnlBNB : 0;
    const combined = tradingPnlValue + (resolutionStats.isResolved ? resolutionStats.resolutionPnl : 0);
    // Only show P/L activity when there's actually something realized
    const hasActivity = (canShowTradingPnl && tradingPnl.hasSells) || resolutionStats.isResolved;
    return { combined, hasActivity, tradingPnlValue, canShowTradingPnl };
  }, [tradingPnl, resolutionStats]);
  
  // Time and status checks
  const now = Date.now();
  const expiryMs = Number(market.expiryTimestamp) * 1000;
  const isExpired = now > expiryMs;
  
  // Check resolved status - also consider local finalize success
  const isResolvedFromData = market?.status === 'Resolved' || market?.resolved;
  const isResolved = isResolvedFromData || isFinalizeSuccess;
  
  const alreadyClaimed = position.claimed || isClaimSuccess;
  
  // Emergency refund status
  const alreadyRefunded = position.emergencyRefunded || isRefundSuccess;
  const emergencyRefundTime = expiryMs + EMERGENCY_REFUND_DELAY;
  const totalShares = yesShares + noShares;
  // Can claim emergency refund if: expired, not resolved, 24h passed, has shares, not already refunded
  const canEmergencyRefund = isExpired && !isResolved && now > emergencyRefundTime && totalShares > 0 && !alreadyRefunded;
  
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
  
  // Get market supply to check if proposed winning side has shareholders
  const marketYesSupply = BigInt(market.yesShares || '0');
  const marketNoSupply = BigInt(market.noShares || '0');
  const marketTotalSupply = marketYesSupply + marketNoSupply;
  const poolBalance = BigInt(market.poolBalance || '0');
  
  // Calculate refund value: (userShares * poolBalance) / totalSupply
  const userSharesBigInt = BigInt(position.yesShares || '0') + BigInt(position.noShares || '0');
  const estimatedRefund = marketTotalSupply > 0n 
    ? (userSharesBigInt * poolBalance) / marketTotalSupply 
    : 0n;
  
  // Check if this is a one-sided market (only YES or only NO holders)
  const isOneSidedMarket = marketTotalSupply > 0n && (marketYesSupply === 0n || marketNoSupply === 0n);
  
  // Check if proposed winning side has shareholders (if not, finalize will fail)
  const proposedWinningSideHasShares = hasProposal && market.proposedOutcome !== undefined && market.proposedOutcome !== null && (
    market.proposedOutcome ? marketYesSupply > 0n : marketNoSupply > 0n
  );
  
  // Can finalize when: has proposal, not resolved (from data), proposed side has shares, NOT one-sided, and either:
  // - No dispute AND dispute window ended
  // - Has dispute AND voting window ended
  // One-sided markets cannot finalize - they can only get emergency refund after 24h
  const canFinalize = hasProposal && !isResolvedFromData && !isFinalizeSuccess && proposedWinningSideHasShares && !isOneSidedMarket && (
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
    // Resolved markets - show outcome clearly (takes priority)
    if (isResolved) {
      const outcomeText = market.outcome ? 'YES WINS' : 'NO WINS';
      // If user has winning shares they can still claim
      const hasWinningShares = market.outcome ? yesShares > 0 : noShares > 0;
      if (hasWinningShares && !alreadyClaimed) {
        return { status: `RESOLVED (${outcomeText})`, badge: 'yes', action: 'CLAIM' };
      }
      // User lost, claimed, or has no shares - just show resolved status (always green)
      return { status: `RESOLVED (${outcomeText})`, badge: 'yes' };
    }
    
    // Market is 24h+ expired without resolution - show UNRESOLVED (even if refunded)
    const isUnresolvedMarket = isExpired && !isResolved && now > emergencyRefundTime;
    if (isUnresolvedMarket) {
      // Already refunded - show UNRESOLVED badge still, but no action
      if (alreadyRefunded) {
        return { status: 'UNRESOLVED', badge: 'no' };
      }
      // Can claim emergency refund
      if (totalShares > 0) {
        return { status: 'UNRESOLVED', badge: 'no', action: 'CLAIM REFUND' };
      }
      // No shares to refund
      return { status: 'UNRESOLVED', badge: 'no' };
    }
    
    // Not expired yet - active trading
    if (!isExpired) {
      return { status: 'ACTIVE', badge: 'active', action: 'VIEW MARKET' };
    }
    
    // One-sided market - can only get emergency refund after 24h, cannot finalize
    if (isOneSidedMarket) {
      // Already refunded
      if (alreadyRefunded) {
        return { status: 'ONE-SIDED', badge: 'disputed' };
      }
      // 24h passed - can claim refund
      if (now > emergencyRefundTime && totalShares > 0) {
        return { status: 'ONE-SIDED', badge: 'disputed', action: 'CLAIM REFUND' };
      }
      // Still waiting for 24h
      return { status: 'ONE-SIDED', badge: 'disputed', action: 'VIEW MARKET' };
    }
    
    // Expired but no proposal yet
    if (!hasProposal) {
      const inCreatorPriority = now < creatorPriorityEnd;
      if (inCreatorPriority && isCreator) {
        return { status: 'AWAITING PROPOSAL', badge: 'neutral', action: 'PROPOSE NOW', actionColor: 'yellow' };
      } else if (inCreatorPriority) {
        return { status: 'CREATOR PRIORITY', badge: 'neutral', action: 'VIEW MARKET' };
      }
      return { status: 'AWAITING PROPOSAL', badge: 'neutral', action: 'VIEW MARKET' };
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

  // Handle emergency refund action
  const handleEmergencyRefund = () => {
    const marketId = BigInt(market.marketId || market.id);
    emergencyRefund(marketId);
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
          
          {/* Heat level badge (top left) */}
          {market.heatLevel !== undefined && (
            <div className="absolute top-2 left-2">
              <HeatLevelBadge heatLevel={market.heatLevel} size="sm" />
            </div>
          )}
        </div>
      )}

      {/* Heat level badge (if no image, show above question) */}
      {!market.imageUrl && market.heatLevel !== undefined && (
        <div className="flex items-center gap-2 mb-2">
          <HeatLevelBadge heatLevel={market.heatLevel} size="sm" />
        </div>
      )}

      {/* Market Question - fixed height for consistent layout */}
      <Link 
        to={`/market/${market.id}`}
        className="block mb-3 min-h-[48px]"
      >
        <h3 className="font-semibold text-white line-clamp-2 break-all group-hover:text-cyber transition-colors">
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
        {/* Pool Size and Volume */}
        <div className="flex justify-between items-center pt-2 border-t border-dark-700">
          <span className="text-sm text-text-muted">Pool Size</span>
          <span className="font-mono text-cyber">{formatBNB(poolBalance)} BNB</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Volume</span>
          <span className="font-mono text-text-secondary">{parseFloat(market.totalVolume || '0').toFixed(4)} BNB</span>
        </div>
      </div>

      {/* P/L Display - ALWAYS show this section unconditionally */}
      <div className={cn(
        'p-3 mb-4 border',
        // Color based on P/L activity and value
        totalPnl.hasActivity
          ? (totalPnl.combined >= 0 ? 'bg-yes/10 border-yes/30' : 'bg-no/10 border-no/30')
          : 'bg-dark-800 border-dark-600'
      )}>
        <div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-text-muted">Total P/L</span>
            {totalPnl.hasActivity ? (
              <span className={cn(
                'font-mono text-sm font-bold',
                totalPnl.combined >= 0 ? 'text-yes' : 'text-no'
              )}>
                {totalPnl.combined >= 0 ? '+' : ''}{totalPnl.combined.toFixed(4)} BNB
              </span>
            ) : positionClosed || resolutionStats.hasRefunded ? (
              <span className="font-mono text-sm text-text-muted">+0.0000 BNB</span>
            ) : (
              <span className="font-mono text-sm text-text-muted">— (position open)</span>
            )}
          </div>
          {/* Breakdown - always visible */}
          <div className="flex justify-end gap-2 mt-1 text-xs font-mono">
            {totalPnl.hasActivity ? (
              <>
                <span className={totalPnl.tradingPnlValue >= 0 ? 'text-yes/80' : 'text-no/80'}>
                  Trading: {totalPnl.tradingPnlValue >= 0 ? '+' : ''}{totalPnl.tradingPnlValue.toFixed(4)}
                </span>
                <span className="text-text-muted">|</span>
                <span className={resolutionStats.resolutionPnl >= 0 ? 'text-yes/80' : 'text-no/80'}>
                  Resolution: {resolutionStats.resolutionPnl >= 0 ? '+' : ''}{resolutionStats.resolutionPnl.toFixed(4)}
                </span>
              </>
            ) : positionClosed || resolutionStats.hasRefunded ? (
              <>
                <span className="text-text-muted">Trading: +0.0000</span>
                <span className="text-text-muted">|</span>
                <span className="text-text-muted">Resolution: +0.0000</span>
              </>
            ) : (
              <>
                <span className="text-text-muted">Trading: —</span>
                <span className="text-text-muted">|</span>
                <span className="text-text-muted">Resolution: —</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Refund Box - Separate from P/L, always visible with consistent height */}
      <div className={cn(
        'p-3 mb-4 border',
        resolutionStats.hasRefunded
          ? 'bg-yes/10 border-yes/30'
          : 'bg-dark-800 border-dark-600'
      )}>
        {resolutionStats.hasRefunded ? (
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-yes">↩ Refund</span>
              <span className="font-mono text-sm text-yes font-bold">
                {resolutionStats.refundedAmount.toFixed(4)} BNB
              </span>
            </div>
            <div className="flex justify-end mt-1 text-xs font-mono text-yes/70">
              <span>Capital recovered</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-text-muted">Refund</span>
              <span className="font-mono text-sm text-text-muted">—</span>
            </div>
            <div className="flex justify-end mt-1 text-xs font-mono text-text-muted">
              <span>No refund</span>
            </div>
          </div>
        )}
      </div>

      {/* Current market chance - ALWAYS show for ALL markets */}
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-text-muted">CHANCE</span>
        <div className="text-right">
          <CompactChance value={yesPercent} />
        </div>
      </div>

      {/* Outcome/Proposed/Expiry - show OUTCOME for resolved, PROPOSED for pending proposal, EXPIRY for markets without proposal */}
      {isResolved ? (
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-text-muted">OUTCOME</span>
          <span className={cn(
            "font-mono font-bold",
            market.outcome ? 'text-yes' : 'text-no'
          )}>
            {market.outcome ? 'YES' : 'NO'}
          </span>
        </div>
      ) : hasProposal ? (
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-text-muted">PROPOSED</span>
          <span className={cn(
            "font-mono font-bold",
            hasDispute
              ? !market.proposedOutcome ? 'text-yes' : 'text-no' // Disputer proposes opposite
              : market.proposedOutcome ? 'text-yes' : 'text-no' // Proposer's outcome
          )}>
            {hasDispute
              ? !market.proposedOutcome ? 'YES' : 'NO' // Disputer wants opposite
              : market.proposedOutcome ? 'YES' : 'NO'
            }
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-text-muted">{isExpired ? 'STATUS' : 'EXPIRY'}</span>
          <span className={cn(
            "font-mono",
            isExpired ? "text-orange-400 font-bold" : "text-text-secondary"
          )}>
            {isExpired 
              ? 'EXPIRED'
              : new Date(expiryMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            }
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto space-y-2">
        <div className="flex gap-2">
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
          ) : canEmergencyRefund ? (
            /* Can claim emergency refund - 24h passed, no resolution */
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 !border-cyber !text-cyber hover:!bg-cyber hover:!text-black"
              onClick={handleEmergencyRefund}
              disabled={isRefundPending || isRefundConfirming}
            >
              {isRefundPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  CONFIRM...
                </span>
              ) : isRefundConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  REFUNDING...
                </span>
              ) : (
                'CLAIM REFUND'
              )}
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
        {/* Show refund value when emergency refund is available */}
        {canEmergencyRefund && estimatedRefund > 0n && (
          <div className="text-center text-xs">
            <span className="text-text-muted">Refund: </span>
            <span className="text-cyber font-mono font-bold">{formatBNB(estimatedRefund)} BNB</span>
          </div>
        )}
        {/* Show payout estimate when can claim */}
        {(canClaim || canClaimAfterFinalize) && !alreadyClaimed && (() => {
          const winningSharesBigInt = market.outcome 
            ? BigInt(position.yesShares || '0') 
            : BigInt(position.noShares || '0');
          const totalWinningShares = market.outcome ? marketYesSupply : marketNoSupply;
          if (totalWinningShares > 0n && winningSharesBigInt > 0n) {
            const grossPayout = (winningSharesBigInt * poolBalance) / totalWinningShares;
            // Apply 0.3% resolution fee (same as contract)
            const resolutionFee = (grossPayout * 30n) / 10000n;
            const netPayout = grossPayout - resolutionFee;
            return (
              <div className="text-center text-xs">
                <span className="text-text-muted">Est. payout: </span>
                <span className="text-yes font-mono font-bold">{formatBNB(netPayout)} BNB</span>
                <span className="text-text-muted ml-1">(after 0.3% fee)</span>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </Card>
  );
}

export default PositionCard;

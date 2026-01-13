/**
 * ===== PORTFOLIO PAGE =====
 *
 * Shows user's positions across all markets.
 * Displays P/L, claimable winnings, and trade history.
 *
 * Predator Polling v2: Uses 120s interval (was 60s), stops when tab inactive
 *
 * @module features/portfolio/pages/PortfolioPage
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@apollo/client/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { GET_USER_POSITIONS, GET_MARKETS_BY_CREATOR, GET_USER_TRADES } from '@/shared/api';
import type { GetUserPositionsResponse, GetMarketsResponse, GetUserTradesResponse } from '@/shared/api';
import { PositionCard } from '../components';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Spinner';
import { AddressDisplay } from '@/shared/components/ui/Jazzicon';
import { Badge } from '@/shared/components/ui/Badge';
import { cn } from '@/shared/utils/cn';
import { Link } from 'react-router-dom';
import { useSmartPollInterval, POLL_INTERVALS } from '@/shared/hooks/useSmartPolling';
import { usePendingWithdrawals, useWithdrawBond, useWithdrawCreatorFees } from '@/shared/hooks';
import { formatEther } from 'viem';
import { calculateWalletRealizedPnl } from '@/features/markets/components/TradeHistory';


// Position with full market data
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
  claimedAmount?: string;
  emergencyRefunded?: boolean;
  refundedAmount?: string;
  hasVoted?: boolean;
}

// Time constants (match contract)
const DISPUTE_WINDOW = 30 * 60 * 1000; // 30 minutes
const VOTING_WINDOW = 60 * 60 * 1000; // 1 hour
const EMERGENCY_REFUND_DELAY = 24 * 60 * 60 * 1000; // 24 hours

// Pagination constants
const ITEMS_PER_PAGE = 20;

// Action-based categorization
type FilterOption = 'all' | 'needs-action' | 'active' | 'awaiting-resolution' | 'resolved' | 'unresolved';
type ViewMode = 'positions' | 'my-markets';

// Action types for positions
type PositionAction = 'vote' | 'claim' | 'refund' | 'finalize' | 'trade' | 'none';

export function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [actionFilter, setActionFilter] = useState<PositionAction | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('positions');
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Predator Polling v2: 120s interval (was 60s), stops when tab is inactive
  const pollInterval = useSmartPollInterval(POLL_INTERVALS.PORTFOLIO);

  const { data, loading, error } = useQuery<GetUserPositionsResponse>(GET_USER_POSITIONS, {
    variables: { user: address?.toLowerCase(), first: 100 },
    skip: !address,
    pollInterval, // Dynamic: 120s when visible, 0 when hidden
    notifyOnNetworkStatusChange: false, // Prevent re-renders during poll refetches
  });

  // Fetch markets created by this user
  const { data: myMarketsData, loading: myMarketsLoading } = useQuery<GetMarketsResponse>(GET_MARKETS_BY_CREATOR, {
    variables: { creator: address?.toLowerCase(), first: 50 },
    skip: !address || viewMode !== 'my-markets',
    pollInterval, // Dynamic: 120s when visible, 0 when hidden
    notifyOnNetworkStatusChange: false, // Prevent re-renders during poll refetches
  });

  // Fetch user's trade history for realized P/L calculation
  const { data: tradesData } = useQuery<GetUserTradesResponse>(GET_USER_TRADES, {
    variables: { trader: address?.toLowerCase(), first: 500 },
    skip: !address,
    pollInterval, // Dynamic: 120s when visible, 0 when hidden
    notifyOnNetworkStatusChange: false,
  });

  // Calculate trading P/L from sells
  const tradingPnl = useMemo(() => {
    if (!tradesData?.trades || !address) {
      return { realizedPnlBNB: 0, realizedPnlPercent: 0, hasSells: false };
    }
    return calculateWalletRealizedPnl(tradesData.trades, address);
  }, [tradesData?.trades, address]);

  // Calculate Resolution P/L (NET: claims - invested for resolved positions only)
  // Also track refunds separately (capital recovery, not P/L)
  const resolutionStats = useMemo(() => {
    const positions = data?.positions || [];
    
    let resolutionPnl = 0;
    let totalRefunded = 0;
    let resolvedCount = 0;
    
    positions.forEach((pos) => {
      // Only count resolved markets OR positions that have been claimed/refunded
      const isResolved = pos.market.resolved;
      const hasClaimed = parseFloat(pos.claimedAmount || '0') > 0;
      const hasRefunded = parseFloat(pos.refundedAmount || '0') > 0;
      
      if (hasRefunded) {
        // Refunds are capital recovery, not P/L
        totalRefunded += parseFloat(pos.refundedAmount || '0');
      }
      
      if (isResolved || hasClaimed) {
        // Resolution P/L = what you got back - what you invested
        const claimed = parseFloat(pos.claimedAmount || '0');
        const invested = parseFloat(pos.totalInvested || '0');
        resolutionPnl += claimed - invested;
        resolvedCount++;
      }
    });
    
    return {
      resolutionPnl,        // Net P/L from market resolutions
      totalRefunded,        // Capital recovered (separate)
      hasResolutions: resolvedCount > 0,
      hasRefunds: totalRefunded > 0,
    };
  }, [data?.positions]);

  // Total P/L = Trading P/L + Resolution P/L
  const totalPnl = useMemo(() => {
    const combined = tradingPnl.realizedPnlBNB + resolutionStats.resolutionPnl;
    const hasActivity = tradingPnl.hasSells || resolutionStats.hasResolutions;
    return { combined, hasActivity };
  }, [tradingPnl, resolutionStats]);

  // Pull Pattern: Pending withdrawals (v3.4.0)
  const { pendingBonds, pendingCreatorFees, refetch: refetchPending } = usePendingWithdrawals(address);
  const { withdrawBond, isPending: isWithdrawingBond, isSuccess: bondWithdrawn } = useWithdrawBond();
  const { withdrawCreatorFees, isPending: isWithdrawingFees, isSuccess: feesWithdrawn } = useWithdrawCreatorFees();
  const queryClient = useQueryClient();

  // Refetch pending withdrawals and invalidate balance queries after successful withdrawal
  useEffect(() => {
    if (bondWithdrawn || feesWithdrawn) {
      refetchPending();
      // Invalidate balance queries so Header updates
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    }
  }, [bondWithdrawn, feesWithdrawn, refetchPending, queryClient]);

  // Format pending amounts
  const pendingBondsFormatted = pendingBonds ? parseFloat(formatEther(pendingBonds)) : 0;
  const pendingFeesFormatted = pendingCreatorFees ? parseFloat(formatEther(pendingCreatorFees)) : 0;
  const hasPendingWithdrawals = pendingBondsFormatted > 0 || pendingFeesFormatted > 0;

  // Only show loading on initial load, not polls
  const isInitialLoading = loading && !data?.positions;
  const isInitialMarketsLoading = myMarketsLoading && !myMarketsData?.markets;

  const positions = (data?.positions || []) as PositionWithMarket[];
  
  // Action-based categorization - focuses on what user CAN DO
  const categorizedPositions = useMemo(() => {
    const now = Date.now();
    const categories = {
      needsAction: [] as (PositionWithMarket & { action: PositionAction })[],
      active: [] as PositionWithMarket[],
      awaitingResolution: [] as PositionWithMarket[],
      resolved: [] as PositionWithMarket[],
      unresolved: [] as PositionWithMarket[],
    };

    positions.forEach((pos) => {
      const market = pos.market;
      const expiryMs = Number(market.expiryTimestamp) * 1000;
      const isExpired = now > expiryMs;
      const isResolved = market.resolved;
      
      // User's shares
      const yesShares = BigInt(pos.yesShares || '0');
      const noShares = BigInt(pos.noShares || '0');
      const hasShares = yesShares > 0n || noShares > 0n;
      
      // Already completed actions
      const alreadyClaimed = pos.claimed;
      const alreadyRefunded = pos.emergencyRefunded;
      
      // Market state
      const hasProposal = market.proposer && market.proposer !== '0x0000000000000000000000000000000000000000';
      const hasDispute = market.disputer && market.disputer !== '0x0000000000000000000000000000000000000000';
      const proposalMs = market.proposalTimestamp ? Number(market.proposalTimestamp) * 1000 : 0;
      const disputeMs = market.disputeTimestamp ? Number(market.disputeTimestamp) * 1000 : 0;
      
      // Time windows
      const disputeWindowEnd = proposalMs + DISPUTE_WINDOW;
      const votingWindowEnd = disputeMs + VOTING_WINDOW;
      const emergencyRefundTime = expiryMs + EMERGENCY_REFUND_DELAY;
      
      // Check if eligible for emergency refund (24h+ expired, not resolved)
      const isUnresolved = isExpired && !isResolved && now > emergencyRefundTime;
      
      // Determine what action the user can take
      
      // 1. Can claim winnings (resolved + has winning shares + not claimed)
      if (isResolved && !alreadyClaimed && hasShares) {
        const hasWinningShares = market.outcome 
          ? yesShares > 0n
          : noShares > 0n;
        if (hasWinningShares) {
          categories.needsAction.push({ ...pos, action: 'claim' });
          // Also add to resolved for category view
          categories.resolved.push(pos);
          return;
        }
      }
      
      // 2. Can vote (disputed + has shares + hasn't voted)
      if (hasDispute && !isResolved && hasShares && !pos.hasVoted && now < votingWindowEnd) {
        categories.needsAction.push({ ...pos, action: 'vote' });
        categories.awaitingResolution.push(pos);
        return;
      }
      
      // 3. Can emergency refund (expired 24h+, not resolved, has shares, not refunded)
      if (isUnresolved && hasShares && !alreadyRefunded) {
        categories.needsAction.push({ ...pos, action: 'refund' });
        categories.unresolved.push(pos);
        return;
      }
      
      // 4. Can finalize (proposal/voting window ended, not resolved, has shares)
      const canFinalize = hasProposal && !isResolved && hasShares && (
        (hasDispute && now > votingWindowEnd) || 
        (!hasDispute && now > disputeWindowEnd)
      );
      if (canFinalize) {
        categories.needsAction.push({ ...pos, action: 'finalize' });
        categories.awaitingResolution.push(pos);
        return;
      }
      
      // 5. Active - market still open for trading and user has shares
      if (!isExpired && hasShares) {
        categories.active.push(pos);
        return;
      }
      
      // 6. Categorize remaining positions
      if (isResolved) {
        // Already resolved (claimed, lost, or no shares left)
        categories.resolved.push(pos);
      } else if (isUnresolved) {
        // 24h+ expired without resolution (may have already refunded)
        categories.unresolved.push(pos);
      } else if (isExpired) {
        // Expired but resolution in progress
        categories.awaitingResolution.push(pos);
      } else {
        // Shouldn't happen, but fallback to active
        categories.active.push(pos);
      }
    });

    return categories;
  }, [positions]);

  // Count actions by type for sub-filters
  const actionCounts = useMemo(() => {
    const counts = { claim: 0, vote: 0, refund: 0, finalize: 0 };
    categorizedPositions.needsAction.forEach((pos) => {
      if (pos.action in counts) {
        counts[pos.action as keyof typeof counts]++;
      }
    });
    return counts;
  }, [categorizedPositions.needsAction]);

  // Filter positions based on selection
  const filteredPositions = useMemo(() => {
    let result: PositionWithMarket[];
    
    switch (filterBy) {
      case 'needs-action':
        // Apply sub-filter if selected
        if (actionFilter !== 'all') {
          return categorizedPositions.needsAction.filter(pos => pos.action === actionFilter);
        }
        return categorizedPositions.needsAction;
      case 'active':
        result = categorizedPositions.active;
        break;
      case 'awaiting-resolution':
        result = categorizedPositions.awaitingResolution;
        break;
      case 'resolved':
        result = categorizedPositions.resolved;
        break;
      case 'unresolved':
        result = categorizedPositions.unresolved;
        break;
      default:
        result = positions;
    }
    return result;
  }, [filterBy, actionFilter, positions, categorizedPositions]);

  // Reset action filter when switching away from needs-action
  const handleFilterChange = (newFilter: FilterOption) => {
    setFilterBy(newFilter);
    setDisplayCount(ITEMS_PER_PAGE); // Reset pagination on filter change
    if (newFilter !== 'needs-action') {
      setActionFilter('all');
    }
  };

  // Reset display count when action filter changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [actionFilter]);

  // Paginated positions for display
  const paginatedPositions = useMemo(() => {
    return filteredPositions.slice(0, displayCount);
  }, [filteredPositions, displayCount]);

  const hasMoreItems = displayCount < filteredPositions.length;

  // Infinite scroll - load more when sentinel is visible
  const loadMore = useCallback(() => {
    if (hasMoreItems) {
      setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredPositions.length));
    }
  }, [hasMoreItems, filteredPositions.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreItems) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loadMore, hasMoreItems]);

  // Calculate portfolio stats
  const stats = calculatePortfolioStats(positions, categorizedPositions);

  // Not connected state - AFTER all hooks
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4">CONNECT WALLET</h1>
          <p className="text-text-secondary mb-6">
            Connect your wallet to view your positions and trading history.
          </p>
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <Button variant="cyber" size="lg" onClick={openConnectModal}>
                CONNECT WALLET
              </Button>
            )}
          </ConnectButton.Custom>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-dark-600 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">
                PORT<span className="text-cyber">FOLIO</span>
              </h1>
              <div className="mt-2">
                <AddressDisplay address={address!} iconSize={24} />
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 flex-wrap">
              <StatBox label="POSITIONS" value={stats.totalPositions.toString()} />
              <StatBox 
                label="INVESTED" 
                value={`${stats.totalInvested.toFixed(2)} BNB`}
              />
              <StatBox 
                label="TOTAL P/L" 
                value={totalPnl.hasActivity 
                  ? `${totalPnl.combined >= 0 ? '+' : ''}${totalPnl.combined.toFixed(4)} BNB`
                  : '—'
                }
                color={totalPnl.hasActivity ? (totalPnl.combined >= 0 ? 'yes' : 'no') : undefined}
                subtextElement={totalPnl.hasActivity 
                  ? (
                    <>
                      <span className={tradingPnl.realizedPnlBNB >= 0 ? 'text-yes' : 'text-no'}>
                        Trading: {tradingPnl.realizedPnlBNB >= 0 ? '+' : ''}{tradingPnl.realizedPnlBNB.toFixed(4)}
                      </span>
                      <span className="text-text-muted"> | </span>
                      <span className={resolutionStats.resolutionPnl >= 0 ? 'text-yes' : 'text-no'}>
                        Resolution: {resolutionStats.resolutionPnl >= 0 ? '+' : ''}{resolutionStats.resolutionPnl.toFixed(4)}
                      </span>
                    </>
                  )
                  : undefined
                }
              />
              {resolutionStats.hasRefunds && (
                <StatBox 
                  label="REFUNDED" 
                  value={`${resolutionStats.totalRefunded.toFixed(4)} BNB`}
                  color="neutral"
                  subtext="Capital recovery"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pending Withdrawals Banner (Pull Pattern v3.4.0) */}
      {hasPendingWithdrawals && (
        <section className="bg-cyber/10 border-b border-cyber py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💎</span>
                <div>
                  <p className="text-cyber font-bold">PENDING WITHDRAWALS</p>
                  <p className="text-sm text-text-secondary">
                    {pendingBondsFormatted > 0 && (
                      <span>Bonds/Jury: {pendingBondsFormatted.toFixed(4)} BNB</span>
                    )}
                    {pendingBondsFormatted > 0 && pendingFeesFormatted > 0 && ' • '}
                    {pendingFeesFormatted > 0 && (
                      <span>Creator Fees: {pendingFeesFormatted.toFixed(4)} BNB</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {pendingBondsFormatted > 0 && (
                  <Button 
                    variant="cyber" 
                    size="sm"
                    onClick={() => withdrawBond()}
                    disabled={isWithdrawingBond}
                  >
                    {isWithdrawingBond ? 'WITHDRAWING...' : `CLAIM BONDS (${pendingBondsFormatted.toFixed(4)})`}
                  </Button>
                )}
                {pendingFeesFormatted > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => withdrawCreatorFees()}
                    disabled={isWithdrawingFees}
                  >
                    {isWithdrawingFees ? 'WITHDRAWING...' : `CLAIM FEES (${pendingFeesFormatted.toFixed(4)})`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* View Mode Tabs */}
      <section className="border-b border-dark-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0">
            <button
              onClick={() => setViewMode('positions')}
              className={cn(
                "px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2",
                viewMode === 'positions'
                  ? "text-cyber border-cyber bg-cyber/5"
                  : "text-text-secondary hover:text-white border-transparent"
              )}
            >
              MY POSITIONS
            </button>
            <button
              onClick={() => setViewMode('my-markets')}
              className={cn(
                "px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2",
                viewMode === 'my-markets'
                  ? "text-cyber border-cyber bg-cyber/5"
                  : "text-text-secondary hover:text-white border-transparent"
              )}
            >
              MY MARKETS
            </button>
          </div>
        </div>
      </section>

      {/* Positions Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {viewMode === 'positions' ? (
            <>
              {/* Action-based filter tabs */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* ALL - Default, shown first */}
                <button 
                  onClick={() => handleFilterChange('all')}
                  className={cn(
                    "text-sm font-bold pb-1 transition-colors",
                    filterBy === 'all' 
                      ? "text-cyber border-b-2 border-cyber" 
                      : "text-text-secondary hover:text-white"
                  )}
                >
                  ALL ({positions.length})
                </button>
                
                <span className="text-dark-500">|</span>
                
                {/* NEEDS ACTION - Primary with highlight when has items */}
                <button 
                  onClick={() => handleFilterChange('needs-action')}
                  className={cn(
                    "text-sm font-bold pb-1 transition-colors flex items-center gap-1",
                    filterBy === 'needs-action' 
                      ? categorizedPositions.needsAction.length > 0
                        ? "text-warning border-b-2 border-warning"  // Selected + has items = yellow
                        : "text-cyber border-b-2 border-cyber"      // Selected + empty = cyan
                      : categorizedPositions.needsAction.length > 0
                        ? "text-warning/80 hover:text-warning animate-pulse"  // Unselected + has items = pulsing yellow
                        : "text-text-secondary hover:text-white"              // Unselected + empty = grey
                  )}
                >
                  {categorizedPositions.needsAction.length > 0 && (
                    <span className="text-warning">⚡</span>
                  )}
                  NEEDS ACTION ({categorizedPositions.needsAction.length})
                </button>
                
                {/* ACTIVE - Positions in live markets */}
                <button 
                  onClick={() => handleFilterChange('active')}
                  className={cn(
                    "text-sm font-bold pb-1 transition-colors",
                    filterBy === 'active' 
                      ? "text-yes border-b-2 border-yes" 
                      : categorizedPositions.active.length > 0
                        ? "text-yes/70 hover:text-yes"
                        : "text-text-secondary hover:text-white"
                  )}
                >
                  ACTIVE ({categorizedPositions.active.length})
                </button>
                
                {/* AWAITING RESOLUTION - Expired, resolution in progress */}
                <button 
                  onClick={() => handleFilterChange('awaiting-resolution')}
                  className={cn(
                    "text-sm font-bold pb-1 transition-colors",
                    filterBy === 'awaiting-resolution' 
                      ? "text-cyber border-b-2 border-cyber" 
                      : "text-text-secondary hover:text-white"
                  )}
                >
                  PENDING ({categorizedPositions.awaitingResolution.length})
                </button>
                
                {/* RESOLVED - Outcome finalized */}
                <button 
                  onClick={() => handleFilterChange('resolved')}
                  className={cn(
                    "text-sm font-bold pb-1 transition-colors",
                    filterBy === 'resolved' 
                      ? "text-yes border-b-2 border-yes" 
                      : categorizedPositions.resolved.length > 0
                        ? "text-yes/70 hover:text-yes"
                        : "text-text-secondary hover:text-white"
                  )}
                >
                  RESOLVED ({categorizedPositions.resolved.length})
                </button>
                
                {/* UNRESOLVED - 24h+ expired, refund eligible */}
                {categorizedPositions.unresolved.length > 0 && (
                  <button 
                    onClick={() => handleFilterChange('unresolved')}
                    className={cn(
                      "text-sm font-bold pb-1 transition-colors",
                      filterBy === 'unresolved' 
                        ? "text-no border-b-2 border-no" 
                        : "text-no/70 hover:text-no"
                    )}
                  >
                    UNRESOLVED ({categorizedPositions.unresolved.length})
                  </button>
                )}
              </div>

              {/* Sub-filter buttons for NEEDS ACTION */}
              {filterBy === 'needs-action' && categorizedPositions.needsAction.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-6 pl-2 border-l-2 border-warning/30">
                  <span className="text-xs text-text-muted mr-1">FILTER BY:</span>
                  <button 
                    onClick={() => setActionFilter('all')}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded transition-colors",
                      actionFilter === 'all' 
                        ? "bg-warning/20 text-warning" 
                        : "text-text-secondary hover:text-white hover:bg-dark-600"
                    )}
                  >
                    ALL
                  </button>
                  {actionCounts.claim > 0 && (
                    <button 
                      onClick={() => setActionFilter('claim')}
                      className={cn(
                        "text-xs font-mono px-2 py-1 rounded transition-colors",
                        actionFilter === 'claim' 
                          ? "bg-yes/20 text-yes" 
                          : "text-yes/70 hover:text-yes hover:bg-dark-600"
                      )}
                    >
                      💰 CLAIM ({actionCounts.claim})
                    </button>
                  )}
                  {actionCounts.vote > 0 && (
                    <button 
                      onClick={() => setActionFilter('vote')}
                      className={cn(
                        "text-xs font-mono px-2 py-1 rounded transition-colors",
                        actionFilter === 'vote' 
                          ? "bg-cyber/20 text-cyber" 
                          : "text-cyber/70 hover:text-cyber hover:bg-dark-600"
                      )}
                    >
                      🗳️ VOTE ({actionCounts.vote})
                    </button>
                  )}
                  {actionCounts.finalize > 0 && (
                    <button 
                      onClick={() => setActionFilter('finalize')}
                      className={cn(
                        "text-xs font-mono px-2 py-1 rounded transition-colors",
                        actionFilter === 'finalize' 
                          ? "bg-purple-500/20 text-purple-400" 
                          : "text-purple-400/70 hover:text-purple-400 hover:bg-dark-600"
                      )}
                    >
                      ⚡ FINALIZE ({actionCounts.finalize})
                    </button>
                  )}
                  {actionCounts.refund > 0 && (
                    <button 
                      onClick={() => setActionFilter('refund')}
                      className={cn(
                        "text-xs font-mono px-2 py-1 rounded transition-colors",
                        actionFilter === 'refund' 
                          ? "bg-no/20 text-no" 
                          : "text-no/70 hover:text-no hover:bg-dark-600"
                      )}
                    >
                      🔄 REFUND ({actionCounts.refund})
                    </button>
                  )}
                </div>
              )}

          {isInitialLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <PositionCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error.message} />
          ) : filteredPositions.length === 0 ? (
            filterBy === 'all' ? (
              <EmptyState />
            ) : (
              <div className="text-center py-16">
                <p className="text-xl font-bold text-white mb-2">
                  {filterBy === 'needs-action' && 'NO ACTIONS NEEDED'}
                  {filterBy === 'active' && 'NO ACTIVE POSITIONS'}
                  {filterBy === 'awaiting-resolution' && 'NO POSITIONS AWAITING RESOLUTION'}
                  {filterBy === 'resolved' && 'NO RESOLVED POSITIONS'}
                  {filterBy === 'unresolved' && 'NO UNRESOLVED POSITIONS'}
                </p>
                <p className="text-text-secondary mb-6">
                  {filterBy === 'needs-action' && "You're all caught up! No votes, claims, or refunds pending."}
                  {filterBy === 'active' && "No positions in markets that are still open for trading."}
                  {filterBy === 'awaiting-resolution' && "No positions in markets waiting for outcome resolution."}
                  {filterBy === 'resolved' && "No positions in markets that have been resolved."}
                  {filterBy === 'unresolved' && "No positions eligible for emergency refund."}
                </p>
                <button 
                  onClick={() => setFilterBy('all')}
                  className="text-cyber hover:underline"
                >
                  View all positions →
                </button>
              </div>
            )
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedPositions.map((position) => (
                  <PositionCard 
                    key={position.id} 
                    position={position} 
                    trades={tradesData?.trades || []}
                  />
                ))}
              </div>
              
              {/* Infinite scroll sentinel + load more info */}
              {hasMoreItems && (
                <div 
                  ref={loadMoreRef}
                  className="flex flex-col items-center justify-center py-8 gap-2"
                >
                  <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-2 h-2 rounded-full bg-cyber animate-pulse"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-text-muted font-mono">
                    Showing {paginatedPositions.length} of {filteredPositions.length}
                  </p>
                </div>
              )}
              
              {/* End of list indicator */}
              {!hasMoreItems && filteredPositions.length > ITEMS_PER_PAGE && (
                <div className="text-center py-6">
                  <p className="text-xs text-text-muted font-mono">
                    — END OF LIST ({filteredPositions.length} positions) —
                  </p>
                </div>
              )}
            </>
          )}
            </>
          ) : (
            /* My Markets View */
            <div>
              {isInitialMarketsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PositionCardSkeleton key={i} />
                  ))}
                </div>
              ) : myMarketsData?.markets?.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-xl font-bold text-white mb-2">NO MARKETS CREATED</p>
                  <p className="text-text-secondary mb-6">
                    Create your first prediction market and earn 0.5% creator fees on all trades!
                  </p>
                  <Link to="/create">
                    <Button variant="cyber">CREATE MARKET</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myMarketsData?.markets?.map((market) => (
                    <MyMarketCard key={market.id} market={market} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatBox({ 
  label, 
  value, 
  highlight = false,
  color,
  subtext,
  subtextElement,
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  color?: 'yes' | 'no' | 'neutral';
  subtext?: string;
  subtextElement?: React.ReactNode;
}) {
  return (
    <div 
      className={cn(
        'text-center px-4 py-2',
        highlight && 'border border-cyber bg-cyber/10'
      )}
    >
      <p className="text-xs text-text-muted font-mono">{label}</p>
      <p className={cn(
        'text-xl font-bold font-mono',
        color === 'yes' && 'text-yes',
        color === 'no' && 'text-no',
        color === 'neutral' && 'text-text-secondary',
        !color && 'text-white'
      )}>
        {value}
      </p>
      {subtextElement ? (
        <div className="text-xs font-mono">{subtextElement}</div>
      ) : subtext ? (
        <p className={cn(
          'text-xs font-mono',
          color === 'yes' && 'text-yes/70',
          color === 'no' && 'text-no/70',
          color === 'neutral' && 'text-text-muted',
          !color && 'text-text-muted'
        )}>
          {subtext}
        </p>
      ) : null}
    </div>
  );
}

function PositionCardSkeleton() {
  return (
    <Card className="space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-8 w-1/2" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </Card>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-4">⚠️</p>
      <p className="text-text-secondary font-mono">SOMETHING BROKE</p>
      <p className="text-no text-sm font-mono mt-2">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-xl font-bold text-white mb-2">NO POSITIONS YET</p>
      <p className="text-text-secondary mb-6">
        Start trading to build your portfolio
      </p>
      <Link to="/">
        <Button variant="cyber">EXPLORE MARKETS</Button>
      </Link>
    </div>
  );
}

function calculatePortfolioStats(
  positions: PositionWithMarket[],
  categorizedPositions: {
    needsAction: (PositionWithMarket & { action: PositionAction })[];
    active: PositionWithMarket[];
    awaitingResolution: PositionWithMarket[];
    resolved: PositionWithMarket[];
    unresolved: PositionWithMarket[];
  }
) {
  let totalInvested = 0;
  let totalValue = 0;
  let claimableValue = 0;

  const UNIT_PRICE = 0.01; // BNB - each winning share pays out 0.01 BNB

  positions.forEach((pos) => {
    const invested = parseFloat(pos.totalInvested || '0');
    totalInvested += invested;

    // Calculate current value based on bonding curve prices
    if (pos.market) {
      const yesShares = Number(BigInt(pos.yesShares || '0')) / 1e18;
      const noShares = Number(BigInt(pos.noShares || '0')) / 1e18;
      const marketYes = Number(BigInt(pos.market.yesShares || '0')) / 1e18;
      const marketNo = Number(BigInt(pos.market.noShares || '0')) / 1e18;
      const total = marketYes + marketNo;

      if (total > 0) {
        // Bonding curve: price = opposite side / total
        // YES price = NO_supply / (YES_supply + NO_supply) * UNIT_PRICE
        // NO price = YES_supply / (YES_supply + NO_supply) * UNIT_PRICE
        const yesPrice = (marketNo / total) * UNIT_PRICE;
        const noPrice = (marketYes / total) * UNIT_PRICE;
        
        totalValue += (yesShares * yesPrice) + (noShares * noPrice);
      }
    }
  });

  // Calculate claimable value from positions that need claiming
  categorizedPositions.needsAction
    .filter(pos => pos.action === 'claim')
    .forEach((pos) => {
      const outcome = pos.market.outcome;
      if (outcome === true) {
        const yesShares = Number(BigInt(pos.yesShares || '0')) / 1e18;
        claimableValue += yesShares * UNIT_PRICE;
      } else if (outcome === false) {
        const noShares = Number(BigInt(pos.noShares || '0')) / 1e18;
        claimableValue += noShares * UNIT_PRICE;
      }
    });

  return {
    totalPositions: positions.length,
    totalInvested,
    totalValue,
    totalPnL: totalValue - totalInvested,
    claimable: claimableValue,
  };
}

// Market card for "My Markets" tab
interface MyMarketCardProps {
  market: {
    id: string;
    marketId?: string;
    question: string;
    status: string;
    resolved: boolean;
    outcome?: boolean | null;
    totalVolume: string;
    totalTrades: string;
    poolBalance: string;
    expiryTimestamp: string;
    imageUrl?: string | null;
    proposer?: string | null;
    proposalTimestamp?: string | null;
    disputer?: string | null;
    disputeTimestamp?: string | null;
  };
}

function MyMarketCard({ market }: MyMarketCardProps) {
  const now = Date.now();
  const expiryMs = Number(market.expiryTimestamp) * 1000;
  const isExpired = now > expiryMs;
  
  // Calculate estimated creator fees (0.5% of total volume from all trades)
  // Note: This is an estimate. Actual fees are tracked on-chain and can be claimed.
  const totalVolume = parseFloat(market.totalVolume || '0');
  const creatorEarnings = totalVolume * 0.005;
  
  // Proposal and dispute status
  const proposalMs = market.proposalTimestamp ? Number(market.proposalTimestamp) * 1000 : 0;
  const disputeMs = market.disputeTimestamp ? Number(market.disputeTimestamp) * 1000 : 0;
  const hasProposal = market.proposer && market.proposer !== '0x0000000000000000000000000000000000000000';
  const hasDispute = market.disputer && market.disputer !== '0x0000000000000000000000000000000000000000';
  const disputeWindowEnd = proposalMs + DISPUTE_WINDOW;
  const votingWindowEnd = disputeMs + VOTING_WINDOW;
  const emergencyRefundTime = expiryMs + EMERGENCY_REFUND_DELAY;
  
  // Badge logic matching PositionCard
  const getBadgeInfo = (): { text: string; variant: 'yes' | 'no' | 'active' | 'expired' | 'disputed' | 'whale' } => {
    // RESOLVED - always green with outcome
    if (market.resolved) {
      const outcomeText = market.outcome ? 'YES WINS' : 'NO WINS';
      return { text: `RESOLVED (${outcomeText})`, variant: 'yes' };
    }
    
    // UNRESOLVED - market expired 24h+ ago without resolution
    if (isExpired && now > emergencyRefundTime) {
      return { text: 'UNRESOLVED', variant: 'no' };
    }
    
    // DISPUTED - in voting period
    if (hasDispute && now < votingWindowEnd) {
      return { text: 'DISPUTED', variant: 'disputed' };
    }
    
    // PROPOSED - has proposal but not yet finalized
    if (hasProposal && !hasDispute && now < disputeWindowEnd) {
      return { text: 'PROPOSED', variant: 'whale' };
    }
    
    // READY TO FINALIZE - voting or dispute window ended
    if (hasProposal && ((hasDispute && now > votingWindowEnd) || (!hasDispute && now > disputeWindowEnd))) {
      return { text: 'READY TO FINALIZE', variant: 'whale' };
    }
    
    // EXPIRED - awaiting proposal
    if (isExpired) {
      return { text: 'EXPIRED', variant: 'expired' };
    }
    
    // ACTIVE - not expired yet
    return { text: 'ACTIVE', variant: 'active' };
  };
  
  const badgeInfo = getBadgeInfo();

  return (
    <Link to={`/market/${market.marketId || market.id}`}>
      <Card className="hover:border-cyber transition-colors cursor-pointer h-full flex flex-col overflow-hidden">
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
            {/* Status badge overlay */}
            <div className="absolute top-2 right-2">
              <Badge variant={badgeInfo.variant}>{badgeInfo.text}</Badge>
            </div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col">
          {/* Question */}
          <p className="font-bold text-white line-clamp-2 text-sm min-h-[40px]">
            {market.question}
          </p>
          
          {/* Status badge (only if no image) */}
          {!market.imageUrl && (
            <div className="flex items-center justify-between mt-3">
              <Badge variant={badgeInfo.variant}>{badgeInfo.text}</Badge>
              <span className="text-xs text-text-muted font-mono">
                {market.totalTrades} trades
              </span>
            </div>
          )}
          
          {/* Trade count (if has image) */}
          {market.imageUrl && (
            <div className="flex justify-end mt-2">
              <span className="text-xs text-text-muted font-mono">
                {market.totalTrades} trades
              </span>
            </div>
          )}
          
          {/* Stats */}
          <div className="border-t border-dark-600 pt-3 mt-auto grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-text-muted">VOLUME</p>
              <p className="text-sm font-mono text-white">{totalVolume.toFixed(3)} BNB</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">CREATOR FEES</p>
              <p className="text-sm font-mono text-cyber">{creatorEarnings.toFixed(4)} BNB</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default PortfolioPage;

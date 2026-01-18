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
import { GET_USER_POSITIONS, GET_MARKETS_BY_CREATOR, GET_USER_TRADES, GET_USER_EARNINGS } from '@/shared/api';
import type { GetUserPositionsResponse, GetMarketsResponse, GetUserTradesResponse, GetUserEarningsResponse } from '@/shared/api';
import { PositionCard } from '../components';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Spinner';
import { AddressDisplay } from '@/shared/components/ui/Jazzicon';
import { Badge } from '@/shared/components/ui/Badge';
import { HeatLevelBadge } from '@/shared/components/ui/HeatLevelBadge';
import { cn } from '@/shared/utils/cn';
import { HEAT_LEVELS } from '@/shared/utils/heatLevel';
import { Link } from 'react-router-dom';
import { useSmartPollInterval, POLL_INTERVALS } from '@/shared/hooks/useSmartPolling';
import { usePendingWithdrawals, useWithdrawBond, useWithdrawCreatorFees } from '@/shared/hooks';
import { formatEther } from 'viem';
import { formatBNB } from '@/shared/utils/format';


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
    poolBalance?: string;
    totalVolume?: string;
    createdAt?: string;
    proposer?: string;
    proposalTimestamp?: string;
    disputer?: string;
    disputeTimestamp?: string;
    heatLevel?: number;
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

// Sub-filters for PENDING tab (resolution stages)
type PendingSubFilter = 'all' | 'awaiting' | 'proposed' | 'disputed' | 'finalizing';

// Sort options (matching MarketsPage)
type SortOption = 'volume' | 'newest' | 'ending' | 'liquidity';

// Heat level filter (-1 = all)
type HeatLevelFilter = -1 | 0 | 1 | 2 | 3 | 4;

export function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [actionFilter, setActionFilter] = useState<PositionAction | 'all'>('all');
  const [pendingSubFilter, setPendingSubFilter] = useState<PendingSubFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest'); // Default: NEW
  const [heatLevelFilter, setHeatLevelFilter] = useState<HeatLevelFilter>(-1); // -1 = all heat levels
  const [heatDropdownOpen, setHeatDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('positions');
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [marketsDisplayCount, setMarketsDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadMoreMarketsRef = useRef<HTMLDivElement>(null);
  const heatDropdownRef = useRef<HTMLDivElement>(null);

  // Predator Polling v2: 120s interval, stops when tab is inactive
  // OPTIMIZATION: Only poll the ACTIVE view to reduce queries by 66%
  const basePollInterval = useSmartPollInterval(POLL_INTERVALS.PORTFOLIO);
  const positionsPollInterval = viewMode === 'positions' ? basePollInterval : 0;
  const myMarketsPollInterval = viewMode === 'my-markets' ? basePollInterval : 0;

  const { data, loading, error, refetch: refetchPositions } = useQuery<GetUserPositionsResponse>(GET_USER_POSITIONS, {
    variables: { user: address?.toLowerCase(), first: 100 },
    skip: !address,
    pollInterval: positionsPollInterval, // Only poll when positions tab is active
    notifyOnNetworkStatusChange: false, // Prevent re-renders during poll refetches
  });

  // Callback for PositionCard to trigger refetch after successful actions
  const handlePositionActionSuccess = useCallback(() => {
    // Wait for subgraph to index the transaction (3 seconds)
    setTimeout(() => {
      refetchPositions();
    }, 3000);
  }, [refetchPositions]);

  // Fetch markets created by this user
  const { data: myMarketsData, loading: myMarketsLoading } = useQuery<GetMarketsResponse>(GET_MARKETS_BY_CREATOR, {
    variables: { creator: address?.toLowerCase(), first: 50 },
    skip: !address || viewMode !== 'my-markets',
    pollInterval: myMarketsPollInterval, // Only poll when my-markets tab is active
    notifyOnNetworkStatusChange: false, // Prevent re-renders during poll refetches
  });

  // Close heat dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (heatDropdownRef.current && !heatDropdownRef.current.contains(event.target as Node)) {
        setHeatDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch user's trade history for realized P/L calculation
  // Predator v2: NO POLLING - trades are historical data, fetch ONCE on load
  const { data: tradesData } = useQuery<GetUserTradesResponse>(GET_USER_TRADES, {
    variables: { trader: address?.toLowerCase(), first: 500 },
    skip: !address,
    // NO pollInterval - trades history doesn't need real-time updates
    notifyOnNetworkStatusChange: false,
  });

  // Fetch user's resolution earnings (proposer/disputes/jury) and creator fees
  // NO POLLING - earnings are historical, update after withdrawals
  const { data: earningsData, refetch: refetchEarnings } = useQuery<GetUserEarningsResponse>(GET_USER_EARNINGS, {
    variables: { user: address?.toLowerCase() },
    skip: !address,
    notifyOnNetworkStatusChange: false,
  });

  // Calculate trading P/L from sells - ONLY for closed positions (fully exited OR resolved markets)
  // v0.7.12: Only sum P/L when position is closed to avoid misleading unrealized values
  const tradingPnl = useMemo(() => {
    if (!tradesData?.trades || !address || !data?.positions) {
      return { realizedPnlBNB: 0, realizedPnlPercent: 0, hasSells: false };
    }
    
    const positions = data.positions;
    const trades = tradesData.trades;
    const walletAddress = address.toLowerCase();
    
    // Build a set of market IDs where user has closed positions
    const closedMarketIds = new Set<string>();
    positions.forEach((pos) => {
      const yesShares = Number(BigInt(pos.yesShares || '0')) / 1e18;
      const noShares = Number(BigInt(pos.noShares || '0')) / 1e18;
      const isResolved = pos.market.resolved || pos.market.status === 'Resolved';
      const fullyExited = yesShares === 0 && noShares === 0;
      
      if (isResolved || fullyExited) {
        closedMarketIds.add(pos.market.id.toLowerCase());
      }
    });
    
    // Calculate trading P/L only for closed markets
    const closedData = {
      yes: { bought: 0, sold: 0, sharesBought: 0, sharesSold: 0 },
      no: { bought: 0, sold: 0, sharesBought: 0, sharesSold: 0 },
    };
    
    trades.forEach(trade => {
      const tradeAddress = trade.traderAddress?.toLowerCase() || '';
      const tradeMarketId = trade.market?.id?.toLowerCase() || '';
      
      // Only include trades from closed positions
      if (tradeAddress !== walletAddress || !closedMarketIds.has(tradeMarketId)) return;
      
      const bnbAmount = parseFloat(trade.bnbAmount || '0');
      const shares = Number(BigInt(trade.shares || '0')) / 1e18;
      const side = trade.isYes ? 'yes' : 'no';
      
      if (trade.isBuy) {
        closedData[side].bought += bnbAmount;
        closedData[side].sharesBought += shares;
      } else {
        closedData[side].sold += bnbAmount;
        closedData[side].sharesSold += shares;
      }
    });
    
    const hasYesSells = closedData.yes.sharesSold > 0;
    const hasNoSells = closedData.no.sharesSold > 0;
    const hasSells = hasYesSells || hasNoSells;
    
    if (!hasSells) {
      return { realizedPnlBNB: 0, realizedPnlPercent: 0, hasSells: false };
    }
    
    let realizedPnlBNB = 0;
    let totalCostBasis = 0;
    
    if (hasYesSells && closedData.yes.sharesBought > 0) {
      const avgCostPerShare = closedData.yes.bought / closedData.yes.sharesBought;
      const costBasisOfSold = avgCostPerShare * closedData.yes.sharesSold;
      realizedPnlBNB += closedData.yes.sold - costBasisOfSold;
      totalCostBasis += costBasisOfSold;
    }
    
    if (hasNoSells && closedData.no.sharesBought > 0) {
      const avgCostPerShare = closedData.no.bought / closedData.no.sharesBought;
      const costBasisOfSold = avgCostPerShare * closedData.no.sharesSold;
      realizedPnlBNB += closedData.no.sold - costBasisOfSold;
      totalCostBasis += costBasisOfSold;
    }
    
    const realizedPnlPercent = totalCostBasis > 0 
      ? (realizedPnlBNB / totalCostBasis) * 100 
      : 0;
    
    return { realizedPnlBNB, realizedPnlPercent, hasSells };
  }, [tradesData?.trades, address, data?.positions]);

  // Calculate Resolution P/L (NET: claims - invested for resolved positions only)
  // Also track refunds separately (capital recovery, not P/L)
  // v0.7.12: Only count positions that are actually closed
  const resolutionStats = useMemo(() => {
    const positions = data?.positions || [];
    
    let resolutionPnl = 0;
    let totalRefunded = 0;
    let resolvedCount = 0;
    
    positions.forEach((pos) => {
      // Check if position is closed (resolved OR fully exited)
      const yesShares = Number(BigInt(pos.yesShares || '0')) / 1e18;
      const noShares = Number(BigInt(pos.noShares || '0')) / 1e18;
      const isResolved = pos.market.resolved || pos.market.status === 'Resolved';
      const fullyExited = yesShares === 0 && noShares === 0;
      const positionClosed = isResolved || fullyExited;
      
      const hasClaimed = parseFloat(pos.claimedAmount || '0') > 0;
      const hasRefunded = parseFloat(pos.refundedAmount || '0') > 0;
      
      if (hasRefunded) {
        // Refunds are capital recovery, not P/L
        totalRefunded += parseFloat(pos.refundedAmount || '0');
      }
      
      // Only count resolution P/L for closed positions
      if (positionClosed && (isResolved || hasClaimed)) {
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
  const { withdrawBond, isPending: isWithdrawingBond, isSuccess: bondWithdrawn, reset: resetBondWithdraw } = useWithdrawBond();
  const { withdrawCreatorFees, isPending: isWithdrawingFees, isSuccess: feesWithdrawn, reset: resetFeesWithdraw } = useWithdrawCreatorFees();
  const queryClient = useQueryClient();

  // Refetch pending withdrawals and invalidate balance queries after successful withdrawal
  useEffect(() => {
    if (bondWithdrawn || feesWithdrawn) {
      // Refetch pending amounts to update the UI
      refetchPending();
      // Refetch earnings to update the totals
      refetchEarnings();
      // Invalidate balance queries so Header updates
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      // Reset the mutation state after a short delay so the banner can disappear
      const timer = setTimeout(() => {
        if (bondWithdrawn) resetBondWithdraw();
        if (feesWithdrawn) resetFeesWithdraw();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [bondWithdrawn, feesWithdrawn, refetchPending, refetchEarnings, queryClient, resetBondWithdraw, resetFeesWithdraw]);

  // Format pending amounts
  const pendingBondsFormatted = pendingBonds ? parseFloat(formatEther(pendingBonds)) : 0;
  const pendingFeesFormatted = pendingCreatorFees ? parseFloat(formatEther(pendingCreatorFees)) : 0;
  const hasPendingWithdrawals = pendingBondsFormatted > 0 || pendingFeesFormatted > 0;

  // Parse resolution earnings (v3.6.1)
  const earnings = useMemo(() => {
    const user = earningsData?.user;
    const proposer = parseFloat(user?.totalProposerRewardsEarned || '0');
    const disputes = parseFloat(user?.totalBondEarnings || '0');
    const jury = parseFloat(user?.totalJuryFeesEarned || '0');
    const creator = parseFloat(user?.totalCreatorFeesEarned || '0');
    const totalResolution = proposer + disputes + jury; // Excludes creator fees
    const hasEarnings = proposer > 0 || disputes > 0 || jury > 0 || creator > 0;
    return { proposer, disputes, jury, creator, totalResolution, hasEarnings };
  }, [earningsData]);

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
      // Pending sub-categories for resolution stages
      pendingSub: {
        awaiting: [] as PositionWithMarket[],   // Just expired, no proposal yet
        proposed: [] as PositionWithMarket[],    // Has proposal, in 30min dispute window
        disputed: [] as PositionWithMarket[],    // Under dispute, 1hr voting period
        finalizing: [] as PositionWithMarket[],  // Window ended, ready to finalize
      },
    };

    // Helper to sub-categorize pending positions
    const subCategorizePending = (pos: PositionWithMarket, market: typeof pos.market) => {
      const hasProposal = market.proposer && market.proposer !== '0x0000000000000000000000000000000000000000';
      const hasDispute = market.disputer && market.disputer !== '0x0000000000000000000000000000000000000000';
      const proposalMs = market.proposalTimestamp ? Number(market.proposalTimestamp) * 1000 : 0;
      const disputeMs = market.disputeTimestamp ? Number(market.disputeTimestamp) * 1000 : 0;
      const disputeWindowEnd = proposalMs + DISPUTE_WINDOW;
      const votingWindowEnd = disputeMs + VOTING_WINDOW;

      if (!hasProposal) {
        categories.pendingSub.awaiting.push(pos);
      } else if (hasDispute && now < votingWindowEnd) {
        categories.pendingSub.disputed.push(pos);
      } else if (!hasDispute && now < disputeWindowEnd) {
        categories.pendingSub.proposed.push(pos);
      } else {
        categories.pendingSub.finalizing.push(pos);
      }
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
      
      // Market supply (for one-sided market detection)
      const marketYesSupply = BigInt(market.yesShares || '0');
      const marketNoSupply = BigInt(market.noShares || '0');
      const marketTotalSupply = marketYesSupply + marketNoSupply;
      const isOneSidedMarket = marketTotalSupply > 0n && (marketYesSupply === 0n || marketNoSupply === 0n);
      
      // Time windows
      const disputeWindowEnd = proposalMs + DISPUTE_WINDOW;
      const votingWindowEnd = disputeMs + VOTING_WINDOW;
      const emergencyRefundTime = expiryMs + EMERGENCY_REFUND_DELAY;
      
      // Check if eligible for emergency refund (24h+ expired, not resolved, OR one-sided market after 24h)
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
        subCategorizePending(pos, market);
        return;
      }
      
      // 3. Can emergency refund (expired 24h+, not resolved, has shares, not refunded)
      // Also includes one-sided markets after 24h (they cannot finalize)
      if (isUnresolved && hasShares && !alreadyRefunded) {
        categories.needsAction.push({ ...pos, action: 'refund' });
        categories.unresolved.push(pos);
        return;
      }
      
      // 3b. One-sided market waiting for 24h refund (not yet unresolved but cannot finalize)
      if (isOneSidedMarket && isExpired && !isResolved && hasShares && !alreadyRefunded) {
        // One-sided markets cannot finalize, they wait for emergency refund
        // If 24h hasn't passed, just show them as awaiting resolution
        categories.awaitingResolution.push(pos);
        subCategorizePending(pos, market);
        return;
      }
      
      // 4. Can finalize (proposal/voting window ended, not resolved, has shares, NOT one-sided)
      // One-sided markets cannot be finalized - they can only get emergency refund
      const canFinalize = hasProposal && !isResolved && hasShares && !isOneSidedMarket && (
        (hasDispute && now > votingWindowEnd) || 
        (!hasDispute && now > disputeWindowEnd)
      );
      if (canFinalize) {
        categories.needsAction.push({ ...pos, action: 'finalize' });
        categories.awaitingResolution.push(pos);
        subCategorizePending(pos, market);
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
        subCategorizePending(pos, market);
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

  // Count pending sub-categories
  const pendingSubCounts = useMemo(() => ({
    awaiting: categorizedPositions.pendingSub.awaiting.length,
    proposed: categorizedPositions.pendingSub.proposed.length,
    disputed: categorizedPositions.pendingSub.disputed.length,
    finalizing: categorizedPositions.pendingSub.finalizing.length,
  }), [categorizedPositions]);

  // Filter positions based on selection
  const filteredPositions = useMemo(() => {
    let result: PositionWithMarket[];
    
    switch (filterBy) {
      case 'needs-action':
        // Apply sub-filter if selected
        if (actionFilter !== 'all') {
          result = categorizedPositions.needsAction.filter(pos => pos.action === actionFilter);
        } else {
          result = categorizedPositions.needsAction;
        }
        break;
      case 'active':
        result = categorizedPositions.active;
        break;
      case 'awaiting-resolution':
        // Apply pending sub-filter if selected
        if (pendingSubFilter !== 'all') {
          result = categorizedPositions.pendingSub[pendingSubFilter];
        } else {
          result = categorizedPositions.awaitingResolution;
        }
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
    
    // Apply heat level filter if not "all" (-1)
    if (heatLevelFilter !== -1) {
      result = result.filter((pos) => {
        const marketHeat = Number(pos.market.heatLevel ?? 1); // Default to 1 if undefined
        return marketHeat === heatLevelFilter;
      });
    }
    
    return result;
  }, [filterBy, actionFilter, pendingSubFilter, positions, categorizedPositions, heatLevelFilter]);

  // Sort positions
  const sortedPositions = useMemo(() => {
    return [...filteredPositions].sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return Number(b.market.totalVolume || '0') - Number(a.market.totalVolume || '0');
        case 'newest':
          return Number(b.market.createdAt || '0') - Number(a.market.createdAt || '0');
        case 'ending':
          return Number(a.market.expiryTimestamp) - Number(b.market.expiryTimestamp);
        case 'liquidity':
          return Number(b.market.poolBalance || '0') - Number(a.market.poolBalance || '0');
        default:
          return 0;
      }
    });
  }, [filteredPositions, sortBy]);

  // Reset action filter when switching away from needs-action
  const handleFilterChange = (newFilter: FilterOption) => {
    setFilterBy(newFilter);
    setDisplayCount(ITEMS_PER_PAGE); // Reset pagination on filter change
    if (newFilter !== 'needs-action') {
      setActionFilter('all');
    }
    if (newFilter !== 'awaiting-resolution') {
      setPendingSubFilter('all');
    }
  };

  // Handle pending sub-filter change
  const handlePendingSubFilterChange = (newSubFilter: PendingSubFilter) => {
    setPendingSubFilter(newSubFilter);
    setDisplayCount(ITEMS_PER_PAGE);
  };

  // Handle sort change
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setDisplayCount(ITEMS_PER_PAGE);
  };

  // Handle heat level filter change
  const handleHeatLevelChange = (newHeatLevel: HeatLevelFilter) => {
    setHeatLevelFilter(newHeatLevel);
    setDisplayCount(ITEMS_PER_PAGE);
  };

  // Reset display count when action filter changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [actionFilter, pendingSubFilter]);

  // Paginated positions for display
  const paginatedPositions = useMemo(() => {
    return sortedPositions.slice(0, displayCount);
  }, [sortedPositions, displayCount]);

  const hasMoreItems = displayCount < sortedPositions.length;

  // Infinite scroll - load more when sentinel is visible
  const loadMore = useCallback(() => {
    if (hasMoreItems) {
      setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, sortedPositions.length));
    }
  }, [hasMoreItems, sortedPositions.length]);

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

  // Markets list from query
  const myMarkets = myMarketsData?.markets || [];
  const hasMoreMarkets = marketsDisplayCount < myMarkets.length;

  // Infinite scroll - load more markets when sentinel is visible
  const loadMoreMarkets = useCallback(() => {
    if (hasMoreMarkets) {
      setMarketsDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, myMarkets.length));
    }
  }, [hasMoreMarkets, myMarkets.length]);

  // Reset markets display count when view mode changes
  useEffect(() => {
    if (viewMode === 'my-markets') {
      setMarketsDisplayCount(ITEMS_PER_PAGE);
    }
  }, [viewMode]);

  // Intersection Observer for markets infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreMarkets) {
          loadMoreMarkets();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreMarketsRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loadMoreMarkets, hasMoreMarkets]);

  // Calculate portfolio stats
  const stats = calculatePortfolioStats(positions, categorizedPositions);

  // Main render - show layout for both connected and disconnected states

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-dark-600 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Mobile: Stack everything vertically / Desktop: Side by side */}
          <div className="flex flex-col gap-4 md:gap-6">
            {/* Title and Address */}
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                PORT<span className="text-cyber">FOLIO</span>
              </h1>
              {isConnected && address && (
                <div className="mt-2">
                  <AddressDisplay address={address} iconSize={24} />
                </div>
              )}
            </div>

            {/* Stats Grid - All stats in one row on desktop, 2-col grid on mobile */}
            <div className="grid grid-cols-2 md:flex md:items-center md:flex-wrap gap-3 md:gap-4">
              {/* Trading Stats */}
              <StatBox label="POSITIONS" value={isConnected ? stats.totalPositions.toString() : '—'} />
              <StatBox 
                label="INVESTED" 
                value={isConnected ? `${stats.totalInvested.toFixed(2)} BNB` : '—'}
              />
              <StatBox 
                label="TOTAL P/L" 
                value={isConnected && totalPnl.hasActivity 
                  ? `${totalPnl.combined >= 0 ? '+' : ''}${totalPnl.combined.toFixed(4)} BNB`
                  : '—'
                }
                color={isConnected && totalPnl.hasActivity ? (totalPnl.combined >= 0 ? 'yes' : 'no') : undefined}
                subtextElement={isConnected && totalPnl.hasActivity 
                  ? (
                    <span className="text-[10px] md:text-xs">
                      <span className={tradingPnl.realizedPnlBNB >= 0 ? 'text-yes' : 'text-no'}>
                        T: {tradingPnl.realizedPnlBNB >= 0 ? '+' : ''}{tradingPnl.realizedPnlBNB.toFixed(4)}
                      </span>
                      <span className="text-text-muted"> | </span>
                      <span className={resolutionStats.resolutionPnl >= 0 ? 'text-yes' : 'text-no'}>
                        R: {resolutionStats.resolutionPnl >= 0 ? '+' : ''}{resolutionStats.resolutionPnl.toFixed(4)}
                      </span>
                    </span>
                  )
                  : undefined
                }
              />
              <StatBox 
                label="REFUNDED" 
                value={resolutionStats.totalRefunded > 0 ? `${resolutionStats.totalRefunded.toFixed(4)} BNB` : '—'}
                color={resolutionStats.totalRefunded > 0 ? 'neutral' : undefined}
              />
              
              {/* Resolution Earnings */}
              <StatBox 
                label="PROPOSER" 
                value={earnings.proposer > 0 ? `+${earnings.proposer.toFixed(4)} BNB` : '—'}
                color={earnings.proposer > 0 ? 'yes' : undefined}
                subtext="0.5% pool rewards"
              />
              <StatBox 
                label="DISPUTES" 
                value={earnings.disputes > 0 ? `+${earnings.disputes.toFixed(4)} BNB` : '—'}
                color={earnings.disputes > 0 ? 'yes' : undefined}
                subtext="Bond winnings"
              />
              <StatBox 
                label="JURY" 
                value={earnings.jury > 0 ? `+${earnings.jury.toFixed(4)} BNB` : '—'}
                color={earnings.jury > 0 ? 'yes' : undefined}
                subtext="Voting rewards"
              />
              
              {/* Creator Fees (separate) */}
              <StatBox 
                label="CREATOR" 
                value={earnings.creator > 0 ? `+${earnings.creator.toFixed(4)} BNB` : '—'}
                color={earnings.creator > 0 ? 'cyber' : undefined}
                subtext="0.5% of trades"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pending Withdrawals Banner (Pull Pattern v3.4.0) - Only when connected */}
      {isConnected && hasPendingWithdrawals && (
        <section className="bg-dark-700/50 border-b border-dark-600 py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
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
      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4">
          {viewMode === 'positions' ? (
            <>
              {/* Action-based filter tabs - scrollable on mobile */}
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-4">
                <div className="flex items-center gap-2 md:gap-3 w-max md:w-auto md:flex-wrap">
                {/* ALL - Default, shown first */}
                <button 
                  onClick={() => handleFilterChange('all')}
                  className={cn(
                    "text-sm font-bold pb-1 transition-colors whitespace-nowrap",
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
                    "text-sm font-bold pb-1 transition-colors flex items-center gap-1 whitespace-nowrap",
                    filterBy === 'needs-action' 
                      ? categorizedPositions.needsAction.length > 0
                        ? "text-status-disputed border-b-2 border-status-disputed"
                        : "text-cyber border-b-2 border-cyber"
                      : categorizedPositions.needsAction.length > 0
                        ? "text-status-disputed/80 hover:text-status-disputed animate-pulse"
                        : "text-text-secondary hover:text-white"
                  )}
                >
                  ACTION ({categorizedPositions.needsAction.length})
                </button>
                
                {/* ACTIVE - Positions in live markets */}
                <button 
                  onClick={() => handleFilterChange('active')}
                  className={cn(
                    "text-sm font-bold pb-1 transition-colors whitespace-nowrap",
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
                    "text-sm font-bold pb-1 transition-colors whitespace-nowrap",
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
                    "text-sm font-bold pb-1 transition-colors whitespace-nowrap",
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
                      "text-sm font-bold pb-1 transition-colors whitespace-nowrap",
                      filterBy === 'unresolved' 
                        ? "text-no border-b-2 border-no" 
                        : "text-text-secondary hover:text-white"
                    )}
                  >
                    UNRESOLVED ({categorizedPositions.unresolved.length})
                  </button>
                )}
                </div>
              </div>

              {/* Sort and Heat Filter Row */}
              <div className={cn(
                "flex items-center gap-2 -mx-4 px-4 mb-4",
                heatDropdownOpen ? "overflow-visible" : "overflow-x-auto scrollbar-hide"
              )}>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-text-muted text-xs font-mono">SORT:</span>
                  <button
                    onClick={() => handleSortChange('volume')}
                    className={cn(
                      'px-2 py-1 text-xs font-mono uppercase font-bold animate-pulse',
                      'bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 bg-clip-text text-transparent',
                      sortBy === 'volume' 
                        ? 'scale-110' 
                        : 'hover:scale-105'
                    )}
                  >
                    HOT
                  </button>
                  <button
                    onClick={() => handleSortChange('newest')}
                    className={cn(
                      'px-2 py-1 text-xs font-mono uppercase transition-colors',
                      sortBy === 'newest'
                        ? 'text-cyber font-bold'
                        : 'text-text-secondary hover:text-white'
                    )}
                  >
                    NEW
                  </button>
                  <button
                    onClick={() => handleSortChange('ending')}
                    className={cn(
                      'px-2 py-1 text-xs font-mono uppercase transition-colors',
                      sortBy === 'ending'
                        ? 'text-cyber font-bold'
                        : 'text-text-secondary hover:text-white'
                    )}
                  >
                    ENDING
                  </button>
                  <button
                    onClick={() => handleSortChange('liquidity')}
                    className={cn(
                      'px-2 py-1 text-xs font-mono uppercase transition-colors',
                      sortBy === 'liquidity'
                        ? 'text-cyber font-bold'
                        : 'text-text-secondary hover:text-white'
                    )}
                  >
                    LIQUID
                  </button>
                </div>
                
                {/* Heat Level Filter - Custom Dropdown */}
                <div className="h-4 w-px bg-dark-600 mx-1 sm:mx-2 flex-shrink-0" />
                <span className="text-text-muted text-xs font-mono flex-shrink-0">HEAT:</span>
                <div className="relative flex-shrink-0" ref={heatDropdownRef}>
                  <button
                    onClick={() => setHeatDropdownOpen(!heatDropdownOpen)}
                    className={cn(
                      'px-2 sm:px-3 py-1.5 text-xs font-bold uppercase border transition-colors cursor-pointer flex items-center gap-1 sm:gap-2',
                      'bg-dark-800 focus:outline-none',
                      heatLevelFilter === -1 
                        ? 'border-cyber text-cyber bg-cyber/10'
                        : heatLevelFilter === 0 
                          ? 'border-no text-no bg-no/10'
                          : heatLevelFilter === 1
                            ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10'
                            : heatLevelFilter === 2
                              ? 'border-cyber text-cyber bg-cyber/10'
                              : heatLevelFilter === 3
                                ? 'border-blue-400 text-blue-400 bg-blue-400/10'
                                : 'border-purple-400 text-purple-400 bg-purple-400/10'
                    )}
                  >
                    <span className="whitespace-nowrap">{heatLevelFilter === -1 ? 'ALL' : HEAT_LEVELS[heatLevelFilter]?.shortName}</span>
                    <svg 
                      className={cn('w-3 h-3 transition-transform flex-shrink-0', heatDropdownOpen && 'rotate-180')} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {heatDropdownOpen && (
                    <div className="absolute top-full right-0 lg:left-0 lg:right-auto mt-1 z-50 min-w-[140px] bg-dark-900 border border-dark-500 shadow-xl">
                      {/* ALL HEAT option */}
                      <button
                        onClick={() => {
                          handleHeatLevelChange(-1);
                          setHeatDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full px-3 py-2 text-left text-xs font-bold uppercase transition-colors',
                          heatLevelFilter === -1
                            ? 'bg-cyber/20 text-cyber'
                            : 'text-text-secondary hover:bg-dark-800 hover:text-white'
                        )}
                      >
                        ALL HEAT
                      </button>
                      
                      {/* Heat level options */}
                      {HEAT_LEVELS.map((level) => {
                        const hoverTextColor = 
                          level.value === 0 ? 'hover:text-no' :
                          level.value === 1 ? 'hover:text-yellow-500' :
                          level.value === 2 ? 'hover:text-cyber' :
                          level.value === 3 ? 'hover:text-blue-400' :
                          'hover:text-purple-400';
                        
                        return (
                          <button
                            key={level.value}
                            onClick={() => {
                              handleHeatLevelChange(level.value as HeatLevelFilter);
                              setHeatDropdownOpen(false);
                            }}
                            className={cn(
                              'w-full px-3 py-2 text-left text-xs font-bold uppercase transition-colors border-t border-dark-700',
                              heatLevelFilter === level.value
                                ? `${level.bgColor} ${level.textColor}`
                                : `text-text-secondary hover:bg-dark-800 ${hoverTextColor}`
                            )}
                          >
                            {level.shortName}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-filter buttons for NEEDS ACTION */}
              {filterBy === 'needs-action' && (
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-6">
                  <div className="flex items-center gap-2 w-max pl-2 border-l-2 border-status-disputed/30">
                    <span className="text-xs text-text-muted mr-1 whitespace-nowrap">FILTER:</span>
                  <button 
                    onClick={() => setActionFilter('all')}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded transition-colors",
                      actionFilter === 'all' 
                        ? "bg-status-disputed/20 text-status-disputed" 
                        : "text-text-secondary hover:text-white hover:bg-dark-600"
                    )}
                  >
                    ALL
                  </button>
                  <button 
                    onClick={() => setActionFilter('claim')}
                    disabled={actionCounts.claim === 0}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded transition-colors",
                      actionFilter === 'claim' 
                        ? "bg-yes/20 text-yes" 
                        : actionCounts.claim > 0
                          ? "text-yes/70 hover:text-yes hover:bg-dark-600"
                          : "text-text-muted/50 cursor-not-allowed"
                    )}
                  >
                    CLAIM ({actionCounts.claim})
                  </button>
                  <button 
                    onClick={() => setActionFilter('vote')}
                    disabled={actionCounts.vote === 0}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded transition-colors",
                      actionFilter === 'vote' 
                        ? "bg-orange-500/20 text-orange-400" 
                        : actionCounts.vote > 0
                          ? "text-orange-400/70 hover:text-orange-400 hover:bg-dark-600"
                          : "text-text-muted/50 cursor-not-allowed"
                    )}
                  >
                    VOTE ({actionCounts.vote})
                  </button>
                  <button 
                    onClick={() => setActionFilter('finalize')}
                    disabled={actionCounts.finalize === 0}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded transition-colors",
                      actionFilter === 'finalize' 
                        ? "bg-purple-500/20 text-purple-400" 
                        : actionCounts.finalize > 0
                          ? "text-purple-400/70 hover:text-purple-400 hover:bg-dark-600"
                          : "text-text-muted/50 cursor-not-allowed"
                    )}
                  >
                    FINALIZE ({actionCounts.finalize})
                  </button>
                  <button 
                    onClick={() => setActionFilter('refund')}
                    disabled={actionCounts.refund === 0}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded transition-colors",
                      actionFilter === 'refund' 
                        ? "bg-yes/20 text-yes" 
                        : actionCounts.refund > 0
                          ? "text-yes/70 hover:text-yes hover:bg-dark-600"
                          : "text-text-muted/50 cursor-not-allowed"
                    )}
                  >
                    REFUND ({actionCounts.refund})
                  </button>
                  </div>
                </div>
              )}

              {/* Sub-filter buttons for PENDING (awaiting-resolution) */}
              {filterBy === 'awaiting-resolution' && (
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-6">
                  <div className="flex items-center gap-2 w-max pl-2 border-l-2 border-cyber/30">
                    <span className="text-xs text-text-muted mr-1 whitespace-nowrap">STAGE:</span>
                  <button 
                    onClick={() => handlePendingSubFilterChange('all')}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded transition-colors",
                      pendingSubFilter === 'all' 
                        ? "bg-cyber/20 text-cyber" 
                        : "text-text-secondary hover:text-white hover:bg-dark-600"
                    )}
                  >
                    ALL ({categorizedPositions.awaitingResolution.length})
                  </button>
                  <button 
                    onClick={() => handlePendingSubFilterChange('awaiting')}
                    disabled={pendingSubCounts.awaiting === 0}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded transition-colors",
                      pendingSubFilter === 'awaiting' 
                        ? "bg-dark-500/20 text-text-secondary" 
                        : pendingSubCounts.awaiting > 0
                          ? "text-text-muted hover:text-text-secondary hover:bg-dark-600"
                          : "text-text-muted/50 cursor-not-allowed"
                    )}
                  >
                    AWAITING ({pendingSubCounts.awaiting})
                  </button>
                  <button 
                    onClick={() => handlePendingSubFilterChange('proposed')}
                    disabled={pendingSubCounts.proposed === 0}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded transition-colors",
                      pendingSubFilter === 'proposed' 
                        ? "bg-yes/20 text-yes" 
                        : pendingSubCounts.proposed > 0
                          ? "text-yes/70 hover:text-yes hover:bg-dark-600"
                          : "text-text-muted/50 cursor-not-allowed"
                    )}
                  >
                    PROPOSED ({pendingSubCounts.proposed})
                  </button>
                  <button 
                    onClick={() => handlePendingSubFilterChange('disputed')}
                    disabled={pendingSubCounts.disputed === 0}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded transition-colors",
                      pendingSubFilter === 'disputed' 
                        ? "bg-orange-500/20 text-orange-400" 
                        : pendingSubCounts.disputed > 0
                          ? "text-orange-400/70 hover:text-orange-400 hover:bg-dark-600"
                          : "text-text-muted/50 cursor-not-allowed"
                    )}
                  >
                    DISPUTED ({pendingSubCounts.disputed})
                  </button>
                  <button 
                    onClick={() => handlePendingSubFilterChange('finalizing')}
                    disabled={pendingSubCounts.finalizing === 0}
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded transition-colors",
                      pendingSubFilter === 'finalizing' 
                        ? "bg-yes/20 text-yes" 
                        : pendingSubCounts.finalizing > 0
                          ? "text-yes/70 hover:text-yes hover:bg-dark-600"
                          : "text-text-muted/50 cursor-not-allowed"
                    )}
                  >
                    FINALIZING ({pendingSubCounts.finalizing})
                  </button>
                  </div>
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
          ) : !isConnected || sortedPositions.length === 0 ? (
            filterBy === 'all' || !isConnected ? (
              <EmptyState isConnected={isConnected} />
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
                    onActionSuccess={handlePositionActionSuccess}
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
                    Showing {paginatedPositions.length} of {sortedPositions.length}
                  </p>
                </div>
              )}
              
              {/* End of list indicator */}
              {!hasMoreItems && sortedPositions.length > ITEMS_PER_PAGE && (
                <div className="text-center py-6">
                  <p className="text-xs text-text-muted font-mono">
                    — END OF LIST ({sortedPositions.length} positions) —
                  </p>
                </div>
              )}
            </>
          )}
            </>
          ) : (
            /* My Markets View */
            <div>
              {!isConnected ? (
                <div className="text-center py-16">
                  <p className="text-xl font-bold text-white mb-2">CONNECT TO VIEW YOUR MARKETS</p>
                  <p className="text-text-secondary mb-6">
                    Connect your wallet to see markets you've created
                  </p>
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <Button variant="cyber" onClick={openConnectModal}>
                        CONNECT WALLET
                      </Button>
                    )}
                  </ConnectButton.Custom>
                </div>
              ) : isInitialMarketsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PositionCardSkeleton key={i} />
                  ))}
                </div>
              ) : myMarkets.length === 0 ? (
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
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myMarkets.slice(0, marketsDisplayCount).map((market) => (
                      <MyMarketCard key={market.id} market={market} />
                    ))}
                  </div>
                  
                  {/* Infinite scroll sentinel + load more info */}
                  {hasMoreMarkets && (
                    <div 
                      ref={loadMoreMarketsRef}
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
                        Showing {Math.min(marketsDisplayCount, myMarkets.length)} of {myMarkets.length}
                      </p>
                    </div>
                  )}
                  
                  {/* End of list indicator */}
                  {!hasMoreMarkets && myMarkets.length > ITEMS_PER_PAGE && (
                    <div className="text-center py-6">
                      <p className="text-xs text-text-muted font-mono">
                        — END OF LIST ({myMarkets.length} markets) —
                      </p>
                    </div>
                  )}
                </>
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
  color?: 'yes' | 'no' | 'neutral' | 'cyber';
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
        color === 'cyber' && 'text-cyber',
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
          color === 'cyber' && 'text-cyber/70',
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

function EmptyState({ isConnected }: { isConnected: boolean }) {
  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-bold text-white mb-2">CONNECT TO VIEW PORTFOLIO</p>
        <p className="text-text-secondary mb-6">
          Connect your wallet to see your positions and earnings
        </p>
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <Button variant="cyber" onClick={openConnectModal}>
              CONNECT WALLET
            </Button>
          )}
        </ConnectButton.Custom>
      </div>
    );
  }
  
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
    proposedOutcome?: boolean | null;
    totalVolume: string;
    totalTrades: string;
    poolBalance: string;
    expiryTimestamp: string;
    imageUrl?: string | null;
    proposer?: string | null;
    proposalTimestamp?: string | null;
    disputer?: string | null;
    disputeTimestamp?: string | null;
    heatLevel?: number;
    yesShares?: string;
    noShares?: string;
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
  
  // One-sided market detection
  const marketYesSupply = BigInt(market.yesShares || '0');
  const marketNoSupply = BigInt(market.noShares || '0');
  const marketTotalSupply = marketYesSupply + marketNoSupply;
  const isOneSidedMarket = marketTotalSupply > 0n && (marketYesSupply === 0n || marketNoSupply === 0n);
  
  // Proposal and dispute status
  const proposalMs = market.proposalTimestamp ? Number(market.proposalTimestamp) * 1000 : 0;
  const disputeMs = market.disputeTimestamp ? Number(market.disputeTimestamp) * 1000 : 0;
  const hasProposal = market.proposer && market.proposer !== '0x0000000000000000000000000000000000000000';
  const hasDispute = market.disputer && market.disputer !== '0x0000000000000000000000000000000000000000';
  const disputeWindowEnd = proposalMs + DISPUTE_WINDOW;
  const votingWindowEnd = disputeMs + VOTING_WINDOW;
  const emergencyRefundTime = expiryMs + EMERGENCY_REFUND_DELAY;
  
  // Badge logic matching MarketCard
  const getBadgeInfo = (): { text: string; variant: 'yes' | 'no' | 'active' | 'expired' | 'disputed' | 'whale' | 'neutral' } => {
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
    
    // PROPOSED - has proposal but not yet finalized (green)
    if (hasProposal && !hasDispute && now < disputeWindowEnd) {
      return { text: 'PROPOSED', variant: 'yes' };
    }
    
    // READY TO FINALIZE - voting or dispute window ended
    if (hasProposal && ((hasDispute && now > votingWindowEnd) || (!hasDispute && now > disputeWindowEnd))) {
      return { text: 'READY TO FINALIZE', variant: 'whale' };
    }
    
    // ONE-SIDED - expired with only one side having holders
    if (isExpired && !hasProposal && isOneSidedMarket) {
      return { text: 'ONE-SIDED', variant: 'disputed' };
    }
    
    // AWAITING PROPOSAL - expired but no proposal yet (two-sided market)
    if (isExpired && !hasProposal) {
      return { text: 'AWAITING PROPOSAL', variant: 'neutral' };
    }
    
    // ACTIVE - not expired yet
    return { text: 'ACTIVE', variant: 'active' };
  };
  
  const badgeInfo = getBadgeInfo();

  return (
    <Link to={`/market/${market.marketId || market.id}`}>
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
            
            {/* Status badge overlay (top right) */}
            <div className="absolute top-2 right-2">
              <Badge variant={badgeInfo.variant}>{badgeInfo.text}</Badge>
            </div>
          </div>
        )}
        
        {/* Heat level badge (if no image, show above question) */}
        {!market.imageUrl && market.heatLevel !== undefined && (
          <div className="flex items-center gap-2 mb-2">
            <HeatLevelBadge heatLevel={market.heatLevel} size="sm" />
          </div>
        )}
        
        <div className="flex-1 flex flex-col">
          {/* Question */}
          <p className="font-bold text-white line-clamp-2 text-sm min-h-[40px] break-all">
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
          <div className="border-t border-dark-600 pt-3 mt-auto grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-text-muted">POOL SIZE</p>
              <p className="text-sm font-mono text-cyber">{formatBNB(BigInt(market.poolBalance || '0'))} BNB</p>
            </div>
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

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

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useQuery } from '@apollo/client/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { GET_USER_POSITIONS, GET_MARKETS_BY_CREATOR } from '@/shared/api';
import type { GetUserPositionsResponse, GetMarketsResponse } from '@/shared/api';
import { PositionCard } from '../components';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Spinner';
import { AddressDisplay } from '@/shared/components/ui/Jazzicon';
import { cn } from '@/shared/utils/cn';
import { Link } from 'react-router-dom';
import { useSmartPollInterval, POLL_INTERVALS } from '@/shared/hooks/useSmartPolling';
import { usePendingWithdrawals, useWithdrawBond, useWithdrawCreatorFees } from '@/shared/hooks';
import { formatEther } from 'viem';


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
  };
  yesShares: string;
  noShares: string;
  totalInvested: string;
  claimed: boolean;
  hasVoted?: boolean;
}

type FilterOption = 'all' | 'active' | 'needs-action' | 'claimable';
type ViewMode = 'positions' | 'my-markets';

export function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('positions');

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

  // Pull Pattern: Pending withdrawals (v3.4.0)
  const { pendingBonds, pendingCreatorFees, refetch: refetchPending } = usePendingWithdrawals(address);
  const { withdrawBond, isPending: isWithdrawingBond, isSuccess: bondWithdrawn } = useWithdrawBond();
  const { withdrawCreatorFees, isPending: isWithdrawingFees, isSuccess: feesWithdrawn } = useWithdrawCreatorFees();

  // Refetch pending withdrawals after successful withdrawal
  if (bondWithdrawn || feesWithdrawn) {
    refetchPending();
  }

  // Format pending amounts
  const pendingBondsFormatted = pendingBonds ? parseFloat(formatEther(pendingBonds)) : 0;
  const pendingFeesFormatted = pendingCreatorFees ? parseFloat(formatEther(pendingCreatorFees)) : 0;
  const hasPendingWithdrawals = pendingBondsFormatted > 0 || pendingFeesFormatted > 0;

  // Only show loading on initial load, not polls
  const isInitialLoading = loading && !data?.positions;
  const isInitialMarketsLoading = myMarketsLoading && !myMarketsData?.markets;

  const positions = (data?.positions || []) as PositionWithMarket[];
  
  // Categorize positions - MUST be before any conditional returns (React hooks rule)
  const categorizedPositions = useMemo(() => {
    const now = Date.now();
    const categories = {
      active: [] as PositionWithMarket[],
      needsAction: [] as PositionWithMarket[], // Can vote or needs attention
      claimable: [] as PositionWithMarket[],
      archived: [] as PositionWithMarket[],
    };

    positions.forEach((pos) => {
      const expiryMs = Number(pos.market.expiryTimestamp) * 1000;
      const isExpired = now > expiryMs;
      const isResolved = pos.market.resolved;
      const isDisputed = pos.market.status === 'Disputed';
      const canVote = isDisputed && !pos.hasVoted;

      if (isResolved && !pos.claimed) {
        // Check if user has winning shares
        const hasWinningShares = pos.market.outcome 
          ? BigInt(pos.yesShares || '0') > 0n
          : BigInt(pos.noShares || '0') > 0n;
        if (hasWinningShares) {
          categories.claimable.push(pos);
          return;
        }
        categories.archived.push(pos);
      } else if (canVote) {
        categories.needsAction.push(pos);
      } else if (isExpired || isResolved) {
        categories.archived.push(pos);
      } else {
        categories.active.push(pos);
      }
    });

    return categories;
  }, [positions]);

  // Filter positions based on selection
  const filteredPositions = useMemo(() => {
    switch (filterBy) {
      case 'active':
        return categorizedPositions.active;
      case 'needs-action':
        return categorizedPositions.needsAction;
      case 'claimable':
        return categorizedPositions.claimable;
      default:
        return positions;
    }
  }, [filterBy, positions, categorizedPositions]);

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
            <div className="flex items-center gap-6">
              <StatBox label="POSITIONS" value={stats.totalPositions.toString()} />
              <StatBox 
                label="TOTAL VALUE" 
                value={`${stats.totalValue.toFixed(2)} BNB`}
                highlight
              />
              <StatBox 
                label="P/L" 
                value={`${stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)} BNB`}
                color={stats.totalPnL >= 0 ? 'yes' : 'no'}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Claimable Banner */}
      {viewMode === 'positions' && stats.claimable > 0 && (
        <section className="bg-yes/10 border-b border-yes py-4">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-yes font-bold">WINNINGS AVAILABLE</p>
                <p className="text-sm text-text-secondary">
                  You have {stats.claimable.toFixed(2)} BNB to claim
                </p>
              </div>
            </div>
            <Button variant="yes">CLAIM ALL</Button>
          </div>
        </section>
      )}

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
              MY MARKETS ({myMarketsData?.markets?.length || 0})
            </button>
          </div>
        </div>
      </section>

      {/* Positions Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {viewMode === 'positions' ? (
            <>
              {/* Filter tabs */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="text-text-muted text-sm font-mono">FILTER:</span>
            <button 
              onClick={() => setFilterBy('all')}
              className={cn(
                "text-sm font-bold pb-1 transition-colors",
                filterBy === 'all' 
                  ? "text-cyber border-b-2 border-cyber" 
                  : "text-text-secondary hover:text-white"
              )}
            >
              ALL ({positions.length})
            </button>
            <button 
              onClick={() => setFilterBy('active')}
              className={cn(
                "text-sm font-bold pb-1 transition-colors",
                filterBy === 'active' 
                  ? "text-cyber border-b-2 border-cyber" 
                  : "text-text-secondary hover:text-white"
              )}
            >
              ACTIVE ({categorizedPositions.active.length})
            </button>
            {categorizedPositions.needsAction.length > 0 && (
              <button 
                onClick={() => setFilterBy('needs-action')}
                className={cn(
                  "text-sm font-bold pb-1 transition-colors flex items-center gap-1",
                  filterBy === 'needs-action' 
                    ? "text-warning border-b-2 border-warning" 
                    : "text-warning/70 hover:text-warning"
                )}
              >
                <span className="animate-pulse">⚡</span>
                NEEDS ACTION ({categorizedPositions.needsAction.length})
              </button>
            )}
            <button 
              onClick={() => setFilterBy('claimable')}
              className={cn(
                "text-sm font-bold pb-1 transition-colors",
                filterBy === 'claimable' 
                  ? "text-yes border-b-2 border-yes" 
                  : categorizedPositions.claimable.length > 0 
                    ? "text-yes/70 hover:text-yes" 
                    : "text-text-secondary hover:text-white"
              )}
            >
              CLAIMABLE ({categorizedPositions.claimable.length})
            </button>
          </div>

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
                <p className="text-xl font-bold text-white mb-2">NO {filterBy.toUpperCase().replace('-', ' ')} POSITIONS</p>
                <p className="text-text-secondary mb-6">
                  {filterBy === 'needs-action' && "No markets need your vote right now"}
                  {filterBy === 'claimable' && "No winnings to claim at the moment"}
                  {filterBy === 'active' && "No active positions in open markets"}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPositions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>
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
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  color?: 'yes' | 'no';
}) {
  return (
    <div className={cn(
      'text-center px-4 py-2',
      highlight && 'border border-cyber bg-cyber/10'
    )}>
      <p className="text-xs text-text-muted font-mono">{label}</p>
      <p className={cn(
        'text-xl font-bold font-mono',
        color === 'yes' && 'text-yes',
        color === 'no' && 'text-no',
        !color && 'text-white'
      )}>
        {value}
      </p>
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
      <p className="text-4xl mb-4">💀</p>
      <p className="text-text-secondary font-mono">FAILED TO LOAD POSITIONS</p>
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
    active: PositionWithMarket[];
    needsAction: PositionWithMarket[];
    claimable: PositionWithMarket[];
    archived: PositionWithMarket[];
  }
) {
  let totalInvested = 0;
  let totalValue = 0;
  let claimableValue = 0;

  positions.forEach((pos) => {
    const invested = Number(pos.totalInvested || 0) / 1e18;
    totalInvested += invested;

    // Calculate current value based on market prices
    if (pos.market) {
      const yesShares = BigInt(pos.yesShares || '0');
      const noShares = BigInt(pos.noShares || '0');
      const marketYes = BigInt(pos.market.yesShares || '0');
      const marketNo = BigInt(pos.market.noShares || '0');
      const total = marketYes + marketNo;

      if (total > 0n) {
        const yesPrice = Number(marketNo) / Number(total);
        const noPrice = Number(marketYes) / Number(total);
        
        totalValue += (Number(yesShares) / 1e18) * yesPrice;
        totalValue += (Number(noShares) / 1e18) * noPrice;
      }
    }
  });

  // Calculate claimable value from winning positions
  categorizedPositions.claimable.forEach((pos) => {
    const outcome = pos.market.outcome;
    if (outcome === true) {
      // YES won - user gets 0.01 BNB per YES share
      const yesShares = Number(pos.yesShares || '0') / 1e18;
      claimableValue += yesShares * 0.01;
    } else if (outcome === false) {
      // NO won - user gets 0.01 BNB per NO share
      const noShares = Number(pos.noShares || '0') / 1e18;
      claimableValue += noShares * 0.01;
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
  };
}

function MyMarketCard({ market }: MyMarketCardProps) {
  const now = Date.now();
  const expiryMs = Number(market.expiryTimestamp) * 1000;
  const isExpired = now > expiryMs;
  
  // Calculate creator earnings (0.5% of total volume)
  const totalVolume = parseFloat(market.totalVolume || '0');
  const creatorEarnings = totalVolume * 0.005;
  
  const statusColor = market.resolved 
    ? 'text-text-muted' 
    : isExpired 
      ? 'text-warning' 
      : 'text-yes';
  
  const statusText = market.resolved 
    ? (market.outcome ? 'RESOLVED: YES' : 'RESOLVED: NO')
    : isExpired 
      ? 'EXPIRED' 
      : 'ACTIVE';

  return (
    <Link to={`/market/${market.marketId || market.id}`}>
      <Card className="hover:border-cyber transition-colors cursor-pointer h-full">
        <div className="space-y-3">
          {/* Question */}
          <p className="font-bold text-white line-clamp-2 text-sm">
            {market.question}
          </p>
          
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={cn("text-xs font-mono font-bold", statusColor)}>
              {statusText}
            </span>
            <span className="text-xs text-text-muted font-mono">
              {market.totalTrades} trades
            </span>
          </div>
          
          {/* Stats */}
          <div className="border-t border-dark-600 pt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-text-muted">VOLUME</p>
              <p className="text-sm font-mono text-white">{totalVolume.toFixed(3)} BNB</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">YOUR EARNINGS</p>
              <p className="text-sm font-mono text-yes">+{creatorEarnings.toFixed(4)} BNB</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default PortfolioPage;

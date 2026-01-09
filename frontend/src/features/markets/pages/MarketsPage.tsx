/**
 * ===== MARKETS PAGE =====
 *
 * The main "Jungle" - homepage showing all active markets.
 * Features a live ticker, market grid, and trending markets.
 *
 * Smart Polling (v3.4.1):
 * - Stops polling when tab is inactive (saves 70%+ API quota)
 * - Uses 30s intervals for list, 2min for ticker
 *
 * @module features/markets/pages/MarketsPage
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_MARKETS, GET_RECENT_TRADES } from '@/shared/api';
import type { GetMarketsResponse, GetRecentTradesResponse } from '@/shared/api';
import { MarketCard, LiveTicker } from '../components';
import { MarketCardSkeleton } from '@/shared/components/ui/Spinner';
import { cn } from '@/shared/utils/cn';
import type { Market } from '@/shared/schemas';
import { useSmartPollInterval, POLL_INTERVALS } from '@/shared/hooks/useSmartPolling';

type SortOption = 'volume' | 'newest' | 'ending' | 'liquidity';
type FilterOption = 'active' | 'expired' | 'resolved';

export function MarketsPage() {
  const [sortBy, setSortBy] = useState<SortOption>('volume');
  const [filterBy, setFilterBy] = useState<FilterOption>('active');
  const [marketIdSearch, setMarketIdSearch] = useState('');

  // Smart polling: stops when tab is inactive
  const listPollInterval = useSmartPollInterval(POLL_INTERVALS.MARKET_LIST);
  const tickerPollInterval = useSmartPollInterval(POLL_INTERVALS.TICKER);

  // Fetch ALL markets (not just active)
  const { data, loading, error } = useQuery<GetMarketsResponse>(GET_MARKETS, {
    variables: { first: 100 },
    pollInterval: listPollInterval, // Dynamic: 30s when visible, 0 when hidden
  });

  // Only show loading skeleton on initial load, not polls
  const isInitialLoading = loading && !data?.markets;

  // Fetch recent trades for ticker
  const { data: tradesData } = useQuery<GetRecentTradesResponse>(GET_RECENT_TRADES, {
    variables: { first: 20 },
    pollInterval: tickerPollInterval, // Dynamic: 2min when visible, 0 when hidden
  });

  const allMarkets = data?.markets || [];
  const recentTrades = tradesData?.trades || [];

  // Filter markets based on selection
  const filteredMarkets = useMemo(() => {
    const now = Date.now();
    
    // First, filter by market ID if search is active
    let markets = allMarkets;
    if (marketIdSearch.trim()) {
      const searchId = marketIdSearch.trim().replace('#', '');
      markets = allMarkets.filter((market) => 
        market.marketId?.toString() === searchId || market.id === searchId
      );
      // If searching by ID, return all matches regardless of status
      if (markets.length > 0) return markets;
    }
    
    // Then filter by status
    return markets.filter((market) => {
      const expiryMs = Number(market.expiryTimestamp) * 1000;
      const isExpired = now > expiryMs;
      const isResolved = market.resolved;

      switch (filterBy) {
        case 'active':
          return !isExpired && !isResolved;
        case 'expired':
          return isExpired && !isResolved;
        case 'resolved':
          return isResolved;
        default:
          return true;
      }
    });
  }, [allMarkets, filterBy, marketIdSearch]);

  // Sort markets
  const sortedMarkets = useMemo(() => {
    return [...filteredMarkets].sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return Number(b.totalVolume) - Number(a.totalVolume);
        case 'newest':
          return Number(b.createdAt) - Number(a.createdAt);
        case 'ending':
          return Number(a.expiryTimestamp) - Number(b.expiryTimestamp);
        case 'liquidity':
          return Number(b.poolBalance) - Number(a.poolBalance);
        default:
          return 0;
      }
    });
  }, [filteredMarkets, sortBy]);

  // Count markets by category
  const marketCounts = useMemo(() => {
    const now = Date.now();
    let active = 0, expired = 0, resolved = 0;
    allMarkets.forEach((market) => {
      const expiryMs = Number(market.expiryTimestamp) * 1000;
      if (market.resolved) resolved++;
      else if (now > expiryMs) expired++;
      else active++;
    });
    return { active, expired, resolved };
  }, [allMarkets]);

  return (
    <div className="min-h-screen">
      {/* Live Ticker */}
      <LiveTicker trades={recentTrades} />

      {/* Hero Section */}
      <section className="border-b border-dark-600 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
                THE <span className="text-cyber">JUNGLE</span>
              </h1>
              <p className="text-text-secondary mt-2 font-mono text-sm">
                {allMarkets.length} MARKETS • TRADE YOUR CONVICTIONS
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 font-mono text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-yes">
                  {marketCounts.active}
                </p>
                <p className="text-text-muted text-xs">ACTIVE</p>
              </div>
              <div className="h-8 w-px bg-dark-600" />
              <div className="text-center">
                <p className="text-2xl font-bold text-cyber">
                  {calculateTotalVolume(allMarkets)}
                </p>
                <p className="text-text-muted text-xs">TOTAL VOL</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Sort */}
      <section className="border-b border-dark-600 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Filter tabs + ID search */}
            <div className="flex items-center gap-4">
              {/* Market ID Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ID #"
                  value={marketIdSearch}
                  onChange={(e) => setMarketIdSearch(e.target.value)}
                  className="w-20 px-2 py-1.5 bg-dark-800 border border-dark-600 text-white font-mono text-sm placeholder-dark-400 focus:outline-none focus:border-cyber"
                />
                {marketIdSearch && (
                  <button
                    onClick={() => setMarketIdSearch('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {/* Filter tabs */}
              <div className="flex items-center gap-2">
                <FilterButton
                  active={filterBy === 'active'}
                  onClick={() => setFilterBy('active')}
                  count={marketCounts.active}
                >
                  ACTIVE
                </FilterButton>
                <FilterButton
                  active={filterBy === 'expired'}
                  onClick={() => setFilterBy('expired')}
                  count={marketCounts.expired}
                >
                EXPIRED
              </FilterButton>
              <FilterButton
                active={filterBy === 'resolved'}
                onClick={() => setFilterBy('resolved')}
                count={marketCounts.resolved}
              >
                RESOLVED
              </FilterButton>
              </div>
            </div>

            {/* Sort options */}
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs font-mono mr-2">SORT:</span>
              <SortButton
                active={sortBy === 'volume'}
                onClick={() => setSortBy('volume')}
              >
                🔥 HOT
              </SortButton>
              <SortButton
                active={sortBy === 'newest'}
                onClick={() => setSortBy('newest')}
              >
                🆕 NEW
              </SortButton>
              <SortButton
                active={sortBy === 'ending'}
                onClick={() => setSortBy('ending')}
              >
                ⏰ ENDING
              </SortButton>
              <SortButton
                active={sortBy === 'liquidity'}
                onClick={() => setSortBy('liquidity')}
              >
                💧 LIQUID
              </SortButton>
            </div>
          </div>
        </div>
      </section>

      {/* Markets Grid */}
      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4">
          {isInitialLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <MarketCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error.message} />
          ) : sortedMarkets.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Helper components
function FilterButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors',
        active
          ? 'bg-cyber/20 text-cyber border-cyber'
          : 'bg-transparent text-text-secondary border-dark-600 hover:border-dark-500'
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn(
          'ml-1.5 px-1.5 py-0.5 text-[10px] rounded-sm',
          active ? 'bg-cyber/30' : 'bg-dark-700'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-1 text-xs font-mono transition-colors',
        active ? 'text-white' : 'text-text-muted hover:text-text-secondary'
      )}
    >
      {children}
    </button>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-4">💀</p>
      <p className="text-text-secondary font-mono">
        FAILED TO LOAD MARKETS
      </p>
      <p className="text-no text-sm font-mono mt-2">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-text-secondary font-mono text-xl">
        NO MARKETS YET
      </p>
      <p className="text-sm text-text-muted mt-2">
        Be the first to create a prediction market!
      </p>
    </div>
  );
}

function calculateTotalVolume(markets: Market[]): string {
  // totalVolume from subgraph is BigDecimal string (already in BNB, not wei)
  const total = markets.reduce(
    (sum, m) => sum + parseFloat(m.totalVolume || '0'),
    0
  );
  if (total >= 1000) return `${(total / 1000).toFixed(1)}K BNB`;
  return `${total.toFixed(1)} BNB`;
}

export default MarketsPage;

/**
 * ===== MARKETS PAGE =====
 *
 * The main "Jungle" - homepage showing all active markets.
 * Features a live ticker, market grid, and trending markets.
 *
 * @module features/markets/pages/MarketsPage
 */

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ACTIVE_MARKETS, GET_RECENT_TRADES } from '@/shared/api';
import type { GetActiveMarketsResponse, GetRecentTradesResponse } from '@/shared/api';
import { MarketCard, LiveTicker } from '../components';
import { MarketCardSkeleton } from '@/shared/components/ui/Spinner';
import { cn } from '@/shared/utils/cn';
import type { Market } from '@/shared/schemas';

type SortOption = 'volume' | 'newest' | 'ending' | 'liquidity';

export function MarketsPage() {
  const [sortBy, setSortBy] = useState<SortOption>('volume');
  const [showActive, setShowActive] = useState(true);

  // Fetch markets
  const { data, loading, error } = useQuery<GetActiveMarketsResponse>(GET_ACTIVE_MARKETS, {
    variables: { first: 50 },
    pollInterval: 60000, // Refresh every 60 seconds
  });

  // Fetch recent trades for ticker
  const { data: tradesData } = useQuery<GetRecentTradesResponse>(GET_RECENT_TRADES, {
    variables: { first: 20 },
    pollInterval: 30000, // Refresh every 30 seconds
  });

  const markets = data?.markets || [];
  const recentTrades = tradesData?.trades || [];

  // Sort markets
  const sortedMarkets = [...markets].sort((a, b) => {
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
                {markets.length} ACTIVE MARKETS • TRADE YOUR CONVICTIONS
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 font-mono text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-yes">
                  {markets.length}
                </p>
                <p className="text-text-muted text-xs">MARKETS</p>
              </div>
              <div className="h-8 w-px bg-dark-600" />
              <div className="text-center">
                <p className="text-2xl font-bold text-cyber">
                  {calculateTotalVolume(markets)}
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
            {/* Filter tabs */}
            <div className="flex items-center gap-2">
              <FilterButton
                active={showActive}
                onClick={() => setShowActive(true)}
              >
                ACTIVE
              </FilterButton>
              <FilterButton
                active={!showActive}
                onClick={() => setShowActive(false)}
              >
                ALL
              </FilterButton>
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
          {loading ? (
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
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
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
      <p className="text-4xl mb-4">🌴</p>
      <p className="text-text-secondary font-mono">
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

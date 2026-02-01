/**
 * ===== MARKETS PAGE =====
 *
 * The main "Jungle" - homepage showing all active markets.
 * Features a live ticker, market grid, and category tabs.
 *
 * v0.7.4: Category tabs (ALL, ACTIVE, PENDING, RESOLVED, UNRESOLVED)
 * - Infinite scroll pagination (20 items per page)
 * - Fetch 500 markets for accurate counts
 * - Default tab: ACTIVE
 *
 * Predator Polling v2:
 * - Market list: 90 seconds (was 30s) - saves 67% queries
 * - Ticker: ONCE on load, no polling - saves 100% ticker queries
 * - Tab hidden: ALL polling stops
 * - Tab focus: Instant refetch
 *
 * @module features/markets/pages/MarketsPage
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_MARKETS, GET_RECENT_TRADES } from '@/shared/api';
import type { GetMarketsResponse, GetRecentTradesResponse } from '@/shared/api';
import { MarketCard, LiveTicker } from '../components';
import { MarketCardSkeleton } from '@/shared/components/ui/Spinner';
import { cn } from '@/shared/utils/cn';
import type { Market } from '@/shared/schemas';
import { useFocusRefetch, POLL_INTERVALS } from '@/shared/hooks/useSmartPolling';
import { HEAT_LEVELS } from '@/shared/utils/heatLevel';
import { useMarketsModeration } from '@/features/chat';
import { env } from '@/shared/config/env';
import type { Network } from '@/lib/database.types';

// Sort options
type SortOption = 'volume' | 'newest' | 'ending' | 'liquidity';

// Category tabs
type FilterOption = 'all' | 'active' | 'pending' | 'resolved' | 'unresolved';

// Sub-filters for PENDING tab (resolution stages)
type PendingSubFilter = 'all' | 'awaiting' | 'proposed' | 'disputed' | 'finalizing';

// Time constants (match contract)
const DISPUTE_WINDOW = 30 * 60 * 1000; // 30 minutes
const VOTING_WINDOW = 60 * 60 * 1000; // 1 hour
const EMERGENCY_REFUND_DELAY = 24 * 60 * 60 * 1000; // 24 hours

// Pagination
const ITEMS_PER_PAGE = 20;

// Heat level filter (-1 = all)
type HeatLevelFilter = -1 | 0 | 1 | 2 | 3 | 4;

export function MarketsPage() {
  const [sortBy, setSortBy] = useState<SortOption>('newest'); // Default: NEW (helps new markets get visibility)
  const [filterBy, setFilterBy] = useState<FilterOption>('active'); // Default: ACTIVE
  const [pendingSubFilter, setPendingSubFilter] = useState<PendingSubFilter>('all');
  const [heatLevelFilter, setHeatLevelFilter] = useState<HeatLevelFilter>(-1); // -1 = all heat levels
  const [heatDropdownOpen, setHeatDropdownOpen] = useState(false); // Custom dropdown state
  const [marketIdSearch, setMarketIdSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const heatDropdownRef = useRef<HTMLDivElement>(null);

  // Predator v2: Fetch up to 500 markets for accurate counts
  const { data, loading, error, refetch } = useQuery<GetMarketsResponse>(GET_MARKETS, {
    variables: { first: 500 },
    notifyOnNetworkStatusChange: false,
    fetchPolicy: 'cache-and-network',
  });

  // Setup focus refetch (triggers refetch when tab becomes visible)
  const { isVisible } = useFocusRefetch(refetch);

  // Get market IDs for moderation lookup
  const marketIds = useMemo(() => {
    return data?.markets?.map(m => m.marketId) || [];
  }, [data?.markets]);

  // Fetch moderation status for all markets
  const network: Network = env.IS_TESTNET ? 'bnb-testnet' : 'bnb-mainnet';
  const { isFieldHidden } = useMarketsModeration({
    marketIds,
    contractAddress: env.CONTRACT_ADDRESS,
    network,
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

  // Manual polling at 90s interval (Predator v2) - only when visible
  useEffect(() => {
    if (!isVisible) return;
    
    const intervalId = setInterval(() => {
      refetch();
    }, POLL_INTERVALS.MARKET_LIST); // 90 seconds
    
    return () => clearInterval(intervalId);
  }, [isVisible, refetch]);

  // Only show loading skeleton on initial load, not polls
  const isInitialLoading = loading && !data?.markets;

  // Ticker: Fetch ONCE on load, no polling (Predator v2)
  const { data: tradesData } = useQuery<GetRecentTradesResponse>(GET_RECENT_TRADES, {
    variables: { first: 20 },
    notifyOnNetworkStatusChange: false,
  });

  const allMarkets = data?.markets || [];
  const recentTrades = tradesData?.trades || [];

  // Categorize all markets for accurate counts
  const categorizedMarkets = useMemo(() => {
    const now = Date.now();
    const categories = {
      all: [] as Market[],
      active: [] as Market[],
      pending: [] as Market[],
      resolved: [] as Market[],
      unresolved: [] as Market[],
      // Pending sub-categories for resolution stages
      pendingSub: {
        awaiting: [] as Market[],   // Just expired, no proposal yet
        proposed: [] as Market[],    // Has proposal, in 30min dispute window
        disputed: [] as Market[],    // Under dispute, 1hr voting period
        finalizing: [] as Market[],  // Window ended, ready to finalize
      },
    };

    allMarkets.forEach((market) => {
      const expiryMs = Number(market.expiryTimestamp) * 1000;
      const isExpired = now > expiryMs;
      const isResolved = market.resolved;
      const emergencyRefundTime = expiryMs + EMERGENCY_REFUND_DELAY;
      const isUnresolved = isExpired && !isResolved && now > emergencyRefundTime;

      // Add to ALL
      categories.all.push(market);

      // Categorize by state
      if (isResolved) {
        categories.resolved.push(market);
      } else if (isUnresolved) {
        categories.unresolved.push(market);
      } else if (isExpired) {
        // Expired but not 24h+ yet - in resolution process
        categories.pending.push(market);
        
        // Sub-categorize pending markets by resolution stage
        const hasProposal = market.proposer && market.proposer !== '0x0000000000000000000000000000000000000000';
        const hasDispute = market.disputer && market.disputer !== '0x0000000000000000000000000000000000000000';
        const proposalMs = market.proposalTimestamp ? Number(market.proposalTimestamp) * 1000 : 0;
        const disputeMs = market.disputeTimestamp ? Number(market.disputeTimestamp) * 1000 : 0;
        const disputeWindowEnd = proposalMs + DISPUTE_WINDOW;
        const votingWindowEnd = disputeMs + VOTING_WINDOW;
        
        if (!hasProposal) {
          // AWAITING: Just expired, no proposal yet
          categories.pendingSub.awaiting.push(market);
        } else if (hasDispute && now < votingWindowEnd) {
          // DISPUTED: Under dispute, in voting window
          categories.pendingSub.disputed.push(market);
        } else if (!hasDispute && now < disputeWindowEnd) {
          // PROPOSED: Has proposal, in dispute window
          categories.pendingSub.proposed.push(market);
        } else {
          // FINALIZING: Windows ended, ready to finalize
          categories.pendingSub.finalizing.push(market);
        }
      } else {
        // Not expired - active for trading
        categories.active.push(market);
      }
    });

    return categories;
  }, [allMarkets]);

  // Get counts for tabs
  const marketCounts = useMemo(() => ({
    all: categorizedMarkets.all.length,
    active: categorizedMarkets.active.length,
    pending: categorizedMarkets.pending.length,
    resolved: categorizedMarkets.resolved.length,
    unresolved: categorizedMarkets.unresolved.length,
  }), [categorizedMarkets]);

  // Get counts for pending sub-filters
  const pendingSubCounts = useMemo(() => ({
    awaiting: categorizedMarkets.pendingSub.awaiting.length,
    proposed: categorizedMarkets.pendingSub.proposed.length,
    disputed: categorizedMarkets.pendingSub.disputed.length,
    finalizing: categorizedMarkets.pendingSub.finalizing.length,
  }), [categorizedMarkets]);

  // Filter markets based on selection (with ID search and heat level)
  const filteredMarkets = useMemo(() => {
    let markets: Market[];
    
    // First, filter by market ID if search is active
    if (marketIdSearch.trim()) {
      const searchId = marketIdSearch.trim().replace('#', '');
      const matches = allMarkets.filter((market) => 
        market.marketId?.toString() === searchId || market.id === searchId
      );
      // If searching by ID, return all matches regardless of status
      if (matches.length > 0) {
        markets = matches;
      } else {
        markets = [];
      }
    } else if (filterBy === 'pending' && pendingSubFilter !== 'all') {
      // For pending tab, apply sub-filter if selected
      markets = categorizedMarkets.pendingSub[pendingSubFilter];
    } else {
      // Return markets for selected category
      markets = categorizedMarkets[filterBy];
    }
    
    // Apply heat level filter if not "all" (-1)
    if (heatLevelFilter !== -1) {
      markets = markets.filter((market) => {
        const marketHeat = Number(market.heatLevel ?? 1); // Default to 1 (STREET FIGHT) if undefined
        return marketHeat === heatLevelFilter;
      });
    }
    
    return markets;
  }, [allMarkets, categorizedMarkets, filterBy, pendingSubFilter, marketIdSearch, heatLevelFilter]);

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

  // Paginated markets for display
  const paginatedMarkets = useMemo(() => {
    return sortedMarkets.slice(0, displayCount);
  }, [sortedMarkets, displayCount]);

  const hasMoreItems = displayCount < sortedMarkets.length;

  // Reset pagination when filter or sort changes
  const handleFilterChange = (newFilter: FilterOption) => {
    setFilterBy(newFilter);
    setDisplayCount(ITEMS_PER_PAGE);
    // Reset pending sub-filter when switching away from pending
    if (newFilter !== 'pending') {
      setPendingSubFilter('all');
    }
  };

  // Reset pagination when pending sub-filter changes
  const handlePendingSubFilterChange = (newSubFilter: PendingSubFilter) => {
    setPendingSubFilter(newSubFilter);
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setDisplayCount(ITEMS_PER_PAGE);
  };

  // Reset pagination when heat level filter changes
  const handleHeatLevelChange = (newHeatLevel: HeatLevelFilter) => {
    setHeatLevelFilter(newHeatLevel);
    setDisplayCount(ITEMS_PER_PAGE);
  };

  // Infinite scroll - load more when sentinel is visible
  const loadMore = useCallback(() => {
    if (hasMoreItems) {
      setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, sortedMarkets.length));
    }
  }, [hasMoreItems, sortedMarkets.length]);

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
          {/* Mobile: Stack in two rows / Desktop: Single row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            
            {/* Row 1 on mobile: ID search + Category tabs */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Market ID Search */}
              <div className="relative flex-shrink-0">
                <input
                  type="text"
                  placeholder="ID #"
                  value={marketIdSearch}
                  onChange={(e) => setMarketIdSearch(e.target.value)}
                  className="w-16 sm:w-20 px-2 py-1.5 bg-dark-900 border border-dark-500 text-white font-mono text-sm placeholder-text-muted focus:outline-none focus:border-cyber hover:border-dark-400 transition-colors"
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
              
              {/* Category tabs - horizontally scrollable on mobile */}
              <div className="flex-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
                <div className="flex items-center gap-1 sm:gap-2 w-max">
                  <FilterTab
                    active={filterBy === 'all'}
                    onClick={() => handleFilterChange('all')}
                    count={marketCounts.all}
                  >
                    ALL
                  </FilterTab>
                  <FilterTab
                    active={filterBy === 'active'}
                    onClick={() => handleFilterChange('active')}
                    count={marketCounts.active}
                    color="yes"
                  >
                    ACTIVE
                  </FilterTab>
                  <FilterTab
                    active={filterBy === 'pending'}
                    onClick={() => handleFilterChange('pending')}
                    count={marketCounts.pending}
                  >
                    PENDING
                  </FilterTab>
                  <FilterTab
                    active={filterBy === 'resolved'}
                    onClick={() => handleFilterChange('resolved')}
                    count={marketCounts.resolved}
                    color="yes"
                  >
                    RESOLVED
                  </FilterTab>
                  {/* Only show UNRESOLVED if there are any */}
                  {marketCounts.unresolved > 0 && (
                    <FilterTab
                      active={filterBy === 'unresolved'}
                      onClick={() => handleFilterChange('unresolved')}
                      count={marketCounts.unresolved}
                      color="no"
                    >
                      UNRESOLVED
                    </FilterTab>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2 on mobile: Sort options + Heat dropdown */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 lg:mx-0 lg:px-0 lg:overflow-visible">
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
                <SortButton
                  active={sortBy === 'newest'}
                  onClick={() => handleSortChange('newest')}
                >
                  NEW
                </SortButton>
                <SortButton
                  active={sortBy === 'ending'}
                  onClick={() => handleSortChange('ending')}
                >
                  ENDING
                </SortButton>
                <SortButton
                  active={sortBy === 'liquidity'}
                  onClick={() => handleSortChange('liquidity')}
                >
                  LIQUID
                </SortButton>
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
                      // Explicit hover colors since Tailwind JIT can't detect dynamic classes
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
          </div>
        </div>
      </section>

      {/* Sub-filters for PENDING tab */}
      {filterBy === 'pending' && marketCounts.pending > 0 && (
        <section className="border-b border-dark-600 py-3 bg-dark-900/50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex items-center gap-2 pl-2 border-l-2 border-cyber/30 w-max min-w-full">
                <span className="text-xs text-text-muted mr-1 flex-shrink-0">STAGE:</span>
                <SubFilterButton
                  active={pendingSubFilter === 'all'}
                  onClick={() => handlePendingSubFilterChange('all')}
                  count={marketCounts.pending}
                >
                  ALL
                </SubFilterButton>
              <SubFilterButton
                active={pendingSubFilter === 'awaiting'}
                onClick={() => handlePendingSubFilterChange('awaiting')}
                count={pendingSubCounts.awaiting}
                color="yellow"
                disabled={pendingSubCounts.awaiting === 0}
              >
                AWAITING
              </SubFilterButton>
              <SubFilterButton
                active={pendingSubFilter === 'proposed'}
                onClick={() => handlePendingSubFilterChange('proposed')}
                count={pendingSubCounts.proposed}
                color="green"
                disabled={pendingSubCounts.proposed === 0}
              >
                PROPOSED
              </SubFilterButton>
              <SubFilterButton
                active={pendingSubFilter === 'disputed'}
                onClick={() => handlePendingSubFilterChange('disputed')}
                count={pendingSubCounts.disputed}
                color="orange"
                disabled={pendingSubCounts.disputed === 0}
              >
                DISPUTED
              </SubFilterButton>
              <SubFilterButton
                active={pendingSubFilter === 'finalizing'}
                onClick={() => handlePendingSubFilterChange('finalizing')}
                count={pendingSubCounts.finalizing}
                color="green"
                disabled={pendingSubCounts.finalizing === 0}
              >
                FINALIZING
              </SubFilterButton>
              </div>
            </div>
          </div>
        </section>
      )}

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
            <EmptyState filterBy={filterBy} onReset={() => handleFilterChange('all')} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedMarkets.map((market) => (
                  <MarketCard 
                    key={market.id} 
                    market={market}
                    isNameHidden={isFieldHidden(market.marketId, 'name')}
                    isImageHidden={isFieldHidden(market.marketId, 'image')}
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
                    Showing {paginatedMarkets.length} of {sortedMarkets.length}
                  </p>
                </div>
              )}

              {/* End of list indicator */}
              {!hasMoreItems && sortedMarkets.length > ITEMS_PER_PAGE && (
                <div className="text-center py-6">
                  <p className="text-xs text-text-muted font-mono">
                    — END OF LIST ({sortedMarkets.length} markets) —
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// Category filter tab
function FilterTab({
  active,
  onClick,
  children,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  color?: 'yes' | 'no' | 'cyber';
}) {
  // Determine colors based on state and color prop
  const getColors = () => {
    if (active) {
      if (color === 'yes') return 'bg-yes/20 text-yes border-yes';
      if (color === 'no') return 'bg-no/20 text-no border-no';
      return 'bg-cyber/20 text-cyber border-cyber';
    }
    // Inactive state
    if (color === 'yes' && count && count > 0) return 'text-yes/70 border-dark-600 hover:border-yes/50';
    if (color === 'no' && count && count > 0) return 'text-no/70 border-dark-600 hover:border-no/50';
    return 'text-text-secondary border-dark-600 hover:border-dark-500';
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors',
        'bg-transparent',
        getColors()
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn(
          'ml-1.5 px-1.5 py-0.5 text-[10px] rounded-sm',
          active 
            ? color === 'yes' ? 'bg-yes/30' 
              : color === 'no' ? 'bg-no/30' 
              : 'bg-cyber/30'
            : 'bg-dark-700'
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
        'px-2 py-1 text-xs font-mono uppercase transition-colors',
        active ? 'text-cyber' : 'text-text-muted hover:text-text-secondary'
      )}
    >
      {children}
    </button>
  );
}

// Sub-filter button for pending stages
function SubFilterButton({
  active,
  onClick,
  children,
  count,
  color,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  color?: 'yellow' | 'cyan' | 'orange' | 'green';
  disabled?: boolean;
}) {
  const getColors = () => {
    // Disabled state: Muted appearance
    if (disabled) {
      return 'text-text-muted/50 cursor-not-allowed';
    }
    // Active state: Always use cyan for consistency
    if (active) {
      return 'bg-cyber/20 text-cyber';
    }
    // Inactive state: Use color-coded hints
    switch (color) {
      case 'yellow': return 'text-warning/70 hover:text-warning hover:bg-dark-600';
      case 'cyan': return 'text-cyber/70 hover:text-cyber hover:bg-dark-600';
      case 'orange': return 'text-orange-400/70 hover:text-orange-400 hover:bg-dark-600';
      case 'green': return 'text-yes/70 hover:text-yes hover:bg-dark-600';
      default: return 'text-text-secondary hover:text-white hover:bg-dark-600';
    }
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'text-xs font-mono px-2 py-1 rounded transition-colors',
        getColors()
      )}
    >
      {children}
      {count !== undefined && (
        <span className="ml-1 opacity-70">({count})</span>
      )}
    </button>
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

function EmptyState({ 
  filterBy, 
  onReset 
}: { 
  filterBy: FilterOption;
  onReset: () => void;
}) {
  const messages: Record<FilterOption, { title: string; desc: string }> = {
    all: { title: 'NO MARKETS YET', desc: 'Be the first to create a prediction market!' },
    active: { title: 'NO ACTIVE MARKETS', desc: 'All markets are either pending resolution or resolved.' },
    pending: { title: 'NO PENDING MARKETS', desc: 'No markets are currently awaiting resolution.' },
    resolved: { title: 'NO RESOLVED MARKETS', desc: 'No markets have been resolved yet.' },
    unresolved: { title: 'NO UNRESOLVED MARKETS', desc: 'No markets are eligible for emergency refund.' },
  };

  const { title, desc } = messages[filterBy];

  return (
    <div className="text-center py-16">
      <p className="text-text-secondary font-mono text-xl">{title}</p>
      <p className="text-sm text-text-muted mt-2">{desc}</p>
      {filterBy !== 'all' && (
        <button 
          onClick={onReset}
          className="text-cyber hover:underline mt-4 text-sm"
        >
          View all markets →
        </button>
      )}
    </div>
  );
}

function calculateTotalVolume(markets: Market[]): string {
  const total = markets.reduce(
    (sum, m) => sum + parseFloat(m.totalVolume || '0'),
    0
  );
  if (total >= 1000) return `${(total / 1000).toFixed(1)}K BNB`;
  return `${total.toFixed(1)} BNB`;
}

export default MarketsPage;

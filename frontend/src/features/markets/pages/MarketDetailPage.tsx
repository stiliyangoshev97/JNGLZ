/**
 * ===== MARKET DETAIL PAGE =====
 *
 * The "War Room" - detailed view of a single market.
 * Features:
 * - Large flickering chance display
 * - TradingView-style chart placeholder
 * - Trade panel with YES/NO buttons
 * - Trade history
 * - Market info & rules
 *
 * Predator Polling v2:
 * - RESOLVED markets: NEVER poll (0 queries)
 * - HOT markets (trade in 5 min): 15s polling
 * - WARM markets (trade in 1 hour): 60s polling
 * - COLD markets (no trades 1h+): 5 min polling
 * - WATCHING (expired): 30s polling
 * - Tab hidden: ALL polling stops
 * - Tab focus: Instant refetch
 * - After trade: 3s delayed refetch + switch to HOT
 *
 * @module features/markets/pages/MarketDetailPage
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { GET_MARKET } from '@/shared/api';
import type { GetMarketResponse } from '@/shared/api';
import { ChanceDisplay, PriceDisplay } from '@/shared/components/ui/ChanceDisplay';
import { SplitHeatBar } from '@/shared/components/ui/HeatBar';
import { Badge, ActiveBadge, ExpiredBadge, DisputedBadge } from '@/shared/components/ui/Badge';
import { HeatLevelBadge, HeatLevelInfo } from '@/shared/components/ui/HeatLevelBadge';
import { Button } from '@/shared/components/ui/Button';
import { LoadingOverlay } from '@/shared/components/ui/Spinner';
import { AddressDisplay } from '@/shared/components/ui/Jazzicon';
import { TradePanel } from '../components';
import { TradeHistory, RealizedPnl } from '../components/TradeHistory';
import { PriceChart } from '../components';
import { ResolutionPanel } from '../components';
import { formatTimeRemaining, calculateYesPercent, calculateNoPercent } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { Market } from '@/shared/schemas';
import { useMarketPollInterval, useTradeRefetch } from '@/shared/hooks/useSmartPolling';
import type { Trade } from '@/shared/schemas';

// Position data interface for holders
interface HolderPosition {
  user: { address: string };
  yesShares: string;
  noShares: string;
  totalInvested: string;
}

export function MarketDetailPage() {
  const { marketId } = useParams<{ marketId: string }>();
  const [retryCount, setRetryCount] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const maxRetries = 10; // Will retry for up to 30 seconds (10 * 3s)

  // Initial query without polling to get market data first
  const { data, loading, error, refetch } = useQuery<GetMarketResponse>(GET_MARKET, {
    variables: { id: marketId },
    skip: !marketId,
    notifyOnNetworkStatusChange: false, // Prevent re-renders during poll refetches
    fetchPolicy: 'cache-and-network', // Return cached data while fetching fresh
    errorPolicy: 'all', // Return partial data even on errors
  });

  // Track if market loaded successfully at least once
  useEffect(() => {
    if (data?.market && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [data?.market, hasLoadedOnce]);

  // Get last trade timestamp from market data
  const lastTradeTimestamp = useMemo(() => {
    const trades = data?.market?.trades;
    if (!trades || trades.length === 0) return null;
    // Find the most recent trade
    return Math.max(...trades.map(t => Number(t.timestamp)));
  }, [data?.market?.trades]);

  // Predator Polling v2: Market-state aware polling
  const { pollInterval, triggerHotMode } = useMarketPollInterval(
    data?.market,
    lastTradeTimestamp,
    refetch
  );

  // Apply polling interval to query
  useEffect(() => {
    // Apollo doesn't have a direct way to change pollInterval dynamically,
    // so we use startPolling/stopPolling
    if (pollInterval > 0) {
      // @ts-ignore - startPolling exists on ObservableQuery
      refetch(); // Initial fetch
    }
  }, [marketId]);

  // Setup dynamic polling based on temperature
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    
    if (pollInterval > 0 && data?.market) {
      intervalId = setInterval(() => {
        refetch();
      }, pollInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollInterval, refetch, data?.market]);

  // Trade refetch: Wait 3s after trade for subgraph to index
  const { triggerTradeRefetch } = useTradeRefetch(refetch);

  // Function to trigger after a successful trade
  const refreshMarket = () => {
    // Trigger delayed refetch for subgraph
    triggerTradeRefetch();
    // Switch to HOT polling mode for 2 minutes
    triggerHotMode();
  };

  // Only show loading on initial load, not on polls/refetches
  const isInitialLoading = loading && !data?.market;

  // Retry fetching if market not found and we came from create page
  // Also auto-retry on transient errors if market was previously loaded
  useEffect(() => {
    const shouldRetry = !loading && !data?.market && retryCount < maxRetries;
    const shouldAutoRetryOnError = error && hasLoadedOnce && !data?.market;
    
    if (shouldRetry || shouldAutoRetryOnError) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        refetch();
      }, 3000); // Retry every 3 seconds
      return () => clearTimeout(timer);
    }
  }, [loading, data?.market, retryCount, refetch, error, hasLoadedOnce]);

  // Keep polling even after errors to recover from transient issues
  useEffect(() => {
    // If we had data before but lost it, keep trying to recover
    if (hasLoadedOnce && !data?.market && !loading) {
      const recoveryInterval = setInterval(() => {
        refetch();
      }, 10000); // Try every 10 seconds
      return () => clearInterval(recoveryInterval);
    }
  }, [hasLoadedOnce, data?.market, loading, refetch]);

  // Still loading or retrying - only on INITIAL load, not polls
  if (isInitialLoading || (!data?.market && retryCount < maxRetries && retryCount > 0)) {
    return (
      <LoadingOverlay 
        message={retryCount > 0 ? "SYNCING FROM BLOCKCHAIN" : "LOADING MARKET"} 
        subMessage={retryCount > 0 ? `Waiting for subgraph... (${retryCount}/${maxRetries})` : undefined}
      />
    );
  }

  // Show reconnecting state if we had data before but lost it
  if (hasLoadedOnce && !data?.market) {
    return (
      <LoadingOverlay 
        message="RECONNECTING" 
        subMessage="Lost connection to subgraph, retrying..."
      />
    );
  }

  if (error || !data?.market) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 border-2 border-dark-500 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-text-muted">?</span>
          </div>
          <p className="text-xl font-bold text-white mb-2">MARKET NOT FOUND</p>
          <p className="text-text-secondary text-sm mb-6">
            {error?.message || 'This market does not exist or failed to load.'}
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              variant="ghost" 
              onClick={() => {
                setRetryCount(0);
                refetch();
              }}
            >
              TRY AGAIN
            </Button>
            <Link to="/">
              <Button variant="cyber" className="w-full">BACK TO JUNGLE</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const market = data.market;
  const trades = data.market.trades || [];
  const positions = data.market.positions || [];

  // Calculate prices using bonding curve formula (with market's virtual liquidity)
  const yesPercent = calculateYesPercent(market.yesShares, market.noShares, market.virtualLiquidity);
  const noPercent = calculateNoPercent(market.yesShares, market.noShares, market.virtualLiquidity);

  // Time calculations
  const expirationTimestamp = Number(market.expiryTimestamp); // Unix timestamp in seconds
  const isExpired = expirationTimestamp * 1000 < Date.now();
  const timeRemaining = formatTimeRemaining(expirationTimestamp);

  // Status
  const isActive = market.status === 'Active' && !isExpired;
  const isResolved = market.resolved;
  const isDisputed = market.status === 'Disputed';

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-dark-600 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <Link 
            to="/" 
            className="text-sm font-mono text-text-secondary hover:text-cyber transition-colors"
          >
            ← BACK TO JUNGLE
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="border-b border-dark-600 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Market Image - Full width if exists */}
          {market.imageUrl && (
            <div className="group relative -mx-4 mb-6 h-48 md:h-64 overflow-hidden">
              <img
                src={market.imageUrl}
                alt=""
                className="w-full h-full object-cover market-image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Question & Info */}
            <div className="lg:col-span-2">
              {/* Status badges */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <HeatLevelBadge heatLevel={market.heatLevel} size="md" />
                {isActive && <ActiveBadge />}
                {isExpired && !isResolved && <ExpiredBadge />}
                {isResolved && <Badge variant="yes">✓ RESOLVED</Badge>}
                {isDisputed && <DisputedBadge />}
              </div>

              {/* Question */}
              <h1 className="text-2xl md:text-4xl font-black text-white mb-4">
                {market.question}
              </h1>

              {/* Creator & Time */}
              <div className="flex flex-wrap items-center gap-4 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">ID</span>
                  <span className="text-cyber font-bold">#{market.marketId}</span>
                </div>
                <div className="h-4 w-px bg-dark-600" />
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">CREATED BY</span>
                  <AddressDisplay address={market.creatorAddress} iconSize={20} />
                </div>
                <div className="h-4 w-px bg-dark-600" />
                <div>
                  <span className="text-text-muted">ENDS </span>
                  <span className={cn(isExpired ? 'text-no' : 'text-white')}>
                    {isExpired ? 'EXPIRED' : timeRemaining}
                  </span>
                </div>
              </div>

              {/* Market Info - Inline below header */}
              <div className="mt-4 pt-4 border-t border-dark-700">
                <MarketInfoCompact market={market} />
              </div>
            </div>

            {/* Right: Big Chance Display */}
            <div className="flex flex-col items-center justify-center p-6 border border-dark-600 bg-dark-900">
              <ChanceDisplay
                value={yesPercent}
                size="hero"
                label="CHANCE"
                animate={isActive}
              />
              <SplitHeatBar
                yesPercent={yesPercent}
                noPercent={noPercent}
                className="w-full mt-4"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trade Panel - Shows first on mobile, right column on desktop */}
            <div className="lg:col-span-1 lg:order-2">
              <div className="sticky top-24 space-y-4">
                <TradePanel
                  market={market}
                  yesPercent={yesPercent}
                  noPercent={noPercent}
                  isActive={isActive}
                  onTradeSuccess={refreshMarket}
                />
                <ResolutionPanel market={market} onActionSuccess={refreshMarket} />
                
                {/* Heat Level Info - Hidden on mobile, visible on desktop */}
                <div className="hidden lg:block border border-dark-600 bg-dark-900">
                  <div className="border-b border-dark-600 px-4 py-3">
                    <h3 className="font-bold uppercase">MARKET TIER</h3>
                  </div>
                  <div className="p-4">
                    <HeatLevelInfo heatLevel={market.heatLevel} />
                  </div>
                </div>
              </div>
            </div>

            {/* Left Column: Chart & History - Shows second on mobile */}
            <div className="lg:col-span-2 lg:order-1 space-y-6">
              {/* Price Chart */}
              <div className="border border-dark-600 bg-dark-900">
                <div className="border-b border-dark-600 px-4 py-3 flex items-center justify-between">
                  <h2 className="font-bold uppercase">PRICE CHART</h2>
                  <PriceDisplay
                    yesPrice={yesPercent / 100}
                    noPrice={noPercent / 100}
                    size="sm"
                  />
                </div>
                <div className="p-4">
                  {/* Predator v2: Pass trades from parent to prevent duplicate queries */}
                  <PriceChart 
                    marketId={market.id} 
                    trades={trades}
                    currentYesShares={market.yesShares}
                    currentNoShares={market.noShares}
                    virtualLiquidity={market.virtualLiquidity}
                  />
                </div>
              </div>

              {/* Trade History & Holders Tabs */}
              <div className="border border-dark-600 bg-dark-900">
                <TradesAndHoldersTabs
                  trades={trades}
                  positions={positions}
                />
              </div>
              
              {/* Heat Level Info - Mobile only, at bottom */}
              <div className="lg:hidden border border-dark-600 bg-dark-900">
                <div className="border-b border-dark-600 px-4 py-3">
                  <h3 className="font-bold uppercase">MARKET TIER</h3>
                </div>
                <div className="p-4">
                  <HeatLevelInfo heatLevel={market.heatLevel} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Compact market info displayed inline in the header area
 */
function MarketInfoCompact({ market }: { market: Market }) {
  // totalVolume is BigDecimal (already in BNB), poolBalance is BigInt (wei)
  const volumeBNB = parseFloat(market.totalVolume || '0').toFixed(4);
  const poolBalanceWei = BigInt(market.poolBalance || '0');
  const poolBalanceBNB = (Number(poolBalanceWei) / 1e18).toFixed(4);

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div>
          <span className="text-text-muted font-mono">VOLUME: </span>
          <span className="font-mono font-bold text-white">{volumeBNB} BNB</span>
        </div>
        <div>
          <span className="text-text-muted font-mono">POOL: </span>
          <span className="font-mono font-bold text-white">{poolBalanceBNB} BNB</span>
        </div>
        <div>
          <span className="text-text-muted font-mono">TRADES: </span>
          <span className="font-mono font-bold text-white">{market.totalTrades}</span>
        </div>
      </div>

      {/* Evidence & Rules */}
      {(market.evidenceLink || market.resolutionRules) && (
        <div className="space-y-2 text-xs">
          {market.evidenceLink && (
            <div>
              <span className="text-text-muted font-mono">SOURCE: </span>
              <a
                href={market.evidenceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyber hover:underline font-mono"
              >
                {market.evidenceLink.length > 60 
                  ? market.evidenceLink.slice(0, 60) + '...' 
                  : market.evidenceLink}
              </a>
            </div>
          )}
          {market.resolutionRules && (
            <div>
              <span className="text-text-muted font-mono">RULES: </span>
              <span className="text-text-secondary">
                {market.resolutionRules.length > 150 
                  ? market.resolutionRules.slice(0, 150) + '...' 
                  : market.resolutionRules}
              </span>
            </div>
          )}
          {/* Street Consensus Disclaimer */}
          <p className="text-yellow-500/80 mt-2 pt-2 border-t border-dark-700">
            Note: These rules are guidelines for proposers and voters. Final outcome is determined by Street Consensus (proposal → dispute → vote). The market may resolve differently if disputed.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Tabbed interface for Trades, Realized P/L, and Holders
 */
function TradesAndHoldersTabs({ 
  trades, 
  positions, 
}: { 
  trades: Trade[]; 
  positions: HolderPosition[];
}) {
  const [activeTab, setActiveTab] = useState<'trades' | 'realized' | 'holders'>('trades');

  return (
    <>
      {/* Tab Headers */}
      <div className="border-b border-dark-600 flex">
        <button
          onClick={() => setActiveTab('trades')}
          className={cn(
            "px-4 py-3 text-sm font-bold uppercase transition-colors",
            activeTab === 'trades'
              ? "text-cyber border-b-2 border-cyber bg-cyber/5"
              : "text-text-secondary hover:text-white"
          )}
        >
          TRADES
        </button>
        <button
          onClick={() => setActiveTab('realized')}
          className={cn(
            "px-4 py-3 text-sm font-bold uppercase transition-colors",
            activeTab === 'realized'
              ? "text-cyber border-b-2 border-cyber bg-cyber/5"
              : "text-text-secondary hover:text-white"
          )}
        >
          REALIZED P/L
        </button>
        <button
          onClick={() => setActiveTab('holders')}
          className={cn(
            "px-4 py-3 text-sm font-bold uppercase transition-colors",
            activeTab === 'holders'
              ? "text-cyber border-b-2 border-cyber bg-cyber/5"
              : "text-text-secondary hover:text-white"
          )}
        >
          HOLDERS
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'trades' ? (
        <TradeHistory trades={trades} />
      ) : activeTab === 'realized' ? (
        <RealizedPnl trades={trades} />
      ) : (
        <HoldersTable positions={positions} />
      )}
    </>
  );
}

/**
 * Holders table showing shareholders sorted by total shares
 */
function HoldersTable({ positions }: { positions: HolderPosition[] }) {
  // Process and sort holders by total shares
  const sortedHolders = useMemo(() => {
    return positions
      .map(pos => {
        const yesShares = Number(BigInt(pos.yesShares || '0')) / 1e18;
        const noShares = Number(BigInt(pos.noShares || '0')) / 1e18;
        const totalShares = yesShares + noShares;
        return {
          address: pos.user.address,
          yesShares,
          noShares,
          totalShares,
        };
      })
      .filter(h => h.totalShares > 0)
      .sort((a, b) => b.totalShares - a.totalShares);
  }, [positions]);

  // Get status badge based on shares
  const getStatusBadge = (totalShares: number) => {
    if (totalShares > 1000) {
      return { label: 'APEX', color: 'text-yellow-400' };
    } else if (totalShares >= 500) {
      return { label: 'PREDATOR', color: 'text-purple-400' };
    }
    return { label: 'MONKE', color: 'text-text-muted' };
  };

  if (sortedHolders.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-muted font-mono">NO HOLDERS</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-dark-700">
      {/* Header */}
      <div className="px-4 py-2 bg-dark-800 flex items-center gap-3 text-xs font-mono text-text-muted">
        <div className="w-8 text-center">#</div>
        <div className="flex-1">HOLDER</div>
        <div className="w-24 text-right">SHARES</div>
        <div className="w-20 text-center">SIDE</div>
        <div className="w-24 text-right">STATUS</div>
      </div>
      
      {/* Rows */}
      {sortedHolders.map((holder, index) => {
        const status = getStatusBadge(holder.totalShares);
        const hasYes = holder.yesShares > 0;
        const hasNo = holder.noShares > 0;
        
        return (
          <div key={holder.address} className="px-4 py-3 flex items-center gap-3 hover:bg-dark-800/50">
            {/* Rank */}
            <div className="w-8 text-center font-mono text-text-muted">
              {index + 1}
            </div>
            
            {/* Address */}
            <div className="flex-1 min-w-0">
              <AddressDisplay address={holder.address} iconSize={20} truncateLength={4} />
            </div>
            
            {/* Total Shares */}
            <div className="w-24 text-right font-mono text-white">
              {holder.totalShares.toFixed(2)}
            </div>
            
            {/* Side */}
            <div className="w-20 text-center flex justify-center gap-1">
              {hasYes && hasNo ? (
                <>
                  <span className="text-yes text-xs px-1 bg-yes/20 rounded">Y:{holder.yesShares.toFixed(0)}</span>
                  <span className="text-no text-xs px-1 bg-no/20 rounded">N:{holder.noShares.toFixed(0)}</span>
                </>
              ) : hasYes ? (
                <span className="text-yes text-xs font-bold">YES</span>
              ) : (
                <span className="text-no text-xs font-bold">NO</span>
              )}
            </div>
            
            {/* Status Badge */}
            <div className={cn("w-24 text-right text-xs font-bold", status.color)}>
              {status.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MarketDetailPage;

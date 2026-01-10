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
 * Smart Polling (v3.4.1):
 * - Stops polling when tab is inactive (saves 70%+ API quota)
 * - Uses 15s intervals instead of 5s
 * - Instant refresh after trades via manual refetch
 *
 * @module features/markets/pages/MarketDetailPage
 */

import { useState, useEffect } from 'react';
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
import { TradeHistory } from '../components';
import { PriceChart } from '../components';
import { ResolutionPanel } from '../components';
import { formatTimeRemaining, calculateYesPercent, calculateNoPercent } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { Market } from '@/shared/schemas';
import { useSmartPollInterval, POLL_INTERVALS } from '@/shared/hooks/useSmartPolling';

export function MarketDetailPage() {
  const { marketId } = useParams<{ marketId: string }>();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10; // Will retry for up to 30 seconds (10 * 3s)

  // Smart polling: stops when tab is inactive, uses 15s interval (was 5s)
  const pollInterval = useSmartPollInterval(POLL_INTERVALS.MARKET_DETAIL);

  const { data, loading, error, refetch } = useQuery<GetMarketResponse>(GET_MARKET, {
    variables: { id: marketId },
    pollInterval, // Dynamic: 15s when visible, 0 when hidden
    skip: !marketId,
    notifyOnNetworkStatusChange: false, // Prevent re-renders during poll refetches
  });

  // Only show loading on initial load, not on polls/refetches
  // networkStatus 1 = loading, 2 = setVariables, 3 = fetchMore, 4 = refetch, 6 = poll, 7 = ready, 8 = error
  const isInitialLoading = loading && !data?.market;

  // Function to trigger immediate refetch (called after trades)
  const refreshMarket = () => {
    refetch();
  };

  // Retry fetching if market not found and we came from create page
  useEffect(() => {
    if (!loading && !data?.market && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        refetch();
      }, 3000); // Retry every 3 seconds
      return () => clearTimeout(timer);
    }
  }, [loading, data?.market, retryCount, refetch]);

  // Still loading or retrying - only on INITIAL load, not polls
  if (isInitialLoading || (!data?.market && retryCount < maxRetries && retryCount > 0)) {
    return (
      <LoadingOverlay 
        message={retryCount > 0 ? "SYNCING FROM BLOCKCHAIN" : "LOADING MARKET"} 
        subMessage={retryCount > 0 ? `Waiting for subgraph... (${retryCount}/${maxRetries})` : undefined}
      />
    );
  }

  if (error || !data?.market) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">💀</p>
          <p className="text-xl font-bold text-white mb-2">MARKET NOT FOUND</p>
          <p className="text-text-secondary font-mono mb-6">
            {error?.message || 'This market does not exist or is still being indexed'}
          </p>
          <Link to="/">
            <Button variant="cyber">BACK TO JUNGLE</Button>
          </Link>
        </div>
      </div>
    );
  }

  const market = data.market;
  const trades = data.market.trades || [];
  const positions = data.market.positions || [];

  // Calculate prices using bonding curve formula (with virtual liquidity)
  const yesPercent = calculateYesPercent(market.yesShares, market.noShares);
  const noPercent = calculateNoPercent(market.yesShares, market.noShares);

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
                <ResolutionPanel market={market} />
                
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
                  <PriceChart marketId={market.id} />
                </div>
              </div>

              {/* Trade History */}
              <div className="border border-dark-600 bg-dark-900">
                <div className="border-b border-dark-600 px-4 py-3">
                  <h2 className="font-bold uppercase">RECENT TRADES</h2>
                </div>
                <TradeHistory 
                  trades={trades} 
                  positions={positions}
                  currentYesPercent={yesPercent}
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
        </div>
      )}
    </div>
  );
}

export default MarketDetailPage;

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
 * @module features/markets/pages/MarketDetailPage
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { GET_MARKET } from '@/shared/api';
import type { GetMarketResponse } from '@/shared/api';
import { ChanceDisplay, PriceDisplay } from '@/shared/components/ui/ChanceDisplay';
import { SplitHeatBar } from '@/shared/components/ui/HeatBar';
import { Badge, ActiveBadge, ExpiredBadge, DisputedBadge } from '@/shared/components/ui/Badge';
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

export function MarketDetailPage() {
  const { marketId } = useParams<{ marketId: string }>();

  const { data, loading, error } = useQuery<GetMarketResponse>(GET_MARKET, {
    variables: { id: marketId },
    pollInterval: 30000, // Refresh every 30 seconds
    skip: !marketId,
  });

  if (loading) {
    return <LoadingOverlay message="LOADING MARKET" />;
  }

  if (error || !data?.market) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">💀</p>
          <p className="text-xl font-bold text-white mb-2">MARKET NOT FOUND</p>
          <p className="text-text-secondary font-mono mb-6">
            {error?.message || 'This market does not exist'}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Question & Info */}
            <div className="lg:col-span-2">
              {/* Status badges */}
              <div className="flex items-center gap-2 mb-4">
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
            </div>

            {/* Right: Big Chance Display */}
            <div className="flex flex-col items-center justify-center p-6 border border-dark-600 bg-dark-900">
              <ChanceDisplay
                value={yesPercent}
                size="hero"
                label="YES CHANCE"
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
            {/* Left Column: Chart & History */}
            <div className="lg:col-span-2 space-y-6">
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
                <TradeHistory trades={trades} />
              </div>

              {/* Market Info */}
              <MarketInfo market={market} />
            </div>

            {/* Right Column: Trade Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <TradePanel
                  market={market}
                  yesPercent={yesPercent}
                  noPercent={noPercent}
                  isActive={isActive}
                />
                <ResolutionPanel market={market} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MarketInfo({ market }: { market: Market }) {
  // totalVolume and poolBalance from subgraph are BigDecimal (already in BNB)
  const volumeBNB = parseFloat(market.totalVolume || '0').toFixed(4);
  const poolBalanceBNB = parseFloat(market.poolBalance || '0').toFixed(4);

  return (
    <div className="border border-dark-600 bg-dark-900">
      <div className="border-b border-dark-600 px-4 py-3">
        <h2 className="font-bold uppercase">MARKET INFO</h2>
      </div>
      <div className="p-4 space-y-4">
        {/* Market Image */}
        {market.imageUrl && (
          <div className="relative -mx-4 -mt-4 mb-4 overflow-hidden border-b border-dark-600">
            <img
              src={market.imageUrl}
              alt=""
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted font-mono uppercase">Total Volume</p>
            <p className="text-xl font-bold font-mono text-white">{volumeBNB} BNB</p>
          </div>
          <div>
            <p className="text-xs text-text-muted font-mono uppercase">Pool Balance</p>
            <p className="text-xl font-bold font-mono text-white">{poolBalanceBNB} BNB</p>
          </div>
        </div>

        {/* Evidence Link */}
        {market.evidenceLink && (
          <div>
            <p className="text-xs text-text-muted font-mono uppercase mb-1">Evidence</p>
            <a
              href={market.evidenceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber hover:underline font-mono text-sm break-all"
            >
              {market.evidenceLink}
            </a>
          </div>
        )}

        {/* Resolution Rules */}
        {market.resolutionRules && (
          <div>
            <p className="text-xs text-text-muted font-mono uppercase mb-1">Resolution Rules</p>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {market.resolutionRules}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MarketDetailPage;

/**
 * ===== TRADE HISTORY COMPONENT =====
 *
 * Shows recent trades for a market with PNL indicators.
 * Desktop: Hover tooltip with detailed trade info
 * Mobile: Tap to expand trade details inline
 *
 * @module features/markets/components/TradeHistory
 */

import { useState, useMemo } from 'react';
import { AddressDisplay } from '@/shared/components/ui/Jazzicon';
import { formatBNB } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { Trade } from '@/shared/schemas';

// Position data from market query
interface TraderPosition {
  user: { address: string };
  yesShares: string;
  noShares: string;
  totalInvested: string;
  averageYesPrice?: string;
  averageNoPrice?: string;
}

interface TradeHistoryProps {
  trades: Trade[];
  positions?: TraderPosition[];
  currentYesPercent: number;
  maxItems?: number;
}

export function TradeHistory({ 
  trades, 
  positions = [], 
  currentYesPercent,
  maxItems = 20 
}: TradeHistoryProps) {
  const displayTrades = trades.slice(0, maxItems);

  // Create a map of trader address -> position for quick lookup
  const positionMap = useMemo(() => {
    const map = new Map<string, TraderPosition>();
    positions.forEach(pos => {
      if (pos.user?.address) {
        map.set(pos.user.address.toLowerCase(), pos);
      }
    });
    return map;
  }, [positions]);

  if (displayTrades.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-muted font-mono">NO TRADES YET</p>
        <p className="text-text-muted text-xs mt-1">Be the first to trade!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-dark-700">
      {displayTrades.map((trade) => (
        <TradeRow 
          key={trade.id} 
          trade={trade} 
          position={positionMap.get(trade.traderAddress?.toLowerCase() || '')}
          currentYesPercent={currentYesPercent}
        />
      ))}
    </div>
  );
}

interface TradeRowProps {
  trade: Trade;
  position?: TraderPosition;
  currentYesPercent: number;
}

function TradeRow({ trade, position, currentYesPercent }: TradeRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const isBuy = trade.isBuy;
  const isYes = trade.isYes;
  const amount = formatBNB(trade.bnbAmount);
  
  // Shares from subgraph is BigInt as string
  const sharesWei = BigInt(trade.shares || '0');
  const sharesNum = Number(sharesWei) / 1e18;
  const sharesFormatted = sharesNum.toFixed(2);
  
  // Price per share in cents (100¢ = 0.01 BNB = full share)
  const pricePerShareBNB = parseFloat(trade.pricePerShare || '0');
  const tradePriceCents = Math.round(pricePerShareBNB * 10000); // 0.01 BNB = 100¢
  
  // Current price in cents
  const currentPriceCents = isYes 
    ? Math.round(currentYesPercent) 
    : Math.round(100 - currentYesPercent);
  
  // Calculate PNL data
  const pnlData = useMemo(() => {
    // For SELL trades, we can calculate realized PNL
    if (!isBuy) {
      // Compare sell price to average entry price
      const avgEntryPrice = isYes 
        ? parseFloat(position?.averageYesPrice || '0')
        : parseFloat(position?.averageNoPrice || '0');
      
      const avgEntryCents = Math.round(avgEntryPrice * 10000);
      
      if (avgEntryCents > 0) {
        const pnlPerShare = (tradePriceCents - avgEntryCents) / 100; // in cents
        const totalPnlBNB = (pnlPerShare * sharesNum) / 10000; // convert to BNB
        const pnlPercent = ((tradePriceCents - avgEntryCents) / avgEntryCents) * 100;
        
        return {
          type: 'realized' as const,
          avgEntryCents,
          pnlBNB: totalPnlBNB,
          pnlPercent,
          isProfit: tradePriceCents >= avgEntryCents,
        };
      }
    }
    
    // For BUY trades or if no avg entry, show unrealized vs current price
    const pnlVsCurrent = currentPriceCents - tradePriceCents;
    const pnlPercentVsCurrent = tradePriceCents > 0 
      ? (pnlVsCurrent / tradePriceCents) * 100 
      : 0;
    
    return {
      type: 'unrealized' as const,
      pnlVsCurrent,
      pnlPercentVsCurrent,
      isProfit: pnlVsCurrent >= 0,
    };
  }, [isBuy, isYes, position, tradePriceCents, currentPriceCents, sharesNum]);
  
  // Remaining position after this trade
  const remainingShares = useMemo(() => {
    if (!position) return null;
    const yesShares = Number(BigInt(position.yesShares || '0')) / 1e18;
    const noShares = Number(BigInt(position.noShares || '0')) / 1e18;
    return { yesShares, noShares };
  }, [position]);
  
  // Format timestamp
  const timestamp = new Date(Number(trade.timestamp) * 1000);
  const timeAgo = getTimeAgo(timestamp);

  // PNL indicator badge (always visible)
  const PnlBadge = () => {
    if (!isBuy && pnlData.type === 'realized' && pnlData.avgEntryCents) {
      // SELL with known entry - show realized PNL
      return (
        <span className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded',
          pnlData.isProfit ? 'bg-yes/20 text-yes' : 'bg-no/20 text-no'
        )}>
          {pnlData.isProfit ? '▲' : '▼'} {Math.abs(pnlData.pnlPercent || 0).toFixed(0)}%
        </span>
      );
    }
    
    // Show vs current price
    const diff = isBuy 
      ? currentPriceCents - tradePriceCents  // BUY: profit if price went up
      : tradePriceCents - currentPriceCents; // SELL: good timing if sold above current
    
    if (Math.abs(diff) < 1) return null; // No significant difference
    
    return (
      <span className={cn(
        'text-[10px] font-bold px-1.5 py-0.5 rounded',
        diff >= 0 ? 'bg-yes/20 text-yes' : 'bg-no/20 text-no'
      )}>
        {diff >= 0 ? '▲' : '▼'} {Math.abs(diff)}¢
      </span>
    );
  };

  return (
    <div className="relative">
      {/* Main Trade Row - Clickable on mobile, hoverable on desktop */}
      <div 
        className={cn(
          'px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer',
          'hover:bg-dark-800/50 active:bg-dark-800/70',
          isExpanded && 'bg-dark-800/50'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Trade type indicator */}
        <div
          className={cn(
            'w-16 sm:w-20 text-center py-2 text-xs font-bold uppercase flex-shrink-0',
            isYes ? 'bg-yes/20 text-yes' : 'bg-no/20 text-no'
          )}
        >
          {isBuy ? 'BUY' : 'SELL'} {isYes ? 'YES' : 'NO'}
        </div>

        {/* Amount - simplified on mobile */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-mono text-white text-sm">{amount}</span>
            <span className="text-text-muted text-xs">BNB</span>
            <span className="text-text-muted text-xs">→</span>
            <span className="font-mono text-white text-sm">{sharesFormatted}</span>
            <span className="text-text-muted text-xs hidden sm:inline">shares</span>
          </div>
        </div>

        {/* PNL Badge */}
        <div className="flex-shrink-0">
          <PnlBadge />
        </div>

        {/* Trader - hidden on small screens */}
        <div className="hidden md:block flex-shrink-0">
          <AddressDisplay address={trade.traderAddress} iconSize={16} truncateLength={3} />
        </div>

        {/* Time */}
        <div className="text-xs text-text-muted font-mono w-14 sm:w-20 text-right flex-shrink-0">
          {timeAgo}
        </div>

        {/* Expand indicator on mobile */}
        <div className="sm:hidden text-text-muted text-xs">
          {isExpanded ? '▲' : '▼'}
        </div>
      </div>

      {/* Desktop Tooltip */}
      {showTooltip && !isExpanded && (
        <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50">
          <TradeTooltip 
            trade={trade}
            position={position}
            pnlData={pnlData}
            tradePriceCents={tradePriceCents}
            currentPriceCents={currentPriceCents}
            sharesNum={sharesNum}
            remainingShares={remainingShares}
            isBuy={isBuy}
            isYes={isYes}
          />
        </div>
      )}

      {/* Mobile Expanded Details */}
      {isExpanded && (
        <div className="sm:hidden px-4 pb-4 bg-dark-800/30 border-t border-dark-700">
          <TradeDetails 
            trade={trade}
            position={position}
            pnlData={pnlData}
            tradePriceCents={tradePriceCents}
            currentPriceCents={currentPriceCents}
            sharesNum={sharesNum}
            remainingShares={remainingShares}
            isBuy={isBuy}
            isYes={isYes}
          />
        </div>
      )}
    </div>
  );
}

// Shared tooltip/details content
interface TradeInfoProps {
  trade: Trade;
  position?: TraderPosition;
  pnlData: {
    type: 'realized' | 'unrealized';
    avgEntryCents?: number;
    pnlBNB?: number;
    pnlPercent?: number;
    pnlVsCurrent?: number;
    pnlPercentVsCurrent?: number;
    isProfit: boolean;
  };
  tradePriceCents: number;
  currentPriceCents: number;
  sharesNum: number;
  remainingShares: { yesShares: number; noShares: number } | null;
  isBuy: boolean;
  isYes: boolean;
}

function TradeTooltip(props: TradeInfoProps) {
  return (
    <div className="bg-dark-900 border border-dark-600 shadow-xl p-3 min-w-[280px] max-w-[320px]">
      <TradeDetailsContent {...props} />
    </div>
  );
}

function TradeDetails(props: TradeInfoProps) {
  return (
    <div className="pt-3">
      <TradeDetailsContent {...props} />
    </div>
  );
}

function TradeDetailsContent({ 
  trade,
  pnlData,
  tradePriceCents,
  currentPriceCents,
  sharesNum,
  remainingShares,
  isBuy,
  isYes,
}: TradeInfoProps) {
  const bnbAmount = parseFloat(trade.bnbAmount || '0');
  const side = isYes ? 'YES' : 'NO';
  
  return (
    <div className="space-y-2 text-xs font-mono">
      {/* Header */}
      <div className={cn(
        'font-bold text-sm flex items-center gap-2',
        isYes ? 'text-yes' : 'text-no'
      )}>
        {isBuy ? '🟢 BUY' : '🔴 SELL'} {side}
      </div>
      
      <div className="border-t border-dark-600 pt-2 space-y-1.5">
        {/* Trade details */}
        <div className="flex justify-between">
          <span className="text-text-muted">{isBuy ? 'Bought' : 'Sold'}:</span>
          <span className="text-white">{sharesNum.toFixed(2)} shares @ {tradePriceCents}¢</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-text-muted">Total:</span>
          <span className="text-white">{bnbAmount.toFixed(4)} BNB</span>
        </div>

        <div className="flex justify-between">
          <span className="text-text-muted">Current {side}:</span>
          <span className="text-white">{currentPriceCents}¢</span>
        </div>
        
        {/* Price comparison */}
        {!isBuy && (
          <div className={cn(
            'flex justify-between',
            tradePriceCents >= currentPriceCents ? 'text-yes' : 'text-no'
          )}>
            <span className="text-text-muted">vs Current:</span>
            <span>
              {tradePriceCents >= currentPriceCents ? '✓ Sold ' : '✗ Sold '}
              {Math.abs(tradePriceCents - currentPriceCents)}¢ 
              {tradePriceCents >= currentPriceCents ? ' above' : ' below'}
            </span>
          </div>
        )}
      </div>

      {/* PNL Section */}
      {pnlData.type === 'realized' && pnlData.avgEntryCents && pnlData.avgEntryCents > 0 && (
        <div className="border-t border-dark-600 pt-2 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-text-muted">Avg Entry:</span>
            <span className="text-white">{pnlData.avgEntryCents}¢</span>
          </div>
          
          <div className={cn(
            'flex justify-between font-bold',
            pnlData.isProfit ? 'text-yes' : 'text-no'
          )}>
            <span>Realized P/L:</span>
            <span>
              {pnlData.isProfit ? '+' : ''}{pnlData.pnlBNB?.toFixed(4)} BNB
              <span className="ml-1 opacity-70">
                ({pnlData.isProfit ? '+' : ''}{pnlData.pnlPercent?.toFixed(1)}%)
              </span>
            </span>
          </div>
        </div>
      )}
      
      {/* Unrealized for BUY trades */}
      {isBuy && pnlData.type === 'unrealized' && (
        <div className="border-t border-dark-600 pt-2">
          <div className={cn(
            'flex justify-between',
            pnlData.isProfit ? 'text-yes' : 'text-no'
          )}>
            <span className="text-text-muted">Unrealized:</span>
            <span>
              {pnlData.pnlVsCurrent && pnlData.pnlVsCurrent >= 0 ? '+' : ''}
              {pnlData.pnlVsCurrent}¢/share
              <span className="ml-1 opacity-70">
                ({pnlData.pnlPercentVsCurrent && pnlData.pnlPercentVsCurrent >= 0 ? '+' : ''}
                {pnlData.pnlPercentVsCurrent?.toFixed(1)}%)
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Remaining Position */}
      {remainingShares && (remainingShares.yesShares > 0 || remainingShares.noShares > 0) && (
        <div className="border-t border-dark-600 pt-2">
          <div className="flex justify-between">
            <span className="text-text-muted">Position:</span>
            <span className="text-white">
              {remainingShares.yesShares > 0 && (
                <span className="text-yes">{remainingShares.yesShares.toFixed(2)} YES</span>
              )}
              {remainingShares.yesShares > 0 && remainingShares.noShares > 0 && ' / '}
              {remainingShares.noShares > 0 && (
                <span className="text-no">{remainingShares.noShares.toFixed(2)} NO</span>
              )}
            </span>
          </div>
        </div>
      )}
      
      {/* No position = fully exited */}
      {remainingShares && remainingShares.yesShares === 0 && remainingShares.noShares === 0 && !isBuy && (
        <div className="border-t border-dark-600 pt-2">
          <div className="text-text-muted text-center">
            ✓ Fully exited position
          </div>
        </div>
      )}

      {/* Trader */}
      <div className="border-t border-dark-600 pt-2 flex justify-between items-center">
        <span className="text-text-muted">Trader:</span>
        <AddressDisplay address={trade.traderAddress} iconSize={14} truncateLength={4} />
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default TradeHistory;

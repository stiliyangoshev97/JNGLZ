/**
 * ===== TRADE HISTORY COMPONENT =====
 *
 * Shows recent trades for a market.
 * Color-coded by trade type with timestamps.
 *
 * @module features/markets/components/TradeHistory
 */

import { AddressDisplay } from '@/shared/components/ui/Jazzicon';
import { formatBNB } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { Trade } from '@/shared/schemas';

interface TradeHistoryProps {
  trades: Trade[];
  maxItems?: number;
}

export function TradeHistory({ trades, maxItems = 20 }: TradeHistoryProps) {
  const displayTrades = trades.slice(0, maxItems);

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
        <TradeRow key={trade.id} trade={trade} />
      ))}
    </div>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  const isBuy = trade.tradeType.startsWith('Buy');
  const isYes = trade.tradeType.includes('Yes');
  const amount = formatBNB(BigInt(trade.bnbAmount));
  const shares = formatBNB(BigInt(trade.sharesAmount));
  
  // Format timestamp
  const timestamp = new Date(Number(trade.timestamp) * 1000);
  const timeAgo = getTimeAgo(timestamp);

  return (
    <div className="px-4 py-3 flex items-center gap-4 hover:bg-dark-800/50 transition-colors">
      {/* Trade type indicator */}
      <div
        className={cn(
          'w-16 text-center py-1 text-xs font-bold uppercase',
          isYes ? 'bg-yes/20 text-yes' : 'bg-no/20 text-no'
        )}
      >
        {isBuy ? 'BUY' : 'SELL'} {isYes ? 'YES' : 'NO'}
      </div>

      {/* Amount */}
      <div className="flex-1">
        <span className="font-mono text-white">{amount}</span>
        <span className="text-text-muted text-xs ml-1">BNB</span>
        <span className="text-text-muted mx-2">→</span>
        <span className="font-mono text-white">{shares}</span>
        <span className="text-text-muted text-xs ml-1">shares</span>
      </div>

      {/* Trader */}
      <div className="hidden sm:block">
        <AddressDisplay address={trade.trader} iconSize={16} truncateLength={3} />
      </div>

      {/* Time */}
      <div className="text-xs text-text-muted font-mono w-20 text-right">
        {timeAgo}
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

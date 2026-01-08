/**
 * ===== LIVE TICKER COMPONENT =====
 *
 * Scrolling ticker showing recent trades.
 * Displays trade type, market, and amount in a continuous loop.
 *
 * @module features/markets/components/LiveTicker
 */

import { formatBNB, formatAddress } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

interface Trade {
  id: string;
  traderAddress: string;
  isYes: boolean;
  isBuy: boolean;
  bnbAmount: string;
  timestamp: string;
  market: {
    id: string;
    question: string;
  };
}

interface LiveTickerProps {
  trades: Trade[];
  className?: string;
}

export function LiveTicker({ trades, className }: LiveTickerProps) {
  if (!trades || trades.length === 0) {
    return null;
  }

  // Double the trades for seamless loop
  const tickerItems = [...trades, ...trades];

  return (
    <div className={cn('ticker-container', className)}>
      <div className="ticker-content">
        {tickerItems.map((trade, index) => (
          <TickerItem key={`${trade.id}-${index}`} trade={trade} />
        ))}
      </div>
    </div>
  );
}

function TickerItem({ trade }: { trade: Trade }) {
  const amount = formatBNB(trade.bnbAmount);
  
  // Truncate question
  const question = trade.market?.question || `Market #${trade.market?.id}`;
  const truncatedQuestion = question.length > 40 
    ? question.slice(0, 40) + '...' 
    : question;

  return (
    <div className="ticker-item border-r border-dark-700 last:border-r-0">
      {/* Trade type indicator */}
      <span
        className={cn(
          'font-bold',
          trade.isYes ? 'text-yes' : 'text-no'
        )}
      >
        {trade.isBuy ? '▲' : '▼'} {trade.isYes ? 'YES' : 'NO'}
      </span>

      {/* Amount */}
      <span className="text-white font-mono">
        {amount} BNB
      </span>

      {/* Market */}
      <span className="text-text-muted">
        on "{truncatedQuestion}"
      </span>

      {/* Trader */}
      <span className="text-text-muted text-xs">
        by {formatAddress(trade.traderAddress)}
      </span>
    </div>
  );
}

export default LiveTicker;

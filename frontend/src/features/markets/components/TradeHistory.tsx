/**
 * ===== TRADE HISTORY COMPONENT =====
 *
 * Shows recent trades for a market.
 * Clean list without PNL calculations.
 * Realized P/L is shown in a separate tab.
 *
 * @module features/markets/components/TradeHistory
 */

import { useMemo } from 'react';
import { AddressDisplay } from '@/shared/components/ui/Jazzicon';
import { formatBNB } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { Trade } from '@/shared/schemas';

interface TradeHistoryProps {
  trades: Trade[];
  maxItems?: number;
}

export function TradeHistory({ 
  trades, 
  maxItems = 20 
}: TradeHistoryProps) {
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

interface TradeRowProps {
  trade: Trade;
}

function TradeRow({ trade }: TradeRowProps) {
  const isBuy = trade.isBuy;
  const isYes = trade.isYes;
  const amount = formatBNB(trade.bnbAmount);
  
  // Shares from subgraph is BigInt as string (in wei)
  const sharesWei = BigInt(trade.shares || '0');
  const sharesNum = Number(sharesWei) / 1e18;
  const sharesFormatted = sharesNum.toFixed(2);
  
  // Format timestamp
  const timestamp = new Date(Number(trade.timestamp) * 1000);
  const timeAgo = getTimeAgo(timestamp);

  return (
    <div 
      className={cn(
        'px-4 py-3 flex items-center gap-3 transition-colors',
        'hover:bg-dark-800/50'
      )}
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

      {/* Amount */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-mono text-white text-sm">{amount}</span>
          <span className="text-text-muted text-xs">BNB</span>
          <span className="text-text-muted text-xs">→</span>
          <span className="font-mono text-white text-sm">{sharesFormatted}</span>
          <span className="text-text-muted text-xs hidden sm:inline">shares</span>
        </div>
      </div>

      {/* Trader */}
      <div className="hidden md:block flex-shrink-0">
        <AddressDisplay address={trade.traderAddress} iconSize={16} truncateLength={3} />
      </div>

      {/* Time */}
      <div className="text-xs text-text-muted font-mono w-14 sm:w-20 text-right flex-shrink-0">
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

/**
 * ===== REALIZED P/L COMPONENT =====
 * 
 * Shows realized profit/loss per wallet.
 * Only wallets that have sold shares appear here.
 * Uses average cost basis for calculation.
 */

interface RealizedPnlProps {
  trades: Trade[];
}

interface WalletPnl {
  address: string;
  side: 'YES' | 'NO' | 'BOTH';
  totalBought: number;      // Total BNB spent on buys
  totalSold: number;        // Total BNB received from sells
  sharesBought: number;     // Total shares bought
  sharesSold: number;       // Total shares sold
  realizedPnlBNB: number;   // Profit/Loss in BNB
  realizedPnlPercent: number; // Profit/Loss percentage
}

export function RealizedPnl({ trades }: RealizedPnlProps) {
  const walletPnls = useMemo(() => {
    // Group trades by wallet and side
    const walletMap = new Map<string, {
      yes: { bought: number; sold: number; sharesBought: number; sharesSold: number };
      no: { bought: number; sold: number; sharesBought: number; sharesSold: number };
    }>();

    // Process all trades
    trades.forEach(trade => {
      const address = trade.traderAddress?.toLowerCase() || '';
      if (!address) return;

      const bnbAmount = parseFloat(trade.bnbAmount || '0');
      const shares = Number(BigInt(trade.shares || '0')) / 1e18;

      if (!walletMap.has(address)) {
        walletMap.set(address, {
          yes: { bought: 0, sold: 0, sharesBought: 0, sharesSold: 0 },
          no: { bought: 0, sold: 0, sharesBought: 0, sharesSold: 0 },
        });
      }

      const wallet = walletMap.get(address)!;
      const side = trade.isYes ? 'yes' : 'no';

      if (trade.isBuy) {
        wallet[side].bought += bnbAmount;
        wallet[side].sharesBought += shares;
      } else {
        wallet[side].sold += bnbAmount;
        wallet[side].sharesSold += shares;
      }
    });

    // Calculate realized P/L for wallets that have sold
    const pnls: WalletPnl[] = [];

    walletMap.forEach((data, address) => {
      const hasYesSells = data.yes.sharesSold > 0;
      const hasNoSells = data.no.sharesSold > 0;

      // Skip if no sells
      if (!hasYesSells && !hasNoSells) return;

      // Calculate realized P/L using average cost basis
      let realizedPnlBNB = 0;
      let totalCostBasis = 0;

      // YES side realized P/L
      if (hasYesSells && data.yes.sharesBought > 0) {
        const avgCostPerShare = data.yes.bought / data.yes.sharesBought;
        const costBasisOfSold = avgCostPerShare * data.yes.sharesSold;
        realizedPnlBNB += data.yes.sold - costBasisOfSold;
        totalCostBasis += costBasisOfSold;
      }

      // NO side realized P/L
      if (hasNoSells && data.no.sharesBought > 0) {
        const avgCostPerShare = data.no.bought / data.no.sharesBought;
        const costBasisOfSold = avgCostPerShare * data.no.sharesSold;
        realizedPnlBNB += data.no.sold - costBasisOfSold;
        totalCostBasis += costBasisOfSold;
      }

      // Calculate percentage (avoid division by zero)
      const realizedPnlPercent = totalCostBasis > 0 
        ? (realizedPnlBNB / totalCostBasis) * 100 
        : 0;

      // Determine side
      let side: 'YES' | 'NO' | 'BOTH' = 'YES';
      if (hasYesSells && hasNoSells) side = 'BOTH';
      else if (hasNoSells) side = 'NO';

      pnls.push({
        address,
        side,
        totalBought: data.yes.bought + data.no.bought,
        totalSold: data.yes.sold + data.no.sold,
        sharesBought: data.yes.sharesBought + data.no.sharesBought,
        sharesSold: data.yes.sharesSold + data.no.sharesSold,
        realizedPnlBNB,
        realizedPnlPercent,
      });
    });

    // Sort by absolute P/L (biggest winners/losers first)
    return pnls.sort((a, b) => Math.abs(b.realizedPnlBNB) - Math.abs(a.realizedPnlBNB));
  }, [trades]);

  if (walletPnls.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-muted font-mono">NO REALIZED P/L YET</p>
        <p className="text-text-muted text-xs mt-1">Appears when traders sell their shares</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-dark-700">
      {/* Header */}
      <div className="px-4 py-2 bg-dark-800 flex items-center gap-3 text-xs font-mono text-text-muted">
        <div className="flex-1">TRADER</div>
        <div className="w-16 text-center">SIDE</div>
        <div className="w-28 text-right">REALIZED P/L</div>
      </div>
      
      {/* Rows */}
      {walletPnls.map((pnl) => (
        <div key={pnl.address} className="px-4 py-3 flex items-center gap-3 hover:bg-dark-800/50">
          {/* Address */}
          <div className="flex-1">
            <AddressDisplay address={pnl.address} iconSize={18} truncateLength={4} />
          </div>
          
          {/* Side */}
          <div className="w-16 text-center">
            {pnl.side === 'BOTH' ? (
              <span className="text-text-muted text-xs font-mono">BOTH</span>
            ) : pnl.side === 'YES' ? (
              <span className="text-yes text-xs font-bold">YES</span>
            ) : (
              <span className="text-no text-xs font-bold">NO</span>
            )}
          </div>
          
          {/* Realized P/L */}
          <div className={cn(
            'w-28 text-right font-mono text-sm font-bold',
            pnl.realizedPnlBNB >= 0 ? 'text-yes' : 'text-no'
          )}>
            <div>
              {pnl.realizedPnlBNB >= 0 ? '+' : ''}{pnl.realizedPnlBNB.toFixed(4)} BNB
            </div>
            <div className="text-xs opacity-75">
              ({pnl.realizedPnlPercent >= 0 ? '+' : ''}{pnl.realizedPnlPercent.toFixed(1)}%)
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TradeHistory;

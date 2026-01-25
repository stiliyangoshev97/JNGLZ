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
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-text-muted font-mono">NO TRADES YET</p>
          <p className="text-text-muted text-xs mt-1">Be the first to trade!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
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
        'hover:bg-dark-800/50',
        'border-b border-dark-700 last:border-b-0'
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
 * ===== TRADING & RESOLUTION P/L COMPONENT =====
 * 
 * Shows both types of realized profit/loss per wallet:
 * - Trading P/L: When traders fully exit via sells (before resolution)
 * - Resolution P/L: When traders claim after market resolution
 */

// Position data from subgraph
interface PositionData {
  user: { address: string };
  yesShares: string;
  noShares: string;
  totalInvested: string;
  totalReturned?: string;
  netCostBasis?: string;
  fullyExited?: boolean;
  tradingPnLRealized?: string;
  claimed?: boolean;
  claimedAmount?: string | null;
  realizedPnL?: string | null;
}

interface RealizedPnlProps {
  trades: Trade[];
  positions?: PositionData[];
}

interface WalletPnl {
  address: string;
  side: 'YES' | 'NO' | 'BOTH';
  totalBought: number;      // Total BNB spent on buys
  totalSold: number;        // Total BNB received from sells
  sharesBought: number;     // Total shares bought
  sharesSold: number;       // Total shares sold
  tradingPnlBNB: number;    // Trading P/L in BNB (from sells)
  tradingPnlPercent: number; // Trading P/L percentage
  resolutionPnlBNB: number | null;   // Resolution P/L in BNB (from claims)
  resolutionPnlPercent: number | null; // Resolution P/L percentage
  hasClaimed: boolean;      // Has user claimed?
}

export function RealizedPnl({ trades, positions = [] }: RealizedPnlProps) {
  const walletPnls = useMemo(() => {
    // Build a map of positions by address for resolution P/L
    const positionMap = new Map<string, PositionData>();
    positions.forEach(pos => {
      const addr = pos.user?.address?.toLowerCase();
      if (addr) positionMap.set(addr, pos);
    });

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

    // Calculate P/L for wallets
    const pnls: WalletPnl[] = [];

    walletMap.forEach((data, address) => {
      const hasYesSells = data.yes.sharesSold > 0;
      const hasNoSells = data.no.sharesSold > 0;

      // Check if position is fully closed via trading
      const EPSILON = 0.0001;
      const yesSharesRemaining = data.yes.sharesBought - data.yes.sharesSold;
      const noSharesRemaining = data.no.sharesBought - data.no.sharesSold;
      const positionFullyExited = Math.abs(yesSharesRemaining) < EPSILON && Math.abs(noSharesRemaining) < EPSILON;

      // Get position data for resolution P/L
      const position = positionMap.get(address);
      const hasClaimed = position?.claimed ?? false;
      const resolutionPnL = position?.realizedPnL ? parseFloat(position.realizedPnL) : null;

      // Skip if no sells AND no claims
      if (!hasYesSells && !hasNoSells && !hasClaimed) return;

      // Calculate trading P/L (only if fully exited via trading)
      let tradingPnlBNB = 0;
      let totalCostBasis = 0;

      if (positionFullyExited && (hasYesSells || hasNoSells)) {
        // YES side trading P/L
        if (hasYesSells && data.yes.sharesBought > 0) {
          const avgCostPerShare = data.yes.bought / data.yes.sharesBought;
          const costBasisOfSold = avgCostPerShare * data.yes.sharesSold;
          tradingPnlBNB += data.yes.sold - costBasisOfSold;
          totalCostBasis += costBasisOfSold;
        }

        // NO side trading P/L
        if (hasNoSells && data.no.sharesBought > 0) {
          const avgCostPerShare = data.no.bought / data.no.sharesBought;
          const costBasisOfSold = avgCostPerShare * data.no.sharesSold;
          tradingPnlBNB += data.no.sold - costBasisOfSold;
          totalCostBasis += costBasisOfSold;
        }
      }

      const tradingPnlPercent = totalCostBasis > 0 
        ? (tradingPnlBNB / totalCostBasis) * 100 
        : 0;

      // Calculate resolution P/L percentage
      const netCostBasis = position?.netCostBasis ? parseFloat(position.netCostBasis) : null;
      const resolutionPnlPercent = (resolutionPnL !== null && netCostBasis && netCostBasis > 0)
        ? (resolutionPnL / netCostBasis) * 100
        : null;

      // Determine side
      let side: 'YES' | 'NO' | 'BOTH' = 'YES';
      if (hasYesSells && hasNoSells) side = 'BOTH';
      else if (hasNoSells) side = 'NO';

      // Only include if there's something to show
      const hasTradeData = positionFullyExited && (hasYesSells || hasNoSells);
      const hasResolutionData = hasClaimed && resolutionPnL !== null;
      
      if (!hasTradeData && !hasResolutionData) return;

      pnls.push({
        address,
        side,
        totalBought: data.yes.bought + data.no.bought,
        totalSold: data.yes.sold + data.no.sold,
        sharesBought: data.yes.sharesBought + data.no.sharesBought,
        sharesSold: data.yes.sharesSold + data.no.sharesSold,
        tradingPnlBNB: hasTradeData ? tradingPnlBNB : 0,
        tradingPnlPercent: hasTradeData ? tradingPnlPercent : 0,
        resolutionPnlBNB: hasResolutionData ? resolutionPnL : null,
        resolutionPnlPercent: hasResolutionData ? resolutionPnlPercent : null,
        hasClaimed,
      });
    });

    // Also add wallets that have claimed but didn't trade (held till resolution)
    positionMap.forEach((position, address) => {
      if (!walletMap.has(address) && position.claimed && position.realizedPnL) {
        const resolutionPnL = parseFloat(position.realizedPnL);
        const netCostBasis = position.netCostBasis ? parseFloat(position.netCostBasis) : 0;
        const resolutionPnlPercent = netCostBasis > 0 ? (resolutionPnL / netCostBasis) * 100 : 0;
        
        // Determine side based on shares
        const yesShares = Number(BigInt(position.yesShares || '0')) / 1e18;
        const noShares = Number(BigInt(position.noShares || '0')) / 1e18;
        let side: 'YES' | 'NO' | 'BOTH' = 'YES';
        if (yesShares > 0 && noShares > 0) side = 'BOTH';
        else if (noShares > 0) side = 'NO';

        pnls.push({
          address,
          side,
          totalBought: parseFloat(position.totalInvested || '0'),
          totalSold: parseFloat(position.totalReturned || '0'),
          sharesBought: yesShares + noShares,
          sharesSold: 0,
          tradingPnlBNB: 0,
          tradingPnlPercent: 0,
          resolutionPnlBNB: resolutionPnL,
          resolutionPnlPercent,
          hasClaimed: true,
        });
      }
    });

    // Sort by total P/L (trading + resolution) descending
    return pnls.sort((a, b) => {
      const totalA = a.tradingPnlBNB + (a.resolutionPnlBNB ?? 0);
      const totalB = b.tradingPnlBNB + (b.resolutionPnlBNB ?? 0);
      return totalB - totalA;
    });
  }, [trades, positions]);

  if (walletPnls.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-text-muted font-mono">NO P/L DATA YET</p>
          <p className="text-text-muted text-xs mt-1">Appears when traders exit or claim</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-dark-700">
      {/* Header */}
      <div className="px-4 py-2 bg-dark-800 flex items-center gap-3 text-xs font-mono text-text-muted">
        <div className="flex-1">TRADER</div>
        <div className="w-16 text-center">SIDE</div>
        <div className="w-28 text-right">TRADING P/L</div>
        <div className="w-28 text-right">RESOLUTION P/L</div>
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
          
          {/* Trading P/L */}
          <div className={cn(
            'w-28 text-right font-mono text-sm',
            pnl.tradingPnlBNB === 0 ? 'text-text-muted' : pnl.tradingPnlBNB >= 0 ? 'text-yes font-bold' : 'text-no font-bold'
          )}>
            {pnl.tradingPnlBNB !== 0 ? (
              <>
                <div>
                  {pnl.tradingPnlBNB >= 0 ? '+' : ''}{pnl.tradingPnlBNB.toFixed(4)} BNB
                </div>
                <div className="text-xs opacity-75">
                  ({pnl.tradingPnlPercent >= 0 ? '+' : ''}{pnl.tradingPnlPercent.toFixed(1)}%)
                </div>
              </>
            ) : (
              <div>
                <div>0 BNB</div>
                <div className="text-xs opacity-75">(0%)</div>
              </div>
            )}
          </div>

          {/* Resolution P/L - Always show, grey 0 if not claimed yet */}
          <div className={cn(
            'w-28 text-right font-mono text-sm',
            pnl.resolutionPnlBNB === null 
              ? 'text-text-muted' 
              : pnl.resolutionPnlBNB > 0 
                ? 'text-yes font-bold' 
                : pnl.resolutionPnlBNB < 0 
                  ? 'text-no font-bold' 
                  : 'text-text-muted'
          )}>
            {pnl.resolutionPnlBNB !== null ? (
              <>
                <div>
                  {pnl.resolutionPnlBNB > 0 ? '+' : ''}{pnl.resolutionPnlBNB.toFixed(4)} BNB
                </div>
                {pnl.resolutionPnlPercent !== null && (
                  <div className="text-xs opacity-75">
                    ({pnl.resolutionPnlPercent > 0 ? '+' : ''}{pnl.resolutionPnlPercent.toFixed(1)}%)
                  </div>
                )}
              </>
            ) : (
              <div>
                <div>0 BNB</div>
                <div className="text-xs opacity-75">(0%)</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Calculate realized P/L for a specific wallet address from trades
 * Returns { realizedPnlBNB, realizedPnlPercent, hasSells }
 */
export function calculateWalletRealizedPnl(
  trades: Trade[],
  walletAddress: string
): { realizedPnlBNB: number; realizedPnlPercent: number; hasSells: boolean } {
  const address = walletAddress.toLowerCase();
  
  // Track buys and sells per side
  const data = {
    yes: { bought: 0, sold: 0, sharesBought: 0, sharesSold: 0 },
    no: { bought: 0, sold: 0, sharesBought: 0, sharesSold: 0 },
  };

  // Process trades for this wallet only
  trades.forEach(trade => {
    const tradeAddress = trade.traderAddress?.toLowerCase() || '';
    if (tradeAddress !== address) return;

    const bnbAmount = parseFloat(trade.bnbAmount || '0');
    const shares = Number(BigInt(trade.shares || '0')) / 1e18;
    const side = trade.isYes ? 'yes' : 'no';

    if (trade.isBuy) {
      data[side].bought += bnbAmount;
      data[side].sharesBought += shares;
    } else {
      data[side].sold += bnbAmount;
      data[side].sharesSold += shares;
    }
  });

  const hasYesSells = data.yes.sharesSold > 0;
  const hasNoSells = data.no.sharesSold > 0;
  const hasSells = hasYesSells || hasNoSells;

  // If no sells, no realized P/L
  if (!hasSells) {
    return { realizedPnlBNB: 0, realizedPnlPercent: 0, hasSells: false };
  }

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

  // Calculate percentage
  const realizedPnlPercent = totalCostBasis > 0 
    ? (realizedPnlBNB / totalCostBasis) * 100 
    : 0;

  return { realizedPnlBNB, realizedPnlPercent, hasSells };
}

export default TradeHistory;

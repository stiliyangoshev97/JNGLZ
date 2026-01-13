/**
 * ===== PRICE CHART COMPONENT =====
 *
 * Real-time price chart showing YES probability over time.
 * Creates FOMO by visualizing pumps and dumps!
 * 
 * Chart style: "Polymarket-style" step chart with sharp jumps
 * - Shows YES probability (0-100%) over time
 * - Each trade moves the probability based on bonding curve
 * - Step chart shows exact moments of price changes
 *
 * How it works:
 * - We track the YES/NO share supplies over time
 * - YES probability = yesShares / (yesShares + noShares) * 100
 * - Each buy/sell changes the supply, thus the probability
 *
 * Predator Polling v2:
 * - NO OWN POLLING - receives trades from parent via props
 * - This prevents duplicate queries (parent polls, child displays)
 * - Falls back to own query (NO polling) if trades not provided
 *
 * @module features/markets/components/PriceChart
 */

import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_MARKET_TRADES } from '@/shared/api';
import { cn } from '@/shared/utils/cn';

interface Trade {
  id: string;
  isYes: boolean;
  isBuy: boolean;
  pricePerShare: string;
  timestamp: string;
  bnbAmount: string;
  shares: string;
}

interface PriceChartProps {
  marketId: string;
  /** Optional: trades passed from parent (Predator v2 - no own polling) */
  trades?: Trade[];
  /** Current YES/NO shares for accurate current price */
  currentYesShares?: string;
  currentNoShares?: string;
  /** Virtual liquidity from market (BigInt string in wei) - needed for correct price calc */
  virtualLiquidity?: string;
  className?: string;
}

/**
 * Calculate YES probability using the bonding curve formula:
 * yesPrice = (yesSupply + VL) / (yesSupply + noSupply + 2*VL)
 * 
 * This is how the smart contract calculates prices.
 */
function calculateYesPercent(yesSupply: number, noSupply: number, virtualLiquidity: number): number {
  const virtualYes = yesSupply + virtualLiquidity;
  const virtualNo = noSupply + virtualLiquidity;
  const total = virtualYes + virtualNo;
  return total > 0 ? (virtualYes / total) * 100 : 50;
}

export function PriceChart({ 
  marketId, 
  trades: propTrades, 
  currentYesShares,
  currentNoShares,
  virtualLiquidity: propVirtualLiquidity,
  className 
}: PriceChartProps) {
  // Only fetch if trades not provided by parent
  // NO POLLING - just initial fetch as fallback
  const { data } = useQuery<{ trades: Trade[] }>(GET_MARKET_TRADES, {
    variables: { marketId, first: 200 },
    skip: !!propTrades, // Skip if parent provides trades
    notifyOnNetworkStatusChange: false,
  });

  // Use prop trades if available, otherwise fall back to own query
  const trades = propTrades || data?.trades || [];

  // Parse virtual liquidity from props (in wei) - default to 5e18 (CRACK level)
  const virtualLiquidity = useMemo(() => {
    if (propVirtualLiquidity) {
      return parseFloat(propVirtualLiquidity) / 1e18;
    }
    return 5; // Default to 5 BNB (CRACK level) if not provided
  }, [propVirtualLiquidity]);

  // Process trades into chart data points
  // We simulate the share supply changes over time to get probability at each point
  const chartData = useMemo(() => {
    if (trades.length === 0) {
      return { 
        points: [{ x: 0, y: 50 }, { x: 100, y: 50 }], // Flat line at 50%
        minTime: 0, 
        maxTime: 0,
        hasRealData: false
      };
    }

    // Sort trades by timestamp (oldest first for simulation)
    const sortedTrades = [...trades].sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp)
    );

    const minTime = Number(sortedTrades[0]?.timestamp || 0);
    const maxTime = Number(sortedTrades[sortedTrades.length - 1]?.timestamp || 0);
    const timeRange = maxTime - minTime || 1;

    // Start with 0 actual shares (virtual liquidity handles the base)
    let yesSupply = 0;
    let noSupply = 0;
    
    // Points for the chart (x = time %, y = YES probability %)
    const points: { x: number; y: number; volume: number }[] = [];
    
    // Add starting point (50% before any trades - when yesSupply=noSupply=0)
    points.push({ x: 0, y: 50, volume: 0 });

    sortedTrades.forEach((trade) => {
      const shares = parseFloat(trade.shares || '0') / 1e18; // Convert from wei
      const volume = parseFloat(trade.bnbAmount || '0');
      
      // Update supply based on trade
      if (trade.isBuy) {
        if (trade.isYes) {
          yesSupply += shares;
        } else {
          noSupply += shares;
        }
      } else {
        // Sell reduces supply
        if (trade.isYes) {
          yesSupply = Math.max(0, yesSupply - shares);
        } else {
          noSupply = Math.max(0, noSupply - shares);
        }
      }
      
      // Calculate YES probability using the bonding curve formula
      const yesPercent = calculateYesPercent(yesSupply, noSupply, virtualLiquidity);
      
      // Time position (0-100%)
      const x = ((Number(trade.timestamp) - minTime) / timeRange) * 100;
      
      points.push({ 
        x: Math.max(0.1, x), // Ensure at least 0.1 so we can see the jump
        y: Math.min(99, Math.max(1, yesPercent)), // Clamp between 1-99%
        volume 
      });
    });
    
    // Add end point at current time (extend line to right edge)
    const lastPoint = points[points.length - 1];
    if (lastPoint && lastPoint.x < 100) {
      points.push({ x: 100, y: lastPoint.y, volume: 0 });
    }

    return { points, minTime, maxTime, hasRealData: true };
  }, [trades, virtualLiquidity]);

  // Calculate current price from props or last chart point
  const currentYesPercent = useMemo(() => {
    if (currentYesShares && currentNoShares) {
      const yes = parseFloat(currentYesShares) / 1e18;
      const no = parseFloat(currentNoShares) / 1e18;
      // Use bonding curve formula with virtual liquidity
      return calculateYesPercent(yes, no, virtualLiquidity);
    }
    const lastPoint = chartData.points[chartData.points.length - 1];
    return lastPoint?.y || 50;
  }, [currentYesShares, currentNoShares, chartData.points, virtualLiquidity]);
  
  const currentNoPercent = 100 - currentYesPercent;

  // Generate STEP PATH (sharp corners for each trade)
  const generateStepPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `${points[0].x},${100 - points[0].y}`;
    
    let path = `${points[0].x},${100 - points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // STEP: horizontal to new x, then vertical to new y (creates sharp jump)
      path += ` ${curr.x},${100 - prev.y}`; // Horizontal
      path += ` ${curr.x},${100 - curr.y}`; // Vertical jump
    }
    
    return path;
  };

  // Generate area fill path
  const generateAreaPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';
    
    let path = `0,100 0,${100 - points[0].y}`;
    
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        path += ` ${points[0].x},${100 - points[0].y}`;
      } else {
        const prev = points[i - 1];
        const curr = points[i];
        path += ` ${curr.x},${100 - prev.y}`;
        path += ` ${curr.x},${100 - curr.y}`;
      }
    }
    
    const lastPoint = points[points.length - 1];
    path += ` 100,${100 - lastPoint.y} 100,100`;
    
    return path;
  };

  return (
    <div className={cn('relative h-64 bg-dark-800', className)}>
      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none">
        {[0, 25, 50, 75, 100].map((percent) => (
          <div
            key={percent}
            className="absolute left-8 right-0 border-t border-dark-700/50"
            style={{ top: `${100 - percent}%` }}
          >
            <span className="absolute -left-8 -top-2 text-xs font-mono text-text-muted w-6 text-right">
              {percent}%
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <svg
        className="absolute inset-0 w-full h-full pl-8"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {/* Area fill - subtle green gradient under the line */}
        {chartData.points.length > 1 && (
          <polygon
            fill="rgba(57, 255, 20, 0.1)"
            points={generateAreaPath(chartData.points)}
          />
        )}
        
        {/* YES probability line - clean step chart */}
        {chartData.points.length > 0 && (
          <polyline
            fill="none"
            stroke="#39FF14"
            strokeWidth="1.5"
            strokeLinejoin="miter"
            strokeLinecap="square"
            points={generateStepPath(chartData.points)}
          />
        )}

        {/* Small dots at each trade point */}
        {chartData.hasRealData && chartData.points.slice(1, -1).map((point, i) => (
          <circle
            key={`point-${i}`}
            cx={point.x}
            cy={100 - point.y}
            r="1.5"
            fill="#39FF14"
            opacity="0.7"
          />
        ))}

        {/* Current price horizontal line */}
        <line
          x1="0"
          y1={100 - currentYesPercent}
          x2="100"
          y2={100 - currentYesPercent}
          stroke="#39FF14"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          opacity="0.6"
        />
      </svg>

      {/* Current price indicators */}
      <div className="absolute right-2 top-2 flex flex-col gap-1 text-xs font-mono">
        <div className="flex items-center gap-2 bg-dark-900/90 px-2 py-1 border border-yes/30">
          <div className="w-2 h-2 bg-yes rounded-full animate-pulse" />
          <span className="text-yes font-bold">{currentYesPercent.toFixed(1)}%</span>
          <span className="text-text-muted">YES</span>
        </div>
        <div className="flex items-center gap-2 bg-dark-900/90 px-2 py-1 border border-no/30">
          <div className="w-2 h-2 bg-no rounded-full" />
          <span className="text-no">{currentNoPercent.toFixed(1)}%</span>
          <span className="text-text-muted">NO</span>
        </div>
      </div>

      {/* Trade count */}
      <div className="absolute left-10 bottom-2 text-xs font-mono text-text-muted">
        <span>{trades.length} trade{trades.length !== 1 ? 's' : ''}</span>
      </div>

      {/* No trades message */}
      {!chartData.hasRealData && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-dark-900/80 px-4 py-2 rounded">
            <p className="text-text-muted font-mono text-sm">NO TRADES YET</p>
            <p className="text-text-muted text-xs mt-1">Be the first to trade!</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PriceChart;

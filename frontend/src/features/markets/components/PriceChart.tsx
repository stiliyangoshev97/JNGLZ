/**
 * ===== PRICE CHART COMPONENT =====
 *
 * Real-time price chart showing YES/NO price movements based on trades.
 * Creates FOMO by visualizing pumps and dumps!
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
}

interface PriceChartProps {
  marketId: string;
  className?: string;
}

export function PriceChart({ marketId, className }: PriceChartProps) {
  // Fetch trades for this market
  const { data } = useQuery<{ trades: Trade[] }>(GET_MARKET_TRADES, {
    variables: { marketId, first: 200 },
    pollInterval: 5000, // Refresh every 5 seconds
  });

  const trades = data?.trades || [];

  // Process trades into chart data points
  const chartData = useMemo(() => {
    if (trades.length === 0) return { yesPoints: [], noPoints: [], minTime: 0, maxTime: 0 };

    // Sort trades by timestamp (oldest first)
    const sortedTrades = [...trades].sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp)
    );

    const minTime = Number(sortedTrades[0]?.timestamp || 0);
    const maxTime = Number(sortedTrades[sortedTrades.length - 1]?.timestamp || 0);
    const timeRange = maxTime - minTime || 1;

    // Build price history - track YES price over time
    // pricePerShare is BigDecimal (already in BNB, e.g., "0.005")
    // We want to show as percentage (0.01 BNB = 100%, 0.005 BNB = 50%)
    const yesPoints: { x: number; y: number; volume: number }[] = [];
    const noPoints: { x: number; y: number; volume: number }[] = [];

    sortedTrades.forEach((trade) => {
      const x = ((Number(trade.timestamp) - minTime) / timeRange) * 100;
      // pricePerShare is BigDecimal string (e.g., "0.005" for 50%)
      const priceBnb = parseFloat(trade.pricePerShare || '0');
      const pricePercent = priceBnb * 100 / 0.01; // 0.01 BNB = 100%
      // bnbAmount is also BigDecimal
      const volume = parseFloat(trade.bnbAmount || '0');

      if (trade.isYes) {
        yesPoints.push({ x, y: Math.min(100, Math.max(0, pricePercent)), volume });
      } else {
        noPoints.push({ x, y: Math.min(100, Math.max(0, pricePercent)), volume });
      }
    });

    return { yesPoints, noPoints, minTime, maxTime };
  }, [trades]);

  // Generate SVG path from points
  const generatePath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `${points[0].x},${100 - points[0].y}`;
    
    return points.map((p) => `${p.x},${100 - p.y}`).join(' ');
  };

  // Calculate current prices from last trades
  const lastYesTrade = chartData.yesPoints[chartData.yesPoints.length - 1];
  const lastNoTrade = chartData.noPoints[chartData.noPoints.length - 1];
  const currentYesPrice = lastYesTrade?.y || 50;
  const currentNoPrice = lastNoTrade?.y || 50;

  // Check if we have real data
  const hasData = trades.length > 0;

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

      {hasData ? (
        <>
          {/* Actual chart */}
          <svg
            className="absolute inset-0 w-full h-full pl-8"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {/* Area fill for YES */}
            {chartData.yesPoints.length > 1 && (
              <polygon
                fill="rgba(57, 255, 20, 0.1)"
                points={`0,100 ${generatePath(chartData.yesPoints)} 100,100`}
              />
            )}
            
            {/* YES price line */}
            {chartData.yesPoints.length > 0 && (
              <polyline
                fill="none"
                stroke="#39FF14"
                strokeWidth="0.8"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={generatePath(chartData.yesPoints)}
              />
            )}
            
            {/* NO price line */}
            {chartData.noPoints.length > 0 && (
              <polyline
                fill="none"
                stroke="#FF3131"
                strokeWidth="0.8"
                strokeOpacity="0.7"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={generatePath(chartData.noPoints)}
              />
            )}

            {/* Trade dots - YES */}
            {chartData.yesPoints.map((point, i) => (
              <circle
                key={`yes-${i}`}
                cx={point.x}
                cy={100 - point.y}
                r={Math.min(2, 0.5 + point.volume * 2)}
                fill="#39FF14"
                opacity="0.8"
              />
            ))}

            {/* Trade dots - NO */}
            {chartData.noPoints.map((point, i) => (
              <circle
                key={`no-${i}`}
                cx={point.x}
                cy={100 - point.y}
                r={Math.min(2, 0.5 + point.volume * 2)}
                fill="#FF3131"
                opacity="0.6"
              />
            ))}
          </svg>

          {/* Current price indicators */}
          <div className="absolute right-2 top-2 flex flex-col gap-1 text-xs font-mono">
            <div className="flex items-center gap-2 bg-dark-900/80 px-2 py-1">
              <div className="w-2 h-2 bg-yes rounded-full" />
              <span className="text-yes">{currentYesPrice.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2 bg-dark-900/80 px-2 py-1">
              <div className="w-2 h-2 bg-no rounded-full" />
              <span className="text-no">{currentNoPrice.toFixed(1)}%</span>
            </div>
          </div>

          {/* Trade count */}
          <div className="absolute left-10 bottom-2 text-xs font-mono text-text-muted">
            {trades.length} trades
          </div>
        </>
      ) : (
        /* No trades yet */
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-muted font-mono text-sm">NO TRADES YET</p>
            <p className="text-text-muted text-xs mt-1">Be the first to trade!</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 right-2 flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-yes" />
          <span className="text-yes">YES</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-no" />
          <span className="text-no">NO</span>
        </div>
      </div>

      {/* Scanner line animation for live feel */}
      {hasData && <div className="scanner-line opacity-30" />}
    </div>
  );
}

export default PriceChart;

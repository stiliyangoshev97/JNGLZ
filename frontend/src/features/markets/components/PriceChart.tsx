/**
 * ===== PRICE CHART COMPONENT =====
 *
 * Real-time price chart showing YES/NO price movements based on trades.
 * Creates FOMO by visualizing pumps and dumps!
 * 
 * Chart style: "Polymarket-style" step chart with sharp jumps
 * - Each trade creates a visible step/jump
 * - No smooth interpolation - raw price action
 * - Glow effects on big moves
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
}

interface PriceChartProps {
  marketId: string;
  /** Optional: trades passed from parent (Predator v2 - no own polling) */
  trades?: Trade[];
  className?: string;
}

export function PriceChart({ marketId, trades: propTrades, className }: PriceChartProps) {
  // Only fetch if trades not provided by parent
  // NO POLLING - just initial fetch as fallback
  const { data } = useQuery<{ trades: Trade[] }>(GET_MARKET_TRADES, {
    variables: { marketId, first: 200 },
    skip: !!propTrades, // Skip if parent provides trades
    notifyOnNetworkStatusChange: false,
  });

  // Use prop trades if available, otherwise fall back to own query
  const trades = propTrades || data?.trades || [];

  // Process trades into chart data points - STEP CHART STYLE
  const chartData = useMemo(() => {
    if (trades.length === 0) return { yesPoints: [], noPoints: [], allPoints: [], minTime: 0, maxTime: 0 };

    // Sort trades by timestamp (oldest first)
    const sortedTrades = [...trades].sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp)
    );

    const minTime = Number(sortedTrades[0]?.timestamp || 0);
    const maxTime = Number(sortedTrades[sortedTrades.length - 1]?.timestamp || 0);
    const timeRange = maxTime - minTime || 1;

    // Build STEP price history - track cumulative YES probability
    // Each trade affects the price, creating sharp jumps
    const yesPoints: { x: number; y: number; volume: number; isBuy: boolean }[] = [];
    const noPoints: { x: number; y: number; volume: number; isBuy: boolean }[] = [];
    const allPoints: { x: number; yesY: number; noY: number; timestamp: number }[] = [];

    // Track running YES probability based on trades
    let currentYesPrice = 50; // Start at 50%
    let currentNoPrice = 50;

    sortedTrades.forEach((trade) => {
      const x = ((Number(trade.timestamp) - minTime) / timeRange) * 100;
      // pricePerShare is BigDecimal string (e.g., "0.005" for 50%)
      const priceBnb = parseFloat(trade.pricePerShare || '0');
      const pricePercent = priceBnb * 100 / 0.01; // 0.01 BNB = 100%
      const volume = parseFloat(trade.bnbAmount || '0');

      if (trade.isYes) {
        currentYesPrice = Math.min(100, Math.max(0, pricePercent));
        currentNoPrice = 100 - currentYesPrice;
        yesPoints.push({ x, y: currentYesPrice, volume, isBuy: trade.isBuy });
      } else {
        currentNoPrice = Math.min(100, Math.max(0, pricePercent));
        currentYesPrice = 100 - currentNoPrice;
        noPoints.push({ x, y: currentNoPrice, volume, isBuy: trade.isBuy });
      }

      // Track all points for step chart
      allPoints.push({ 
        x, 
        yesY: currentYesPrice, 
        noY: currentNoPrice,
        timestamp: Number(trade.timestamp)
      });
    });

    return { yesPoints, noPoints, allPoints, minTime, maxTime };
  }, [trades]);

  // Generate STEP PATH (Polymarket-style jumps) - creates sharp corners
  const generateStepPath = (points: { x: number; yesY: number }[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `${points[0].x},${100 - points[0].yesY}`;
    
    let path = `${points[0].x},${100 - points[0].yesY}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // STEP: First go horizontal to new x, then vertical to new y
      // This creates the sharp "jump" effect
      path += ` ${curr.x},${100 - prev.yesY}`; // Horizontal step
      path += ` ${curr.x},${100 - curr.yesY}`; // Vertical jump
    }
    
    return path;
  };

  // Generate step path for NO line (inverted)
  const generateNoStepPath = (points: { x: number; noY: number }[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `${points[0].x},${100 - points[0].noY}`;
    
    let path = `${points[0].x},${100 - points[0].noY}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      path += ` ${curr.x},${100 - prev.noY}`;
      path += ` ${curr.x},${100 - curr.noY}`;
    }
    
    return path;
  };

  // Generate area fill path for step chart
  const generateStepAreaPath = (points: { x: number; yesY: number }[]): string => {
    if (points.length === 0) return '';
    
    let path = `0,100 0,${100 - points[0].yesY}`;
    
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        path += ` ${points[0].x},${100 - points[0].yesY}`;
      } else {
        const prev = points[i - 1];
        const curr = points[i];
        path += ` ${curr.x},${100 - prev.yesY}`;
        path += ` ${curr.x},${100 - curr.yesY}`;
      }
    }
    
    // Close the area
    const lastPoint = points[points.length - 1];
    path += ` 100,${100 - lastPoint.yesY} 100,100`;
    
    return path;
  };

  // Calculate current prices from last point
  const lastPoint = chartData.allPoints[chartData.allPoints.length - 1];
  const currentYesPrice = lastPoint?.yesY || 50;
  const currentNoPrice = lastPoint?.noY || 50;

  // Check if we have real data
  const hasData = trades.length > 0;

  // Calculate biggest moves for highlighting
  const bigMoves = useMemo(() => {
    if (chartData.allPoints.length < 2) return [];
    const moves: { x: number; y: number; change: number }[] = [];
    
    for (let i = 1; i < chartData.allPoints.length; i++) {
      const prev = chartData.allPoints[i - 1];
      const curr = chartData.allPoints[i];
      const change = Math.abs(curr.yesY - prev.yesY);
      if (change >= 5) { // Highlight moves >= 5%
        moves.push({ x: curr.x, y: curr.yesY, change });
      }
    }
    return moves;
  }, [chartData.allPoints]);

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
          {/* Actual chart - STEP STYLE */}
          <svg
            className="absolute inset-0 w-full h-full pl-8"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {/* Glow filter for big moves */}
            <defs>
              <filter id="glow-yes" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glow-no" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Area fill for YES - step style */}
            {chartData.allPoints.length > 1 && (
              <polygon
                fill="rgba(57, 255, 20, 0.15)"
                points={generateStepAreaPath(chartData.allPoints)}
              />
            )}
            
            {/* YES price line - STEP CHART */}
            {chartData.allPoints.length > 0 && (
              <polyline
                fill="none"
                stroke="#39FF14"
                strokeWidth="2"
                strokeLinejoin="miter"
                strokeLinecap="square"
                points={generateStepPath(chartData.allPoints)}
                filter="url(#glow-yes)"
              />
            )}
            
            {/* NO price line - STEP CHART (thinner, more subtle) */}
            {chartData.allPoints.length > 0 && (
              <polyline
                fill="none"
                stroke="#FF3131"
                strokeWidth="1.5"
                strokeOpacity="0.6"
                strokeLinejoin="miter"
                strokeLinecap="square"
                points={generateNoStepPath(chartData.allPoints)}
              />
            )}

            {/* Big move highlights - pulsing circles */}
            {bigMoves.map((move, i) => (
              <g key={`big-move-${i}`}>
                <circle
                  cx={move.x}
                  cy={100 - move.y}
                  r="3"
                  fill="#39FF14"
                  opacity="0.9"
                  filter="url(#glow-yes)"
                >
                  <animate
                    attributeName="r"
                    values="2;4;2"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.9;0.5;0.9"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            ))}

            {/* Trade dots - YES (buys = bright, sells = dimmer) */}
            {chartData.yesPoints.map((point, i) => (
              <circle
                key={`yes-${i}`}
                cx={point.x}
                cy={100 - point.y}
                r={Math.min(3, 1 + point.volume * 3)}
                fill={point.isBuy ? "#39FF14" : "#39FF14"}
                opacity={point.isBuy ? "1" : "0.5"}
              />
            ))}

            {/* Trade dots - NO */}
            {chartData.noPoints.map((point, i) => (
              <circle
                key={`no-${i}`}
                cx={point.x}
                cy={100 - point.y}
                r={Math.min(3, 1 + point.volume * 3)}
                fill="#FF3131"
                opacity={point.isBuy ? "0.8" : "0.4"}
              />
            ))}

            {/* Current price horizontal line (dashed) */}
            <line
              x1="0"
              y1={100 - currentYesPrice}
              x2="100"
              y2={100 - currentYesPrice}
              stroke="#39FF14"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              opacity="0.5"
            />
          </svg>

          {/* Current price indicators */}
          <div className="absolute right-2 top-2 flex flex-col gap-1 text-xs font-mono">
            <div className="flex items-center gap-2 bg-dark-900/90 px-2 py-1 border border-yes/30">
              <div className="w-2 h-2 bg-yes rounded-full animate-pulse" />
              <span className="text-yes font-bold">{currentYesPrice.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2 bg-dark-900/90 px-2 py-1 border border-no/30">
              <div className="w-2 h-2 bg-no rounded-full" />
              <span className="text-no">{currentNoPrice.toFixed(1)}%</span>
            </div>
          </div>

          {/* Trade count & big moves */}
          <div className="absolute left-10 bottom-2 text-xs font-mono text-text-muted flex items-center gap-3">
            <span>{trades.length} trades</span>
            {bigMoves.length > 0 && (
              <span className="text-yes animate-pulse">⚡ {bigMoves.length} big moves</span>
            )}
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

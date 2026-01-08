/**
 * ===== PRICE CHART COMPONENT =====
 *
 * TradingView-style chart placeholder with scanner line animation.
 * In the future, this will show actual price history.
 *
 * @module features/markets/components/PriceChart
 */

import { cn } from '@/shared/utils/cn';

interface PriceChartProps {
  marketId: string;
  className?: string;
}

export function PriceChart({ marketId: _marketId, className }: PriceChartProps) {
  // TODO: Implement actual chart with historical data
  // For now, show a placeholder with scanner line animation

  return (
    <div className={cn('relative h-64 bg-dark-800', className)}>
      {/* Grid lines */}
      <div className="absolute inset-0">
        {/* Horizontal lines */}
        {[0, 25, 50, 75, 100].map((percent) => (
          <div
            key={percent}
            className="absolute left-0 right-0 border-t border-dark-700"
            style={{ top: `${100 - percent}%` }}
          >
            <span className="absolute -left-8 -top-2 text-xs font-mono text-text-muted">
              {percent}%
            </span>
          </div>
        ))}
      </div>

      {/* Placeholder line chart */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {/* YES price line */}
        <polyline
          fill="none"
          stroke="#39FF14"
          strokeWidth="0.5"
          strokeOpacity="0.8"
          points={generateRandomPath(50, 30)}
        />
        {/* NO price line */}
        <polyline
          fill="none"
          stroke="#FF3131"
          strokeWidth="0.5"
          strokeOpacity="0.5"
          points={generateRandomPath(50, 30, true)}
        />
      </svg>

      {/* Scanner line animation */}
      <div className="scanner-line" />

      {/* Legend */}
      <div className="absolute top-2 right-2 flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-yes" />
          <span className="text-yes">YES</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-no" />
          <span className="text-no">NO</span>
        </div>
      </div>

      {/* Coming soon overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-dark-800/50">
        <div className="text-center">
          <p className="text-text-muted font-mono text-sm">📊 LIVE CHART</p>
          <p className="text-text-muted text-xs mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  );
}

// Generate a random-looking path for placeholder
function generateRandomPath(startY: number, variance: number, invert = false): string {
  const points: string[] = [];
  let y = startY;
  
  for (let x = 0; x <= 100; x += 2) {
    y += (Math.random() - 0.5) * variance * 0.3;
    y = Math.max(10, Math.min(90, y)); // Clamp between 10 and 90
    const displayY = invert ? 100 - y : y;
    points.push(`${x},${100 - displayY}`);
  }
  
  return points.join(' ');
}

export default PriceChart;

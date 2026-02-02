/**
 * ===== LEADERBOARD PAGE =====
 *
 * Shows top 10 traders ranked by total P/L from the subgraph.
 * Simplified view: Rank, Address, Total PNL only.
 *
 * Predator Polling v2:
 * - Fetches ONCE on load, no continuous polling (leaderboard is not real-time critical)
 * - Refetches on tab focus
 *
 * @module features/leaderboard/pages/LeaderboardPage
 */

import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router-dom';
import { GET_LEADERBOARD } from '@/shared/api';
import type { GetLeaderboardResponse } from '@/shared/api';
import { Card } from '@/shared/components/ui/Card';
import { Spinner } from '@/shared/components/ui/Spinner';
import { cn } from '@/shared/utils/cn';
import { useFocusRefetch } from '@/shared/hooks/useSmartPolling';
import { useSEO } from '@/shared/hooks/useSEO';
import { getBscScanAddressUrl } from '@/shared/config/env';

// Rank badge styling
function getRankStyle(rank: number) {
  if (rank === 1) return { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-500', label: '1ST' };
  if (rank === 2) return { bg: 'bg-gray-400/20', border: 'border-gray-400', text: 'text-gray-400', label: '2ND' };
  if (rank === 3) return { bg: 'bg-amber-600/20', border: 'border-amber-600', text: 'text-amber-600', label: '3RD' };
  return { bg: 'bg-dark-800', border: 'border-dark-600', text: 'text-text-muted', label: `#${rank}` };
}

// Format address for display
function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format BNB amount
function formatBNB(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(2)}K`;
  if (Math.abs(num) >= 1) return num.toFixed(2);
  return num.toFixed(4);
}

// Format P/L with color
function formatPnL(value: string | number): { text: string; isPositive: boolean; isZero: boolean } {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return { text: '0.00', isPositive: false, isZero: true };
  const prefix = num > 0 ? '+' : '';
  return { 
    text: `${prefix}${formatBNB(num)}`, 
    isPositive: num > 0, 
    isZero: false 
  };
}

export function LeaderboardPage() {
  // SEO: Set page title
  useSEO({
    title: 'Leaderboard',
    description: 'Top traders ranked by total P/L on JNGLZ.FUN prediction markets. See who\'s winning the jungle.',
    path: '/leaderboard',
  });

  // Predator v2: Fetch ONCE on load, no polling (leaderboard doesn't need real-time updates)
  const { data, loading, error, refetch } = useQuery<GetLeaderboardResponse>(GET_LEADERBOARD, {
    variables: { 
      first: 10,
      orderBy: 'totalPnL',
      orderDirection: 'desc'
    },
    notifyOnNetworkStatusChange: false, // Prevent UI re-renders during refetch
  });

  // Predator v2: Refetch when tab regains focus
  useFocusRefetch(refetch);

  const leaderboard = data?.users || [];

  return (
    <div className="min-h-screen py-6 md:py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="border-b border-dark-600 pb-4 md:pb-6 mb-6 md:mb-8">
          <Link to="/" className="text-cyber hover:underline text-sm mb-3 md:mb-4 inline-block">
            ← Back to Markets
          </Link>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
            <span className="text-cyber">JUNGLE</span> LEADERBOARD
          </h1>
          <p className="text-text-muted text-sm mt-2">
            Top 10 Traders by Total PNL
          </p>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Card className="p-6 md:p-8 text-center">
            <p className="text-4xl mb-4">💀</p>
            <p className="text-text-secondary font-mono">FAILED TO LOAD LEADERBOARD</p>
            <p className="text-no text-sm font-mono mt-2">{error.message}</p>
          </Card>
        ) : leaderboard.length === 0 ? (
          <Card className="p-6 md:p-8 text-center">
            <p className="text-text-secondary font-mono">NO TRADERS YET</p>
            <p className="text-text-muted text-sm mt-2">Be the first to make a trade!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {/* Table Header - Hidden on mobile */}
            <div className="hidden md:flex items-center px-4 py-2 text-xs text-text-muted font-mono uppercase">
              <div className="w-16">RANK</div>
              <div className="flex-1">WALLET</div>
              <div className="text-right w-36">TOTAL PNL</div>
            </div>
            
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const rankStyle = getRankStyle(rank);
              const pnl = formatPnL(entry.totalPnL);

              return (
                <Card 
                  key={entry.id} 
                  className={cn(
                    'p-3 md:p-4 border border-dark-600 transition-all hover:scale-[1.005] hover:border-cyber/50'
                  )}
                >
                  {/* Mobile layout: Stack vertically */}
                  <div className="flex flex-col gap-2 md:hidden">
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        'w-14 h-8 flex items-center justify-center font-black text-xs rounded',
                        rankStyle.bg,
                        rankStyle.text
                      )}>
                        {rankStyle.label}
                      </div>
                      <div className={cn(
                        'text-lg font-black font-mono',
                        pnl.isZero ? 'text-text-muted' : pnl.isPositive ? 'text-yes' : 'text-no'
                      )}>
                        {pnl.text} <span className="text-xs font-normal text-text-muted">BNB</span>
                      </div>
                    </div>
                    <a
                      href={getBscScanAddressUrl(entry.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-white hover:text-cyber transition-colors text-xs"
                    >
                      {formatAddress(entry.address)}
                    </a>
                  </div>

                  {/* Desktop layout: Horizontal */}
                  <div className="hidden md:flex items-center">
                    {/* Rank */}
                    <div className={cn(
                      'w-16 h-10 flex items-center justify-center font-black text-sm rounded mr-4',
                      rankStyle.bg,
                      rankStyle.text
                    )}>
                      {rankStyle.label}
                    </div>

                    {/* Address */}
                    <div className="flex-1 min-w-0">
                      <a
                        href={getBscScanAddressUrl(entry.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-white hover:text-cyber transition-colors text-sm"
                      >
                        {formatAddress(entry.address)}
                      </a>
                    </div>

                    {/* Total PNL */}
                    <div className={cn(
                      'w-36 text-right text-xl font-black font-mono',
                      pnl.isZero ? 'text-text-muted' : pnl.isPositive ? 'text-yes' : 'text-no'
                    )}>
                      {pnl.text} <span className="text-sm font-normal text-text-muted">BNB</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 md:mt-8 p-3 md:p-4 bg-dark-800 border border-dark-600 text-xs text-text-muted text-center">
          <p>
            Total PNL = Trading Profits + Resolution Winnings
          </p>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;

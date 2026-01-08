/**
 * ===== PORTFOLIO PAGE =====
 *
 * Shows user's positions across all markets.
 * Displays P/L, claimable winnings, and trade history.
 *
 * @module features/portfolio/pages/PortfolioPage
 */

import { useAccount } from 'wagmi';
import { useQuery } from '@apollo/client/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { GET_USER_POSITIONS } from '@/shared/api';
import type { GetUserPositionsResponse } from '@/shared/api';
import { PositionCard } from '../components';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Spinner';
import { AddressDisplay } from '@/shared/components/ui/Jazzicon';
import { cn } from '@/shared/utils/cn';
import { Link } from 'react-router-dom';
import type { Position, Market } from '@/shared/schemas';

interface PositionWithMarket extends Position {
  market?: Market;
}

export function PortfolioPage() {
  const { address, isConnected } = useAccount();

  const { data, loading, error } = useQuery<GetUserPositionsResponse>(GET_USER_POSITIONS, {
    variables: { user: address?.toLowerCase(), first: 100 },
    skip: !address,
    pollInterval: 30000,
  });

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-6">🔐</p>
          <h1 className="text-2xl font-bold mb-4">CONNECT WALLET</h1>
          <p className="text-text-secondary mb-6">
            Connect your wallet to view your positions and trading history.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  const positions = (data?.positions || []) as PositionWithMarket[];
  
  // Calculate portfolio stats
  const stats = calculatePortfolioStats(positions);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-dark-600 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">
                PORT<span className="text-cyber">FOLIO</span>
              </h1>
              <div className="mt-2">
                <AddressDisplay address={address!} iconSize={24} />
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-6">
              <StatBox label="POSITIONS" value={stats.totalPositions.toString()} />
              <StatBox 
                label="TOTAL VALUE" 
                value={`${stats.totalValue.toFixed(2)} BNB`}
                highlight
              />
              <StatBox 
                label="P/L" 
                value={`${stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)} BNB`}
                color={stats.totalPnL >= 0 ? 'yes' : 'no'}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Claimable Banner */}
      {stats.claimable > 0 && (
        <section className="bg-yes/10 border-b border-yes py-4">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-yes font-bold">WINNINGS AVAILABLE</p>
                <p className="text-sm text-text-secondary">
                  You have {stats.claimable.toFixed(2)} BNB to claim
                </p>
              </div>
            </div>
            <Button variant="yes">CLAIM ALL</Button>
          </div>
        </section>
      )}

      {/* Positions Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Filter tabs */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-text-muted text-sm font-mono">FILTER:</span>
            <button className="text-sm font-bold text-cyber border-b-2 border-cyber pb-1">
              ALL
            </button>
            <button className="text-sm font-bold text-text-secondary hover:text-white pb-1">
              ACTIVE
            </button>
            <button className="text-sm font-bold text-text-secondary hover:text-white pb-1">
              CLAIMABLE
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <PositionCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error.message} />
          ) : positions.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatBox({ 
  label, 
  value, 
  highlight = false,
  color,
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  color?: 'yes' | 'no';
}) {
  return (
    <div className={cn(
      'text-center px-4 py-2',
      highlight && 'border border-cyber bg-cyber/10'
    )}>
      <p className="text-xs text-text-muted font-mono">{label}</p>
      <p className={cn(
        'text-xl font-bold font-mono',
        color === 'yes' && 'text-yes',
        color === 'no' && 'text-no',
        !color && 'text-white'
      )}>
        {value}
      </p>
    </div>
  );
}

function PositionCardSkeleton() {
  return (
    <Card className="space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-8 w-1/2" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </Card>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-4">💀</p>
      <p className="text-text-secondary font-mono">FAILED TO LOAD POSITIONS</p>
      <p className="text-no text-sm font-mono mt-2">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-6xl mb-4">📭</p>
      <p className="text-xl font-bold text-white mb-2">NO POSITIONS YET</p>
      <p className="text-text-secondary mb-6">
        Start trading to build your portfolio
      </p>
      <Link to="/">
        <Button variant="cyber">EXPLORE MARKETS</Button>
      </Link>
    </div>
  );
}

function calculatePortfolioStats(positions: PositionWithMarket[]) {
  let totalInvested = 0;
  let totalValue = 0;
  let claimable = 0;

  positions.forEach((pos) => {
    const invested = Number(pos.totalInvested || 0) / 1e18;
    totalInvested += invested;

    // Calculate current value based on market prices
    if (pos.market) {
      const yesShares = BigInt(pos.yesShares || '0');
      const noShares = BigInt(pos.noShares || '0');
      const marketYes = BigInt(pos.market.yesShares || '0');
      const marketNo = BigInt(pos.market.noShares || '0');
      const total = marketYes + marketNo;

      if (total > 0n) {
        const yesPrice = Number(marketNo) / Number(total);
        const noPrice = Number(marketYes) / Number(total);
        
        totalValue += (Number(yesShares) / 1e18) * yesPrice;
        totalValue += (Number(noShares) / 1e18) * noPrice;
      }

      // Check if resolved and claimable
      if (pos.market.status === 'Resolved') {
        // Simplified - would need actual resolution outcome
        claimable += invested * 0.5; // Placeholder
      }
    }
  });

  return {
    totalPositions: positions.length,
    totalInvested,
    totalValue,
    totalPnL: totalValue - totalInvested,
    claimable,
  };
}

export default PortfolioPage;

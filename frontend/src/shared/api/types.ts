/**
 * GraphQL Response Types
 *
 * Type definitions for GraphQL query responses.
 * These match the subgraph schema.
 *
 * @module shared/api/types
 */

import type { Market, Trade, Position } from '@/shared/schemas';

// ===== MARKET QUERIES =====

export interface GetMarketsResponse {
  markets: Market[];
}

export interface GetMarketResponse {
  market: Market & {
    trades?: Trade[];
  };
}

export interface GetActiveMarketsResponse {
  markets: Market[];
}

export interface GetTrendingMarketsResponse {
  markets: Market[];
}

// ===== TRADE QUERIES =====

export interface GetRecentTradesResponse {
  trades: Trade[];
}

export interface GetMarketTradesResponse {
  trades: Trade[];
}

export interface GetUserTradesResponse {
  trades: Trade[];
}

// ===== POSITION QUERIES =====

export interface GetUserPositionsResponse {
  positions: Position[];
}

export interface GetClaimablePositionsResponse {
  positions: Position[];
}

export interface GetMarketPositionsResponse {
  positions: Position[];
}

// ===== STATS QUERIES =====

export interface GlobalStats {
  id: string;
  totalMarkets: string;
  totalVolume: string;
  totalTrades: string;
  totalUsers: string;
}

export interface GetGlobalStatsResponse {
  globalStats: GlobalStats | null;
}

export interface UserStats {
  id: string;
  user: string;
  totalTrades: string;
  totalVolume: string;
  totalPnL: string;
  marketsParticipated: string;
}

export interface GetUserStatsResponse {
  userStats: UserStats | null;
}

export interface LeaderboardEntry {
  id: string;
  address: string;
  totalPnL: string;
  tradingPnL: string;
  resolutionPnL: string;
  totalVolume: string;
  totalTrades: string;
  winCount: string;
  lossCount: string;
  winRate: string;
}

export interface GetLeaderboardResponse {
  users: LeaderboardEntry[];
}

// User Earnings (v3.6.1 - Resolution earnings + Creator fees)
export interface UserEarnings {
  id: string;
  totalProposerRewardsEarned: string;
  totalBondEarnings: string;
  totalJuryFeesEarned: string;
  totalCreatorFeesEarned: string;
}

export interface GetUserEarningsResponse {
  user: UserEarnings | null;
}

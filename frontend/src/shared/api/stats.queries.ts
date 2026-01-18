/**
 * ===== STATS GRAPHQL QUERIES =====
 *
 * GraphQL queries for fetching global statistics from The Graph subgraph.
 * Matches subgraph schema exactly.
 *
 * @module shared/api/stats.queries
 */

import { gql } from '@apollo/client';

/**
 * Get global protocol statistics
 */
export const GET_GLOBAL_STATS = gql`
  query GetGlobalStats {
    globalStats(id: "global") {
      id
      totalMarkets
      activeMarkets
      resolvedMarkets
      totalVolume
      totalTrades
      totalUsers
      totalClaimed
      totalRefunded
      disputedMarkets
    }
  }
`;

/**
 * Get user statistics
 */
export const GET_USER_STATS = gql`
  query GetUserStats($user: ID!) {
    user(id: $user) {
      id
      address
      totalTrades
      totalVolume
      marketsCreated
      totalClaimed
      totalRefunded
    }
  }
`;

/**
 * Get user earnings (resolution earnings + creator fees)
 * Separate from P/L - only tracks positive earnings, not losses
 */
export const GET_USER_EARNINGS = gql`
  query GetUserEarnings($user: ID!) {
    user(id: $user) {
      id
      # Resolution Earnings (proposer/disputer/jury)
      totalProposerRewardsEarned
      totalBondEarnings
      totalJuryFeesEarned
      # Creator Fees (separate - passive income)
      totalCreatorFeesEarned
    }
  }
`;

/**
 * Get daily stats for charts
 * Note: This entity may not exist in the subgraph yet
 */
export const GET_DAILY_STATS = gql`
  query GetDailyStats($first: Int = 30) {
    globalStats(id: "global") {
      id
      totalVolume
      totalTrades
      totalMarkets
      activeMarkets
    }
  }
`;

/**
 * Get hourly stats for a specific market (for price charts)
 * Note: We use trades to calculate price history
 */
export const GET_MARKET_HOURLY_STATS = gql`
  query GetMarketHourlyStats($marketId: String!, $first: Int = 168) {
    trades(
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: { market: $marketId }
    ) {
      id
      timestamp
      isYes
      isBuy
      pricePerShare
      bnbAmount
      shares
    }
  }
`;

/**
 * Get leaderboard - top traders by total P/L
 */
export const GET_LEADERBOARD = gql`
  query GetLeaderboard($first: Int = 10, $orderBy: String = "totalPnL", $orderDirection: String = "desc") {
    users(first: $first, orderBy: totalPnL, orderDirection: desc, where: { totalTrades_gt: "0" }) {
      id
      address
      totalTrades
      totalVolume
      totalPnL
      tradingPnL
      resolutionPnL
      winCount
      lossCount
      winRate
    }
  }
`;

/**
 * Get market creators leaderboard
 */
export const GET_TOP_CREATORS = gql`
  query GetTopCreators($first: Int = 20) {
    users(
      first: $first
      orderBy: marketsCreated
      orderDirection: desc
      where: { marketsCreated_gt: "0" }
    ) {
      id
      address
      marketsCreated
      totalVolume
    }
  }
`;

/**
 * API Barrel Export
 *
 * GraphQL queries for The Graph subgraph.
 *
 * @module shared/api
 */

// Market queries
export {
  MARKET_FRAGMENT,
  MARKET_CARD_FRAGMENT,
  GET_MARKETS,
  GET_MARKETS_LIGHT,
  GET_ACTIVE_MARKETS,
  GET_MARKET,
  GET_MARKETS_BY_CREATOR,
  GET_TRENDING_MARKETS,
  GET_RESOLVED_MARKETS,
  GET_DISPUTED_MARKETS,
  SEARCH_MARKETS,
} from './markets.queries';

// Trade queries
export {
  TRADE_FRAGMENT,
  GET_RECENT_TRADES,
  GET_MARKET_TRADES,
  GET_USER_TRADES,
  GET_TICKER_TRADES,
  GET_WHALE_TRADES,
  GET_TRADES_IN_RANGE,
} from './trades.queries';

// Position queries
export {
  POSITION_FRAGMENT,
  GET_USER_POSITIONS,
  GET_USER_ACTIVE_POSITIONS,
  GET_CLAIMABLE_POSITIONS,
  GET_POSITION,
  GET_MARKET_POSITIONS,
  GET_TOP_YES_HOLDERS,
  GET_TOP_NO_HOLDERS,
  GET_CLAIMABLE_JURY_FEES,
} from './positions.queries';

// Stats queries
export {
  GET_GLOBAL_STATS,
  GET_USER_STATS,
  GET_USER_EARNINGS,
  GET_DAILY_STATS,
  GET_MARKET_HOURLY_STATS,
  GET_LEADERBOARD,
  GET_TOP_CREATORS,
} from './stats.queries';

// Response types
export type {
  GetMarketsResponse,
  GetMarketResponse,
  GetActiveMarketsResponse,
  GetTrendingMarketsResponse,
  GetRecentTradesResponse,
  GetMarketTradesResponse,
  GetUserTradesResponse,
  GetUserPositionsResponse,
  GetClaimablePositionsResponse,
  GetMarketPositionsResponse,
  GetGlobalStatsResponse,
  GetUserStatsResponse,
  GetUserEarningsResponse,
  GetLeaderboardResponse,
} from './types';

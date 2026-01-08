/**
 * ===== TRADE GRAPHQL QUERIES =====
 *
 * GraphQL queries for fetching trade data from The Graph subgraph.
 *
 * @module shared/api/trades.queries
 */

import { gql } from '@apollo/client';

/**
 * Trade fragment - common fields
 * Matches subgraph schema exactly
 */
export const TRADE_FRAGMENT = gql`
  fragment TradeFields on Trade {
    id
    market {
      id
      question
    }
    trader {
      id
      address
    }
    traderAddress
    isYes
    isBuy
    shares
    bnbAmount
    pricePerShare
    timestamp
    txHash
    blockNumber
    logIndex
  }
`;

/**
 * Get recent trades across all markets (for live ticker)
 */
export const GET_RECENT_TRADES = gql`
  ${TRADE_FRAGMENT}
  query GetRecentTrades($first: Int = 50) {
    trades(first: $first, orderBy: timestamp, orderDirection: desc) {
      ...TradeFields
    }
  }
`;

/**
 * Get trades for a specific market
 */
export const GET_MARKET_TRADES = gql`
  ${TRADE_FRAGMENT}
  query GetMarketTrades($marketId: String!, $first: Int = 100, $skip: Int = 0) {
    trades(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
      where: { market: $marketId }
    ) {
      ...TradeFields
    }
  }
`;

/**
 * Get trades by a specific user
 */
export const GET_USER_TRADES = gql`
  ${TRADE_FRAGMENT}
  query GetUserTrades($trader: Bytes!, $first: Int = 100, $skip: Int = 0) {
    trades(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
      where: { traderAddress: $trader }
    ) {
      ...TradeFields
    }
  }
`;

/**
 * Get trades for ticker display with market info
 */
export const GET_TICKER_TRADES = gql`
  query GetTickerTrades($first: Int = 20) {
    trades(first: $first, orderBy: timestamp, orderDirection: desc) {
      id
      traderAddress
      isYes
      isBuy
      bnbAmount
      timestamp
      market {
        id
        question
      }
    }
  }
`;

/**
 * Get large trades (whale activity)
 * Trades above a certain BNB threshold
 */
export const GET_WHALE_TRADES = gql`
  ${TRADE_FRAGMENT}
  query GetWhaleTrades($minBnbAmount: BigDecimal!, $first: Int = 50) {
    trades(
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: { bnbAmount_gte: $minBnbAmount }
    ) {
      ...TradeFields
    }
  }
`;

/**
 * Get trades within a time range
 */
export const GET_TRADES_IN_RANGE = gql`
  ${TRADE_FRAGMENT}
  query GetTradesInRange(
    $marketId: String!
    $startTime: BigInt!
    $endTime: BigInt!
    $first: Int = 1000
  ) {
    trades(
      first: $first
      orderBy: timestamp
      orderDirection: asc
      where: {
        market: $marketId
        timestamp_gte: $startTime
        timestamp_lte: $endTime
      }
    ) {
      ...TradeFields
    }
  }
`;

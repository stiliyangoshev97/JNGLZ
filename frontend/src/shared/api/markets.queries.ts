/**
 * ===== MARKET GRAPHQL QUERIES =====
 *
 * GraphQL queries for fetching market data from The Graph subgraph.
 *
 * @module shared/api/markets.queries
 */

import { gql } from '@apollo/client';

/**
 * Market fragment - common fields
 * Matches subgraph schema exactly (v3.1.0)
 */
export const MARKET_FRAGMENT = gql`
  fragment MarketFields on Market {
    id
    marketId
    question
    creator {
      id
      address
    }
    creatorAddress
    evidenceLink
    resolutionRules
    imageUrl
    heatLevel
    virtualLiquidity
    expiryTimestamp
    status
    resolved
    outcome
    proposedOutcome
    proposer
    proposalTimestamp
    proposerBond
    disputer
    disputerBond
    disputeTimestamp
    proposerVoteWeight
    disputerVoteWeight
    totalVoters
    yesShares
    noShares
    poolBalance
    totalVolume
    totalTrades
    createdAt
    createdAtBlock
  }
`;

/**
 * Get all markets with optional filtering
 */
export const GET_MARKETS = gql`
  ${MARKET_FRAGMENT}
  query GetMarkets(
    $first: Int = 50
    $skip: Int = 0
    $orderBy: Market_orderBy = createdAt
    $orderDirection: OrderDirection = desc
    $where: Market_filter
  ) {
    markets(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      ...MarketFields
    }
  }
`;

/**
 * Get active markets only
 */
export const GET_ACTIVE_MARKETS = gql`
  ${MARKET_FRAGMENT}
  query GetActiveMarkets($first: Int = 50, $skip: Int = 0) {
    markets(
      first: $first
      skip: $skip
      orderBy: totalVolume
      orderDirection: desc
      where: { status: "Active" }
    ) {
      ...MarketFields
    }
  }
`;

/**
 * Get a single market by ID
 */
export const GET_MARKET = gql`
  ${MARKET_FRAGMENT}
  query GetMarket($id: ID!) {
    market(id: $id) {
      ...MarketFields
      trades(first: 50, orderBy: timestamp, orderDirection: desc) {
        id
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
      }
      positions(first: 100) {
        id
        user {
          id
          address
        }
        yesShares
        noShares
        totalInvested
        averageYesPrice
        averageNoPrice
        claimed
      }
    }
  }
`;

/**
 * Get markets created by a specific user
 */
export const GET_MARKETS_BY_CREATOR = gql`
  ${MARKET_FRAGMENT}
  query GetMarketsByCreator($creator: Bytes!, $first: Int = 20) {
    markets(
      first: $first
      orderBy: createdAt
      orderDirection: desc
      where: { creatorAddress: $creator }
    ) {
      ...MarketFields
    }
  }
`;

/**
 * Get trending markets (highest volume in last 24h)
 */
export const GET_TRENDING_MARKETS = gql`
  ${MARKET_FRAGMENT}
  query GetTrendingMarkets($first: Int = 10) {
    markets(
      first: $first
      orderBy: totalVolume
      orderDirection: desc
      where: { status: "Active" }
    ) {
      ...MarketFields
    }
  }
`;

/**
 * Get recently resolved markets
 */
export const GET_RESOLVED_MARKETS = gql`
  ${MARKET_FRAGMENT}
  query GetResolvedMarkets($first: Int = 20) {
    markets(
      first: $first
      orderBy: createdAt
      orderDirection: desc
      where: { resolved: true }
    ) {
      ...MarketFields
    }
  }
`;

/**
 * Get disputed markets
 */
export const GET_DISPUTED_MARKETS = gql`
  ${MARKET_FRAGMENT}
  query GetDisputedMarkets($first: Int = 20) {
    markets(
      first: $first
      orderBy: disputeTimestamp
      orderDirection: desc
      where: { status: "Disputed" }
    ) {
      ...MarketFields
    }
  }
`;

/**
 * Search markets by question text
 * Note: Full-text search requires specific subgraph configuration
 */
export const SEARCH_MARKETS = gql`
  ${MARKET_FRAGMENT}
  query SearchMarkets($searchText: String!, $first: Int = 20) {
    marketSearch(text: $searchText, first: $first) {
      ...MarketFields
    }
  }
`;

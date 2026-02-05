/**
 * ===== POSITION GRAPHQL QUERIES =====
 *
 * GraphQL queries for fetching user position data from The Graph subgraph.
 *
 * @module shared/api/positions.queries
 */

import { gql } from '@apollo/client';

/**
 * Position fragment - common fields
 * Matches subgraph schema exactly
 * v3.7.0: Added juryFeesClaimed, juryFeesClaimedAmount
 */
export const POSITION_FRAGMENT = gql`
  fragment PositionFields on Position {
    id
    user {
      id
      address
    }
    market {
      id
      marketId
      question
      status
      resolved
      outcome
      proposedOutcome
      expiryTimestamp
      imageUrl
      yesShares
      noShares
      poolBalance
      virtualLiquidity
      heatLevel
      totalVolume
      createdAt
      proposer
      proposalTimestamp
      proposerBond
      disputer
      disputeTimestamp
      disputerBond
      proposerVoteWeight
      disputerVoteWeight
    }
    yesShares
    noShares
    totalInvested
    totalReturned
    netCostBasis
    averageYesPrice
    averageNoPrice
    claimed
    claimedAmount
    emergencyRefunded
    refundedAmount
    hasVoted
    votedForProposer
    juryFeesClaimed
    juryFeesClaimedAmount
  }
`;

/**
 * Get all positions for a user
 */
export const GET_USER_POSITIONS = gql`
  ${POSITION_FRAGMENT}
  query GetUserPositions($user: String!, $first: Int = 100, $skip: Int = 0) {
    positions(
      first: $first
      skip: $skip
      orderBy: totalInvested
      orderDirection: desc
      where: { user: $user }
    ) {
      ...PositionFields
    }
  }
`;

/**
 * Get active positions for a user (non-resolved markets)
 */
export const GET_USER_ACTIVE_POSITIONS = gql`
  ${POSITION_FRAGMENT}
  query GetUserActivePositions($user: String!, $first: Int = 100) {
    positions(
      first: $first
      orderBy: totalInvested
      orderDirection: desc
      where: { 
        user: $user
        market_: { resolved: false }
      }
    ) {
      ...PositionFields
    }
  }
`;

/**
 * Get positions with claims available (resolved markets)
 */
export const GET_CLAIMABLE_POSITIONS = gql`
  ${POSITION_FRAGMENT}
  query GetClaimablePositions($user: String!, $first: Int = 100) {
    positions(
      first: $first
      orderBy: totalInvested
      orderDirection: desc
      where: { 
        user: $user
        claimed: false
        market_: { resolved: true }
      }
    ) {
      ...PositionFields
    }
  }
`;

/**
 * Get a specific position
 */
export const GET_POSITION = gql`
  ${POSITION_FRAGMENT}
  query GetPosition($id: ID!) {
    position(id: $id) {
      ...PositionFields
    }
  }
`;

/**
 * Get all positions for a market (for displaying top holders)
 */
export const GET_MARKET_POSITIONS = gql`
  ${POSITION_FRAGMENT}
  query GetMarketPositions($marketId: String!, $first: Int = 50) {
    positions(
      first: $first
      orderBy: totalInvested
      orderDirection: desc
      where: { market: $marketId }
    ) {
      ...PositionFields
    }
  }
`;

/**
 * Get top YES holders for a market
 */
export const GET_TOP_YES_HOLDERS = gql`
  ${POSITION_FRAGMENT}
  query GetTopYesHolders($marketId: String!, $first: Int = 10) {
    positions(
      first: $first
      orderBy: yesShares
      orderDirection: desc
      where: { 
        market: $marketId
        yesShares_gt: "0"
      }
    ) {
      ...PositionFields
    }
  }
`;

/**
 * Get top NO holders for a market
 */
export const GET_TOP_NO_HOLDERS = gql`
  ${POSITION_FRAGMENT}
  query GetTopNoHolders($marketId: String!, $first: Int = 10) {
    positions(
      first: $first
      orderBy: noShares
      orderDirection: desc
      where: { 
        market: $marketId
        noShares_gt: "0"
      }
    ) {
      ...PositionFields
    }
  }
`;

/**
 * Get positions with claimable jury fees (v3.7.0)
 * User voted, market resolved, jury fees not yet claimed
 * Note: We filter by hasVoted=true and juryFeesClaimed=false
 * The frontend will need to check if user voted for winning side
 */
export const GET_CLAIMABLE_JURY_FEES = gql`
  ${POSITION_FRAGMENT}
  query GetClaimableJuryFees($user: String!, $first: Int = 100) {
    positions(
      first: $first
      orderBy: totalInvested
      orderDirection: desc
      where: { 
        user: $user
        hasVoted: true
        juryFeesClaimed: false
        market_: { 
          resolved: true
          disputer_not: null
        }
      }
    ) {
      ...PositionFields
    }
  }
`;

/**
 * Get jury fees pools for specific markets (v0.8.24)
 * Used to get the actual pool amount instead of calculating from bonds
 * This fixes the incorrect jury fee estimation bug
 */
export const GET_JURY_FEES_POOLS = gql`
  query GetJuryFeesPools($marketIds: [String!]!) {
    juryFeesPools(
      first: 100
      where: { market_in: $marketIds }
    ) {
      id
      market {
        id
        marketId
      }
      amount
      timestamp
    }
  }
`;

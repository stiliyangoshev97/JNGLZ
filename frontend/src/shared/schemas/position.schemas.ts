/**
 * ===== POSITION SCHEMAS =====
 *
 * Zod schemas for user position data validation.
 * Matches subgraph schema exactly.
 *
 * @module shared/schemas/position
 */

import { z } from 'zod';
import { MarketSchema } from './market.schemas';

/**
 * User entity for positions
 */
export const PositionUserSchema = z.object({
  id: z.string(),
  address: z.string(),
});

/**
 * Market reference in position
 */
export const PositionMarketSchema = z.object({
  id: z.string(),
  question: z.string(),
  status: z.string(),
  resolved: z.boolean(),
  outcome: z.boolean().optional().nullable(),
  expiryTimestamp: z.string(),
});

/**
 * User position entity from the subgraph
 * Matches subgraph schema exactly
 */
export const PositionSchema = z.object({
  id: z.string(), // marketId-userAddress
  user: PositionUserSchema,
  market: PositionMarketSchema,
  yesShares: z.string(), // BigInt as string
  noShares: z.string(),
  totalInvested: z.string(), // BigDecimal - Total BNB invested
  averageYesPrice: z.string(), // BigDecimal - Avg price paid for YES
  averageNoPrice: z.string(), // BigDecimal - Avg price paid for NO
  claimed: z.boolean(),
  claimedAmount: z.string().optional().nullable(),
  emergencyRefunded: z.boolean(),
  refundedAmount: z.string().optional().nullable(),
  hasVoted: z.boolean(),
  votedForProposer: z.boolean().optional().nullable(),
});

export type Position = z.infer<typeof PositionSchema>;

/**
 * Positions list response
 */
export const PositionsResponseSchema = z.object({
  positions: z.array(PositionSchema),
});

export type PositionsResponse = z.infer<typeof PositionsResponseSchema>;

/**
 * User positions response with market data
 */
export const UserPositionsResponseSchema = z.object({
  positions: z.array(
    PositionSchema.extend({
      market: MarketSchema.optional(),
    })
  ),
});

export type UserPositionsResponse = z.infer<typeof UserPositionsResponseSchema>;

/**
 * Computed position data
 */
export const ComputedPositionDataSchema = z.object({
  // Current values
  yesSharesValue: z.number(), // Current BNB value of YES shares
  noSharesValue: z.number(), // Current BNB value of NO shares
  totalCurrentValue: z.number(), // Total current value in BNB
  
  // P/L
  unrealizedPnL: z.number(), // Current value - invested
  unrealizedPnLPercent: z.number(), // As percentage
  
  // Position type
  isYesHolder: z.boolean(),
  isNoHolder: z.boolean(),
  isWhale: z.boolean(), // Large position (e.g., > 10% of pool)
  
  // Claimable
  canClaim: z.boolean(),
  claimableAmount: z.number(),
});

export type ComputedPositionData = z.infer<typeof ComputedPositionDataSchema>;

/**
 * Full position with computed data
 */
export const FullPositionSchema = PositionSchema.extend({
  market: MarketSchema.optional(),
  computed: ComputedPositionDataSchema.optional(),
});

export type FullPosition = z.infer<typeof FullPositionSchema>;

/**
 * Portfolio summary
 */
export const PortfolioSummarySchema = z.object({
  totalPositions: z.number(),
  totalInvested: z.number(), // Total BNB invested
  totalCurrentValue: z.number(), // Current value of all positions
  totalUnrealizedPnL: z.number(),
  totalUnrealizedPnLPercent: z.number(),
  
  // Breakdown
  activePositions: z.number(),
  resolvedPositions: z.number(),
  claimableAmount: z.number(),
});

export type PortfolioSummary = z.infer<typeof PortfolioSummarySchema>;

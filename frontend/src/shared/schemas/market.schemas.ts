/**
 * ===== MARKET SCHEMAS =====
 *
 * Zod schemas for market data validation.
 * These schemas match the subgraph entities and contract data.
 *
 * @module shared/schemas/market
 */

import { z } from 'zod';

/**
 * Market Status enum matching the contract
 */
export const MarketStatusSchema = z.enum([
  'Active',
  'Expired',
  'Proposed',
  'Disputed',
  'VotingEnded',
  'Resolved',
]);

export type MarketStatus = z.infer<typeof MarketStatusSchema>;

/**
 * Creator entity from subgraph
 */
export const CreatorSchema = z.object({
  id: z.string(),
  address: z.string(),
});

/**
 * Market entity from the subgraph
 * Matches subgraph schema exactly
 */
export const MarketSchema = z.object({
  id: z.string(), // Market ID (uint256 as string)
  marketId: z.string(), // On-chain market ID
  question: z.string(),
  creator: CreatorSchema,
  creatorAddress: z.string(), // Address for filtering
  evidenceLink: z.string().optional().nullable(),
  resolutionRules: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  expiryTimestamp: z.string(), // BigInt as string
  status: z.string(),
  resolved: z.boolean(),
  outcome: z.boolean().optional().nullable(),
  
  // Proposal info
  proposedOutcome: z.boolean().optional().nullable(),
  proposer: z.string().optional().nullable(),
  proposerBond: z.string().optional().nullable(),
  proposalProofLink: z.string().optional().nullable(),
  proposalTimestamp: z.string().optional().nullable(),
  
  // Dispute info
  disputer: z.string().optional().nullable(),
  disputerBond: z.string().optional().nullable(),
  disputeTimestamp: z.string().optional().nullable(),
  
  // Voting results
  proposerVoteWeight: z.string(),
  disputerVoteWeight: z.string(),
  totalVoters: z.string(),
  
  // Pool data
  yesShares: z.string(), // BigInt as string
  noShares: z.string(),
  poolBalance: z.string(), // Total BNB in pool
  totalVolume: z.string(),
  totalTrades: z.string(),
  
  // Timestamps
  createdAt: z.string(),
  createdAtBlock: z.string(),
  
  // Relations
  trades: z.array(z.any()).optional(),
  positions: z.array(z.any()).optional(),
  votes: z.array(z.any()).optional(),
});

export type Market = z.infer<typeof MarketSchema>;

/**
 * Market list response from subgraph
 */
export const MarketsResponseSchema = z.object({
  markets: z.array(MarketSchema),
});

export type MarketsResponse = z.infer<typeof MarketsResponseSchema>;

/**
 * Single market response
 */
export const MarketResponseSchema = z.object({
  market: MarketSchema.nullable(),
});

export type MarketResponse = z.infer<typeof MarketResponseSchema>;

/**
 * Market filter options
 */
export const MarketFilterSchema = z.object({
  status: MarketStatusSchema.optional(),
  creator: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'volume', 'liquidity', 'expiration']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type MarketFilter = z.infer<typeof MarketFilterSchema>;

/**
 * Computed market data (calculated from raw data)
 */
export const ComputedMarketDataSchema = z.object({
  yesPercent: z.number(),
  noPercent: z.number(),
  yesPriceBNB: z.number(),
  noPriceBNB: z.number(),
  totalLiquidityBNB: z.number(),
  totalVolumeBNB: z.number(),
  timeRemaining: z.number(), // milliseconds
  isExpired: z.boolean(),
  isActive: z.boolean(),
  isResolved: z.boolean(),
  isDisputed: z.boolean(),
});

export type ComputedMarketData = z.infer<typeof ComputedMarketDataSchema>;

/**
 * Full market with computed data
 */
export const FullMarketSchema = MarketSchema.extend({
  computed: ComputedMarketDataSchema.optional(),
});

export type FullMarket = z.infer<typeof FullMarketSchema>;

/**
 * Create market input - matches contract parameters
 * 
 * NOTE: No "initial liquidity" - the contract uses virtual shares (100 YES + 100 NO)
 * Creator can optionally buy first via createMarketAndBuy()
 */
export const CreateMarketInputSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters').max(500, 'Question too long'),
  evidenceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  resolutionRules: z.string().max(2000, 'Rules too long').optional().or(z.literal('')),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  expiryTimestamp: z.number().int().positive('Must be a future date'),
  // Optional first bet
  wantFirstBet: z.boolean().optional(),
  firstBetSide: z.enum(['yes', 'no']).optional(),
  firstBetAmount: z.string().optional(), // BNB amount as string
});

export type CreateMarketInput = z.infer<typeof CreateMarketInputSchema>;

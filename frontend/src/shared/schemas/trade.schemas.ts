/**
 * ===== TRADE SCHEMAS =====
 *
 * Zod schemas for trade data validation.
 * Matches subgraph schema exactly.
 *
 * @module shared/schemas/trade
 */

import { z } from 'zod';

/**
 * Trader entity from subgraph
 */
export const TraderSchema = z.object({
  id: z.string(),
  address: z.string(),
});

/**
 * Market reference in trade
 */
export const TradeMarketSchema = z.object({
  id: z.string(),
  question: z.string(),
});

/**
 * Trade entity from the subgraph
 * Matches subgraph schema exactly
 */
export const TradeSchema = z.object({
  id: z.string(), // txHash-logIndex
  market: TradeMarketSchema,
  trader: TraderSchema,
  traderAddress: z.string(), // Address for filtering
  isYes: z.boolean(), // YES or NO side
  isBuy: z.boolean(), // Buy or Sell
  shares: z.string(), // BigInt as string
  bnbAmount: z.string(), // BigDecimal as string
  pricePerShare: z.string(), // BNB per share
  timestamp: z.string(),
  txHash: z.string(),
  blockNumber: z.string(),
  logIndex: z.string(),
});

export type Trade = z.infer<typeof TradeSchema>;

/**
 * Trades list response
 */
export const TradesResponseSchema = z.object({
  trades: z.array(TradeSchema),
});

export type TradesResponse = z.infer<typeof TradesResponseSchema>;

/**
 * Trade type enum (for UI)
 */
export const TradeTypeSchema = z.enum([
  'BuyYes',
  'BuyNo',
  'SellYes',
  'SellNo',
]);

export type TradeType = z.infer<typeof TradeTypeSchema>;

/**
 * Trade preview (before execution)
 */
export const TradePreviewSchema = z.object({
  tradeType: TradeTypeSchema,
  inputAmount: z.string(), // BNB or shares depending on direction
  outputAmount: z.string(), // Shares or BNB depending on direction
  priceImpact: z.number(), // Percentage
  effectivePrice: z.number(), // Price per share
  fee: z.string(), // Fee amount
  minOutput: z.string(), // After slippage
});

export type TradePreview = z.infer<typeof TradePreviewSchema>;

/**
 * Trade input for executing a trade
 */
export const TradeInputSchema = z.object({
  marketId: z.string(),
  tradeType: TradeTypeSchema,
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Amount must be a positive number'),
  slippage: z.number().min(0).max(50).default(1), // Percentage
});

export type TradeInput = z.infer<typeof TradeInputSchema>;

/**
 * Recent trade for ticker display
 */
export const TickerTradeSchema = z.object({
  id: z.string(),
  market: TradeMarketSchema,
  traderAddress: z.string(),
  isYes: z.boolean(),
  isBuy: z.boolean(),
  bnbAmount: z.string(),
  timestamp: z.string(),
});

export type TickerTrade = z.infer<typeof TickerTradeSchema>;

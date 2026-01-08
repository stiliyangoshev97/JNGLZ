/**
 * Schemas Barrel Export
 *
 * @module shared/schemas
 */

// Market schemas
export {
  MarketStatusSchema,
  MarketSchema,
  MarketsResponseSchema,
  MarketResponseSchema,
  MarketFilterSchema,
  ComputedMarketDataSchema,
  FullMarketSchema,
  CreateMarketInputSchema,
  type MarketStatus,
  type Market,
  type MarketsResponse,
  type MarketResponse,
  type MarketFilter,
  type ComputedMarketData,
  type FullMarket,
  type CreateMarketInput,
} from './market.schemas';

// Trade schemas
export {
  TradeTypeSchema,
  TradeSchema,
  TradesResponseSchema,
  TradePreviewSchema,
  TradeInputSchema,
  TickerTradeSchema,
  type TradeType,
  type Trade,
  type TradesResponse,
  type TradePreview,
  type TradeInput,
  type TickerTrade,
} from './trade.schemas';

// Position schemas
export {
  PositionSchema,
  PositionsResponseSchema,
  UserPositionsResponseSchema,
  ComputedPositionDataSchema,
  FullPositionSchema,
  PortfolioSummarySchema,
  type Position,
  type PositionsResponse,
  type UserPositionsResponse,
  type ComputedPositionData,
  type FullPosition,
  type PortfolioSummary,
} from './position.schemas';

// User schemas
export {
  UserSchema,
  UserResponseSchema,
  UserProfileSchema,
  UserBadgeSchema,
  AdminAddressSchema,
  isAdminAddress,
  type User,
  type UserResponse,
  type UserProfile,
  type UserBadge,
  type AdminAddress,
} from './user.schemas';

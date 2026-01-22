/**
 * Shared Hooks Barrel Export
 *
 * @module shared/hooks
 */

export {
  useChainValidation,
  useCanTrade,
  useValidatedAction,
  type ChainValidationState,
  type ChainValidationActions,
  type UseChainValidationReturn,
} from './useChainValidation';

// Contract Read Hooks
export {
  useMarketCreationFee,
  useProposerRewardBps,
  useContractPaused,
  useYesPrice,
  useNoPrice,
  useMarketPrices,
  usePreviewBuy,
  usePreviewSell,
  usePosition,
  useRequiredBond,
  useMaxSellableShares,
  // Pull Pattern (v3.4.0)
  usePendingWithdrawal,
  usePendingCreatorFees,
  usePendingWithdrawals,
} from './useContractReads';

// Contract Write Hooks
export {
  useCreateMarket,
  useCreateMarketAndBuy,
  useBuyYes,
  useBuyNo,
  useSellYes,
  useSellNo,
  useProposeOutcome,
  useDispute,
  useVote,
  useFinalizeMarket,
  useClaim,
  useEmergencyRefund,
  // Pull Pattern (v3.4.0)
  useWithdrawBond,
  useWithdrawCreatorFees,
  // Jury Fees (v3.7.0)
  useClaimJuryFees,
} from './useContractWrites';

// Smart Hooks
export { useSmartClaim } from './useSmartClaim';

// Smart Polling (Predator v2 - intelligent rate limit protection)
export {
  usePageVisibility,
  useSmartPollInterval,
  useFocusRefetch,
  useMarketPollInterval,
  useImmediateRefetch,
  useTradeRefetch,
  getMarketTemperature,
  getTemperatureInterval,
  POLL_INTERVALS,
  calculateDailyQueries,
  type MarketTemperature,
} from './useSmartPolling';

// Optimistic Trade Hooks (v3.4.1 - instant UI feedback)
export {
  useOptimisticTrade,
  useOptimisticPosition,
} from './useOptimisticTrade';

export {
  useBuyYesOptimistic,
  useBuyNoOptimistic,
  useSellYesOptimistic,
  useSellNoOptimistic,
} from './useTradeWithOptimism';

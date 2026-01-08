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
  useYesPrice,
  useNoPrice,
  useMarketPrices,
  usePreviewBuy,
  usePreviewSell,
  usePosition,
  useRequiredBond,
  useMaxSellableShares,
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
} from './useContractWrites';

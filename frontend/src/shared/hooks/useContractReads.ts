/**
 * ===== CONTRACT READ HOOKS =====
 *
 * Wagmi hooks for reading data from the PredictionMarket contract.
 *
 * @module shared/hooks/useContractReads
 */

import { useReadContract } from 'wagmi';
import {
  PREDICTION_MARKET_ADDRESS,
  PREDICTION_MARKET_ABI,
} from '@/shared/config/contracts';

/**
 * Get current market creation fee (defaults to 0)
 */
export function useMarketCreationFee() {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'marketCreationFee',
  });
}

/**
 * Get YES price for a market
 */
export function useYesPrice(marketId: bigint | undefined) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getYesPrice',
    args: marketId !== undefined ? [marketId] : undefined,
    query: {
      enabled: marketId !== undefined,
    },
  });
}

/**
 * Get NO price for a market
 */
export function useNoPrice(marketId: bigint | undefined) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getNoPrice',
    args: marketId !== undefined ? [marketId] : undefined,
    query: {
      enabled: marketId !== undefined,
    },
  });
}

/**
 * Get both YES and NO prices for a market
 */
export function useMarketPrices(marketId: bigint | undefined) {
  const yesResult = useYesPrice(marketId);
  const noResult = useNoPrice(marketId);

  return {
    yesPrice: yesResult.data as bigint | undefined,
    noPrice: noResult.data as bigint | undefined,
    isLoading: yesResult.isLoading || noResult.isLoading,
    refetch: () => {
      yesResult.refetch();
      noResult.refetch();
    },
  };
}

/**
 * Preview buy shares for a given BNB amount
 */
export function usePreviewBuy(
  marketId: bigint | undefined,
  bnbAmount: bigint | undefined,
  isYes: boolean
) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'previewBuy',
    args:
      marketId !== undefined && bnbAmount !== undefined
        ? [marketId, bnbAmount, isYes]
        : undefined,
    query: {
      enabled: marketId !== undefined && bnbAmount !== undefined && bnbAmount > 0n,
    },
  });
}

/**
 * Preview sell BNB return for a given share amount
 */
export function usePreviewSell(
  marketId: bigint | undefined,
  shares: bigint | undefined,
  isYes: boolean
) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'previewSell',
    args:
      marketId !== undefined && shares !== undefined
        ? [marketId, shares, isYes]
        : undefined,
    query: {
      enabled: marketId !== undefined && shares !== undefined && shares > 0n,
    },
  });
}

/**
 * Get user's position in a market
 */
export function usePosition(marketId: bigint | undefined, userAddress: `0x${string}` | undefined) {
  const result = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getPosition',
    args:
      marketId !== undefined && userAddress
        ? [marketId, userAddress]
        : undefined,
    query: {
      enabled: marketId !== undefined && !!userAddress,
    },
  });

  // Parse the result tuple
  const data = result.data as [bigint, bigint, boolean, boolean, boolean, boolean] | undefined;

  return {
    ...result,
    position: data
      ? {
          yesShares: data[0],
          noShares: data[1],
          claimed: data[2],
          emergencyRefunded: data[3],
          hasVoted: data[4],
          votedForProposer: data[5],
        }
      : undefined,
  };
}

/**
 * Get required bond for proposing/disputing
 */
export function useRequiredBond(marketId: bigint | undefined) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getRequiredBond',
    args: marketId !== undefined ? [marketId] : undefined,
    query: {
      enabled: marketId !== undefined,
    },
  });
}

/**
 * Get max sellable shares (limited by pool liquidity)
 */
export function useMaxSellableShares(marketId: bigint | undefined, userShares: bigint | undefined, isYes: boolean) {
  const result = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getMaxSellableShares',
    args: marketId !== undefined && userShares !== undefined ? [marketId, userShares, isYes] : undefined,
    query: {
      enabled: marketId !== undefined && userShares !== undefined && userShares > 0n,
    },
  });

  const data = result.data as [bigint, bigint] | undefined;

  return {
    ...result,
    maxShares: data?.[0],
    bnbOut: data?.[1],
  };
}

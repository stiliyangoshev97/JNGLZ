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
 * Get current proposer reward percentage (in basis points)
 * Default is 50 bps = 0.5% of pool
 */
export function useProposerRewardBps() {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'proposerRewardBps',
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
      // Refetch more frequently to catch updates
      refetchInterval: 10000,
    },
  });

  // Parse the result tuple
  const data = result.data as [bigint, bigint, boolean, boolean, boolean, boolean, boolean] | undefined;

  return {
    ...result,
    position: data
      ? {
          yesShares: data[0],
          noShares: data[1],
          claimed: data[2],
          emergencyRefunded: data[3],
          hasVoted: data[4],
          votedOutcome: data[5],
          juryFeesClaimed: data[6],
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

// ============ Pull Pattern Reads (v3.4.0) ============

/**
 * Get pending bond/jury fee withdrawals for an address
 * 
 * Contract: getPendingWithdrawal(address)
 * Returns: amount in wei that can be withdrawn via withdrawBond()
 */
export function usePendingWithdrawal(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getPendingWithdrawal',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

/**
 * Get pending creator fees for an address
 * 
 * Contract: getPendingCreatorFees(address)
 * Returns: amount in wei that can be withdrawn via withdrawCreatorFees()
 */
export function usePendingCreatorFees(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getPendingCreatorFees',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

/**
 * Get both pending withdrawals for a user (bonds + creator fees)
 * 
 * Combines usePendingWithdrawal and usePendingCreatorFees
 */
export function usePendingWithdrawals(userAddress: `0x${string}` | undefined) {
  const bondResult = usePendingWithdrawal(userAddress);
  const creatorResult = usePendingCreatorFees(userAddress);

  return {
    pendingBonds: bondResult.data as bigint | undefined,
    pendingCreatorFees: creatorResult.data as bigint | undefined,
    totalPending: 
      ((bondResult.data as bigint) || 0n) + ((creatorResult.data as bigint) || 0n),
    isLoading: bondResult.isLoading || creatorResult.isLoading,
    refetch: () => {
      bondResult.refetch();
      creatorResult.refetch();
    },
  };
}

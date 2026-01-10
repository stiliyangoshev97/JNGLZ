/**
 * ===== OPTIMISTIC TRADE HOOK =====
 *
 * Provides instant UI feedback for trades with automatic rollback on failure.
 * Uses Apollo Cache modification with proper error handling.
 *
 * Strategy:
 * 1. User clicks "Buy" → Optimistic update shows instantly
 * 2. Transaction succeeds → Cache stays as-is, next poll confirms
 * 3. Transaction fails → Automatic rollback to previous state + toast error
 *
 * @module shared/hooks/useOptimisticTrade
 */

import { useCallback, useRef } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { formatEther, parseEther } from 'viem';

// ============ Types ============

interface MarketCacheData {
  __typename: 'Market';
  id: string;
  yesSupply: string;
  noSupply: string;
  poolBalance: string;
  yesPrice: string;
  noPrice: string;
}

interface OptimisticTradeParams {
  marketId: string;
  isYes: boolean;
  isBuy: boolean;
  bnbAmount: string; // Amount in BNB (e.g., "0.1")
  sharesAmount: string; // Shares in wei string
}

interface CacheSnapshot {
  yesSupply: string;
  noSupply: string;
  poolBalance: string;
  yesPrice: string;
  noPrice: string;
}

// ============ Constants ============

const UNIT_PRICE = 0.01; // BNB - P_YES + P_NO always equals this
const PLATFORM_FEE_BPS = 100; // 1%
const CREATOR_FEE_BPS = 50; // 0.5%
const TOTAL_FEE_BPS = PLATFORM_FEE_BPS + CREATOR_FEE_BPS; // 1.5%
const BPS_DENOMINATOR = 10000;

// ============ Price Calculation Helpers ============

/**
 * Calculate YES price from supplies
 * Formula: P_YES = UNIT_PRICE * (yesSupply + vLiq) / (yesSupply + noSupply + 2*vLiq)
 */
function calculateYesPrice(
  yesSupply: bigint,
  noSupply: bigint,
  virtualLiquidity: bigint
): number {
  const virtualYes = yesSupply + virtualLiquidity;
  const virtualNo = noSupply + virtualLiquidity;
  const totalVirtual = virtualYes + virtualNo;

  if (totalVirtual === 0n) return UNIT_PRICE / 2;

  return (UNIT_PRICE * Number(virtualYes)) / Number(totalVirtual);
}

/**
 * Calculate NO price from supplies
 */
function calculateNoPrice(
  yesSupply: bigint,
  noSupply: bigint,
  virtualLiquidity: bigint
): number {
  return UNIT_PRICE - calculateYesPrice(yesSupply, noSupply, virtualLiquidity);
}

// ============ Hook ============

/**
 * Hook for optimistic trade updates with automatic rollback
 *
 * @example
 * ```tsx
 * const { applyOptimisticUpdate, rollback } = useOptimisticTrade();
 *
 * const handleBuy = async () => {
 *   // Apply optimistic update BEFORE sending transaction
 *   const snapshotId = applyOptimisticUpdate({
 *     marketId: '0',
 *     isYes: true,
 *     isBuy: true,
 *     bnbAmount: '0.1',
 *     sharesAmount: previewedShares.toString(),
 *   });
 *
 *   try {
 *     await buyYes({ marketId: 0n, amount: '0.1' });
 *     // Success! Cache will be confirmed by next poll
 *   } catch (error) {
 *     // Transaction failed - rollback optimistic update
 *     rollback(snapshotId);
 *     toast.error('Transaction failed');
 *   }
 * };
 * ```
 */
export function useOptimisticTrade() {
  const client = useApolloClient();

  // Store snapshots for rollback (keyed by unique ID)
  const snapshotsRef = useRef<Map<string, { marketId: string; data: CacheSnapshot }>>(
    new Map()
  );

  /**
   * Apply optimistic update to Apollo cache
   * Returns a snapshot ID for potential rollback
   */
  const applyOptimisticUpdate = useCallback(
    (params: OptimisticTradeParams): string => {
      const { marketId, isYes, isBuy, bnbAmount, sharesAmount } = params;

      // Generate unique snapshot ID
      const snapshotId = `${marketId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Read current cache data
      const cacheId = `Market:${marketId}`;

      try {
        // Take snapshot BEFORE modification
        const cacheData = client.cache.extract() as Record<string, unknown>;
        const currentData = cacheData[cacheId] as MarketCacheData | undefined;

        if (!currentData) {
          console.warn(`[OptimisticTrade] Market ${marketId} not in cache, skipping optimistic update`);
          return snapshotId;
        }

        // Store snapshot for potential rollback
        snapshotsRef.current.set(snapshotId, {
          marketId,
          data: {
            yesSupply: currentData.yesSupply,
            noSupply: currentData.noSupply,
            poolBalance: currentData.poolBalance,
            yesPrice: currentData.yesPrice,
            noPrice: currentData.noPrice,
          },
        });

        // Calculate new values
        const currentYesSupply = BigInt(currentData.yesSupply);
        const currentNoSupply = BigInt(currentData.noSupply);
        const currentPoolBalance = BigInt(currentData.poolBalance);
        const shares = BigInt(sharesAmount);
        const bnbWei = parseEther(bnbAmount);

        // Calculate fee-adjusted amount
        const feeAmount = (bnbWei * BigInt(TOTAL_FEE_BPS)) / BigInt(BPS_DENOMINATOR);
        const amountAfterFee = bnbWei - feeAmount;

        let newYesSupply = currentYesSupply;
        let newNoSupply = currentNoSupply;
        let newPoolBalance = currentPoolBalance;

        if (isBuy) {
          // BUY: Add shares, add BNB to pool (after fees)
          if (isYes) {
            newYesSupply = currentYesSupply + shares;
          } else {
            newNoSupply = currentNoSupply + shares;
          }
          newPoolBalance = currentPoolBalance + amountAfterFee;
        } else {
          // SELL: Remove shares, remove BNB from pool (gross, before fees)
          // Note: For sells, bnbAmount is the gross output before fees
          const grossBnbWei = parseEther(bnbAmount);
          if (isYes) {
            newYesSupply = currentYesSupply - shares;
          } else {
            newNoSupply = currentNoSupply - shares;
          }
          newPoolBalance = currentPoolBalance - grossBnbWei;
        }

        // Estimate virtual liquidity (default to HIGH = 20)
        // In production, you'd read this from the market entity
        const virtualLiquidity = BigInt('20000000000000000000'); // 20 * 1e18

        // Calculate new prices
        const newYesPrice = calculateYesPrice(newYesSupply, newNoSupply, virtualLiquidity);
        const newNoPrice = calculateNoPrice(newYesSupply, newNoSupply, virtualLiquidity);

        // Apply optimistic update to cache
        client.cache.modify({
          id: cacheId,
          fields: {
            yesSupply: () => newYesSupply.toString(),
            noSupply: () => newNoSupply.toString(),
            poolBalance: () => newPoolBalance.toString(),
            yesPrice: () => newYesPrice.toFixed(18),
            noPrice: () => newNoPrice.toFixed(18),
          },
        });

        console.log(`[OptimisticTrade] Applied optimistic update for market ${marketId}`, {
          action: isBuy ? 'BUY' : 'SELL',
          side: isYes ? 'YES' : 'NO',
          shares: formatEther(shares),
          bnb: bnbAmount,
          newYesSupply: formatEther(newYesSupply),
          newNoSupply: formatEther(newNoSupply),
          newPoolBalance: formatEther(newPoolBalance),
        });

        return snapshotId;
      } catch (error) {
        console.error('[OptimisticTrade] Failed to apply optimistic update:', error);
        return snapshotId;
      }
    },
    [client]
  );

  /**
   * Rollback an optimistic update using the snapshot ID
   */
  const rollback = useCallback(
    (snapshotId: string): boolean => {
      const snapshot = snapshotsRef.current.get(snapshotId);

      if (!snapshot) {
        console.warn(`[OptimisticTrade] No snapshot found for ID: ${snapshotId}`);
        return false;
      }

      const { marketId, data } = snapshot;
      const cacheId = `Market:${marketId}`;

      try {
        client.cache.modify({
          id: cacheId,
          fields: {
            yesSupply: () => data.yesSupply,
            noSupply: () => data.noSupply,
            poolBalance: () => data.poolBalance,
            yesPrice: () => data.yesPrice,
            noPrice: () => data.noPrice,
          },
        });

        // Clean up snapshot
        snapshotsRef.current.delete(snapshotId);

        console.log(`[OptimisticTrade] Rolled back optimistic update for market ${marketId}`);
        return true;
      } catch (error) {
        console.error('[OptimisticTrade] Failed to rollback:', error);
        return false;
      }
    },
    [client]
  );

  /**
   * Clear a snapshot after successful transaction (cleanup)
   */
  const confirmUpdate = useCallback((snapshotId: string) => {
    snapshotsRef.current.delete(snapshotId);
    console.log(`[OptimisticTrade] Confirmed update, cleared snapshot: ${snapshotId}`);
  }, []);

  /**
   * Force refetch a market from the network
   * Use after a failed optimistic update to ensure fresh data
   */
  const refetchMarket = useCallback(
    async (marketId: string) => {
      await client.refetchQueries({
        include: ['GetMarket', 'GetMarkets'],
      });
      console.log(`[OptimisticTrade] Refetched market data for ${marketId}`);
    },
    [client]
  );

  return {
    applyOptimisticUpdate,
    rollback,
    confirmUpdate,
    refetchMarket,
  };
}

// ============ Utility: Optimistic User Position Update ============

/**
 * Hook for optimistic position updates
 * Updates the user's position in cache after a trade
 */
export function useOptimisticPosition() {
  const client = useApolloClient();
  const snapshotsRef = useRef<Map<string, { positionId: string; data: any }>>(new Map());

  const applyOptimisticPositionUpdate = useCallback(
    (params: {
      marketId: string;
      userAddress: string;
      isYes: boolean;
      isBuy: boolean;
      sharesAmount: string;
    }): string => {
      const { marketId, userAddress, isYes, isBuy, sharesAmount } = params;
      const snapshotId = `pos-${marketId}-${userAddress}-${Date.now()}`;

      // Position cache ID format depends on your schema
      const positionId = `Position:${marketId}-${userAddress.toLowerCase()}`;

      try {
        const cacheData = client.cache.extract() as Record<string, unknown>;
        const currentData = cacheData[positionId];

        if (currentData) {
          snapshotsRef.current.set(snapshotId, {
            positionId,
            data: { ...currentData },
          });

          const shares = BigInt(sharesAmount);
          const delta = isBuy ? shares : -shares;

          client.cache.modify({
            id: positionId,
            fields: {
              yesShares: (prev: string) =>
                isYes ? (BigInt(prev) + delta).toString() : prev,
              noShares: (prev: string) =>
                !isYes ? (BigInt(prev) + delta).toString() : prev,
            },
          });
        }

        return snapshotId;
      } catch (error) {
        console.error('[OptimisticPosition] Failed to update:', error);
        return snapshotId;
      }
    },
    [client]
  );

  const rollbackPosition = useCallback(
    (snapshotId: string) => {
      const snapshot = snapshotsRef.current.get(snapshotId);
      if (!snapshot) return;

      try {
        client.cache.writeFragment({
          id: snapshot.positionId,
          fragment: {
            kind: 'Document',
            definitions: [],
          } as any,
          data: snapshot.data,
        });
        snapshotsRef.current.delete(snapshotId);
      } catch (error) {
        console.error('[OptimisticPosition] Rollback failed:', error);
      }
    },
    [client]
  );

  return {
    applyOptimisticPositionUpdate,
    rollbackPosition,
  };
}

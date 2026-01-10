/**
 * ===== TRADE WITH OPTIMISTIC UI HOOK =====
 *
 * Combines contract writes with optimistic cache updates.
 * Provides instant UI feedback with automatic rollback on failure.
 *
 * @module shared/hooks/useTradeWithOptimism
 */

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useOptimisticTrade, useOptimisticPosition } from './useOptimisticTrade';
import {
  PREDICTION_MARKET_ADDRESS,
  PREDICTION_MARKET_ABI,
} from '@/shared/config/contracts';

// ============ Types ============

interface TradeParams {
  marketId: bigint;
  amount: string; // BNB amount as string
  minSharesOut?: bigint;
  // For optimistic updates (get from previewBuy)
  expectedShares?: string; // Shares in wei string
}

interface SellParams {
  marketId: bigint;
  shares: bigint;
  minBnbOut?: bigint;
  // For optimistic updates (get from previewSell)
  expectedBnb?: string; // BNB in string format
}

type TradeStatus = 'idle' | 'optimistic' | 'pending' | 'confirming' | 'success' | 'error';

// ============ Hook ============

/**
 * Buy YES shares with optimistic UI update
 *
 * @example
 * ```tsx
 * const { buyYesOptimistic, status, error } = useBuyYesOptimistic();
 *
 * const handleBuy = async () => {
 *   const preview = await previewBuy(marketId, amount, true);
 *   await buyYesOptimistic({
 *     marketId: BigInt(market.id),
 *     amount: '0.1',
 *     expectedShares: preview.toString(),
 *   });
 * };
 * ```
 */
export function useBuyYesOptimistic() {
  const [status, setStatus] = useState<TradeStatus>('idle');
  const [_snapshotId, setSnapshotId] = useState<string | null>(null);

  const { writeContractAsync, data: hash, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { applyOptimisticUpdate, rollback, confirmUpdate, refetchMarket } = useOptimisticTrade();
  const { applyOptimisticPositionUpdate, rollbackPosition } = useOptimisticPosition();

  const buyYesOptimistic = useCallback(
    async (params: TradeParams & { userAddress?: string }) => {
      const { marketId, amount, minSharesOut, expectedShares, userAddress } = params;

      setStatus('optimistic');

      // Apply optimistic updates if we have expected values
      let marketSnapshotId: string | null = null;
      let positionSnapshotId: string | null = null;

      if (expectedShares) {
        marketSnapshotId = applyOptimisticUpdate({
          marketId: marketId.toString(),
          isYes: true,
          isBuy: true,
          bnbAmount: amount,
          sharesAmount: expectedShares,
        });
        setSnapshotId(marketSnapshotId);

        if (userAddress) {
          positionSnapshotId = applyOptimisticPositionUpdate({
            marketId: marketId.toString(),
            userAddress,
            isYes: true,
            isBuy: true,
            sharesAmount: expectedShares,
          });
        }
      }

      try {
        setStatus('pending');

        // Send transaction
        await writeContractAsync({
          address: PREDICTION_MARKET_ADDRESS,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'buyYes',
          args: [marketId, minSharesOut || 0n],
          value: parseEther(amount),
        });

        setStatus('confirming');

        // Transaction submitted! Wait for confirmation handled by useWaitForTransactionReceipt
        // The optimistic update stays - next poll will confirm or the component can watch isSuccess

        // Cleanup snapshot (keep optimistic data)
        if (marketSnapshotId) {
          confirmUpdate(marketSnapshotId);
        }

        setStatus('success');
      } catch (err) {
        console.error('[BuyYesOptimistic] Transaction failed:', err);

        // ROLLBACK on failure
        if (marketSnapshotId) {
          rollback(marketSnapshotId);
        }
        if (positionSnapshotId) {
          rollbackPosition(positionSnapshotId);
        }

        // Force refetch to ensure fresh data
        await refetchMarket(marketId.toString());

        setStatus('error');
        throw err;
      }
    },
    [
      writeContractAsync,
      applyOptimisticUpdate,
      applyOptimisticPositionUpdate,
      rollback,
      rollbackPosition,
      confirmUpdate,
      refetchMarket,
    ]
  );

  const resetTrade = useCallback(() => {
    setStatus('idle');
    setSnapshotId(null);
    reset();
  }, [reset]);

  return {
    buyYesOptimistic,
    status,
    hash,
    isConfirming,
    isSuccess,
    error,
    reset: resetTrade,
  };
}

/**
 * Buy NO shares with optimistic UI update
 */
export function useBuyNoOptimistic() {
  const [status, setStatus] = useState<TradeStatus>('idle');
  const [_snapshotId, setSnapshotId] = useState<string | null>(null);

  const { writeContractAsync, data: hash, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { applyOptimisticUpdate, rollback, confirmUpdate, refetchMarket } = useOptimisticTrade();
  const { applyOptimisticPositionUpdate, rollbackPosition } = useOptimisticPosition();

  const buyNoOptimistic = useCallback(
    async (params: TradeParams & { userAddress?: string }) => {
      const { marketId, amount, minSharesOut, expectedShares, userAddress } = params;

      setStatus('optimistic');

      let marketSnapshotId: string | null = null;
      let positionSnapshotId: string | null = null;

      if (expectedShares) {
        marketSnapshotId = applyOptimisticUpdate({
          marketId: marketId.toString(),
          isYes: false,
          isBuy: true,
          bnbAmount: amount,
          sharesAmount: expectedShares,
        });
        setSnapshotId(marketSnapshotId);

        if (userAddress) {
          positionSnapshotId = applyOptimisticPositionUpdate({
            marketId: marketId.toString(),
            userAddress,
            isYes: false,
            isBuy: true,
            sharesAmount: expectedShares,
          });
        }
      }

      try {
        setStatus('pending');

        await writeContractAsync({
          address: PREDICTION_MARKET_ADDRESS,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'buyNo',
          args: [marketId, minSharesOut || 0n],
          value: parseEther(amount),
        });

        setStatus('confirming');

        if (marketSnapshotId) {
          confirmUpdate(marketSnapshotId);
        }

        setStatus('success');
      } catch (err) {
        console.error('[BuyNoOptimistic] Transaction failed:', err);

        if (marketSnapshotId) {
          rollback(marketSnapshotId);
        }
        if (positionSnapshotId) {
          rollbackPosition(positionSnapshotId);
        }

        await refetchMarket(marketId.toString());
        setStatus('error');
        throw err;
      }
    },
    [
      writeContractAsync,
      applyOptimisticUpdate,
      applyOptimisticPositionUpdate,
      rollback,
      rollbackPosition,
      confirmUpdate,
      refetchMarket,
    ]
  );

  const resetTrade = useCallback(() => {
    setStatus('idle');
    setSnapshotId(null);
    reset();
  }, [reset]);

  return {
    buyNoOptimistic,
    status,
    hash,
    isConfirming,
    isSuccess,
    error,
    reset: resetTrade,
  };
}

/**
 * Sell YES shares with optimistic UI update
 */
export function useSellYesOptimistic() {
  const [status, setStatus] = useState<TradeStatus>('idle');

  const { writeContractAsync, data: hash, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { applyOptimisticUpdate, rollback, confirmUpdate, refetchMarket } = useOptimisticTrade();
  const { applyOptimisticPositionUpdate, rollbackPosition } = useOptimisticPosition();

  const sellYesOptimistic = useCallback(
    async (params: SellParams & { userAddress?: string }) => {
      const { marketId, shares, minBnbOut, expectedBnb, userAddress } = params;

      setStatus('optimistic');

      let marketSnapshotId: string | null = null;
      let positionSnapshotId: string | null = null;

      if (expectedBnb) {
        marketSnapshotId = applyOptimisticUpdate({
          marketId: marketId.toString(),
          isYes: true,
          isBuy: false,
          bnbAmount: expectedBnb,
          sharesAmount: shares.toString(),
        });

        if (userAddress) {
          positionSnapshotId = applyOptimisticPositionUpdate({
            marketId: marketId.toString(),
            userAddress,
            isYes: true,
            isBuy: false,
            sharesAmount: shares.toString(),
          });
        }
      }

      try {
        setStatus('pending');

        await writeContractAsync({
          address: PREDICTION_MARKET_ADDRESS,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'sellYes',
          args: [marketId, shares, minBnbOut || 0n],
        });

        setStatus('confirming');

        if (marketSnapshotId) {
          confirmUpdate(marketSnapshotId);
        }

        setStatus('success');
      } catch (err) {
        console.error('[SellYesOptimistic] Transaction failed:', err);

        if (marketSnapshotId) {
          rollback(marketSnapshotId);
        }
        if (positionSnapshotId) {
          rollbackPosition(positionSnapshotId);
        }

        await refetchMarket(marketId.toString());
        setStatus('error');
        throw err;
      }
    },
    [
      writeContractAsync,
      applyOptimisticUpdate,
      applyOptimisticPositionUpdate,
      rollback,
      rollbackPosition,
      confirmUpdate,
      refetchMarket,
    ]
  );

  const resetTrade = useCallback(() => {
    setStatus('idle');
    reset();
  }, [reset]);

  return {
    sellYesOptimistic,
    status,
    hash,
    isConfirming,
    isSuccess,
    error,
    reset: resetTrade,
  };
}

/**
 * Sell NO shares with optimistic UI update
 */
export function useSellNoOptimistic() {
  const [status, setStatus] = useState<TradeStatus>('idle');

  const { writeContractAsync, data: hash, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { applyOptimisticUpdate, rollback, confirmUpdate, refetchMarket } = useOptimisticTrade();
  const { applyOptimisticPositionUpdate, rollbackPosition } = useOptimisticPosition();

  const sellNoOptimistic = useCallback(
    async (params: SellParams & { userAddress?: string }) => {
      const { marketId, shares, minBnbOut, expectedBnb, userAddress } = params;

      setStatus('optimistic');

      let marketSnapshotId: string | null = null;
      let positionSnapshotId: string | null = null;

      if (expectedBnb) {
        marketSnapshotId = applyOptimisticUpdate({
          marketId: marketId.toString(),
          isYes: false,
          isBuy: false,
          bnbAmount: expectedBnb,
          sharesAmount: shares.toString(),
        });

        if (userAddress) {
          positionSnapshotId = applyOptimisticPositionUpdate({
            marketId: marketId.toString(),
            userAddress,
            isYes: false,
            isBuy: false,
            sharesAmount: shares.toString(),
          });
        }
      }

      try {
        setStatus('pending');

        await writeContractAsync({
          address: PREDICTION_MARKET_ADDRESS,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'sellNo',
          args: [marketId, shares, minBnbOut || 0n],
        });

        setStatus('confirming');

        if (marketSnapshotId) {
          confirmUpdate(marketSnapshotId);
        }

        setStatus('success');
      } catch (err) {
        console.error('[SellNoOptimistic] Transaction failed:', err);

        if (marketSnapshotId) {
          rollback(marketSnapshotId);
        }
        if (positionSnapshotId) {
          rollbackPosition(positionSnapshotId);
        }

        await refetchMarket(marketId.toString());
        setStatus('error');
        throw err;
      }
    },
    [
      writeContractAsync,
      applyOptimisticUpdate,
      applyOptimisticPositionUpdate,
      rollback,
      rollbackPosition,
      confirmUpdate,
      refetchMarket,
    ]
  );

  const resetTrade = useCallback(() => {
    setStatus('idle');
    reset();
  }, [reset]);

  return {
    sellNoOptimistic,
    status,
    hash,
    isConfirming,
    isSuccess,
    error,
    reset: resetTrade,
  };
}

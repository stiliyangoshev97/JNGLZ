/**
 * ===== SMART CLAIM HOOK =====
 *
 * Handles the claim flow with automatic finalization.
 * If market needs finalizing first, calls finalize then claim.
 *
 * @module shared/hooks/useSmartClaim
 */

import { useState, useCallback, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import {
  PREDICTION_MARKET_ADDRESS,
  PREDICTION_MARKET_ABI,
} from '@/shared/config/contracts';

type ClaimStep = 'idle' | 'checking' | 'finalizing' | 'claiming' | 'success' | 'error';

interface SmartClaimResult {
  smartClaim: (marketId: bigint) => Promise<void>;
  step: ClaimStep;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Smart claim that automatically finalizes market if needed before claiming
 * 
 * Use this instead of separate useFinalizeMarket + useClaim hooks
 * to provide a seamless UX where user just clicks "Claim" once.
 */
export function useSmartClaim(): SmartClaimResult {
  const [step, setStep] = useState<ClaimStep>('idle');
  const [currentMarketId, setCurrentMarketId] = useState<bigint | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [shouldClaim, setShouldClaim] = useState(false);

  // Read market to check if finalization is needed
  const { refetch: refetchMarket } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'getMarket',
    args: currentMarketId !== null ? [currentMarketId] : undefined,
    query: {
      enabled: currentMarketId !== null,
    },
  });

  // Finalize contract call
  const {
    writeContract: writeFinalize,
    data: finalizeHash,
    isPending: isFinalizePending,
    error: finalizeError,
    reset: resetFinalize,
  } = useWriteContract();

  const { isLoading: isFinalizeConfirming, isSuccess: isFinalizeSuccess } = useWaitForTransactionReceipt({
    hash: finalizeHash,
  });

  // Claim contract call
  const {
    writeContract: writeClaim,
    data: claimHash,
    isPending: isClaimPending,
    error: claimError,
    reset: resetClaim,
  } = useWriteContract();

  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  // Main smart claim function
  const smartClaim = useCallback(async (marketId: bigint) => {
    setCurrentMarketId(marketId);
    setError(null);
    setStep('checking');
    setShouldClaim(false);
    
    try {
      // Refetch market state
      const { data: market } = await refetchMarket();
      
      if (!market) {
        throw new Error('Failed to fetch market data');
      }

      // getMarket returns: [question, evidenceLink, resolutionRules, imageUrl, creator, 
      //                     expiryTimestamp, yesShares, noShares, poolBalance, resolved, outcome]
      const resolved = (market as readonly unknown[])[9] as boolean;
      
      if (!resolved) {
        // Need to finalize first
        setStep('finalizing');
        
        writeFinalize({
          address: PREDICTION_MARKET_ADDRESS,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'finalizeMarket',
          args: [marketId],
        });
      } else {
        // Already resolved, proceed to claim
        setStep('claiming');
        
        writeClaim({
          address: PREDICTION_MARKET_ADDRESS,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'claim',
          args: [marketId],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setStep('error');
    }
  }, [refetchMarket, writeFinalize, writeClaim]);

  // Handle finalize success -> trigger claim
  useEffect(() => {
    if (isFinalizeSuccess && step === 'finalizing' && currentMarketId !== null && !shouldClaim) {
      setShouldClaim(true);
      setStep('claiming');
      
      writeClaim({
        address: PREDICTION_MARKET_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'claim',
        args: [currentMarketId],
      });
    }
  }, [isFinalizeSuccess, step, currentMarketId, shouldClaim, writeClaim]);

  // Handle claim success
  useEffect(() => {
    if (isClaimSuccess && step === 'claiming') {
      setStep('success');
    }
  }, [isClaimSuccess, step]);

  // Handle errors
  useEffect(() => {
    if (finalizeError && step === 'finalizing') {
      setError(finalizeError);
      setStep('error');
    }
  }, [finalizeError, step]);

  useEffect(() => {
    if (claimError && step === 'claiming') {
      setError(claimError);
      setStep('error');
    }
  }, [claimError, step]);

  const reset = useCallback(() => {
    setStep('idle');
    setCurrentMarketId(null);
    setError(null);
    setShouldClaim(false);
    resetFinalize();
    resetClaim();
  }, [resetFinalize, resetClaim]);

  return {
    smartClaim,
    step,
    isPending: isFinalizePending || isClaimPending,
    isConfirming: isFinalizeConfirming || isClaimConfirming,
    isSuccess: step === 'success',
    error,
    reset,
  };
}

export default useSmartClaim;

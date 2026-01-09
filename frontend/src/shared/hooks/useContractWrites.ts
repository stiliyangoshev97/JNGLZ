/**
 * ===== CONTRACT WRITE HOOKS =====
 *
 * Wagmi hooks for writing to the PredictionMarket contract.
 * Includes: createMarket, buy/sell, resolution, claims.
 *
 * @module shared/hooks/useContractWrites
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import {
  PREDICTION_MARKET_ADDRESS,
  PREDICTION_MARKET_ABI,
} from '@/shared/config/contracts';

// ============ Market Creation ============

/**
 * Create a new market (without initial buy)
 * 
 * Contract: createMarket(question, evidenceLink, resolutionRules, imageUrl, expiryTimestamp, heatLevel)
 * Note: Market creation is FREE by default (marketCreationFee = 0)
 * Virtual liquidity (100 YES + 100 NO shares) provides initial pricing
 */
export function useCreateMarket() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const createMarket = async (params: {
    question: string;
    evidenceLink?: string;
    resolutionRules?: string;
    imageUrl?: string;
    expiryTimestamp: bigint;
    heatLevel: number; // 0=CRACK, 1=HIGH, 2=PRO
    creationFee?: bigint; // Usually 0
  }) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'createMarket',
      args: [
        params.question,
        params.evidenceLink || '',
        params.resolutionRules || '',
        params.imageUrl || '',
        params.expiryTimestamp,
        params.heatLevel,
      ],
      value: params.creationFee || 0n,
    });
  };

  return {
    createMarket,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    receipt,
    error,
    reset,
  };
}

/**
 * Create market AND buy first shares atomically
 * 
 * Contract: createMarketAndBuy(question, evidenceLink, resolutionRules, imageUrl, expiryTimestamp, heatLevel, buyYesSide, minSharesOut)
 * This guarantees creator is first buyer - impossible to front-run
 * msg.value must cover: marketCreationFee + bet amount (min 0.005 BNB)
 */
export function useCreateMarketAndBuy() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const createMarketAndBuy = async (params: {
    question: string;
    evidenceLink?: string;
    resolutionRules?: string;
    imageUrl?: string;
    expiryTimestamp: bigint;
    heatLevel: number; // 0=CRACK, 1=HIGH, 2=PRO
    buyYesSide: boolean;
    betAmount: string; // BNB as string (e.g., "0.1")
    minSharesOut?: bigint;
    creationFee?: bigint;
  }) => {
    const betAmountWei = parseEther(params.betAmount);
    const totalValue = betAmountWei + (params.creationFee || 0n);
    
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'createMarketAndBuy',
      args: [
        params.question,
        params.evidenceLink || '',
        params.resolutionRules || '',
        params.imageUrl || '',
        params.expiryTimestamp,
        params.heatLevel,
        params.buyYesSide,
        params.minSharesOut || 0n, // 0 = no slippage protection
      ],
      value: totalValue,
    });
  };

  return {
    createMarketAndBuy,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    receipt,
    error,
    reset,
  };
}

// ============ Trading ============

/**
 * Buy YES shares
 * 
 * Contract: buyYes(marketId, minSharesOut) payable
 * Min bet: 0.005 BNB
 * Fees: 1% platform + 0.5% creator = 1.5% total
 */
export function useBuyYes() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyYes = async (params: {
    marketId: bigint;
    amount: string; // BNB as string
    minSharesOut?: bigint;
  }) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'buyYes',
      args: [params.marketId, params.minSharesOut || 0n],
      value: parseEther(params.amount),
    });
  };

  return {
    buyYes,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Buy NO shares
 */
export function useBuyNo() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyNo = async (params: {
    marketId: bigint;
    amount: string;
    minSharesOut?: bigint;
  }) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'buyNo',
      args: [params.marketId, params.minSharesOut || 0n],
      value: parseEther(params.amount),
    });
  };

  return {
    buyNo,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Sell YES shares
 * 
 * Contract: sellYes(marketId, shares, minBnbOut)
 */
export function useSellYes() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const sellYes = async (params: {
    marketId: bigint;
    shares: bigint;
    minBnbOut?: bigint;
  }) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'sellYes',
      args: [params.marketId, params.shares, params.minBnbOut || 0n],
    });
  };

  return {
    sellYes,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Sell NO shares
 */
export function useSellNo() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const sellNo = async (params: {
    marketId: bigint;
    shares: bigint;
    minBnbOut?: bigint;
  }) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'sellNo',
      args: [params.marketId, params.shares, params.minBnbOut || 0n],
    });
  };

  return {
    sellNo,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============ Street Consensus Resolution ============

/**
 * Propose market outcome
 * 
 * Contract: proposeOutcome(marketId, outcome, proofLink) payable
 * Bond: max(0.005 BNB, pool * 1%)
 * Creator has 10 min priority window
 */
export function useProposeOutcome() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const proposeOutcome = async (params: {
    marketId: bigint;
    outcome: boolean; // true = YES wins, false = NO wins
    proofLink: string;
    bond: bigint; // Required bond amount
  }) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'proposeOutcome',
      args: [params.marketId, params.outcome, params.proofLink],
      value: params.bond,
    });
  };

  return {
    proposeOutcome,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Dispute a proposed outcome
 * 
 * Contract: dispute(marketId) payable
 * Bond: 2× proposer's bond
 * Must be within 30 min dispute window
 */
export function useDispute() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const dispute = async (params: {
    marketId: bigint;
    bond: bigint; // 2× proposer's bond + fee buffer
  }) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'dispute',
      args: [params.marketId],
      value: params.bond,
    });
  };

  return {
    dispute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Vote on disputed outcome
 * 
 * Contract: vote(marketId, supportProposer)
 * Weight = YES + NO shares owned
 * 1 hour voting window
 */
export function useVote() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const vote = async (params: {
    marketId: bigint;
    supportProposer: boolean; // true = agree with proposer, false = agree with disputer
  }) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'vote',
      args: [params.marketId, params.supportProposer],
    });
  };

  return {
    vote,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Finalize market after voting/dispute window
 * 
 * Contract: finalizeMarket(marketId)
 * Can be called by anyone after voting ends
 */
export function useFinalizeMarket() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const finalizeMarket = async (marketId: bigint) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'finalizeMarket',
      args: [marketId],
    });
  };

  return {
    finalizeMarket,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============ Claims ============

/**
 * Claim winnings after market resolved
 * 
 * Contract: claim(marketId)
 * Winners get proportional share of pool
 */
export function useClaim() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claim = async (marketId: bigint) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'claim',
      args: [marketId],
    });
  };

  return {
    claim,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Emergency refund if no one proposes within 24h
 * 
 * Contract: emergencyRefund(marketId)
 * Proportional refund based on shares owned
 */
export function useEmergencyRefund() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const emergencyRefund = async (marketId: bigint) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'emergencyRefund',
      args: [marketId],
    });
  };

  return {
    emergencyRefund,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

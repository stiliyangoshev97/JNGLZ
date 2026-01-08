/**
 * ===== CHAIN VALIDATION HOOK =====
 *
 * CRITICAL: Prevents users from getting stuck with unsupported wallets.
 *
 * This hook validates that the connected wallet is on a supported chain (BNB).
 * Wallets like Phantom don't support BNB Chain and users can get stuck
 * unable to disconnect if we don't handle this properly.
 *
 * FEATURES:
 * - Detects wrong network immediately after connection
 * - Provides switch chain functionality
 * - Always allows disconnect even on wrong network
 * - Blocks trading actions when on wrong network
 *
 * @module shared/hooks/useChainValidation
 */

import { useAccount, useChainId, useSwitchChain, useDisconnect } from 'wagmi';
import { useMemo, useCallback } from 'react';
import { isChainSupported, getDefaultChain } from '@/shared/config/wagmi';

export interface ChainValidationState {
  /** Is the user connected to a wallet? */
  isConnected: boolean;
  /** Is the connected chain supported? */
  isChainSupported: boolean;
  /** Is the user on the wrong network? */
  isWrongNetwork: boolean;
  /** Current chain ID (may be undefined) */
  chainId: number | undefined;
  /** The chain ID we want them to switch to */
  targetChainId: number;
  /** Name of the target chain */
  targetChainName: string;
  /** Is a chain switch in progress? */
  isSwitching: boolean;
  /** Error from switch attempt */
  switchError: Error | null;
  /** Can the user perform trading actions? */
  canTrade: boolean;
}

export interface ChainValidationActions {
  /** Switch to the default supported chain */
  switchToSupportedChain: () => Promise<void>;
  /** Disconnect the wallet (always available) */
  disconnect: () => void;
}

export type UseChainValidationReturn = ChainValidationState & ChainValidationActions;

export function useChainValidation(): UseChainValidationReturn {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();
  const { disconnect } = useDisconnect();

  // Get the default/target chain
  const defaultChain = useMemo(() => getDefaultChain(), []);

  // Compute validation state
  const validationState = useMemo((): ChainValidationState => {
    const chainSupported = isChainSupported(chainId);
    const wrongNetwork = isConnected && !chainSupported;

    return {
      isConnected,
      isChainSupported: chainSupported,
      isWrongNetwork: wrongNetwork,
      chainId,
      targetChainId: defaultChain.id,
      targetChainName: defaultChain.name,
      isSwitching,
      switchError: switchError as Error | null,
      // Can only trade if connected AND on supported chain
      canTrade: isConnected && chainSupported,
    };
  }, [isConnected, chainId, defaultChain, isSwitching, switchError]);

  // Switch to supported chain
  const switchToSupportedChain = useCallback(async () => {
    if (!switchChain) {
      console.error('Switch chain not available');
      return;
    }

    try {
      await switchChain({ chainId: defaultChain.id });
    } catch (error) {
      console.error('Failed to switch chain:', error);
      // Don't throw - let the UI handle via switchError state
    }
  }, [switchChain, defaultChain.id]);

  // Disconnect wrapper (always available)
  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return {
    ...validationState,
    switchToSupportedChain,
    disconnect: handleDisconnect,
  };
}

/**
 * Hook to check if trading is allowed
 * Simplified version for components that just need to know if they can trade
 */
export function useCanTrade(): boolean {
  const { canTrade } = useChainValidation();
  return canTrade;
}

/**
 * Hook to get a function that validates before executing trading actions
 * Throws if not on correct network
 */
export function useValidatedAction() {
  const { isConnected, isChainSupported, isWrongNetwork } = useChainValidation();

  return useCallback(
    <T>(action: () => T): T => {
      if (!isConnected) {
        throw new Error('Wallet not connected');
      }
      if (isWrongNetwork || !isChainSupported) {
        throw new Error('Please switch to BNB Chain to continue');
      }
      return action();
    },
    [isConnected, isChainSupported, isWrongNetwork]
  );
}

export default useChainValidation;

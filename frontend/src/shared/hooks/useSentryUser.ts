/**
 * ===== SENTRY USER CONTEXT HOOK =====
 *
 * Syncs wallet connection state with Sentry user context.
 * Call this once at the app level after Web3Provider.
 *
 * @module shared/hooks/useSentryUser
 */

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { setUserContext } from '@/shared/config/sentry';

/**
 * Syncs connected wallet address with Sentry user context.
 * When wallet connects, sets user ID in Sentry.
 * When wallet disconnects, clears user context.
 */
export function useSentryUser() {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      setUserContext(address);
    } else {
      setUserContext(null);
    }
  }, [address, isConnected]);
}

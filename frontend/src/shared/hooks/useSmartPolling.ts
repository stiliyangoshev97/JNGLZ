/**
 * ===== PREDATOR POLLING ENGINE v2 =====
 * 
 * Intelligent polling system that reduces API calls by 80-95%:
 * 
 * 1. Tab Visibility - Stop polling when tab is hidden
 * 2. Focus Refetch - One-time refetch when tab regains focus
 * 3. Market-State Aware - Different intervals based on activity
 * 4. Trade-Triggered - Instant switch to HOT polling after trades
 * 
 * Rate Limit Context:
 * - Production URL: 100,000 queries/month (~3,333/day)
 * - Development URL: 3,000 queries/day
 * 
 * @module shared/hooks/useSmartPolling
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Polling intervals (in milliseconds)
 * PREDATOR v2: More aggressive savings
 */
export const POLL_INTERVALS = {
  /** HOT: Active market with recent trades (15 seconds) */
  HOT: 15000,
  /** WARM: Market with trades in last hour (60 seconds) */
  WARM: 60000,
  /** COLD: No trades in 1+ hour (5 minutes) */
  COLD: 300000,
  /** WATCHING: Expired, awaiting resolution (30 seconds) */
  WATCHING: 30000,
  /** RESOLVED: Never poll - market is done */
  RESOLVED: 0,
  /** MARKET_LIST: Homepage grid (90 seconds - was 30s) */
  MARKET_LIST: 90000,
  /** PORTFOLIO: User positions (2 minutes - was 60s) */
  PORTFOLIO: 120000,
  /** DISABLED: For hidden tabs or resolved markets */
  DISABLED: 0,
  
  // Legacy aliases for backwards compatibility
  MARKET_DETAIL: 15000,
  BACKGROUND: 120000,
  TICKER: 0, // Ticker now fetches ONCE on load, no polling
} as const;

/**
 * Market temperature thresholds (in milliseconds)
 */
const TEMPERATURE_THRESHOLDS = {
  /** Trade within 5 minutes = HOT */
  HOT: 5 * 60 * 1000,
  /** Trade within 1 hour = WARM */
  WARM: 60 * 60 * 1000,
  // Anything older = COLD
} as const;

/**
 * Market status for polling decisions
 */
export type MarketTemperature = 'HOT' | 'WARM' | 'COLD' | 'WATCHING' | 'RESOLVED';

/**
 * Hook to check if the page is currently visible
 * Returns false when user switches tabs, minimizes browser, etc.
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

/**
 * Hook that tracks tab visibility and triggers refetch on focus
 * Returns { isVisible, justBecameVisible }
 */
export function useFocusRefetch(refetchFn?: () => void): { 
  isVisible: boolean; 
  justBecameVisible: boolean;
} {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [justBecameVisible, setJustBecameVisible] = useState(false);
  const wasHidden = useRef(document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const nowVisible = !document.hidden;
      setIsVisible(nowVisible);
      
      // If we were hidden and now visible, trigger refetch
      if (wasHidden.current && nowVisible) {
        setJustBecameVisible(true);
        // Call refetch after a short delay to let React settle
        if (refetchFn) {
          setTimeout(() => refetchFn(), 100);
        }
        // Reset the flag after a tick
        setTimeout(() => setJustBecameVisible(false), 200);
      }
      
      wasHidden.current = document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchFn]);

  return { isVisible, justBecameVisible };
}

/**
 * Determine market temperature based on last trade time and status
 */
export function getMarketTemperature(
  isResolved: boolean,
  isExpired: boolean,
  lastTradeTimestamp?: number | string | null
): MarketTemperature {
  // Resolved markets NEVER poll
  if (isResolved) return 'RESOLVED';
  
  // Expired but not resolved = watching for resolution
  if (isExpired) return 'WATCHING';
  
  // No trades yet = treat as COLD
  if (!lastTradeTimestamp) return 'COLD';
  
  const lastTradeMs = typeof lastTradeTimestamp === 'string' 
    ? Number(lastTradeTimestamp) * 1000 
    : lastTradeTimestamp * 1000;
  const timeSinceLastTrade = Date.now() - lastTradeMs;
  
  if (timeSinceLastTrade < TEMPERATURE_THRESHOLDS.HOT) return 'HOT';
  if (timeSinceLastTrade < TEMPERATURE_THRESHOLDS.WARM) return 'WARM';
  return 'COLD';
}

/**
 * Get poll interval based on market temperature
 */
export function getTemperatureInterval(temperature: MarketTemperature): number {
  switch (temperature) {
    case 'HOT': return POLL_INTERVALS.HOT;
    case 'WARM': return POLL_INTERVALS.WARM;
    case 'COLD': return POLL_INTERVALS.COLD;
    case 'WATCHING': return POLL_INTERVALS.WATCHING;
    case 'RESOLVED': return POLL_INTERVALS.RESOLVED;
    default: return POLL_INTERVALS.WARM;
  }
}

/**
 * Hook that returns the appropriate poll interval based on page visibility
 * Returns 0 (disabled) when page is not visible
 * 
 * @param activeInterval - The interval to use when page is visible
 * @returns The current poll interval (0 if page hidden)
 */
export function useSmartPollInterval(activeInterval: number): number {
  const isVisible = usePageVisibility();
  return isVisible ? activeInterval : 0;
}

/**
 * ===== PREDATOR HOOK: Market-State Aware Polling =====
 * 
 * The main hook for MarketDetailPage. Intelligently adjusts polling based on:
 * - Tab visibility (stop when hidden)
 * - Market resolution status (never poll resolved)
 * - Last trade time (HOT/WARM/COLD)
 * - User activity (refetch on tab focus)
 * 
 * @param market - The market data (needs resolved, expiryTimestamp, lastTradeTime)
 * @param refetchFn - Function to call for manual refetch
 * @returns { pollInterval, temperature, triggerHotMode }
 */
export function useMarketPollInterval(
  market: {
    resolved?: boolean;
    expiryTimestamp?: string | number;
    // We'll track last trade from the trades array
  } | null | undefined,
  lastTradeTimestamp?: number | string | null,
  refetchFn?: () => void
): { 
  pollInterval: number; 
  temperature: MarketTemperature;
  triggerHotMode: () => void;
} {
  const { isVisible } = useFocusRefetch(refetchFn);
  const [forcedHot, setForcedHot] = useState(false);
  const forcedHotTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate market temperature
  const isResolved = market?.resolved ?? false;
  const isExpired = market?.expiryTimestamp 
    ? Number(market.expiryTimestamp) * 1000 < Date.now() 
    : false;
  
  const naturalTemperature = getMarketTemperature(isResolved, isExpired, lastTradeTimestamp);
  
  // If forcedHot is active, override to HOT (unless resolved)
  const temperature = forcedHot && naturalTemperature !== 'RESOLVED' 
    ? 'HOT' 
    : naturalTemperature;
  
  const baseInterval = getTemperatureInterval(temperature);
  
  // Return 0 if tab is hidden
  const pollInterval = isVisible ? baseInterval : 0;

  // Function to trigger HOT mode for 2 minutes (after a trade)
  const triggerHotMode = useCallback(() => {
    // Clear any existing timeout
    if (forcedHotTimeout.current) {
      clearTimeout(forcedHotTimeout.current);
    }
    
    setForcedHot(true);
    
    // Stay in HOT mode for 2 minutes, then revert to natural temperature
    forcedHotTimeout.current = setTimeout(() => {
      setForcedHot(false);
    }, 2 * 60 * 1000);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (forcedHotTimeout.current) {
        clearTimeout(forcedHotTimeout.current);
      }
    };
  }, []);

  return { pollInterval, temperature, triggerHotMode };
}

/**
 * Hook to track if we should do an immediate refetch
 * Used after trades to update UI instantly without waiting for poll
 */
export function useImmediateRefetch() {
  const [shouldRefetch, setShouldRefetch] = useState(false);

  const triggerRefetch = useCallback(() => {
    setShouldRefetch(true);
    // Reset after a tick so the query can pick it up
    setTimeout(() => setShouldRefetch(false), 100);
  }, []);

  return { shouldRefetch, triggerRefetch };
}

/**
 * Hook for delayed refetch after trade (waits for subgraph indexing)
 * Triggers refetch after 3 seconds to catch subgraph update
 */
export function useTradeRefetch(refetchFn: () => void) {
  const triggerTradeRefetch = useCallback(() => {
    // Wait 3 seconds for subgraph to index the new trade
    setTimeout(() => {
      refetchFn();
    }, 3000);
  }, [refetchFn]);

  return { triggerTradeRefetch };
}

/**
 * Calculate daily query budget based on polling intervals
 * Updated for Predator v2 intervals
 */
export function calculateDailyQueries(
  marketDetailPages: number,
  marketListViews: number,
  avgSessionMinutes: number
): number {
  // Assume average market temperature is WARM
  const avgDetailInterval = POLL_INTERVALS.WARM / 1000; // 60s
  const listInterval = POLL_INTERVALS.MARKET_LIST / 1000; // 90s
  
  const queriesPerDetailSession = (avgSessionMinutes * 60) / avgDetailInterval;
  const queriesPerListSession = (avgSessionMinutes * 60) / listInterval;
  const sessionsPerDay = 24 * 60 / avgSessionMinutes;
  
  return Math.round(
    (marketDetailPages * queriesPerDetailSession + 
     marketListViews * queriesPerListSession) * 
    sessionsPerDay * 0.3 // Assume 30% of time tab is active
  );
}

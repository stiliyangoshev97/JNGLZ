/**
 * Smart Polling Hook
 * 
 * Reduces The Graph API calls by:
 * 1. Stopping polling when tab is inactive (saves 70-80% of quota)
 * 2. Using longer intervals for list views vs detail views
 * 3. Providing manual refetch capability for instant updates after trades
 * 
 * Rate Limit Context:
 * - Development URL: 3,000 queries/day
 * - Production URL: 100,000 queries/month
 * 
 * @module shared/hooks/useSmartPolling
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Polling intervals (in milliseconds)
 * Adjusted to stay well under rate limits
 */
export const POLL_INTERVALS = {
  /** Fast polling for individual market pages (15 seconds) */
  MARKET_DETAIL: 15000,
  /** Medium polling for market lists (30 seconds) */
  MARKET_LIST: 30000,
  /** Slow polling for portfolio/background data (60 seconds) */
  BACKGROUND: 60000,
  /** Very slow polling for ticker/non-critical (2 minutes) */
  TICKER: 120000,
  /** Disabled (for use with page visibility) */
  DISABLED: 0,
} as const;

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
 * Calculate daily query budget based on polling intervals
 * Useful for debugging/monitoring
 */
export function calculateDailyQueries(
  marketDetailPages: number,
  marketListViews: number,
  avgSessionMinutes: number
): number {
  const sessionsPerDay = 24 * 60 / avgSessionMinutes;
  const queriesPerDetailSession = (avgSessionMinutes * 60) / (POLL_INTERVALS.MARKET_DETAIL / 1000);
  const queriesPerListSession = (avgSessionMinutes * 60) / (POLL_INTERVALS.MARKET_LIST / 1000);
  
  return Math.round(
    (marketDetailPages * queriesPerDetailSession + 
     marketListViews * queriesPerListSession) * 
    sessionsPerDay * 0.3 // Assume 30% of time tab is active
  );
}

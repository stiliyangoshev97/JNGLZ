/**
 * ===== SENTRY CONFIGURATION =====
 *
 * Error tracking and performance monitoring via Sentry.
 * Only initializes in production when DSN is provided.
 *
 * @module shared/config/sentry
 */

import * as Sentry from '@sentry/react';
import { env } from './env';

/**
 * Initialize Sentry error tracking
 * Only runs if SENTRY_DSN is provided and we're in production
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  // Skip Sentry in development or if DSN is not configured
  if (!dsn || import.meta.env.DEV) {
    console.log('[Sentry] Skipped - no DSN or development mode');
    return;
  }

  Sentry.init({
    dsn,
    
    // Environment based on network
    environment: env.IS_TESTNET ? 'testnet' : 'mainnet',
    
    // App version (can be updated with each release)
    release: `jnglz-frontend@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    
    // Performance Monitoring
    // Capture 10% of transactions for performance monitoring in production
    tracesSampleRate: 0.1,
    
    // Session Replay
    // Capture 10% of sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Only send errors from our domain
    allowUrls: [
      /https?:\/\/(.*)\.jnglz\.fun/,
      /https?:\/\/jnglz\.fun/,
      /https?:\/\/localhost/,
    ],

    // Ignore common non-actionable errors
    ignoreErrors: [
      // Wallet connection errors (common and expected)
      'User rejected the request',
      'User denied transaction signature',
      'MetaMask Tx Signature: User denied',
      'User rejected request',
      'Request rejected',
      
      // Network errors
      'Network Error',
      'Failed to fetch',
      'Load failed',
      'ChunkLoadError',
      
      // Browser extensions
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
    ],

    // Scrub sensitive data
    beforeSend(event) {
      // Remove wallet addresses from breadcrumbs if needed
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.message) {
            // Redact full wallet addresses (keep first/last 4 chars)
            breadcrumb.message = breadcrumb.message.replace(
              /0x[a-fA-F0-9]{40}/g,
              (match) => `${match.slice(0, 6)}...${match.slice(-4)}`
            );
          }
          return breadcrumb;
        });
      }
      return event;
    },
  });

  console.log(`[Sentry] Initialized for ${env.IS_TESTNET ? 'testnet' : 'mainnet'}`);
}

/**
 * Capture a custom error with context
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.error('[Sentry] Would capture:', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(walletAddress: string | null) {
  if (walletAddress) {
    Sentry.setUser({
      id: walletAddress,
      // Only store shortened address
      username: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
) {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
  });
}

// Re-export Sentry components for React integration
export { Sentry };

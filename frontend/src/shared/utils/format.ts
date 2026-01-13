/**
 * Format Utilities
 *
 * Helper functions for formatting data in the UI.
 * Provides consistent formatting for addresses, BNB amounts, percentages, and time.
 *
 * @module shared/utils/format
 */

import { formatUnits } from 'viem';

// ============ Bonding Curve Constants ============
// Default virtual liquidity (CRACK level = 5 BNB)
// Markets can have different levels: CRACK=5e18, HIGH=20e18, PRO=50e18
const DEFAULT_VIRTUAL_LIQUIDITY = 5n * 10n ** 18n;

/**
 * Calculate YES price percentage from share supplies
 * Uses the bonding curve formula: P(YES) = virtualYes / (virtualYes + virtualNo)
 * 
 * @param yesShares - YES share supply (BigInt string from subgraph)
 * @param noShares - NO share supply (BigInt string from subgraph)
 * @param virtualLiquidity - Virtual liquidity (BigInt string from market, defaults to 5e18)
 * @returns YES price as percentage (0-100)
 * 
 * @example calculateYesPercent("100000000000000000000", "100000000000000000000") => 50
 */
export function calculateYesPercent(
  yesShares: string, 
  noShares: string,
  virtualLiquidity?: string
): number {
  const yes = BigInt(yesShares || '0');
  const no = BigInt(noShares || '0');
  const vl = virtualLiquidity ? BigInt(virtualLiquidity) : DEFAULT_VIRTUAL_LIQUIDITY;
  
  // Add virtual liquidity to both sides (matches contract)
  const virtualYes = yes + vl;
  const virtualNo = no + vl;
  const total = virtualYes + virtualNo;
  
  if (total === 0n) return 50;
  
  // YES price = virtualYes / total (as percentage)
  return Number((virtualYes * 100n) / total);
}

/**
 * Calculate NO price percentage from share supplies
 * Uses the bonding curve formula: P(NO) = virtualNo / (virtualYes + virtualNo)
 * 
 * @param yesShares - YES share supply (BigInt string from subgraph)
 * @param noShares - NO share supply (BigInt string from subgraph)
 * @param virtualLiquidity - Virtual liquidity (BigInt string from market, defaults to 5e18)
 * @returns NO price as percentage (0-100)
 */
export function calculateNoPercent(
  yesShares: string, 
  noShares: string,
  virtualLiquidity?: string
): number {
  return 100 - calculateYesPercent(yesShares, noShares, virtualLiquidity);
}

/**
 * Shorten an Ethereum address for display
 * @param address - Full Ethereum address (0x...)
 * @param chars - Number of characters to show on each side (default: 4)
 * @returns Shortened address like "0x1234...5678"
 * 
 * @example formatAddress("0x1234567890abcdef1234567890abcdef12345678") => "0x1234...5678"
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a BigInt as BNB with specified decimals
 * @param value - Value in wei (BigInt) or as decimal string from subgraph
 * @param decimals - Number of decimal places to show (default: 4)
 * @returns Formatted string like "0.0123"
 * 
 * @example formatBNB(10000000000000000n) => "0.0100"
 * @example formatBNB("0.01") => "0.0100"
 */
export function formatBNB(value: bigint | string | undefined, decimals = 4): string {
  if (value === undefined) return '0';
  
  // Handle string (BigDecimal from subgraph - already in BNB units)
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toFixed(decimals);
  }
  
  // Handle BigInt (wei units - needs division by 1e18)
  const formatted = formatUnits(value, 18);
  const num = parseFloat(formatted);
  return num.toFixed(decimals);
}

/**
 * Format a BigInt as BNB number only (no suffix)
 * @param value - Value in wei (BigInt) or as decimal string
 * @param decimals - Number of decimal places to show (default: 4)
 * @returns Formatted number string
 */
export function formatBNBValue(value: bigint | string | undefined, decimals = 4): string {
  if (value === undefined) return '0';
  
  // Handle string (BigDecimal from subgraph)
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toFixed(decimals);
  }
  
  // Handle BigInt
  const formatted = formatUnits(value, 18);
  const num = parseFloat(formatted);
  return num.toFixed(decimals);
}

/**
 * Format shares (from 18 decimals to human readable)
 * @param shares - Shares in wei units (BigInt)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted shares string
 * 
 * @example formatShares(1000000000000000000n) => "1.00"
 */
export function formatShares(shares: bigint | undefined, decimals = 2): string {
  if (shares === undefined) return '0';
  const formatted = formatUnits(shares, 18);
  const num = parseFloat(formatted);
  return num.toFixed(decimals);
}

/**
 * Format a price (0-10000 basis points) as percentage
 * Price in contract is scaled to 0.01 BNB = 10000
 * @param price - Price in contract units
 * @returns Percentage string like "72%"
 * 
 * @example formatPercent(7200n) => "72%"
 */
export function formatPercent(price: bigint | undefined): string {
  if (price === undefined) return '0%';
  // Contract price: 0.01 BNB = 10000 (UNIT_PRICE)
  // So price / 100 = percentage
  const percent = Number(price) / 100;
  return `${Math.round(percent)}%`;
}

/**
 * Format a price as decimal percentage
 * @param price - Price in contract units
 * @param decimals - Number of decimal places
 * @returns Decimal percentage like "72.5"
 */
export function formatPercentDecimal(price: bigint | undefined, decimals = 1): string {
  if (price === undefined) return '0';
  const percent = Number(price) / 100;
  return percent.toFixed(decimals);
}

/**
 * Format relative time from now
 * @param timestamp - Unix timestamp in seconds
 * @returns Relative time string like "2 hours ago" or "in 3 days"
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);

  const minutes = Math.floor(absDiff / 60);
  const hours = Math.floor(absDiff / 3600);
  const days = Math.floor(absDiff / 86400);

  let timeStr: string;
  if (absDiff < 60) {
    timeStr = 'just now';
    return timeStr;
  } else if (minutes < 60) {
    timeStr = `${minutes}m`;
  } else if (hours < 24) {
    timeStr = `${hours}h`;
  } else {
    timeStr = `${days}d`;
  }

  return diff > 0 ? `in ${timeStr}` : `${timeStr} ago`;
}

/**
 * Format time remaining as countdown
 * @param timestamp - Unix timestamp in seconds (expiry time)
 * @returns Countdown string like "2d 5h 30m" or "EXPIRED"
 */
export function formatTimeRemaining(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;

  if (diff <= 0) return 'EXPIRED';

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '< 1m';
}

/**
 * Format a date for display
 * @param timestamp - Unix timestamp in seconds
 * @returns Date string like "Jan 8, 2026"
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date with time
 * @param timestamp - Unix timestamp in seconds
 * @returns DateTime string like "Jan 8, 2026, 2:30 PM"
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a number with thousand separators
 * @param value - Number to format
 * @returns Formatted string like "1,234,567"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format volume in BNB with K/M/B suffixes
 * @param value - Value in wei (BigInt)
 * @returns Formatted string like "1.2K BNB"
 */
export function formatVolume(value: bigint | undefined): string {
  if (value === undefined) return '0 BNB';
  const num = parseFloat(formatUnits(value, 18));
  
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B BNB`;
  } else if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M BNB`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K BNB`;
  } else {
    return `${num.toFixed(2)} BNB`;
  }
}

/**
 * Format blockchain/wallet errors into user-friendly messages
 * @param error - Error object from wagmi/viem
 * @returns User-friendly error message
 */
export function formatError(error: Error | null | undefined): string {
  if (!error) return 'An unknown error occurred';
  
  const message = error.message || String(error);
  
  // User rejected transaction
  if (
    message.includes('User rejected') ||
    message.includes('User denied') ||
    message.includes('user rejected') ||
    message.includes('user denied')
  ) {
    return 'Transaction cancelled';
  }
  
  // Insufficient funds
  if (
    message.includes('insufficient funds') ||
    message.includes('Insufficient funds')
  ) {
    return 'Insufficient BNB balance for this transaction';
  }
  
  // Gas estimation failed
  if (message.includes('gas required exceeds allowance')) {
    return 'Transaction would fail - check your inputs';
  }
  
  // Contract revert errors (common ones)
  if (message.includes('BelowMinBet')) {
    return 'Amount is below minimum bet (0.005 BNB)';
  }
  if (message.includes('SlippageExceeded')) {
    return 'Price moved too much - try again or increase slippage';
  }
  if (message.includes('MarketNotActive')) {
    return 'This market is no longer active';
  }
  if (message.includes('InsufficientShares')) {
    return 'You don\'t have enough shares to sell';
  }
  if (message.includes('InsufficientPoolBalance')) {
    return 'Pool doesn\'t have enough liquidity';
  }
  if (message.includes('InvalidExpiryTimestamp')) {
    return 'Expiry time must be in the future';
  }
  if (message.includes('EmptyQuestion')) {
    return 'Question cannot be empty';
  }
  if (message.includes('InsufficientBond')) {
    return 'Bond amount is too low';
  }
  if (message.includes('AlreadyProposed')) {
    return 'An outcome has already been proposed';
  }
  if (message.includes('AlreadyDisputed')) {
    return 'This market is already disputed';
  }
  if (message.includes('AlreadyVoted')) {
    return 'You have already voted on this market';
  }
  if (message.includes('NoSharesForVoting')) {
    return 'You need shares to vote';
  }
  if (message.includes('AlreadyClaimed')) {
    return 'You have already claimed your winnings';
  }
  if (message.includes('NothingToClaim')) {
    return 'No winnings to claim';
  }
  if (message.includes('NoTradesToResolve')) {
    return 'This market has no trades to resolve';
  }
  
  // Network errors
  if (message.includes('network') || message.includes('Network')) {
    return 'Network error - please check your connection';
  }
  
  // Timeout
  if (message.includes('timeout') || message.includes('Timeout')) {
    return 'Request timed out - please try again';
  }
  
  // Generic contract revert
  if (message.includes('reverted') || message.includes('revert')) {
    // Try to extract the reason
    const match = message.match(/reason="([^"]+)"/);
    if (match) {
      return `Transaction failed: ${match[1]}`;
    }
    return 'Transaction failed - the contract rejected this action';
  }
  
  // If message is very long (raw error), truncate it
  if (message.length > 100) {
    return 'Transaction failed - please try again';
  }
  
  // Return original message if none of the above
  return message;
}

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
// Must match contract constants exactly
const VIRTUAL_LIQUIDITY = 100n * 10n ** 18n; // 100 shares with 18 decimals

/**
 * Calculate YES price percentage from share supplies
 * Uses the bonding curve formula: P(YES) = virtualYes / (virtualYes + virtualNo)
 * 
 * @param yesShares - YES share supply (BigInt string from subgraph)
 * @param noShares - NO share supply (BigInt string from subgraph)
 * @returns YES price as percentage (0-100)
 * 
 * @example calculateYesPercent("100000000000000000000", "100000000000000000000") => 50
 */
export function calculateYesPercent(yesShares: string, noShares: string): number {
  const yes = BigInt(yesShares || '0');
  const no = BigInt(noShares || '0');
  
  // Add virtual liquidity to both sides (matches contract)
  const virtualYes = yes + VIRTUAL_LIQUIDITY;
  const virtualNo = no + VIRTUAL_LIQUIDITY;
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
 * @returns NO price as percentage (0-100)
 */
export function calculateNoPercent(yesShares: string, noShares: string): number {
  return 100 - calculateYesPercent(yesShares, noShares);
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

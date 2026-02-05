/**
 * Environment Configuration
 *
 * Centralized access to all environment variables with type safety.
 * Uses Vite's import.meta.env for environment variable access.
 *
 * @module shared/config/env
 *
 * NETWORK SWITCH:
 * - VITE_IS_TESTNET=true  → Uses testnet config (BNB Testnet, Chain ID: 97)
 * - VITE_IS_TESTNET=false → Uses mainnet config (BNB Chain, Chain ID: 56)
 * 
 * Just change ONE variable to switch networks!
 * 
 * MAINTENANCE MODE:
 * - VITE_MAINTENANCE_MODE=true     → Blocks entire site with maintenance page
 * - VITE_MAINTENANCE_MESSAGE       → Custom message to display
 * - VITE_MAINTENANCE_END_TIME      → Expected end time (e.g., "January 20, 2026 at 10:00 UTC")
 */

// Master network switch
const isTestnet = import.meta.env.VITE_IS_TESTNET === 'true';

export const env = {
  // Network Switch
  IS_TESTNET: isTestnet,
  CHAIN_ID: isTestnet ? 97 : 56,
  
  // Contract Address (auto-selected based on network)
  CONTRACT_ADDRESS: isTestnet 
    ? import.meta.env.VITE_TESTNET_CONTRACT_ADDRESS || ''
    : import.meta.env.VITE_MAINNET_CONTRACT_ADDRESS || '',
  
  // Subgraph URL (auto-selected based on network)
  SUBGRAPH_URL: isTestnet 
    ? import.meta.env.VITE_TESTNET_SUBGRAPH_URL || ''
    : import.meta.env.VITE_MAINNET_SUBGRAPH_URL || '',
  
  // The Graph API Key (auto-selected based on network)
  GRAPH_API_KEY: isTestnet
    ? import.meta.env.VITE_TESTNET_GRAPH_API_KEY || ''
    : import.meta.env.VITE_MAINNET_GRAPH_API_KEY || '',
  
  // Web3 (shared)
  WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  
  // Admin wallets (MultiSig signers - auto-selected based on network)
  ADMIN_ADDRESSES: (isTestnet
    ? import.meta.env.VITE_TESTNET_ADMIN_ADDRESSES || ''
    : import.meta.env.VITE_MAINNET_ADMIN_ADDRESSES || '')
    .split(',')
    .map((addr: string) => addr.trim().toLowerCase())
    .filter((addr: string) => addr.length > 0),
  
  // Social Links (shared)
  X_URL: import.meta.env.VITE_X_URL || 'https://x.com/jnglzdotfun',
  TELEGRAM_URL: import.meta.env.VITE_TELEGRAM_URL || 'https://t.me/jnglzdotfun',
  
  // Maintenance Mode
  MAINTENANCE_MODE: import.meta.env.VITE_MAINTENANCE_MODE?.toLowerCase() === 'true',
  MAINTENANCE_MESSAGE: import.meta.env.VITE_MAINTENANCE_MESSAGE || '',
  MAINTENANCE_END_TIME: import.meta.env.VITE_MAINTENANCE_END_TIME || '',
  
  // Environment
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

/**
 * Get the BscScan base URL based on network configuration
 * @returns BscScan URL (testnet or mainnet)
 */
export function getBscScanUrl(): string {
  return env.IS_TESTNET 
    ? 'https://testnet.bscscan.com' 
    : 'https://bscscan.com';
}

/**
 * Get a BscScan transaction URL
 * @param txHash - Transaction hash
 * @returns Full BscScan transaction URL
 */
export function getBscScanTxUrl(txHash: string): string {
  return `${getBscScanUrl()}/tx/${txHash}`;
}

/**
 * Get a BscScan address URL
 * @param address - Wallet/contract address
 * @returns Full BscScan address URL
 */
export function getBscScanAddressUrl(address: string): string {
  return `${getBscScanUrl()}/address/${address}`;
}

/**
 * Get current network name for display
 * @returns "BNB Testnet" or "BNB Chain"
 */
export function getNetworkName(): string {
  return env.IS_TESTNET ? 'BNB Testnet' : 'BNB Chain';
}

// Type for env object
export type Env = typeof env;

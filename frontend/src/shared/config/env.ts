/**
 * Environment Configuration
 *
 * Centralized access to all environment variables with type safety.
 * Uses Vite's import.meta.env for environment variable access.
 *
 * @module shared/config/env
 *
 * VITE ENVIRONMENT VARIABLES:
 * All custom env vars must be prefixed with VITE_ to be exposed to the client.
 *
 * REQUIRED VARIABLES:
 * - VITE_WALLETCONNECT_PROJECT_ID - WalletConnect Cloud project ID
 *
 * OPTIONAL VARIABLES:
 * - VITE_SUBGRAPH_URL      - The Graph endpoint
 * - VITE_CHAIN_ID          - Default chain ID (97 for testnet, 56 for mainnet)
 * - VITE_CONTRACT_ADDRESS  - PredictionMarket contract address
 * 
 * NETWORK TOGGLE:
 * - VITE_ENABLE_TESTNET=true  → Shows testnet (BNB Testnet, Chain ID: 97)
 * - VITE_ENABLE_TESTNET=false → Shows mainnet only (BNB Chain, Chain ID: 56)
 */

export const env = {
  // Web3
  WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  CHAIN_ID: Number(import.meta.env.VITE_CHAIN_ID) || 97,
  
  // Contract
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || '',
  
  // The Graph
  SUBGRAPH_URL: import.meta.env.VITE_SUBGRAPH_URL || '',
  GRAPH_API_KEY: import.meta.env.VITE_GRAPH_API_KEY || '',
  
  // Network Toggle (YES = testnet visible, NO = mainnet only)
  // Set VITE_ENABLE_TESTNET=true for testnet, false for mainnet
  ENABLE_TESTNET: import.meta.env.VITE_ENABLE_TESTNET === 'true',
  
  // Derived: Is this a testnet environment?
  IS_TESTNET: import.meta.env.VITE_ENABLE_TESTNET === 'true',
  
  // Admin wallets (MultiSig signers)
  ADMIN_ADDRESSES: (import.meta.env.VITE_ADMIN_ADDRESSES || '')
    .split(',')
    .map((addr: string) => addr.trim().toLowerCase())
    .filter((addr: string) => addr.length > 0),
  
  // Social Links
  X_URL: import.meta.env.VITE_X_URL || 'https://x.com/jnglzdotfun',
  TELEGRAM_URL: import.meta.env.VITE_TELEGRAM_URL || 'https://t.me/jnglzdotfun',
  
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

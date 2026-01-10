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
  
  // Feature flags
  ENABLE_TESTNET: import.meta.env.VITE_ENABLE_TESTNET === 'true',
  
  // Admin wallets (MultiSig signers)
  ADMIN_ADDRESSES: (import.meta.env.VITE_ADMIN_ADDRESSES || '')
    .split(',')
    .map((addr: string) => addr.trim().toLowerCase())
    .filter((addr: string) => addr.length > 0),
  
  // Environment
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

// Type for env object
export type Env = typeof env;

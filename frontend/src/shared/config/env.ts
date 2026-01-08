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
  CHAIN_ID: Number(import.meta.env.VITE_CHAIN_ID) || 97, // Default to BNB Testnet
  
  // Contract
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || '0x3988808940d027a70FE2D0938Cf06580bbad19F9',
  
  // The Graph
  SUBGRAPH_URL: import.meta.env.VITE_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/1722665/junkiefun-bnb-testnet/v0.0.1',
  
  // Feature flags
  ENABLE_TESTNET: import.meta.env.VITE_ENABLE_TESTNET === 'true' || true,
  
  // Admin wallets (MultiSig signers)
  ADMIN_ADDRESSES: (import.meta.env.VITE_ADMIN_ADDRESSES || '0x4Cca77ba15B0D85d7B733E0838a429E7bEF42DD2,0xC119B9152afcC5f40C019aABd78A312d37C63926,0x6499fe8016cE2C2d3a21d08c3016345Edf3467F1')
    .split(',')
    .map((addr: string) => addr.trim().toLowerCase()),
  
  // Environment
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

// Type for env object
export type Env = typeof env;

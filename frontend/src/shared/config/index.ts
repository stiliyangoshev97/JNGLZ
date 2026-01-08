/**
 * Config Barrel Export
 *
 * Central export point for all configuration.
 *
 * @module shared/config
 */

export { env } from './env';
export { wagmiConfig, chains, CHAIN_IDS, SUPPORTED_CHAIN_IDS, isChainSupported, getDefaultChain } from './wagmi';
export { PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI } from './contracts';
export { apolloClient } from './graphql';

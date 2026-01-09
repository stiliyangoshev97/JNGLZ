/**
 * Contract Configuration
 *
 * Contains the PredictionMarket contract address and ABI.
 * ABI is minimal - only includes functions we call from frontend.
 *
 * @module shared/config/contracts
 */

import { env } from './env';

/**
 * PredictionMarket Contract Address
 * v2.5.0 - with imageUrl + marketCreationFee
 */
export const PREDICTION_MARKET_ADDRESS = env.CONTRACT_ADDRESS as `0x${string}`;

/**
 * PredictionMarket ABI (minimal - only frontend-needed functions)
 * 
 * Full ABI is in /contracts/out/PredictionMarket.sol/PredictionMarket.json
 * This is a trimmed version for bundle size.
 */
export const PREDICTION_MARKET_ABI = [
  // ===== VIEW FUNCTIONS =====
  {
    name: 'getMarket',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [
      { name: 'question', type: 'string' },
      { name: 'evidenceLink', type: 'string' },
      { name: 'resolutionRules', type: 'string' },
      { name: 'imageUrl', type: 'string' },
      { name: 'creator', type: 'address' },
      { name: 'expiryTimestamp', type: 'uint256' },
      { name: 'yesShares', type: 'uint256' },
      { name: 'noShares', type: 'uint256' },
      { name: 'poolBalance', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
      { name: 'outcome', type: 'bool' },
    ],
  },
  {
    name: 'getYesPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getNoPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getPosition',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    outputs: [
      { name: 'yesShares', type: 'uint256' },
      { name: 'noShares', type: 'uint256' },
      { name: 'claimed', type: 'bool' },
      { name: 'emergencyRefunded', type: 'bool' },
      { name: 'hasVoted', type: 'bool' },
      { name: 'votedForProposer', type: 'bool' },
    ],
  },
  {
    name: 'previewBuy',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'bnbAmount', type: 'uint256' },
      { name: 'isYes', type: 'bool' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'previewSell',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'shares', type: 'uint256' },
      { name: 'isYes', type: 'bool' },
    ],
    outputs: [{ name: 'bnbOut', type: 'uint256' }],
  },
  {
    name: 'getMaxSellableShares',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'userShares', type: 'uint256' },
      { name: 'isYes', type: 'bool' },
    ],
    outputs: [
      { name: 'maxShares', type: 'uint256' },
      { name: 'bnbOut', type: 'uint256' },
    ],
  },
  {
    name: 'getRequiredBond',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'marketCreationFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'nextMarketId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },

  // ===== WRITE FUNCTIONS =====
  {
    name: 'createMarket',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'evidenceLink', type: 'string' },
      { name: 'resolutionRules', type: 'string' },
      { name: 'imageUrl', type: 'string' },
      { name: 'expiryTimestamp', type: 'uint256' },
      { name: 'heatLevel', type: 'uint8' },
    ],
    outputs: [{ name: 'marketId', type: 'uint256' }],
  },
  {
    name: 'createMarketAndBuy',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'evidenceLink', type: 'string' },
      { name: 'resolutionRules', type: 'string' },
      { name: 'imageUrl', type: 'string' },
      { name: 'expiryTimestamp', type: 'uint256' },
      { name: 'heatLevel', type: 'uint8' },
      { name: 'isYes', type: 'bool' },
      { name: 'minSharesOut', type: 'uint256' },
    ],
    outputs: [{ name: 'marketId', type: 'uint256' }],
  },
  {
    name: 'buyYes',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'minSharesOut', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'buyNo',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'minSharesOut', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'sellYes',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'shares', type: 'uint256' },
      { name: 'minBnbOut', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'sellNo',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'shares', type: 'uint256' },
      { name: 'minBnbOut', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'proposeOutcome',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'outcome', type: 'bool' },
      { name: 'proofLink', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'dispute',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'marketId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'vote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'supportProposer', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'finalizeMarket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'emergencyRefund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [],
  },

  // ===== EVENTS =====
  {
    name: 'MarketCreated',
    type: 'event',
    inputs: [
      { name: 'marketId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'question', type: 'string', indexed: false },
      { name: 'expiryTimestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Trade',
    type: 'event',
    inputs: [
      { name: 'marketId', type: 'uint256', indexed: true },
      { name: 'trader', type: 'address', indexed: true },
      { name: 'isYes', type: 'bool', indexed: false },
      { name: 'isBuy', type: 'bool', indexed: false },
      { name: 'shares', type: 'uint256', indexed: false },
      { name: 'bnbAmount', type: 'uint256', indexed: false },
    ],
  },
] as const;

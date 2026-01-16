/**
 * ===== HEAT LEVEL UTILITIES =====
 *
 * Heat level configuration and helpers for market tiers.
 * v3.5.0: 5 tiers with 10x virtual liquidity
 * 
 * 0 = DEGEN FLASH (50 vLiq - high volatility)
 * 1 = STREET FIGHT (200 vLiq - balanced, default)
 * 2 = WHALE POND (500 vLiq - low slippage)
 * 3 = INSTITUTION (2000 vLiq - professional)
 * 4 = DEEP SPACE (10000 vLiq - maximum depth)
 *
 * @module shared/utils/heatLevel
 */

export interface HeatLevelConfig {
  value: number;
  emoji: string;
  name: string;
  shortName: string;
  targetUser: string;
  userDescription: string;
  tradeRange: string;
  vibe: string;
  vibeDescription: string;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  virtualLiquidity: number; // Virtual liquidity in shares (not BNB!)
  priceImpact: string; // Resulting price after 1 BNB first buy (tested)
}

export const HEAT_LEVELS: HeatLevelConfig[] = [
  { 
    value: 0, 
    emoji: '',
    name: 'DEGEN FLASH',
    shortName: 'DEGEN',
    targetUser: 'The Moon-Bagger',
    userDescription: 'Small wallets, high adrenaline',
    tradeRange: '0.005 – 0.1 BNB',
    vibe: 'Total Chaos.',
    vibeDescription: "Maximum volatility — a few bucks swings the price 10%. For traders who thrive on chaos.",
    color: 'no',
    borderColor: 'border-no',
    bgColor: 'bg-no/10',
    textColor: 'text-no',
    virtualLiquidity: 50,
    priceImpact: '83¢', // 50¢ → 83¢ (+33¢)
  },
  { 
    value: 1, 
    emoji: '',
    name: 'STREET FIGHT',
    shortName: 'STREET',
    targetUser: 'The Trader',
    userDescription: 'Active battlers, middle-weights',
    tradeRange: '0.1 – 1.0 BNB',
    vibe: 'The Standard.',
    vibeDescription: "Classic tug-of-war battles. Momentum shifts fast, conviction gets rewarded. High ROI potential.",
    color: 'yellow-500',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-500',
    virtualLiquidity: 200,
    priceImpact: '66¢', // 50¢ → 66¢ (+16¢)
  },
  { 
    value: 2, 
    emoji: '',
    name: 'WHALE POND',
    shortName: 'WHALE',
    targetUser: 'The Shark',
    userDescription: 'Serious money, high conviction',
    tradeRange: '1.0 – 5.0 BNB',
    vibe: 'Serious Stakes.',
    vibeDescription: "Low slippage so big trades don't get 'eaten' by the curve. Built for accuracy, not just volatility.",
    color: 'cyber',
    borderColor: 'border-cyber',
    bgColor: 'bg-cyber/10',
    textColor: 'text-cyber',
    virtualLiquidity: 500,
    priceImpact: '58¢', // 50¢ → 58¢ (+8¢)
  },
  { 
    value: 3, 
    emoji: '',
    name: 'INSTITUTION',
    shortName: 'INST',
    targetUser: 'The Whale',
    userDescription: 'Professional traders, deep pockets',
    tradeRange: '5.0 – 20.0 BNB',
    vibe: 'The Professional.',
    vibeDescription: "Deep liquidity for serious capital. Price moves slowly and deliberately. Built for whales.",
    color: 'blue-400',
    borderColor: 'border-blue-400',
    bgColor: 'bg-blue-400/10',
    textColor: 'text-blue-400',
    virtualLiquidity: 2000,
    priceImpact: '52¢', // 50¢ → 52¢ (+2¢)
  },
  { 
    value: 4, 
    emoji: '',
    name: 'DEEP SPACE',
    shortName: 'DEEP',
    targetUser: 'The Titan',
    userDescription: 'Maximum capital, ultimate stability',
    tradeRange: '20.0 – 100+ BNB',
    vibe: 'Infinite Depth.',
    vibeDescription: "The final frontier. Near-zero slippage for massive trades. The ultimate source of truth.",
    color: 'purple-400',
    borderColor: 'border-purple-400',
    bgColor: 'bg-purple-400/10',
    textColor: 'text-purple-400',
    virtualLiquidity: 10000,
    priceImpact: '51¢', // 50¢ → 51¢ (<1¢)
  },
];

/**
 * Get heat level config by value
 */
export function getHeatLevel(value: number | string | undefined): HeatLevelConfig {
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  return HEAT_LEVELS.find(h => h.value === numValue) || HEAT_LEVELS[1]; // Default to STREET FIGHT
}

/**
 * Get heat level name
 */
export function getHeatLevelName(value: number | string | undefined): string {
  return getHeatLevel(value).name;
}

/**
 * Get heat level emoji
 */
export function getHeatLevelEmoji(value: number | string | undefined): string {
  return getHeatLevel(value).emoji;
}

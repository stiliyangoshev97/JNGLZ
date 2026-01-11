/**
 * ===== HEAT LEVEL UTILITIES =====
 *
 * Heat level configuration and helpers for market tiers.
 * 0 = DEGEN FLASH (low liquidity, high volatility)
 * 1 = STREET FIGHT (medium liquidity)
 * 2 = WHALE POND (high liquidity, low slippage)
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
  },
  { 
    value: 2, 
    emoji: '',
    name: 'WHALE POND',
    shortName: 'WHALE',
    targetUser: 'The Shark',
    userDescription: 'Serious money, high conviction',
    tradeRange: '1.0 – 5.0+ BNB',
    vibe: 'Serious Stakes.',
    vibeDescription: "Low slippage so big trades don't get 'eaten' by the curve. Built for accuracy, not just volatility.",
    color: 'cyber',
    borderColor: 'border-cyber',
    bgColor: 'bg-cyber/10',
    textColor: 'text-cyber',
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

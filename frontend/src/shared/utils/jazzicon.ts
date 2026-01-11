/**
 * Jazzicon Generator
 *
 * Generates deterministic, colorful identicons based on wallet addresses.
 * No external dependencies - pure CSS/JS implementation.
 *
 * @module shared/utils/jazzicon
 *
 * This creates a unique "face" for every wallet without storing any images.
 * Users will start to recognize addresses by their jazzicon colors.
 */

/**
 * Color palette for jazzicons
 * Based on the JNGLZ.FUN theme colors
 */
const COLORS = [
  '#39FF14', // Electric Lime (YES)
  '#FF3131', // Neon Crimson (NO)
  '#00E0FF', // Cyber Blue
  '#FFB800', // Warning Yellow
  '#A855F7', // Purple
  '#FF00FF', // Magenta (Admin)
  '#FFD700', // Gold (Whale)
  '#00FF88', // Mint
  '#FF6B6B', // Coral
  '#4DEBFF', // Light Cyan
];

/**
 * Simple hash function for addresses
 * @param address - Ethereum address
 * @returns Numeric hash
 */
function hashAddress(address: string): number {
  const addr = address.toLowerCase();
  let hash = 0;
  for (let i = 0; i < addr.length; i++) {
    const char = addr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a color from address
 * @param address - Ethereum address
 * @param index - Color index offset
 * @returns Hex color string
 */
function getColor(address: string, index: number): string {
  const hash = hashAddress(address);
  const colorIndex = (hash + index) % COLORS.length;
  return COLORS[colorIndex];
}

/**
 * Generate jazzicon data for an address
 * @param address - Ethereum address
 * @returns Object with colors and rotation for CSS rendering
 */
export function generateJazzicon(address: string): {
  primary: string;
  secondary: string;
  tertiary: string;
  rotation: number;
} {
  if (!address) {
    return {
      primary: COLORS[0],
      secondary: COLORS[1],
      tertiary: COLORS[2],
      rotation: 0,
    };
  }

  const hash = hashAddress(address);
  
  return {
    primary: getColor(address, 0),
    secondary: getColor(address, 3),
    tertiary: getColor(address, 7),
    rotation: hash % 360,
  };
}

/**
 * Generate CSS gradient string for jazzicon
 * @param address - Ethereum address
 * @returns CSS gradient string
 */
export function getJazziconGradient(address: string): string {
  const { primary, secondary, tertiary, rotation } = generateJazzicon(address);
  return `conic-gradient(from ${rotation}deg, ${primary} 0deg, ${secondary} 120deg, ${tertiary} 240deg, ${primary} 360deg)`;
}

/**
 * Generate inline styles for jazzicon element
 * @param address - Ethereum address
 * @param size - Size in pixels (default: 32)
 * @returns CSS style object
 */
export function getJazziconStyle(address: string, size = 32): React.CSSProperties {
  return {
    width: size,
    height: size,
    background: getJazziconGradient(address),
    borderRadius: '0', // Brutalist - no rounded corners
    border: '1px solid #262626',
  };
}

/**
 * ===== JAZZICON COMPONENT =====
 *
 * Generates deterministic wallet avatars based on address.
 * Uses CSS gradients for a unique, colorful identicon.
 *
 * @module shared/components/ui/Jazzicon
 */

import { cn } from '@/shared/utils/cn';

interface JazziconProps {
  /** Ethereum/BSC address to generate avatar for */
  address: string;
  /** Size in pixels */
  size?: number;
  /** Additional class names */
  className?: string;
  /** Border variant */
  border?: 'none' | 'default' | 'yes' | 'no' | 'cyber';
}

const borderClasses = {
  none: '',
  default: 'border border-dark-600',
  yes: 'border-2 border-yes',
  no: 'border-2 border-no',
  cyber: 'border-2 border-cyber',
};

export function Jazzicon({
  address,
  size = 32,
  className,
  border = 'default',
}: JazziconProps) {
  return (
    <img
      src="/logo.svg"
      alt="User"
      className={cn(
        'flex-shrink-0 rounded-full object-cover',
        borderClasses[border],
        className
      )}
      style={{ width: size, height: size }}
      title={address}
    />
  );
}

/**
 * Jazzicon with fallback for when no address is provided
 */
interface JazziconWithFallbackProps extends Omit<JazziconProps, 'address'> {
  address?: string | null;
  fallback?: React.ReactNode;
}

export function JazziconWithFallback({
  address,
  fallback,
  size = 32,
  className,
  border,
}: JazziconWithFallbackProps) {
  if (!address) {
    return (
      fallback || (
        <div
          className={cn(
            'flex-shrink-0 bg-dark-700 flex items-center justify-center text-text-secondary',
            borderClasses[border || 'default'],
            className
          )}
          style={{ width: size, height: size }}
        >
          <span style={{ fontSize: size * 0.5 }}>?</span>
        </div>
      )
    );
  }

  return (
    <Jazzicon
      address={address}
      size={size}
      className={className}
      border={border}
    />
  );
}

/**
 * Address display with Jazzicon
 */
interface AddressDisplayProps {
  address: string;
  /** Number of characters to show */
  truncateLength?: number;
  /** Size of the jazzicon */
  iconSize?: number;
  /** Show full address on hover */
  showFullOnHover?: boolean;
  className?: string;
}

export function AddressDisplay({
  address,
  truncateLength = 4,
  showFullOnHover = true,
  className,
}: AddressDisplayProps) {
  const truncated = `${address.slice(0, truncateLength + 2)}...${address.slice(-truncateLength)}`;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 font-mono text-sm',
        className
      )}
      title={showFullOnHover ? address : undefined}
    >
      <span className="text-text-secondary">{truncated}</span>
    </div>
  );
}

export default Jazzicon;

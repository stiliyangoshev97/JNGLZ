/**
 * ===== BADGE COMPONENT =====
 *
 * Status badges for indicating user roles, positions, and status.
 * Used for: [YES HOLDER], [NO HOLDER], [WHALE], [ADMIN], etc.
 *
 * @module shared/components/ui/Badge
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

type BadgeVariant = 'yes' | 'no' | 'whale' | 'admin' | 'neutral' | 'active' | 'expired' | 'disputed';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  yes: 'bg-yes/20 text-yes border-yes/50',
  no: 'bg-no/20 text-no border-no/50',
  whale: 'bg-whale/20 text-whale border-whale/50',
  admin: 'bg-admin/20 text-admin border-admin/50',
  neutral: 'bg-dark-700 text-text-secondary border-dark-600',
  active: 'bg-status-active/20 text-status-active border-status-active/50',
  expired: 'bg-status-expired/20 text-status-expired border-status-expired/50',
  disputed: 'bg-status-disputed/20 text-status-disputed border-status-disputed/50',
};

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center px-2 py-0.5',
        'text-xs font-mono font-semibold uppercase tracking-wider',
        'border',
        // NO rounded corners - brutalist
        'rounded-none',
        // Variant
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ===== PRE-DEFINED BADGES =====

export function YesHolderBadge() {
  return <Badge variant="yes">[YES HOLDER]</Badge>;
}

export function NoHolderBadge() {
  return <Badge variant="no">[NO HOLDER]</Badge>;
}

export function WhaleBadge() {
  return <Badge variant="whale">[WHALE]</Badge>;
}

export function AdminBadge() {
  return <Badge variant="admin">[ADMIN]</Badge>;
}

export function ActiveBadge() {
  return <Badge variant="active">● ACTIVE</Badge>;
}

export function ExpiredBadge() {
  return <Badge variant="expired">■ EXPIRED</Badge>;
}

export function DisputedBadge() {
  return <Badge variant="disputed">⚠ DISPUTED</Badge>;
}

export default Badge;

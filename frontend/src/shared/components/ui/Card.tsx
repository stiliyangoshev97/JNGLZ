/**
 * ===== CARD COMPONENT =====
 *
 * Brutalist card container with harsh borders.
 * NO rounded corners, NO shadows.
 *
 * VARIANTS:
 * - default: Standard card
 * - hover: Card with hover border effect
 * - hype-yes: Card with YES flash animation
 * - hype-no: Card with NO flash animation
 *
 * @module shared/components/ui/Card
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

type CardVariant = 'default' | 'hover' | 'hype-yes' | 'hype-no';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  children: ReactNode;
}

const variants: Record<CardVariant, string> = {
  default: 'bg-dark-800 border border-dark-600',
  hover: 'bg-dark-800 border border-dark-600 hover:border-dark-500 transition-colors duration-150',
  'hype-yes': 'bg-dark-800 border border-dark-600 animate-hype-flash-yes',
  'hype-no': 'bg-dark-800 border border-dark-600 animate-hype-flash-no',
};

const paddings: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // NO rounded corners - brutalist
          'rounded-none',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ===== CARD SUB-COMPONENTS =====

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-bold text-white', className)} {...props}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-text-secondary mt-1', className)} {...props}>
      {children}
    </p>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-dark-600', className)} {...props}>
      {children}
    </div>
  );
}

export default Card;

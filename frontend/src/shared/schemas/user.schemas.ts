/**
 * ===== USER SCHEMAS =====
 *
 * Zod schemas for user data validation.
 *
 * @module shared/schemas/user
 */

import { z } from 'zod';

/**
 * User entity from the subgraph
 */
export const UserSchema = z.object({
  id: z.string(), // Address
  address: z.string(),
  totalTrades: z.string(), // BigInt as string
  totalVolume: z.string(),
  totalMarketsCreated: z.string(),
  firstTradeAt: z.string().optional(),
  lastTradeAt: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * User response
 */
export const UserResponseSchema = z.object({
  user: UserSchema.nullable(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * User profile from Supabase (future)
 */
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  walletAddress: z.string(),
  username: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  twitterHandle: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * User badge types
 */
export const UserBadgeSchema = z.enum([
  'YES_HOLDER',
  'NO_HOLDER',
  'WHALE',
  'ADMIN',
  'CREATOR',
  'TOP_TRADER',
]);

export type UserBadge = z.infer<typeof UserBadgeSchema>;

/**
 * Admin addresses (from config)
 */
export const AdminAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');

export type AdminAddress = z.infer<typeof AdminAddressSchema>;

/**
 * Check if address is admin
 */
export function isAdminAddress(address: string, adminList: string[]): boolean {
  return adminList.some(
    (admin) => admin.toLowerCase() === address.toLowerCase()
  );
}

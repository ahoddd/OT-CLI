/**
 * User subscription tiers (members) — separate from partner tiers (Silver/Gold/Platinum).
 * Subscriptions fund perks and platform; designed for self-sustaining profitability.
 */

import { COLORS } from './Colors';

export type UserTierKey = 'free' | 'premium' | 'pro';

export interface UserTierDef {
  key: UserTierKey;
  label: string;
  shortLabel: string;
  color: string;
  /** One-line benefit for profile/CTAs */
  tagline: string;
}

export const USER_TIERS: Record<UserTierKey, UserTierDef> = {
  free: {
    key: 'free',
    label: 'Member',
    shortLabel: 'Free',
    color: COLORS.neonBlue[0],
    tagline: 'Earn points, redeem perks, climb the leaderboard.',
  },
  premium: {
    key: 'premium',
    label: 'Premium',
    shortLabel: 'Premium',
    color: COLORS.gold[0],
    tagline: 'Extra perks, city compare, priority support. Subscriptions fund real rewards.',
  },
  pro: {
    key: 'pro',
    label: 'Pro',
    shortLabel: 'Pro',
    color: COLORS.gold[0],
    tagline: 'Partner tools + Premium benefits. Your subscription helps fund perks for everyone.',
  },
};

export function getUserTierLabel(tier: UserTierKey): string {
  return USER_TIERS[tier]?.label ?? 'Member';
}

export function getUserTierColor(tier: UserTierKey): string {
  return USER_TIERS[tier]?.color ?? COLORS.neonBlue[0];
}

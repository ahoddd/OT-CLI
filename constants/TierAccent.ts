/**
 * Tier accent colors for user and partner tiers.
 * Used by TierGlow and any tier-differentiated UI (premium/pro cards, partner dashboard).
 */
import { PARTNER_TIER_COLORS } from './PartnerTiers';
import { COLORS } from './Colors';

/** User subscription tier or partner tier — unified for glow and accent styling. */
export type AnyTier = 'free' | 'premium' | 'pro' | 'silver' | 'gold' | 'platinum';

const USER_TIER_ACCENT: Record<'free' | 'premium' | 'pro', string> = {
  free: '#94a3b8',
  premium: COLORS.gold[0],
  pro: PARTNER_TIER_COLORS.platinum,
};

/**
 * Returns the accent hex color for a given tier.
 * free/silver: neutral; premium/gold: warm gold; pro/platinum: violet.
 */
export function getTierAccent(tier: AnyTier): string {
  if (tier === 'silver' || tier === 'gold' || tier === 'platinum') {
    return PARTNER_TIER_COLORS[tier];
  }
  return USER_TIER_ACCENT[tier];
}

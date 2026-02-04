/** OrbTap premium/holographic look — shared across Featured Partner, grid perks, and perk surfaces */

import type { Tier } from './MockData';

export const HOLO_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'] as const;
export const SHINE_COLORS = ['transparent', 'rgba(255,255,255,0.15)', 'transparent', 'rgba(255,255,255,0.08)', 'transparent'] as const;

export const HOLO_BORDER_WIDTH = 2;

/** Tier rank 0–3: higher = more premium. Used to scale border/shine so tiers are distinguished by effect strength, not just color. */
export const TIER_RANK: Record<Tier, number> = {
  common: 0,
  rare: 1,
  legendary: 2,
  apex: 3,
};

/** Premium intensity 0.25–1: common = subtle, apex = full holographic. Reduces color confusion; tiers read as "more premium" not "different color". */
export function getTierPremiumIntensity(tier: Tier): number {
  const r = TIER_RANK[tier];
  return 0.25 + (r / 3) * 0.75;
}

/** Border width multiplier by tier (higher tier = thicker holo border). */
export function getTierBorderWidth(tier: Tier): number {
  return Math.round(HOLO_BORDER_WIDTH * (0.6 + getTierPremiumIntensity(tier) * 0.8));
}

/** Shine overlay opacity by tier (higher tier = more pronounced). */
export function getTierShineOpacity(tier: Tier): number {
  return 0.4 + getTierPremiumIntensity(tier) * 0.5;
}

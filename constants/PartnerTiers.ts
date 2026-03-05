/**
 * Partner tier system: Silver (free), Gold (premium), Platinum (pro).
 * Perks inherit their partner's tier color unless boosted.
 */

export type PartnerTier = 'silver' | 'gold' | 'platinum';

/** Psychology-based tier colors: Silver = trust/neutral, Gold = premium/value, Platinum = exclusivity/best. */
export const PARTNER_TIER_COLORS: Record<PartnerTier, string> = {
  silver: '#94a3b8',   // Cool slate — professional free tier, calm and clear
  gold: '#d4af37',     // Rich gold — premium, valuable; reads as gold not orange
  platinum: '#a78bfa', // Lighter violet — Pro stands out on dark; premium, top-tier
};

/** Gradient for Pro (Platinum): brightest, most premium look. */
export const PLATINUM_GRADIENT = { outer: '#c4b5fd', inner: '#a78bfa' } as const;

/** Gradient for Gold (premium): shiny gold, less intense than Pro. */
export const GOLD_GRADIENT = { outer: '#eab308', inner: '#ca8a04' } as const;

export const PARTNER_TIER_LABELS: Record<PartnerTier, string> = {
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

/** Short label for badges/pills (e.g. "PRO" for Platinum). */
export const PARTNER_TIER_BADGE_LABELS: Record<PartnerTier, string> = {
  silver: 'Silver',
  gold: 'Premium',
  platinum: 'PRO',
};

/** Rank 0–2 for styling intensity (border, shine, shadow). */
export const PARTNER_TIER_RANK: Record<PartnerTier, number> = {
  silver: 0,
  gold: 1,
  platinum: 2,
};

export function isPremiumPartnerTier(tier: PartnerTier): boolean {
  return tier === 'gold' || tier === 'platinum';
}

export function isProPartnerTier(tier: PartnerTier): boolean {
  return tier === 'platinum';
}

/** Partner tier benefits — used in partner dashboard, premium page, and admin. Realistic, high-demand for local businesses. */
export const PARTNER_TIER_BENEFITS: Record<PartnerTier, string[]> = {
  silver: [
    'List your venue on the map — reach locals who open OrbTap',
    'Public profile page with hours, address, and basic info',
    'Up to 3 active perks (e.g. happy hour, lunch deal)',
    '7-day analytics — see profile views and engagement',
    'Verified checkmark so customers trust your listing',
    'Receive OrbOps work orders and catering requests',
  ],
  gold: [
    'Everything in Silver, plus:',
    'Up to 10 active perks — run seasonal offers, daily specials, and member perks',
    '30-day analytics — see trends and compare weeks',
    'Conversion funnel — see how many viewed → tapped → redeemed',
    'Export to CSV — use your data in spreadsheets or BI tools',
    'Featured placement opportunities — get in front of more explorers',
    'Drops and flash offers — time-limited deals that drive urgency',
    'Premium (Gold) badge — signals quality and boosts trust',
    'Priority support — faster response when you need help',
  ],
  platinum: [
    'Everything in Gold, plus:',
    'Unlimited active perks — no cap on offers (menus, happy hours, events, promos)',
    'Pro badge — platinum verification; stands out on map, search, and leaderboard',
    'Sponsored carousel slots — your venue in Pulse and high-traffic spots',
    'Priority placement — shown above Premium and Free in search and discovery',
    'Dedicated success contact — a real person for onboarding, strategy, and growth',
    'Early access to new OrbTap features (drops, ads, OrbPass highlights)',
    'Custom campaign support — featured in local push or email when we run promos',
    'Highest visibility — first in “Nearby” and category filters for Pro partners',
  ],
};

/** Pro (platinum) gets the strongest styling so it looks best and drives upgrades. */
const PRO_BOOST = 1.25;

/** Border width for partner cards by tier. */
export function getPartnerTierBorderWidth(tier: PartnerTier): number {
  const HOLO_BORDER_WIDTH = 2;
  let intensity = 0.35 + (PARTNER_TIER_RANK[tier] / 2) * 0.65;
  if (tier === 'platinum') intensity = Math.min(1, intensity * PRO_BOOST);
  return Math.round(HOLO_BORDER_WIDTH * (0.6 + intensity * 0.8));
}

export function getPartnerTierShineOpacity(tier: PartnerTier): number {
  let intensity = 0.35 + (PARTNER_TIER_RANK[tier] / 2) * 0.65;
  if (tier === 'platinum') intensity = Math.min(1, intensity * PRO_BOOST);
  return 0.4 + intensity * 0.5;
}

export function getPartnerTierShadowAll(tier: PartnerTier): {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
} {
  const color = PARTNER_TIER_COLORS[tier];
  let intensity = 0.35 + (PARTNER_TIER_RANK[tier] / 2) * 0.65;
  if (tier === 'platinum') intensity = Math.min(1, intensity * PRO_BOOST);
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15 + intensity * 0.28,
    shadowRadius: 6 + intensity * 14,
    elevation: 4 + Math.round(intensity * 8),
  };
}

export function getPartnerTierShadow(tier: PartnerTier): {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation?: number;
} | null {
  if (!isPremiumPartnerTier(tier)) return null;
  const color = PARTNER_TIER_COLORS[tier];
  const opacity = tier === 'platinum' ? 0.45 : 0.35;
  const radius = tier === 'platinum' ? 16 : 12;
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: tier === 'platinum' ? 10 : 8,
  };
}

export function getPartnerTierBarHeight(tier: PartnerTier): number {
  const base = 3 + PARTNER_TIER_RANK[tier] * 2;
  return tier === 'platinum' ? base + 1 : base;
}

export function getPartnerTierPremiumIntensity(tier: PartnerTier): number {
  let intensity = 0.35 + (PARTNER_TIER_RANK[tier] / 2) * 0.65;
  if (tier === 'platinum') intensity = Math.min(1, intensity * PRO_BOOST);
  return intensity;
}

/** Descriptions for map legend and "What tiers mean" modal. Partner-focused, ROI language. */
export const PARTNER_TIER_DESCRIPTIONS: Record<PartnerTier, string> = {
  silver: 'Free tier. Get on the map, list up to 3 perks, and see 7-day analytics. Perfect for trying OrbTap and reaching local customers.',
  gold: 'Premium tier. 10 perks, 30-day analytics, conversion funnel, CSV export, featured placement, and drops. Best value for driving more foot traffic and measuring ROI.',
  platinum: 'Pro tier. Unlimited perks, Pro badge, sponsored carousel slots, priority placement, and a dedicated success contact. For businesses that want maximum visibility and growth on OrbTap.',
};

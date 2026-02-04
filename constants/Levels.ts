/**
 * OrbTap XP levels — tier names, XP thresholds, and perks for FOMO and engagement.
 */

export interface LevelTier {
  level: number;
  title: string;
  xpRequired: number;
  perk: string;
  perkShort: string; // One-liner for bars
  nextTeaser?: string; // What you get at NEXT level (for current tier)
}

export const LEVEL_TIERS: LevelTier[] = [
  { level: 1, title: 'Scout', xpRequired: 0, perk: 'Basic map access & daily orb', perkShort: 'Map + Daily Orb' },
  { level: 2, title: 'Mapper', xpRequired: 500, perk: '2× Grid View — see more partners at once', perkShort: '2× Grid View', nextTeaser: 'Unlock 2× Grid View' },
  { level: 3, title: 'Orbiter', xpRequired: 1500, perk: 'Custom app icons & priority support', perkShort: 'Custom Icons', nextTeaser: 'Custom icons & priority support' },
  { level: 4, title: 'Voyager', xpRequired: 3000, perk: '1.1× point multiplier on redemptions', perkShort: '1.1× Multiplier', nextTeaser: '1.1× point multiplier' },
  { level: 5, title: 'Apex', xpRequired: 5000, perk: 'Secret Black Tier venues & early drops', perkShort: 'Black Tier Access', nextTeaser: 'Black Tier venues' },
  { level: 6, title: 'Legend', xpRequired: 10000, perk: 'Exclusive Legend badge & 1.2× multiplier', perkShort: 'Legend Badge', nextTeaser: 'Legend badge & 1.2×' },
  { level: 7, title: 'Orb Master', xpRequired: 25000, perk: 'All perks + Orb Master title on profile', perkShort: 'Orb Master', nextTeaser: 'Orb Master title' },
];

const MAX_LEVEL = LEVEL_TIERS[LEVEL_TIERS.length - 1]!.level;
const MAX_XP = LEVEL_TIERS[LEVEL_TIERS.length - 1]!.xpRequired;

export function getTierForXp(xp: number): LevelTier {
  let current = LEVEL_TIERS[0]!;
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TIERS[i]!.xpRequired) {
      current = LEVEL_TIERS[i]!;
      break;
    }
  }
  return current;
}

export function getNextTier(xp: number): LevelTier | null {
  const current = getTierForXp(xp);
  const idx = LEVEL_TIERS.findIndex((t) => t.level === current.level);
  return LEVEL_TIERS[idx + 1] ?? null;
}

export function getProgressToNextLevel(xp: number): { current: number; required: number; progress: number; nextTitle: string; nextPerk: string } | null {
  const next = getNextTier(xp);
  if (!next) {
    return null; // Max level
  }
  const current = getTierForXp(xp);
  const currentReq = current.xpRequired;
  const nextReq = next.xpRequired;
  const range = nextReq - currentReq;
  const intoLevel = xp - currentReq;
  const progress = range > 0 ? Math.min(intoLevel / range, 1) : 0;
  return {
    current: xp,
    required: nextReq,
    progress,
    nextTitle: next.title,
    nextPerk: next.perk,
  };
}

export { MAX_LEVEL, MAX_XP };

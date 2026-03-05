/**
 * Sphere XP — levels for teams. Earned by verified visits, OT Points earned as a sphere, and missions completed.
 * Distinct design from user XP; competitive for leaderboards.
 */

export interface SphereTier {
  level: number;
  title: string;
  xpRequired: number;
  perk: string;
  perkShort: string;
  nextTeaser?: string;
}

export const SPHERE_TIERS: SphereTier[] = [
  { level: 1, title: 'Squad', xpRequired: 0, perk: 'Unlock sphere feed & pool', perkShort: 'Feed + Pool' },
  { level: 2, title: 'Crew', xpRequired: 500, perk: 'Group visit bonus: +5% OT when 2+ members visit same partner in 24h', perkShort: 'Group bonus', nextTeaser: 'Group visit bonus' },
  { level: 3, title: 'Squad Silver', xpRequired: 1500, perk: 'Sphere leaderboard badge + 1.05× pool redemption value', perkShort: 'Silver badge', nextTeaser: 'Leaderboard badge' },
  { level: 4, title: 'Squad Gold', xpRequired: 3500, perk: 'Partner “Sphere perk” unlocks: exclusive offers for your sphere', perkShort: 'Sphere perks', nextTeaser: 'Partner sphere perks' },
  { level: 5, title: 'Squad Apex', xpRequired: 7000, perk: 'Priority support + 1.1× pool value', perkShort: 'Apex perks', nextTeaser: '1.1× pool value' },
  { level: 6, title: 'Orb Legion', xpRequired: 12000, perk: 'Top sphere leaderboard flair + exclusive Legion title', perkShort: 'Legion title', nextTeaser: 'Legion title' },
];

const MAX_SPHERE_LEVEL = SPHERE_TIERS[SPHERE_TIERS.length - 1]!.level;
const MAX_SPHERE_XP = SPHERE_TIERS[SPHERE_TIERS.length - 1]!.xpRequired;

export function getSphereTierForXp(xp: number): SphereTier {
  let current = SPHERE_TIERS[0]!;
  for (let i = SPHERE_TIERS.length - 1; i >= 0; i--) {
    if (xp >= SPHERE_TIERS[i]!.xpRequired) {
      current = SPHERE_TIERS[i]!;
      break;
    }
  }
  return current;
}

export function getSphereNextTier(xp: number): SphereTier | null {
  const current = getSphereTierForXp(xp);
  const idx = SPHERE_TIERS.findIndex((t) => t.level === current.level);
  return SPHERE_TIERS[idx + 1] ?? null;
}

export function getSphereProgressToNext(xp: number): {
  current: number;
  required: number;
  progress: number;
  nextTitle: string;
  nextPerk: string;
} | null {
  const next = getSphereNextTier(xp);
  if (!next) return null;
  const current = getSphereTierForXp(xp);
  const range = next.xpRequired - current.xpRequired;
  const intoLevel = xp - current.xpRequired;
  const progress = range > 0 ? Math.min(intoLevel / range, 1) : 0;
  return {
    current: xp,
    required: next.xpRequired,
    progress,
    nextTitle: next.title,
    nextPerk: next.perk,
  };
}

/** XP sources for spheres (used when awarding). */
export type SphereXpSource = 'verified_visit' | 'ot_earned' | 'mission_complete' | 'pool_contribute';

/** XP granted per source (tunable). */
export const SPHERE_XP_PER_SOURCE: Record<SphereXpSource, number> = {
  verified_visit: 25,
  ot_earned: 1,       // 1 XP per 1 OT Point earned by any member (capped per day if needed)
  mission_complete: 50,
  pool_contribute: 2, // 2 XP per OT Point contributed to pool
};

export { MAX_SPHERE_LEVEL, MAX_SPHERE_XP };

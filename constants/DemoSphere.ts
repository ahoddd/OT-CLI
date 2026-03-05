/**
 * Demo sphere shown first on the Spheres leaderboard so users can tap through
 * to see the public sphere profile page (different account / not their sphere).
 */

export const DEMO_SPHERE_LEADERBOARD_ID = 'demo-legend-1';

export interface PublicSphereProfileData {
  id: string;
  name: string;
  type: 'couple' | 'fami' | 'pal';
  sphereXp: number;
  memberCount: number;
  memberNames?: string[];
  verifiedVisitsCount: number;
  missionsCompletedCount: number;
  poolBalance: number;
  totalPoints: number;
  inviteCode: string;
  isPublic: boolean;
  showStatsPublic: boolean;
  showMembersPublic: boolean;
  showAchievementsPublic: boolean;
  leaderboardWins?: number;
  tagline?: string;
  /** Timestamp (ms) when sphere was created. Shown as "Sphere established on ...". */
  createdAt?: number;
  /** 3-tier: free | premium | pro. Drives color/label on profile. */
  sphereTier?: 'free' | 'premium' | 'pro';
}

export const DEMO_SPHERE_PROFILE: PublicSphereProfileData = {
  id: DEMO_SPHERE_LEADERBOARD_ID,
  name: 'Neon Raiders',
  type: 'pal',
  sphereXp: 8500,
  memberCount: 5,
  memberNames: ['Alex', 'Jordan', 'Sam', 'Riley', 'Casey'],
  verifiedVisitsCount: 127,
  missionsCompletedCount: 48,
  poolBalance: 1200,
  totalPoints: 4200,
  inviteCode: 'NEON-R1',
  isPublic: true,
  showStatsPublic: true,
  showMembersPublic: true,
  showAchievementsPublic: true,
  leaderboardWins: 2,
  tagline: 'Weekend crew. Real spots. Real rewards.',
  createdAt: Date.now() - 180 * 86400000, // ~6 months ago
  sphereTier: 'premium',
};

import { getSphereTierForXp } from './SphereLevels';

/** Leaderboard row for the demo sphere (first in list). */
export function getDemoSphereLeaderboardRow() {
  const d = DEMO_SPHERE_PROFILE;
  const tier = getSphereTierForXp(d.sphereXp);
  const val = d.sphereXp >= 1000 ? `${(d.sphereXp / 1000).toFixed(1)}k XP` : `${d.sphereXp} XP`;
  return {
    id: d.id,
    name: d.name,
    val,
    badge: tier.title,
  };
}

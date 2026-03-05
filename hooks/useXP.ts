/**
 * OrbTap user XP & level — derived from total OT earned (wallet history).
 * Single source of truth for level/tier/progress; drives level-up modal and UI everywhere.
 */

import { useMemo } from 'react';
import { useWalletContext } from '../context/WalletContext';
import {
  getTierForXp,
  getProgressToNextLevel,
  getNextTier,
  type LevelTier,
} from '../constants/Levels';

export interface XPRank {
  xp: number;
  level: number;
  title: string;
  tier: LevelTier;
  nextLevelXp: number;
  progress: number;
  isMaxLevel: boolean;
  perkShort: string;
  nextLevelTitle: string | null;
  nextLevelPerk: string | null;
  xpToNextLevel: number;
}

/** Total XP = sum of all earned OT (missions, scan, welcome, etc.). */
function totalEarnedFromHistory(history: { type: string; amount: number }[]): number {
  return history
    .filter((t) => t.type === 'earn')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function useXP(): XPRank {
  const { history } = useWalletContext();
  return useMemo(() => {
    const xp = totalEarnedFromHistory(history);
    const tier = getTierForXp(xp);
    const next = getNextTier(xp);
    const progressToNext = getProgressToNextLevel(xp);
    const isMaxLevel = next == null;
    const nextLevelXp = next?.xpRequired ?? tier.xpRequired;
    const progress = progressToNext?.progress ?? 1;
    const xpToNextLevel = next ? next.xpRequired - xp : 0;
    return {
      xp,
      level: tier.level,
      title: tier.title,
      tier,
      nextLevelXp,
      progress,
      isMaxLevel,
      perkShort: tier.perkShort,
      nextLevelTitle: next?.title ?? null,
      nextLevelPerk: next?.perk ?? null,
      xpToNextLevel,
    };
  }, [history]);
}

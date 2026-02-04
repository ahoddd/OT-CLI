import { useState, useEffect, useCallback } from 'react';
import { getTierForXp, getNextTier, getProgressToNextLevel, LEVEL_TIERS, type LevelTier } from '../constants/Levels';

export interface UserRank {
  level: number;
  xp: number;
  nextLevelXp: number;
  title: string;
  perk: string;
  perkShort: string;
  nextLevelTitle: string | null;
  nextLevelPerk: string | null;
  xpToNextLevel: number;
  progress: number; // 0–1 to next level
  isMaxLevel: boolean;
  tier: LevelTier;
}

// In real app this comes from Firebase / backend
const DEFAULT_XP = 1250;

export const useGamification = () => {
  const [xp, setXp] = useState(DEFAULT_XP);
  const [rank, setRank] = useState<UserRank>(() => {
    const tier = getTierForXp(DEFAULT_XP);
    const next = getNextTier(DEFAULT_XP);
    const prog = getProgressToNextLevel(DEFAULT_XP);
    return {
      level: tier.level,
      xp: DEFAULT_XP,
      nextLevelXp: next?.xpRequired ?? tier.xpRequired,
      title: tier.title,
      perk: tier.perk,
      perkShort: tier.perkShort,
      nextLevelTitle: next?.title ?? null,
      nextLevelPerk: next?.perk ?? null,
      xpToNextLevel: prog ? prog.required - prog.current : 0,
      progress: prog?.progress ?? 0,
      isMaxLevel: !next,
      tier,
    };
  });

  const recalcRank = useCallback((currentXp: number) => {
    const tier = getTierForXp(currentXp);
    const next = getNextTier(currentXp);
    const prog = getProgressToNextLevel(currentXp);
    setRank({
      level: tier.level,
      xp: currentXp,
      nextLevelXp: next?.xpRequired ?? tier.xpRequired,
      title: tier.title,
      perk: tier.perk,
      perkShort: tier.perkShort,
      nextLevelTitle: next?.title ?? null,
      nextLevelPerk: next?.perk ?? null,
      xpToNextLevel: prog ? prog.required - prog.current : 0,
      progress: prog?.progress ?? 0,
      isMaxLevel: !next,
      tier,
    });
  }, []);

  useEffect(() => {
    recalcRank(xp);
  }, [xp, recalcRank]);

  const getProgress = useCallback(() => rank.progress, [rank.progress]);

  const addXp = useCallback((amount: number) => {
    setXp((prev) => prev + amount);
  }, []);

  return { xp, setXp, addXp, rank, getProgress };
};

export { LEVEL_TIERS };

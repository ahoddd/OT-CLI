import { useState, useEffect } from 'react';

export interface UserRank {
  level: number;
  xp: number;
  nextLevelXp: number;
  title: string;
  perk: string; // The FOMO Hook
}

const RANKS = [
  { level: 1, title: 'Scout', xpReq: 0, perk: 'Basic Map Access' },
  { level: 2, title: 'Mapper', xpReq: 500, perk: 'Unlock: 2x Grid View' },
  { level: 3, title: 'Orbiter', xpReq: 1500, perk: 'Unlock: Custom App Icons' },
  { level: 4, title: 'Voyager', xpReq: 3000, perk: 'Unlock: 1.1x Point Multiplier' },
  { level: 5, title: 'Apex', xpReq: 5000, perk: 'Unlock: Secret "Black Tier" Venues' },
];

export const useGamification = () => {
  // Mock data for MVP - in real app this comes from Firebase
  const [xp, setXp] = useState(1250); 
  const [rank, setRank] = useState<UserRank>({ ...RANKS[0], xp: 0, nextLevelXp: 100 });

  useEffect(() => {
    calculateRank();
  }, [xp]);

  const calculateRank = () => {
    let currentRank = RANKS[0];
    let nextXp = RANKS[1].xpReq;

    for (let i = 0; i < RANKS.length; i++) {
      if (xp >= RANKS[i].xpReq) {
        currentRank = RANKS[i];
        nextXp = RANKS[i + 1]?.xpReq || 100000;
      }
    }
    setRank({ ...currentRank, xp, nextLevelXp: nextXp });
  };

  const getProgress = () => {
    const prevLevelXp = RANKS[rank.level - 1].xpReq;
    const levelRange = rank.nextLevelXp - prevLevelXp;
    const currentProgress = xp - prevLevelXp;
    return Math.min(Math.max(currentProgress / levelRange, 0), 1);
  };

  return { xp, rank, getProgress };
};

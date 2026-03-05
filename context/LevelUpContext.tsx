/**
 * Level-up detection and modal — shows celebratory popup when user gains enough XP to level up.
 * Persists last-acknowledged level so we don't re-show on app reopen; drives engagement.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXP } from '../hooks/useXP';
import { LevelUpModal, type LevelUpInfo } from '../components/LevelUpModal';

const LEVEL_UP_ACK_KEY = 'ORBTAP_LEVEL_UP_ACK';

interface LevelUpContextType {
  /** Current level from XP (for display elsewhere). */
  level: number;
  /** Dismiss the level-up modal and mark this level as acknowledged. */
  dismissLevelUp: () => void;
}

const LevelUpContext = createContext<LevelUpContextType | undefined>(undefined);

export function LevelUpProvider({ children }: { children: React.ReactNode }) {
  const rank = useXP();
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUpInfo | null>(null);
  const [visible, setVisible] = useState(false);
  const lastAckRef = useRef<number>(rank.level);

  const dismissLevelUp = useCallback(() => {
    setVisible(false);
    if (levelUpInfo) {
      lastAckRef.current = levelUpInfo.level;
      AsyncStorage.setItem(LEVEL_UP_ACK_KEY, String(levelUpInfo.level)).catch(() => {});
    }
    setLevelUpInfo(null);
  }, [levelUpInfo]);

  useEffect(() => {
    AsyncStorage.getItem(LEVEL_UP_ACK_KEY).then((s) => {
      const n = parseInt(s ?? '0', 10);
      if (Number.isFinite(n)) lastAckRef.current = n;
    });
  }, []);

  useEffect(() => {
    const currentLevel = rank.level;
    if (currentLevel > lastAckRef.current && currentLevel >= 2) {
      const tier = rank.tier;
      setLevelUpInfo({
        level: tier.level,
        title: tier.title,
        perk: tier.perk,
        perkShort: tier.perkShort,
      });
      setVisible(true);
    }
  }, [rank.level, rank.tier]);

  return (
    <LevelUpContext.Provider value={{ level: rank.level, dismissLevelUp }}>
      {children}
      <LevelUpModal visible={visible} info={levelUpInfo} onDismiss={dismissLevelUp} />
    </LevelUpContext.Provider>
  );
}

export function useLevelUp() {
  const ctx = useContext(LevelUpContext);
  if (!ctx) throw new Error('useLevelUp must be used within LevelUpProvider');
  return ctx;
}

import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWalletContext } from './WalletContext';

const GAME_KEY = 'ORBTAP_GAME_V1';
const BLOCKED_KEY = 'ORBTAP_BLOCKED_USERS';

const GAME_STORAGE_KEYS = [
  GAME_KEY,
  'orb_points',
  'orb_power',
  'orb_level',
  'orb_ownedSkins',
  'orb_equippedSkin',
  'orb_lifetimeTaps',
];

/** OT points are the wallet balance — single source of truth. GameContext exposes points = balance. */
interface GameState {
  tapPower: number;
  level: number;
  ownedSkins: string[];
  equippedSkin: string;
  lifetimeTaps: number;
}

interface GameContextType extends GameState {
  /** OT points = wallet balance (single source of truth). */
  points: number;
  incrementPoints: () => void;
  setTapPower: (n: number) => void;
  setLevel: (n: number) => void;
  purchaseUpgrade: (cost: number, powerIncrease: number) => boolean;
  unlockSkin: (skinId: string, cost: number) => boolean;
  equipSkin: (skinId: string) => void;
  resetGame: () => Promise<void>;
  loading: boolean;
  blockedUsers: string[];
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isBlocked: (userId: string) => boolean;
}

const defaultState: GameState = {
  tapPower: 1,
  level: 1,
  ownedSkins: ['default'],
  equippedSkin: 'default',
  lifetimeTaps: 0,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const { balance, addTransaction } = useWalletContext();
  const [tapPower, setTapPowerState] = useState(defaultState.tapPower);
  const [level, setLevelState] = useState(defaultState.level);
  const [ownedSkins, setOwnedSkins] = useState<string[]>(defaultState.ownedSkins);
  const [equippedSkin, setEquippedSkinState] = useState(defaultState.equippedSkin);
  const [lifetimeTaps, setLifetimeTaps] = useState(defaultState.lifetimeTaps);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const lastSavedRef = useRef<GameState>(defaultState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** OT points = wallet balance (single source of truth). */
  const points = balance;

  const persist = useCallback(async (state: GameState) => {
    try {
      await AsyncStorage.setItem(GAME_KEY, JSON.stringify(state));
      lastSavedRef.current = state;
    } catch (e) {
      console.error('GameContext persist error:', e);
    }
  }, []);

  // Load on startup (no points — they come from wallet)
  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(GAME_KEY);
        const blockedData = await AsyncStorage.getItem(BLOCKED_KEY);
        const blockedList = blockedData ? JSON.parse(blockedData) : [];
        setBlockedUsers(Array.isArray(blockedList) ? blockedList : []);
        if (data) {
          const parsed = JSON.parse(data);
          setTapPowerState(typeof parsed.tapPower === 'number' ? parsed.tapPower : defaultState.tapPower);
          setLevelState(typeof parsed.level === 'number' ? parsed.level : defaultState.level);
          setOwnedSkins(Array.isArray(parsed.ownedSkins) ? parsed.ownedSkins : defaultState.ownedSkins);
          setEquippedSkinState(typeof parsed.equippedSkin === 'string' ? parsed.equippedSkin : defaultState.equippedSkin);
          setLifetimeTaps(typeof parsed.lifetimeTaps === 'number' ? parsed.lifetimeTaps : defaultState.lifetimeTaps);
          lastSavedRef.current = {
            tapPower: typeof parsed.tapPower === 'number' ? parsed.tapPower : defaultState.tapPower,
            level: typeof parsed.level === 'number' ? parsed.level : defaultState.level,
            ownedSkins: Array.isArray(parsed.ownedSkins) ? parsed.ownedSkins : defaultState.ownedSkins,
            equippedSkin: typeof parsed.equippedSkin === 'string' ? parsed.equippedSkin : defaultState.equippedSkin,
            lifetimeTaps: typeof parsed.lifetimeTaps === 'number' ? parsed.lifetimeTaps : defaultState.lifetimeTaps,
          };
        }
      } catch (e) {
        console.error('GameContext load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Save whenever tapPower, level, ownedSkins, equippedSkin, or lifetimeTaps change (points live in wallet)
  useEffect(() => {
    if (loading) return;
    const state = { tapPower, level, ownedSkins, equippedSkin, lifetimeTaps };
    persist(state);
  }, [tapPower, level, ownedSkins, equippedSkin, lifetimeTaps, loading, persist]);

  // Also save every 10 seconds as backup
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const state = { tapPower, level, ownedSkins, equippedSkin, lifetimeTaps };
      if (
        state.tapPower !== lastSavedRef.current.tapPower ||
        state.level !== lastSavedRef.current.level ||
        JSON.stringify(state.ownedSkins) !== JSON.stringify(lastSavedRef.current.ownedSkins) ||
        state.equippedSkin !== lastSavedRef.current.equippedSkin ||
        state.lifetimeTaps !== lastSavedRef.current.lifetimeTaps
      ) {
        persist(state);
      }
    }, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tapPower, level, ownedSkins, equippedSkin, lifetimeTaps, persist]);

  const incrementPoints = useCallback(() => {
    addTransaction({
      type: 'earn',
      amount: tapPower,
      reason: 'Orb Tap',
    });
    setLifetimeTaps((prev) => prev + 1);
  }, [tapPower, addTransaction]);

  const setTapPower = useCallback((n: number) => {
    setTapPowerState((prev) => (typeof n === 'number' && n >= 0 ? n : prev));
  }, []);

  const setLevel = useCallback((n: number) => {
    setLevelState((prev) => (typeof n === 'number' && n >= 1 ? n : prev));
  }, []);

  const purchaseUpgrade = useCallback(
    (cost: number, powerIncrease: number): boolean => {
      if (typeof cost !== 'number' || typeof powerIncrease !== 'number' || cost < 0 || powerIncrease < 0) return false;
      if (balance < cost) return false;
      addTransaction({
        type: 'spend',
        amount: -cost,
        reason: 'Upgrade',
      });
      setTapPowerState((prev) => prev + powerIncrease);
      return true;
    },
    [balance, addTransaction]
  );

  const unlockSkin = useCallback(
    (skinId: string, cost: number): boolean => {
      if (ownedSkins.includes(skinId)) return true;
      if (typeof cost !== 'number' || cost < 0 || balance < cost) return false;
      addTransaction({
        type: 'spend',
        amount: -cost,
        reason: 'Unlock Skin',
      });
      setOwnedSkins((prev) => (prev.includes(skinId) ? prev : [...prev, skinId]));
      return true;
    },
    [balance, ownedSkins, addTransaction]
  );

  const equipSkin = useCallback((skinId: string) => {
    if (!ownedSkins.includes(skinId)) return;
    setEquippedSkinState(skinId);
  }, [ownedSkins]);

  const resetGame = useCallback(async () => {
    try {
      for (const key of GAME_STORAGE_KEYS) {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.error('GameContext resetGame clear error:', e);
    }
    setTapPowerState(defaultState.tapPower);
    setLevelState(defaultState.level);
    setOwnedSkins([...defaultState.ownedSkins]);
    setEquippedSkinState(defaultState.equippedSkin);
    setLifetimeTaps(defaultState.lifetimeTaps);
    lastSavedRef.current = { ...defaultState };
    try {
      await AsyncStorage.setItem(GAME_KEY, JSON.stringify(defaultState));
    } catch (e) {
      console.error('GameContext resetGame persist error:', e);
    }
  }, []);

  const blockUser = useCallback((userId: string) => {
    setBlockedUsers((prev) => {
      if (prev.includes(userId)) return prev;
      const next = [...prev, userId];
      AsyncStorage.setItem(BLOCKED_KEY, JSON.stringify(next)).catch((e) => console.error('Block persist:', e));
      return next;
    });
  }, []);

  const unblockUser = useCallback((userId: string) => {
    setBlockedUsers((prev) => {
      const next = prev.filter((id) => id !== userId);
      AsyncStorage.setItem(BLOCKED_KEY, JSON.stringify(next)).catch((e) => console.error('Unblock persist:', e));
      return next;
    });
  }, []);

  const isBlocked = useCallback(
    (userId: string) => blockedUsers.includes(userId),
    [blockedUsers]
  );

  return (
    <GameContext.Provider
      value={{
        points,
        tapPower,
        level,
        ownedSkins,
        equippedSkin,
        lifetimeTaps,
        incrementPoints,
        setTapPower,
        setLevel,
        purchaseUpgrade,
        unlockSkin,
        equipSkin,
        resetGame,
        loading,
        blockedUsers,
        blockUser,
        unblockUser,
        isBlocked,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};

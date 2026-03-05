/**
 * Admin-controlled tutorial toggles. Which tutorials are globally disabled.
 * Persisted to AsyncStorage. Used by TutorialContext and Admin Hub.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@orbtap_admin_tutorial_disabled';

interface TutorialConfigContextValue {
  disabledIds: string[];
  isTutorialDisabled(tutorialId: string): boolean;
  setTutorialDisabled(tutorialId: string, disabled: boolean): Promise<void>;
  resetToDefaults(): Promise<void>;
  loaded: boolean;
}

const TutorialConfigContext = createContext<TutorialConfigContextValue | null>(null);

export function TutorialConfigProvider({ children }: { children: React.ReactNode }) {
  const [disabledIds, setDisabledIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        setDisabledIds(raw ? JSON.parse(raw) : []);
      } catch {
        setDisabledIds([]);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const isTutorialDisabled = useCallback(
    (tutorialId: string) => disabledIds.includes(tutorialId),
    [disabledIds]
  );

  const setTutorialDisabled = useCallback(async (tutorialId: string, disabled: boolean) => {
    setDisabledIds((prev) => {
      const next = disabled
        ? prev.includes(tutorialId) ? prev : [...prev, tutorialId]
        : prev.filter((id) => id !== tutorialId);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(async () => {
    setDisabledIds([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: TutorialConfigContextValue = {
    disabledIds,
    isTutorialDisabled,
    setTutorialDisabled,
    resetToDefaults,
    loaded,
  };

  return <TutorialConfigContext.Provider value={value}>{children}</TutorialConfigContext.Provider>;
}

export function useTutorialConfig(): TutorialConfigContextValue {
  const ctx = useContext(TutorialConfigContext);
  if (!ctx) throw new Error('useTutorialConfig must be used within TutorialConfigProvider');
  return ctx;
}

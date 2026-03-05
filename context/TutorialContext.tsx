/**
 * Tutorial state: skip all, completed IDs. Persisted to AsyncStorage.
 * Used by GuidedTutorialOverlay and Settings Tutorials.
 * Respects admin-disabled tutorials from TutorialConfigContext.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTutorialConfig } from './TutorialConfigContext';

const SKIP_ALL_KEY = '@orbtap_tutorial_skip_all';
const COMPLETED_KEY = '@orbtap_tutorial_completed';

interface TutorialContextValue {
  skipAll: boolean;
  completedIds: string[];
  shouldShowTutorial(tutorialId: string): boolean;
  markCompleted(tutorialId: string): Promise<void>;
  setSkipAllTutorials(): Promise<void>;
  clearCompleted(tutorialId?: string): Promise<void>;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { isTutorialDisabled } = useTutorialConfig();
  const [skipAll, setSkipAll] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [skip, completed] = await Promise.all([
          AsyncStorage.getItem(SKIP_ALL_KEY),
          AsyncStorage.getItem(COMPLETED_KEY),
        ]);
        setSkipAll(skip === 'true');
        setCompletedIds(completed ? JSON.parse(completed) : []);
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const markCompleted = useCallback(async (tutorialId: string) => {
    setCompletedIds((prev) => {
      const next = prev.includes(tutorialId) ? prev : [...prev, tutorialId];
      AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setSkipAllTutorials = useCallback(async () => {
    setSkipAll(true);
    await AsyncStorage.setItem(SKIP_ALL_KEY, 'true');
  }, []);

  const shouldShowTutorial = useCallback(
    (tutorialId: string) => {
      if (!loaded || skipAll || completedIds.includes(tutorialId) || isTutorialDisabled(tutorialId)) return false;
      return true;
    },
    [loaded, skipAll, completedIds, isTutorialDisabled]
  );

  const clearCompleted = useCallback(async (tutorialId?: string) => {
    if (tutorialId) {
      setCompletedIds((prev) => {
        const next = prev.filter((id) => id !== tutorialId);
        AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    } else {
      setCompletedIds([]);
      await AsyncStorage.removeItem(COMPLETED_KEY);
    }
  }, []);

  const value: TutorialContextValue = {
    skipAll,
    completedIds,
    shouldShowTutorial,
    markCompleted,
    setSkipAllTutorials,
    clearCompleted,
  };

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
  return ctx;
}

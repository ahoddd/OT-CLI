/**
 * Onboarding slides config. Admin can override via Admin Hub; stored in AsyncStorage.
 * App merges stored overrides with defaults from OnboardingConfig.
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingSlide, OnboardingAudience } from '../constants/OnboardingConfig';
import {
  DEFAULT_MEMBER_SLIDES,
  DEFAULT_PARTNER_SLIDES,
} from '../constants/OnboardingConfig';

const STORAGE_KEY = '@orbtap_onboarding_slides_v1';

interface StoredConfig {
  memberSlides: OnboardingSlide[];
  partnerSlides: OnboardingSlide[];
}

function sortSlides(slides: OnboardingSlide[]): OnboardingSlide[] {
  return [...slides].sort((a, b) => a.order - b.order);
}

export function useOnboardingConfig() {
  const [stored, setStored] = useState<StoredConfig | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        setStored(raw ? JSON.parse(raw) : null);
      } catch {
        setStored(null);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const memberSlides = stored?.memberSlides?.length
    ? sortSlides(stored.memberSlides)
    : DEFAULT_MEMBER_SLIDES;
  const partnerSlides = stored?.partnerSlides?.length
    ? sortSlides(stored.partnerSlides)
    : DEFAULT_PARTNER_SLIDES;

  const saveConfig = useCallback(async (config: StoredConfig) => {
    setStored(config);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, []);

  const addSlide = useCallback(
    async (audience: OnboardingAudience, slide: Omit<OnboardingSlide, 'id' | 'order'>) => {
      const current = audience === 'member' ? memberSlides : partnerSlides;
      const maxOrder = current.length ? Math.max(...current.map((s) => s.order)) : 0;
      const newSlide: OnboardingSlide = {
        ...slide,
        id: `${audience}-${Date.now()}`,
        audience,
        order: maxOrder + 1,
      };
      const next =
        audience === 'member'
          ? { memberSlides: [...memberSlides, newSlide], partnerSlides }
          : { memberSlides, partnerSlides: [...partnerSlides, newSlide] };
      await saveConfig(next);
    },
    [memberSlides, partnerSlides, saveConfig]
  );

  const updateSlide = useCallback(
    async (audience: OnboardingAudience, id: string, updates: Partial<OnboardingSlide>) => {
      const current = audience === 'member' ? memberSlides : partnerSlides;
      const nextSlides = current.map((s) => (s.id === id ? { ...s, ...updates } : s));
      const next =
        audience === 'member'
          ? { memberSlides: nextSlides, partnerSlides }
          : { memberSlides, partnerSlides: nextSlides };
      await saveConfig(next);
    },
    [memberSlides, partnerSlides, saveConfig]
  );

  const deleteSlide = useCallback(
    async (audience: OnboardingAudience, id: string) => {
      const current = audience === 'member' ? memberSlides : partnerSlides;
      const nextSlides = current.filter((s) => s.id !== id);
      const next =
        audience === 'member'
          ? { memberSlides: nextSlides, partnerSlides }
          : { memberSlides, partnerSlides: nextSlides };
      await saveConfig(next);
    },
    [memberSlides, partnerSlides, saveConfig]
  );

  const reorderSlides = useCallback(
    async (audience: OnboardingAudience, orderedIds: string[]) => {
      const current = audience === 'member' ? memberSlides : partnerSlides;
      const byId = new Map(current.map((s) => [s.id, s]));
      const nextSlides = orderedIds
        .map((id, index) => {
          const s = byId.get(id);
          return s ? { ...s, order: index + 1 } : null;
        })
        .filter(Boolean) as OnboardingSlide[];
      const next =
        audience === 'member'
          ? { memberSlides: nextSlides, partnerSlides }
          : { memberSlides, partnerSlides: nextSlides };
      await saveConfig(next);
    },
    [memberSlides, partnerSlides, saveConfig]
  );

  const resetToDefaults = useCallback(async () => {
    setStored(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    memberSlides,
    partnerSlides,
    loaded,
    addSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    saveConfig,
    resetToDefaults,
    hasOverrides: stored !== null,
  };
}

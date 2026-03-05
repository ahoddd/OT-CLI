/**
 * OrbSwipe user controls preferences — radius, indoor-only, hide categories, hidden partners.
 * Persisted to AsyncStorage (ORBTAP_ORBSWIPE_PREFS_V1). Used for deck composition and Tune sheet.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ORBTAP_ORBSWIPE_PREFS_V1';

export interface OrbSwipePreferences {
  radiusMiles: number;
  indoorOnly: boolean;
  hideCategoryIds: string[];
  showFewerSponsored: boolean;
  /** Partner IDs to hide from deck (block in OrbSwipe). */
  hiddenPartnerIds: string[];
  /** "Show fewer like this" — keys like "category:partnerId" or "partnerId", downrank for 7 days. */
  downrankKeys: string[];
  downrankExpiresAt: number;
}

const DEFAULT_PREFS: OrbSwipePreferences = {
  radiusMiles: 10,
  indoorOnly: false,
  hideCategoryIds: [],
  showFewerSponsored: false,
  hiddenPartnerIds: [],
  downrankKeys: [],
  downrankExpiresAt: 0,
};

export function useOrbSwipePreferences() {
  const [prefs, setPrefs] = useState<OrbSwipePreferences>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<OrbSwipePreferences> & Record<string, unknown>;
          const now = Date.now();
          const downrankKeys = Array.isArray(parsed.downrankKeys) ? parsed.downrankKeys : [];
          const downrankExpiresAt = typeof parsed.downrankExpiresAt === 'number' ? parsed.downrankExpiresAt : 0;
          setPrefs({
            radiusMiles: typeof parsed.radiusMiles === 'number' && parsed.radiusMiles >= 1 && parsed.radiusMiles <= 15 ? parsed.radiusMiles : DEFAULT_PREFS.radiusMiles,
            indoorOnly: Boolean(parsed.indoorOnly),
            hideCategoryIds: Array.isArray(parsed.hideCategoryIds) ? parsed.hideCategoryIds : [],
            showFewerSponsored: Boolean(parsed.showFewerSponsored),
            hiddenPartnerIds: Array.isArray(parsed.hiddenPartnerIds) ? parsed.hiddenPartnerIds : [],
            downrankKeys: downrankExpiresAt > now ? downrankKeys : [],
            downrankExpiresAt: downrankExpiresAt > now ? downrankExpiresAt : 0,
          });
        }
      } catch (e) {
        if (__DEV__) console.warn('OrbSwipe prefs load error', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const save = useCallback(async (next: OrbSwipePreferences) => {
    setPrefs(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      if (__DEV__) console.warn('OrbSwipe prefs save error', e);
    }
  }, []);

  const setRadiusMiles = useCallback((miles: number) => {
    setPrefs((p) => {
      const next = { ...p, radiusMiles: miles };
      save(next);
      return next;
    });
  }, [save]);

  const setIndoorOnly = useCallback((value: boolean) => {
    setPrefs((p) => {
      const next = { ...p, indoorOnly: value };
      save(next);
      return next;
    });
  }, [save]);

  const setHideCategoryIds = useCallback((ids: string[]) => {
    setPrefs((p) => {
      const next = { ...p, hideCategoryIds: ids };
      save(next);
      return next;
    });
  }, [save]);

  const setShowFewerSponsored = useCallback((value: boolean) => {
    setPrefs((p) => {
      const next = { ...p, showFewerSponsored: value };
      save(next);
      return next;
    });
  }, [save]);

  const hidePartner = useCallback((partnerId: string) => {
    setPrefs((p) => {
      const set = new Set(p.hiddenPartnerIds);
      set.add(partnerId);
      const next = { ...p, hiddenPartnerIds: Array.from(set) };
      save(next);
      return next;
    });
  }, [save]);

  /** "Show fewer like this" — downrank this category/partner for 7 days. */
  const downrankCategoryOrPartner = useCallback((categoryId: string, partnerId?: string) => {
    const key = partnerId ? `${categoryId}:${partnerId}` : categoryId;
    setPrefs((p) => {
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const set = new Set(p.downrankKeys);
      set.add(key);
      const next = { ...p, downrankKeys: Array.from(set), downrankExpiresAt: expiresAt };
      save(next);
      return next;
    });
  }, [save]);

  return {
    prefs,
    loaded,
    setRadiusMiles,
    setIndoorOnly,
    setHideCategoryIds,
    setShowFewerSponsored,
    hidePartner,
    downrankCategoryOrPartner,
  };
}

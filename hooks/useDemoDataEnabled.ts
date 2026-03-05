/**
 * Demo data toggle — admin can turn off all mock/demo partners, map pins, feed posts
 * so the app shows a fresh empty state for launch with real signups only.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_DEMO_DATA_ENABLED, DEMO_DATA_STORAGE_KEY } from '../constants/DemoDataConfig';

export function useDemoDataEnabled(): {
  demoDataEnabled: boolean;
  setDemoDataEnabled: (value: boolean) => Promise<void>;
  loading: boolean;
} {
  const [demoDataEnabled, setState] = useState(DEFAULT_DEMO_DATA_ENABLED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DEMO_DATA_STORAGE_KEY);
        if (raw !== null) {
          setState(raw === 'true');
        }
      } catch {
        // keep default
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setDemoDataEnabled = useCallback(async (value: boolean) => {
    setState(value);
    try {
      await AsyncStorage.setItem(DEMO_DATA_STORAGE_KEY, value ? 'true' : 'false');
    } catch (e) {
      if (__DEV__) console.warn('Demo data preference save failed', e);
    }
  }, []);

  return { demoDataEnabled, setDemoDataEnabled, loading };
}

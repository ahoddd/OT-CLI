/**
 * Show demo polls when Firestore has no polls. Admin-only toggle in Admin Hub.
 * Default: true (show demos until admin turns off after launch).
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHOW_DEMO_POLLS_KEY = 'orbtap_showDemoPolls';

export async function getShowDemoPolls(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SHOW_DEMO_POLLS_KEY);
    if (raw === null) return true; // default: show demo polls
    return raw === 'true';
  } catch {
    return true;
  }
}

export function useShowDemoPolls() {
  const [showDemoPolls, setShowDemoPollsState] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const value = await getShowDemoPolls();
      setShowDemoPollsState(value);
      setLoading(false);
    })();
  }, []);

  const setShowDemoPolls = useCallback(async (value: boolean) => {
    setShowDemoPollsState(value);
    try {
      await AsyncStorage.setItem(SHOW_DEMO_POLLS_KEY, value ? 'true' : 'false');
    } catch (e) {
      if (__DEV__) console.warn('showDemoPolls save error:', e);
    }
  }, []);

  return { showDemoPolls, setShowDemoPolls, loading };
}

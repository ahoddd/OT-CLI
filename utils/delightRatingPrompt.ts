/**
 * Rating prompt at delight moments (first scan, first mission complete, new level).
 * Phase 8 — competitive differentiation. Use expo-store-review when available.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking } from 'react-native';
import { APP_STORE_URL, PLAY_STORE_URL } from '../constants/AppLinks';
import { Platform } from 'react-native';

const STORAGE_KEY = 'ORBTAP_RATING_PROMPT_V1';

type DelightMoment = 'first_scan' | 'first_mission' | 'new_level';

/** Returns true if we should show the rating prompt (first time for this moment type). */
export async function shouldShowRatingPrompt(moment: DelightMoment): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const seen: string[] = raw ? JSON.parse(raw) : [];
    if (seen.includes(moment)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Mark that we've shown the prompt for this moment (or user dismissed). */
export async function markRatingPromptShown(moment: DelightMoment): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const seen: string[] = raw ? JSON.parse(raw) : [];
    if (!seen.includes(moment)) seen.push(moment);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {}
}

/** Open the app store review page. */
function openStoreReview(): void {
  const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
  Linking.openURL(url).catch(() => {});
}

/**
 * Show the rating prompt if appropriate for this moment. Call after first scan, first mission complete, or level up.
 */
export function showRatingPromptIfDelight(moment: DelightMoment): void {
  shouldShowRatingPrompt(moment).then((show) => {
    if (!show) return;
    Alert.alert(
      'Enjoying OrbTap?',
      'Your feedback helps us improve. Would you rate us on the store?',
      [
        { text: 'Maybe later', style: 'cancel', onPress: () => markRatingPromptShown(moment) },
        { text: 'Rate us', onPress: () => { markRatingPromptShown(moment); openStoreReview(); } },
      ]
    );
  });
}

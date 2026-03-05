/**
 * OrbSwipe origin tracking — when user completes a verified action from Fuse, show recap + optional bonus.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_WIN_KEY = 'ORBTAP_ORBSWIPE_PENDING_WIN';

export interface OrbSwipePendingWin {
  type: 'drop' | 'mission';
  dropId?: string;
  missionId?: string;
  partnerId: string;
  at: number;
}

export async function setOrbSwipePendingWin(payload: Omit<OrbSwipePendingWin, 'at'>): Promise<void> {
  await AsyncStorage.setItem(
    PENDING_WIN_KEY,
    JSON.stringify({ ...payload, at: Date.now() })
  );
}

const PENDING_WIN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function getOrbSwipePendingWin(): Promise<OrbSwipePendingWin | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_WIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrbSwipePendingWin;
    if (!parsed.partnerId || !parsed.type) return null;
    const at = parsed.at ?? 0;
    if (Date.now() - at > PENDING_WIN_MAX_AGE_MS) {
      await clearOrbSwipePendingWin();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearOrbSwipePendingWin(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_WIN_KEY);
}

/** Call after showing OrbSwipe Win banner / recap so we don't show again. */
export async function consumeOrbSwipePendingWinIfMatch(partnerId: string): Promise<boolean> {
  const pending = await getOrbSwipePendingWin();
  if (!pending || pending.partnerId !== partnerId) return false;
  await clearOrbSwipePendingWin();
  return true;
}

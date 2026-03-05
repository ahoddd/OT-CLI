/**
 * Save daily ritual config to Firestore (admin only). Called from Admin Hub.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';
import type { DailyOrbRitualConfig } from '../constants/DailyRitualConfig';

export async function saveDailyRitualConfigToServer(
  config: DailyOrbRitualConfig,
  updatedBy: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const f = getFunctions(auth.app, 'us-central1');
    const fn = httpsCallable<
      Record<string, unknown> & { updatedBy?: string },
      { success: boolean; message?: string }
    >(f, 'setDailyRitualConfig');
    const payload = {
      ...config,
      audit: { updatedAt: Date.now(), updatedBy },
    };
    const res = await fn(payload);
    const data = res.data;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Save failed' };
  } catch (e: unknown) {
    const message =
      e && typeof e === 'object' && 'message' in e
        ? String((e as { message: unknown }).message)
        : 'Service unavailable';
    return { success: false, message };
  }
}

/**
 * Admin push config — get/set global push settings, send test push.
 * Calls Cloud Functions (setPushConfig, getPushConfigCallable, sendTestPush).
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebaseConfig';

export interface PushConfig {
  pollPushEnabled: boolean;
  deadlineReminderEnabled: boolean;
  stampReminderEnabled: boolean;
}

export async function getPushConfig(): Promise<{ success: boolean; config?: PushConfig; message?: string }> {
  const f = getFunctions(app, 'us-central1');
  const fn = httpsCallable<unknown, { success: boolean; config?: PushConfig; message?: string }>(f, 'getPushConfigCallable');
  try {
    const result = await fn({});
    return result.data as { success: boolean; config?: PushConfig; message?: string };
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Request failed';
    return { success: false, message };
  }
}

export async function setPushConfig(config: Partial<PushConfig>): Promise<{ success: boolean; message?: string }> {
  const f = getFunctions(app, 'us-central1');
  const fn = httpsCallable<Partial<PushConfig>, { success: boolean; message?: string }>(f, 'setPushConfig');
  try {
    const result = await fn(config);
    return result.data as { success: boolean; message?: string };
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Request failed';
    return { success: false, message };
  }
}

export async function sendTestPush(): Promise<{ success: boolean; message?: string }> {
  const f = getFunctions(app, 'us-central1');
  const fn = httpsCallable<unknown, { success: boolean; message?: string }>(f, 'sendTestPush');
  try {
    const result = await fn({});
    return result.data as { success: boolean; message?: string };
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Request failed';
    return { success: false, message };
  }
}

/** Admin-only: run stamp reward-expiring reminders now (otherwise sent daily at 10:00 UTC). */
export async function runStampCardsReminders(): Promise<{ success: boolean; message?: string; sent?: number }> {
  const f = getFunctions(app, 'us-central1');
  const fn = httpsCallable<unknown, { success: boolean; message?: string; sent?: number }>(f, 'stampCardsSendReminders');
  try {
    const result = await fn({});
    return result.data as { success: boolean; message?: string; sent?: number };
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Request failed';
    return { success: false, message };
  }
}

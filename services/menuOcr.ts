/**
 * Partner Menu OCR — call Cloud Function to extract text from menu photo URLs.
 * Falls back to empty string if function is unavailable or fails.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';

const REGION = 'us-central1';

export type MenuOcrResult =
  | { success: true; text: string }
  | { success: false; text: ''; error?: string };

export async function extractMenuTextFromImageUrls(urls: string[]): Promise<MenuOcrResult> {
  if (!urls.length) return { success: true, text: '' };
  try {
    const f = getFunctions(auth.app, REGION);
    const fn = httpsCallable<
      { urls: string[] },
      { text?: string; error?: string }
    >(f, 'menuOcrFromUrls');
    const res = await fn({ urls });
    const data = res.data as { text?: string; error?: string } | undefined;
    const text = typeof data?.text === 'string' ? data.text.trim() : '';
    if (data?.error) return { success: false, text: '', error: data.error };
    return { success: true, text };
  } catch (e) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'OCR unavailable';
    return { success: false, text: '', error: message };
  }
}

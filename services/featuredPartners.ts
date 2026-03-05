/**
 * Featured partners config for Orb hub carousel (up to 3 paid slots + 1 wildcard).
 * Admin sets via Admin Hub; app reads for carousel.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';

export interface FeaturedSlotConfig {
  partnerId: string;
  customImageUrl: string | null;
  order: number;
}

export type GetFeaturedPartnersConfigResult =
  | { success: true; entries: FeaturedSlotConfig[] }
  | { success: false; message: string };

export type SetFeaturedPartnersConfigResult =
  | { success: true }
  | { success: false; message: string };

function getFunctionsRegion() {
  return getFunctions(auth.app, 'us-central1');
}

export async function getFeaturedPartnersConfig(): Promise<GetFeaturedPartnersConfigResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<unknown, { success: boolean; entries?: FeaturedSlotConfig[]; message?: string }>(f, 'getFeaturedPartnersConfig');
    const res = await fn({});
    const data = res.data;
    if (data?.success && Array.isArray(data.entries)) {
      return { success: true, entries: data.entries };
    }
    return { success: false, message: (data?.message as string) ?? 'Failed to load' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

export async function setFeaturedPartnersConfig(entries: FeaturedSlotConfig[]): Promise<SetFeaturedPartnersConfigResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<{ entries: FeaturedSlotConfig[] }, { success: boolean; message?: string }>(f, 'setFeaturedPartnersConfig');
    const res = await fn({ entries });
    const data = res.data;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Failed to save' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

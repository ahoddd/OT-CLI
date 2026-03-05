/**
 * Global stats for social proof (landing, premium). Uses metaStats/global.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebaseConfig';

const getF = () => getFunctions(app, 'us-central1');

export type GlobalStats = {
  userCount: number;
  partnerCount: number;
  totalRedemptions: number;
};

export async function getGlobalStats(): Promise<GlobalStats | null> {
  try {
    const fn = httpsCallable<unknown, { success: boolean; userCount?: number; partnerCount?: number; totalRedemptions?: number }>(
      getF(),
      'getGlobalStats'
    );
    const res = await fn({});
    const data = res.data;
    if (!data?.success) return null;
    return {
      userCount: data.userCount ?? 0,
      partnerCount: data.partnerCount ?? 0,
      totalRedemptions: data.totalRedemptions ?? 0,
    };
  } catch {
    return null;
  }
}

/** Format large numbers for display (e.g. 12400 -> "12.4K+"). */
export function formatStatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K+`;
  if (n > 0) return `${n}+`;
  return '0';
}

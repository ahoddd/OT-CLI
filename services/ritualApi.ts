/**
 * Daily Orb Ritual — server-authoritative claim.
 * Idempotent once per day; returns points + optional badge.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';

export interface ClaimDailyOrbRitualResult {
  success: boolean;
  pointsAwarded: number;
  badgeAwarded?: { badgeId: string; tier: string };
  alreadyClaimed: boolean;
  claimedAt: number;
  nextEligibleAt: number;
  message?: string;
}

/**
 * Claim daily ritual reward. Call after orb breaks (3rd tap).
 * Server returns idempotent payload if already claimed today.
 */
export async function claimDailyOrbRitual(params?: {
  clientNonce?: string;
  streakDays?: number;
}): Promise<ClaimDailyOrbRitualResult> {
  try {
    const f = getFunctions(auth.app, 'us-central1');
    const fn = httpsCallable<
      { clientNonce?: string; streakDays?: number },
      {
        success: boolean;
        pointsAwarded?: number;
        badgeAwarded?: { badgeId: string; tier: string };
        alreadyClaimed?: boolean;
        claimedAt?: number;
        nextEligibleAt?: number;
        message?: string;
      }
    >(f, 'claimDailyOrbRitual');
    const res = await fn({
      clientNonce: params?.clientNonce ?? `ritual_${Date.now()}`,
      streakDays: params?.streakDays ?? 1,
    });
    const data = res.data;
    if (data?.success && typeof data.pointsAwarded === 'number') {
      return {
        success: true,
        pointsAwarded: data.pointsAwarded,
        badgeAwarded: data.badgeAwarded,
        alreadyClaimed: data.alreadyClaimed === true,
        claimedAt: typeof data.claimedAt === 'number' ? data.claimedAt : Date.now(),
        nextEligibleAt: typeof data.nextEligibleAt === 'number' ? data.nextEligibleAt : 0,
      };
    }
    return {
      success: false,
      pointsAwarded: 0,
      alreadyClaimed: data?.alreadyClaimed === true,
      claimedAt: typeof data?.claimedAt === 'number' ? data.claimedAt : 0,
      nextEligibleAt: typeof data?.nextEligibleAt === 'number' ? data.nextEligibleAt : 0,
      message: (data?.message as string) ?? 'Claim failed',
    };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return {
      success: false,
      pointsAwarded: 0,
      alreadyClaimed: false,
      claimedAt: 0,
      nextEligibleAt: 0,
      message,
    };
  }
}

export interface ClaimBonusOrbTapResult {
  success: boolean;
  pointsAwarded: number;
  alreadyClaimed: boolean;
  message?: string;
}

/** Claim bonus orb tap after watching the reward ad. Once per day; only if user already claimed regular ritual today. */
export async function claimBonusOrbTapAfterAd(): Promise<ClaimBonusOrbTapResult> {
  try {
    const f = getFunctions(auth.app, 'us-central1');
    const fn = httpsCallable<Record<string, never>, { success?: boolean; pointsAwarded?: number; alreadyClaimed?: boolean; message?: string }>(f, 'claimBonusOrbTapAfterAd');
    const res = await fn({});
    const data = res.data;
    if (data?.success) {
      return {
        success: true,
        pointsAwarded: typeof data.pointsAwarded === 'number' ? data.pointsAwarded : 0,
        alreadyClaimed: data.alreadyClaimed === true,
      };
    }
    return {
      success: false,
      pointsAwarded: 0,
      alreadyClaimed: data?.alreadyClaimed === true,
      message: (data?.message as string) ?? 'Claim failed',
    };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, pointsAwarded: 0, alreadyClaimed: false, message };
  }
}

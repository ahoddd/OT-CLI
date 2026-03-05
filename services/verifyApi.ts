/**
 * Server-authoritative verify + wallet API (Cloud Functions).
 * Used by WalletContext for awardVerifiedAction and spendWallet.
 * See docs/BUILD/FRAUD_DEFENSE_API.md.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';

export type AwardVerifiedActionResult =
  | { success: true; actionId: string; pointsAwarded: number; balance: number; idempotent: boolean }
  | { success: false; message: string };

export type SpendWalletResult =
  | { success: true; balance: number; idempotent: boolean }
  | { success: false; message: string };

export type GetWalletBalanceResult =
  | { success: true; balance: number }
  | { success: false; message: string };

export type SponsorMissionResult =
  | { success: true; balance: number; expiresAt: number; targetMissionCount: number; message?: string }
  | { success: false; message: string };

export type CreatePerkRedeemTokenResult =
  | { success: true; token: string; expiresAt: number; points: number }
  | { success: false; message: string };

export type VerifyPerkRedeemTokenResult =
  | { success: true; message: string; pointsAwarded: number; actionId: string }
  | { success: false; message: string };

function getFunctionsRegion() {
  return getFunctions(auth.app, 'us-central1');
}

/**
 * Award a verified action (redeem / drop redeem / quest complete). Server-authoritative; idempotent; rate limited.
 */
export async function awardVerifiedAction(params: {
  refType?: string;
  refId: string;
  reasonCode?: string;
  partnerId?: string;
  perkId?: string;
  clientNonce?: string;
  /** Client GPS for server-side proximity anti-cheat (optional but encouraged). */
  clientLat?: number;
  clientLng?: number;
}): Promise<AwardVerifiedActionResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<
      { refType?: string; refId: string; reasonCode?: string; partnerId?: string; perkId?: string; clientNonce?: string; clientLat?: number; clientLng?: number },
      { success: boolean; actionId?: string; pointsAwarded?: number; balance?: number; idempotent?: boolean; message?: string }
    >(f, 'awardVerifiedAction');
    const res = await fn({
      refType: params.refType ?? 'perk',
      refId: params.refId,
      reasonCode: params.reasonCode ?? 'EMIT_VERIFIED_REDEEM',
      partnerId: params.partnerId ?? '',
      perkId: params.perkId ?? params.refId,
      clientNonce: params.clientNonce,
      clientLat: params.clientLat,
      clientLng: params.clientLng,
    });
    const data = res.data;
    if (data?.success && data.actionId != null && data.pointsAwarded != null && data.balance != null) {
      return {
        success: true,
        actionId: data.actionId,
        pointsAwarded: data.pointsAwarded,
        balance: data.balance,
        idempotent: data.idempotent === true,
      };
    }
    return { success: false, message: (data?.message as string) ?? 'Verification failed' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

/**
 * Create a one-time, user-bound redemption token for showing a QR at the venue.
 * Customer calls this; then shows QR with orbtap://redeem?t=TOKEN. Only the partner can verify (scan).
 */
export async function createPerkRedeemToken(params: {
  partnerId: string;
  perkId: string;
  points?: number;
}): Promise<CreatePerkRedeemTokenResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<
      { partnerId: string; perkId: string; points?: number },
      { success: boolean; token?: string; expiresAt?: number; points?: number; message?: string }
    >(f, 'createPerkRedeemToken');
    const res = await fn({
      partnerId: params.partnerId,
      perkId: params.perkId,
      points: params.points,
    });
    const data = res.data;
    if (data?.success && data.token != null && data.expiresAt != null) {
      return {
        success: true,
        token: data.token,
        expiresAt: data.expiresAt,
        points: typeof data.points === 'number' ? data.points : 0,
      };
    }
    return { success: false, message: (data?.message as string) ?? 'Could not create code' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

/**
 * Verify a customer's one-time redemption code. Callable only by the partner (venue).
 * Partner scans the customer's QR; backend credits the customer (token's userId).
 */
export async function verifyPerkRedeemToken(token: string): Promise<VerifyPerkRedeemTokenResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<
      { token: string },
      { success: boolean; message?: string; pointsAwarded?: number; actionId?: string }
    >(f, 'verifyPerkRedeemToken');
    const res = await fn({ token: token.trim() });
    const data = res.data;
    if (data?.success && data.pointsAwarded != null && data.actionId != null) {
      return {
        success: true,
        message: (data.message as string) ?? 'Redeemed.',
        pointsAwarded: data.pointsAwarded,
        actionId: data.actionId,
      };
    }
    return { success: false, message: (data?.message as string) ?? 'Verification failed' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

/**
 * Spend OT Points (server-authoritative). Requires clientNonce for idempotency; rate limited.
 */
export async function spendWallet(params: {
  productKey: string;
  amountExpected: number;
  clientNonce: string;
  refType?: string;
  refId?: string;
}): Promise<SpendWalletResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<
      { productKey: string; amountExpected: number; clientNonce: string; refType?: string; refId?: string },
      { success: boolean; balance?: number; idempotent?: boolean; message?: string }
    >(f, 'spendWallet');
    const res = await fn({
      productKey: params.productKey,
      amountExpected: params.amountExpected,
      clientNonce: params.clientNonce,
      refType: params.refType,
      refId: params.refId,
    });
    const data = res.data;
    if (data?.success && typeof data.balance === 'number') {
      return { success: true, balance: data.balance, idempotent: data.idempotent === true };
    }
    return { success: false, message: (data?.message as string) ?? 'Spend failed' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

/**
 * Sponsor a mission (partner pays OT to appear in user daily missions). Deducts OT and creates missionSponsorship doc.
 * Caller must be the partner owner.
 */
export async function sponsorMission(params: {
  partnerId: string;
  targetMissionCount?: number;
}): Promise<SponsorMissionResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<
      { partnerId: string; targetMissionCount?: number },
      { success: boolean; balance?: number; expiresAt?: number; targetMissionCount?: number; message?: string }
    >(f, 'sponsorMission');
    const res = await fn({
      partnerId: params.partnerId,
      targetMissionCount: params.targetMissionCount,
    });
    const data = res.data;
    if (data?.success && typeof data.balance === 'number') {
      return {
        success: true,
        balance: data.balance,
        expiresAt: data.expiresAt ?? 0,
        targetMissionCount: data.targetMissionCount ?? 50,
        message: data.message as string | undefined,
      };
    }
    return { success: false, message: (data?.message as string) ?? 'Sponsor request failed' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

/**
 * Fetch current OT Points balance from server. Use on app load so balance is consistent across devices.
 */
export async function getWalletBalance(): Promise<GetWalletBalanceResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<unknown, { success: boolean; balance?: number; message?: string }>(f, 'getWalletBalance');
    const res = await fn({});
    const data = res.data;
    if (data?.success && typeof data.balance === 'number') {
      return { success: true, balance: data.balance };
    }
    return { success: false, message: (data?.message as string) ?? 'Failed to load balance' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

/**
 * Stamp Cards™ — client API (Cloud Functions callables).
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';
import type { StampProgram, StampCardState } from '../constants/StampCards';

function getFunctionsRegion() {
  return getFunctions(auth.app, 'us-central1');
}

export type EarnStampResult =
  | { success: true; stampCount: number; rewardEarned: boolean; nextEligibleAt: number; actionId?: string; activeReward?: unknown; idempotent?: boolean }
  | { success: false; message: string; nextEligibleAt?: number };

export async function earnStamp(params: { partnerId: string; programId: string; tokenId?: string }): Promise<EarnStampResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<
      { partnerId: string; programId: string; tokenId?: string },
      { success: boolean; stampCount?: number; rewardEarned?: boolean; nextEligibleAt?: number; actionId?: string; activeReward?: unknown; idempotent?: boolean; message?: string }
    >(f, 'stampCardsEarnStamp');
    const res = await fn({ partnerId: params.partnerId, programId: params.programId, tokenId: params.tokenId });
    const data = res.data;
    if (data?.success) {
      return {
        success: true,
        stampCount: data.stampCount ?? 0,
        rewardEarned: data.rewardEarned === true,
        nextEligibleAt: data.nextEligibleAt ?? 0,
        actionId: data.actionId,
        activeReward: data.activeReward,
        idempotent: data.idempotent === true,
      };
    }
    return { success: false, message: (data?.message as string) ?? 'Could not earn stamp', nextEligibleAt: data?.nextEligibleAt };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

export type RedeemRewardResult =
  | { success: true; actionId?: string; idempotent?: boolean }
  | { success: false; message: string };

export async function redeemStampReward(params: { rewardToken: string } | { pin: string }): Promise<RedeemRewardResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<
      { rewardToken?: string; pin?: string },
      { success: boolean; actionId?: string; idempotent?: boolean; message?: string }
    >(f, 'stampCardsRedeemReward');
    const payload = 'rewardToken' in params ? { rewardToken: params.rewardToken } : { pin: params.pin };
    const res = await fn(payload);
    const data = res.data;
    if (data?.success) {
      return { success: true, actionId: data.actionId, idempotent: data.idempotent === true };
    }
    return { success: false, message: (data?.message as string) ?? 'Could not redeem' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

export type GetProgramResult =
  | { success: true; program: StampProgram & { id: string } }
  | { success: false; message: string };

export type GetActiveProgramForPartnerResult =
  | { success: true; program: (StampProgram & { id: string }) | null }
  | { success: false; message: string };

export async function getActiveStampProgramForPartner(partnerId: string): Promise<GetActiveProgramForPartnerResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<{ partnerId: string }, { success: boolean; program?: (StampProgram & { id: string }) | null; message?: string }>(f, 'stampCardsGetActiveProgramForPartner');
    const res = await fn({ partnerId });
    const data = res.data;
    if (data?.success) return { success: true, program: data.program ?? null };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

export async function getStampProgram(programId: string): Promise<GetProgramResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<{ programId: string }, { success: boolean; program?: StampProgram & { id: string }; message?: string }>(f, 'stampCardsGetProgram');
    const res = await fn({ programId });
    const data = res.data;
    if (data?.success && data.program) return { success: true, program: data.program };
    return { success: false, message: (data?.message as string) ?? 'Program not found' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

export type ListProgramsResult =
  | { success: true; programs: (StampProgram & { id: string })[] }
  | { success: false; message: string };

export async function listStampProgramsForPartner(partnerId?: string): Promise<ListProgramsResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<{ partnerId?: string }, { success: boolean; programs?: (StampProgram & { id: string })[]; message?: string }>(f, 'stampCardsListProgramsForPartner');
    const res = await fn(partnerId != null ? { partnerId } : {});
    const data = res.data;
    if (data?.success && Array.isArray(data.programs)) return { success: true, programs: data.programs };
    return { success: false, message: (data?.message as string) ?? 'Failed to list' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

export type GetUserStateResult =
  | { success: true; state: (StampCardState & { id: string }) | null }
  | { success: true; states: (StampCardState & { id: string })[] }
  | { success: false; message: string };

export async function getStampUserState(programId?: string): Promise<GetUserStateResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<
      { programId?: string },
      { success: boolean; state?: (StampCardState & { id: string }) | null; states?: (StampCardState & { id: string })[]; message?: string }
    >(f, 'stampCardsGetUserState');
    const res = await fn({ programId: programId ?? undefined });
    const data = res.data;
    if (data?.success) {
      if (programId != null) return { success: true, state: data.state ?? null };
      return { success: true, states: data.states ?? [] };
    }
    return { success: false, message: (data?.message as string) ?? 'Failed to get state' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

export type UpsertProgramResult =
  | { success: true; id: string; program: StampProgram & { id: string } }
  | { success: false; message: string };

export async function upsertStampProgram(params: Partial<StampProgram> & { id?: string; partnerId?: string }): Promise<UpsertProgramResult> {
  try {
    const f = getFunctionsRegion();
    const fn = httpsCallable<
      Record<string, unknown>,
      { success: boolean; id?: string; program?: StampProgram & { id: string }; message?: string }
    >(f, 'stampCardsUpsertProgram');
    const res = await fn(params as Record<string, unknown>);
    const data = res.data;
    if (data?.success && data.id && data.program) return { success: true, id: data.id, program: data.program };
    return { success: false, message: (data?.message as string) ?? 'Failed to save program' };
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Service unavailable';
    return { success: false, message };
  }
}

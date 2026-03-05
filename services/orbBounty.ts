/**
 * OrbBounty™ — Client API via Firebase callables.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';
import type { BountyDoc, BidDoc, OrbBountyConfig } from '../constants/orbBounty';

function getFunctionsRegion() {
  try {
    return getFunctions(auth.app, 'us-central1');
  } catch {
    return null;
  }
}

export async function bountyCreate(params: {
  cityId: string;
  geo: { lat: number; lng: number };
  radiusMeters: number;
  category: 'food' | 'retail' | 'services';
  budgetMin: number;
  budgetMax: number;
  ttlSeconds: number;
  privacy: 'public' | 'friends' | 'private';
  title: string;
  templateData: Record<string, unknown>;
  createdByDisplay?: string;
}): Promise<{ success: true; bountyId: string; bounty: BountyDoc } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'bountyCreate')(params);
    const data = res.data as { success?: boolean; bountyId?: string; bounty?: BountyDoc; message?: string };
    if (data?.success && data?.bountyId) return { success: true, bountyId: data.bountyId, bounty: data.bounty! };
    return { success: false, message: data?.message ?? 'Failed to create bounty' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function bountyGet(bountyId: string): Promise<{ success: true; bounty: BountyDoc; bids: BidDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'bountyGet')({ id: bountyId });
    const data = res.data as { success?: boolean; bounty?: BountyDoc; bids?: BidDoc[]; message?: string };
    if (data?.success && data?.bounty) return { success: true, bounty: data.bounty, bids: data.bids ?? [] };
    return { success: false, message: data?.message ?? 'Not found' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function bountyFeed(params: {
  cityId?: string;
  category?: 'food' | 'retail' | 'services';
  highLikelihood?: boolean;
  limit?: number;
}): Promise<{ success: true; bounties: BountyDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'bountyFeed')(params);
    const data = res.data as { success?: boolean; bounties?: BountyDoc[]; message?: string };
    if (data?.success) return { success: true, bounties: data.bounties ?? [] };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function bountyListMine(limit?: number): Promise<{ success: true; bounties: BountyDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'bountyListMine')({ limit: limit ?? 30 });
    const data = res.data as { success?: boolean; bounties?: BountyDoc[]; message?: string };
    if (data?.success) return { success: true, bounties: data.bounties ?? [] };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function bountyBid(bountyId: string, terms: { headline: string; details: string; price?: number | null; discount?: string | null; addons?: string[] }): Promise<{ success: true; bidId: string; bid: BidDoc } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'bountyBid')({ bountyId, terms });
    const data = res.data as { success?: boolean; bidId?: string; bid?: BidDoc; message?: string };
    if (data?.success && data?.bidId) return { success: true, bidId: data.bidId, bid: data.bid! };
    return { success: false, message: data?.message ?? 'Failed to place bid' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function bountyAcceptBid(bountyId: string, bidId: string): Promise<{ success: true; pin: string; qrToken: string } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'bountyAcceptBid')({ bountyId, bidId });
    const data = res.data as { success?: boolean; pin?: string; qrToken?: string; message?: string };
    if (data?.success && data?.pin != null) return { success: true, pin: data.pin, qrToken: data.qrToken ?? '' };
    return { success: false, message: data?.message ?? 'Failed to accept bid' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function bountyVerifyFulfillment(bountyId: string, pinOrQrToken: string): Promise<{ success: true; fulfilledAt: number } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  const isPin = /^\d{6}$/.test(pinOrQrToken);
  try {
    const res = await httpsCallable(f, 'bountyVerifyFulfillment')({ bountyId, [isPin ? 'pin' : 'qrToken']: pinOrQrToken });
    const data = res.data as { success?: boolean; fulfilledAt?: number; message?: string };
    if (data?.success) return { success: true, fulfilledAt: data.fulfilledAt ?? Date.now() };
    return { success: false, message: data?.message ?? 'Verification failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function bountyDeleteBounty(bountyId: string): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'bountyDeleteBounty')({ bountyId });
    const data = res.data as { success?: boolean; message?: string };
    if (data?.success) return { success: true };
    return { success: false, message: data?.message ?? 'Failed to delete' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function bountyListAdmin(params?: { limit?: number; status?: string }): Promise<{ success: true; bounties: BountyDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'bountyListAdmin')(params ?? {});
    const data = res.data as { success?: boolean; bounties?: BountyDoc[]; message?: string };
    if (data?.success) return { success: true, bounties: data.bounties ?? [] };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

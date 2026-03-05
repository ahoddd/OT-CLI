/**
 * Sponsored Ads — client API via Firebase callables.
 * Config and CRUD for premium ad spots (orb carousel, daily ritual reward).
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';
import type { SponsoredAdDoc, SponsoredAdsConfig, SponsoredAdPlacement } from '../constants/sponsoredAds';

function getFunctionsRegion() {
  try {
    return getFunctions(auth.app, 'us-central1');
  } catch {
    return null;
  }
}

export async function getSponsoredAdsConfig(): Promise<
  { success: true; config: SponsoredAdsConfig } | { success: false; message: string }
> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'getSponsoredAdsConfig')({});
    const data = res.data as { success?: boolean; config?: SponsoredAdsConfig; message?: string };
    if (data?.success && data?.config) return { success: true, config: data.config };
    return { success: false, message: data?.message ?? 'Failed to load config' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function setSponsoredAdsConfig(config: Partial<SponsoredAdsConfig>): Promise<
  { success: true } | { success: false; message: string }
> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'setSponsoredAdsConfig')(config);
    const data = res.data as { success?: boolean; message?: string };
    if (data?.success) return { success: true };
    return { success: false, message: data?.message ?? 'Failed to save' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function listSponsoredAds(placement: SponsoredAdPlacement): Promise<
  { success: true; ads: SponsoredAdDoc[] } | { success: false; message: string }
> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'listSponsoredAds')({ placement });
    const data = res.data as { success?: boolean; ads?: SponsoredAdDoc[]; message?: string };
    if (data?.success) return { success: true, ads: data.ads ?? [] };
    return { success: false, message: data?.message ?? 'Failed to load ads' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function adminListSponsoredAds(): Promise<
  { success: true; ads: SponsoredAdDoc[] } | { success: false; message: string }
> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'adminListSponsoredAds')({});
    const data = res.data as { success?: boolean; ads?: SponsoredAdDoc[]; message?: string };
    if (data?.success) return { success: true, ads: data.ads ?? [] };
    return { success: false, message: data?.message ?? 'Failed to load' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function createSponsoredAd(ad: Omit<SponsoredAdDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<
  { success: true; adId: string; ad: SponsoredAdDoc } | { success: false; message: string }
> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'createSponsoredAd')(ad);
    const data = res.data as { success?: boolean; adId?: string; ad?: SponsoredAdDoc; message?: string };
    if (data?.success && data?.adId) return { success: true, adId: data.adId, ad: data.ad! };
    return { success: false, message: data?.message ?? 'Failed to create' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function updateSponsoredAd(adId: string, updates: Partial<Omit<SponsoredAdDoc, 'id' | 'createdAt'>>): Promise<
  { success: true; ad: SponsoredAdDoc } | { success: false; message: string }
> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'updateSponsoredAd')({ adId, ...updates });
    const data = res.data as { success?: boolean; ad?: SponsoredAdDoc; message?: string };
    if (data?.success && data?.ad) return { success: true, ad: data.ad };
    return { success: false, message: data?.message ?? 'Failed to update' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function deleteSponsoredAd(adId: string): Promise<
  { success: true } | { success: false; message: string }
> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'deleteSponsoredAd')({ adId });
    const data = res.data as { success?: boolean; message?: string };
    if (data?.success) return { success: true };
    return { success: false, message: data?.message ?? 'Failed to delete' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

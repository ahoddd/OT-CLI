/**
 * OrbPass™ — Client API via Firebase callables.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';
import type { OrbPassConfig } from '../constants/orbPass';

function getFunctionsRegion() {
  try {
    return getFunctions(auth.app, 'us-central1');
  } catch {
    return null;
  }
}

export async function orbPassGetConfig(): Promise<{
  success: true;
  config: { enabled: boolean; emergencyKill: unknown; capsByTier: unknown };
  userTier: string;
  eligible: boolean;
  caps: { redemptionsPerMonth: number; maxValuePerMonth: number; cooldownHours: number } | null;
} | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPassGetConfig')({});
    const data = res.data as any;
    if (data?.success) return data;
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function orbPassEligibleOffers(params: { cityId?: string }): Promise<{ success: true; offers: any[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPassEligibleOffers')(params);
    const data = res.data as any;
    if (data?.success) return { success: true, offers: data.offers ?? [] };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function orbPassRedemptionInitiate(params: {
  partnerId: string;
  offerTemplateId?: string | null;
  valueCents: number;
  cityId?: string;
}): Promise<{ success: true; redemptionId: string; pin: string; qrToken: string; redemption: any } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPassRedemptionInitiate')(params);
    const data = res.data as any;
    if (data?.success && data?.redemptionId) return data;
    return { success: false, message: data?.message ?? 'Failed to initiate' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function orbPassRedemptionVerify(redemptionId: string, pinOrQrToken: string): Promise<{ success: true; verifiedAt: number } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  const isPin = /^\d{6}$/.test(pinOrQrToken);
  try {
    const res = await httpsCallable(f, 'orbPassRedemptionVerify')({ redemptionId, [isPin ? 'pin' : 'qrToken']: pinOrQrToken });
    const data = res.data as any;
    if (data?.success) return { success: true, verifiedAt: data.verifiedAt ?? Date.now() };
    return { success: false, message: data?.message ?? 'Verification failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function orbPassRedemptionComplete(redemptionId: string): Promise<{ success: true; completedAt: number } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPassRedemptionComplete')({ redemptionId });
    const data = res.data as any;
    if (data?.success) return { success: true, completedAt: data.completedAt ?? Date.now() };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function orbPassRedemptionHistory(limit?: number): Promise<{ success: true; redemptions: any[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPassRedemptionHistory')({ limit: limit ?? 30 });
    const data = res.data as any;
    if (data?.success) return { success: true, redemptions: data.redemptions ?? [] };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function orbPassPartnerInbox(params?: { status?: string; limit?: number }): Promise<{ success: true; redemptions: any[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPassPartnerInbox')(params ?? {});
    const data = res.data as any;
    if (data?.success) return { success: true, redemptions: data.redemptions ?? [] };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function orbPassPartnerUpdateSettings(settings: Partial<any>): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPassPartnerUpdateSettings')(settings);
    const data = res.data as any;
    if (data?.success) return { success: true };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function adminOrbPassMetrics(): Promise<{ success: true; configEnabled?: boolean; emergencyKill?: unknown; redemptions?: unknown } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'adminOrbPassMetrics')({});
    const data = res.data as any;
    if (data?.success) return data;
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function adminOrbPassUpdateConfig(config: Partial<OrbPassConfig>): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'adminOrbPassUpdateConfig')(config);
    const data = res.data as any;
    if (data?.success) return { success: true };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function adminOrbPassSettlementRunMonth(monthKey?: string): Promise<{ success: true; message: string } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'adminOrbPassSettlementRunMonth')({ monthKey });
    const data = res.data as any;
    if (data?.success) return data;
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function adminOrbPassEmergencyKill(emergencyKill: { disableDiscovery?: boolean; disableRedemption?: boolean; disableSettlement?: boolean }): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'adminOrbPassEmergencyKill')({ emergencyKill });
    const data = res.data as any;
    if (data?.success) return { success: true };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

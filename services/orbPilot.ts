/**
 * OrbPilot™ — Client API via Firebase callables.
 * Follows orbBounty.ts pattern.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';
import { getCallableErrorMessage } from '../utils/callableError';
import type {
  CampaignDoc,
  OrbPilotOffer,
  OrbPilotMetrics,
  RewardTier,
  TrustTier,
  Objective,
  RejectionReason,
  VerifyOutcome,
  DisputeDoc,
  PartnerSpendEntry,
  UserRestriction,
  PartnerRestriction,
  UserEntitlements,
  PartnerEntitlements,
  DisputeStatus,
  RestrictionType,
} from '../constants/OrbPilot';

function getFunctionsRegion() {
  try {
    return getFunctions(auth.app, 'us-central1');
  } catch {
    return null;
  }
}

type Res<T> = T | { success: false; message: string };

// ─── Campaign CRUD ────────────────────────────────────────────────────────────

export async function pilotCampaignCreate(params: {
  partnerId?: string;
  locationId?: string;
  cityId?: string;
  objective?: Objective;
  weeklyBudgetUsd: number;
  dailyMaxUsd?: number;
  schedule: Array<{ dow: number[]; startTime: string; endTime: string }>;
  rewardLadder?: { basePoints: number; boostPoints: number; rescuePoints: number };
  maxVVPerDay?: number;
  maxVVPerUserPerWeek?: number;
  minTrustTier?: TrustTier;
  cpaMaxUsd?: number;
  pinRequired?: boolean;
}): Promise<{ success: true; campaignId: string; campaign: CampaignDoc } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotCampaignCreate')(params);
    const data = res.data as Record<string, unknown>;
    if (data?.success && data?.campaignId) return { success: true, campaignId: data.campaignId as string, campaign: data.campaign as CampaignDoc };
    return { success: false, message: (data?.message as string) ?? 'Failed to create campaign' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotCampaignGet(campaignId: string): Promise<{ success: true; campaign: CampaignDoc } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotCampaignGet')({ campaignId });
    const data = res.data as Record<string, unknown>;
    if (data?.success && data?.campaign) return { success: true, campaign: data.campaign as CampaignDoc };
    return { success: false, message: (data?.message as string) ?? 'Not found' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotCampaignUpdate(campaignId: string, fields: Partial<CampaignDoc>): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotCampaignUpdate')({ campaignId, ...fields });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Update failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotCampaignActivate(campaignId: string): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotCampaignActivate')({ campaignId });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotCampaignPause(campaignId: string): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotCampaignPause')({ campaignId });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotCampaignResume(campaignId: string): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotCampaignResume')({ campaignId });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotCampaignEnd(campaignId: string): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotCampaignEnd')({ campaignId });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotPartnerListCampaigns(partnerId?: string): Promise<{ success: true; campaigns: CampaignDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotPartnerListCampaigns')({ partnerId });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true, campaigns: (data.campaigns as CampaignDoc[]) ?? [] };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

// ─── Offers (user) ────────────────────────────────────────────────────────────

export async function pilotOfferNearby(lat: number, lng: number, radiusM?: number): Promise<{ success: true; offers: OrbPilotOffer[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotOfferNearby')({ lat, lng, radiusM });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true, offers: (data.offers as OrbPilotOffer[]) ?? [] };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e, 'Failed to load nearby offers') }; }
}

export async function pilotOfferClaim(slotId: string, lat: number, lng: number): Promise<{ success: true; slotId: string; claimExpiresISO: string } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotOfferClaim')({ slotId, lat, lng });
    const data = res.data as Record<string, unknown>;
    if (data?.success && data?.slotId) return { success: true, slotId: data.slotId as string, claimExpiresISO: data.claimExpiresISO as string };
    return { success: false, message: (data?.message as string) ?? 'Claim failed' };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e, 'Claim failed') }; }
}

export async function pilotOfferCancel(slotId: string): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotOfferCancel')({ slotId });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Cancel failed' };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e, 'Cancel failed') }; }
}

// ─── Verification ─────────────────────────────────────────────────────────────

export async function pilotVerifyInitiate(params: {
  partnerId: string;
  slotId: string;
  qrPayload: string;
  lat: number;
  lng: number;
  accuracyM: number;
}): Promise<{ success: true; attemptId: string; nonce: string; requiresPin: boolean; pinLength: number; expiresISO: string } | { success: false; message: string; rejectionReason?: RejectionReason }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotVerifyInitiate')(params);
    const data = res.data as Record<string, unknown>;
    if (data?.success && data?.attemptId) {
      return { success: true, attemptId: data.attemptId as string, nonce: data.nonce as string, requiresPin: Boolean(data.requiresPin), pinLength: Number(data.pinLength) || 6, expiresISO: data.expiresISO as string };
    }
    return { success: false, message: (data?.message as string) ?? 'Verification initiation failed', rejectionReason: data?.rejectionReason as RejectionReason };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotVerifyComplete(params: {
  attemptId: string;
  nonce: string;
  pin?: string;
  lat: number;
  lng: number;
  accuracyM: number;
}): Promise<{ success: true; outcome: VerifyOutcome; visitId: string; rewardGranted: boolean; rewardPoints: number; ledgerTxnId: string } | { success: false; outcome?: VerifyOutcome; rejectionReason?: RejectionReason; message: string; attemptsRemaining?: number }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotVerifyComplete')(params);
    const data = res.data as Record<string, unknown>;
    if (data?.success && data?.outcome === 'verified') {
      return { success: true, outcome: 'verified', visitId: data.visitId as string, rewardGranted: Boolean(data.rewardGranted), rewardPoints: Number(data.rewardPoints), ledgerTxnId: data.ledgerTxnId as string };
    }
    return { success: false, outcome: data?.outcome as VerifyOutcome, rejectionReason: data?.rejectionReason as RejectionReason, message: (data?.message as string) ?? 'Verification failed', attemptsRemaining: data?.attemptsRemaining as number };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

// ─── PIN ──────────────────────────────────────────────────────────────────────

export async function pilotPinCurrent(partnerId?: string): Promise<{ success: true; pin: string; expiresISO: string } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotPinCurrent')({ partnerId });
    const data = res.data as Record<string, unknown>;
    if (data?.success && data?.pin) return { success: true, pin: data.pin as string, expiresISO: data.expiresISO as string };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotPinRotate(partnerId?: string): Promise<{ success: true; pin: string; expiresISO: string } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotPinRotate')({ partnerId });
    const data = res.data as Record<string, unknown>;
    if (data?.success && data?.pin) return { success: true, pin: data.pin as string, expiresISO: data.expiresISO as string };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function pilotMetricsPartner(partnerId: string, from?: string, to?: string): Promise<{ success: true; metrics: OrbPilotMetrics } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotMetricsPartner')({ partnerId, from, to });
    const data = res.data as Record<string, unknown>;
    if (data?.success && data?.metrics) return { success: true, metrics: data.metrics as OrbPilotMetrics };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotMetricsCampaign(campaignId: string, from?: string, to?: string): Promise<{ success: true; metrics: OrbPilotMetrics } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotMetricsCampaign')({ campaignId, from, to });
    const data = res.data as Record<string, unknown>;
    if (data?.success && data?.metrics) return { success: true, metrics: data.metrics as OrbPilotMetrics };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotPartnerActivity(partnerId: string, limit?: number): Promise<{ success: true; attempts: unknown[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotPartnerActivity')({ partnerId, limit });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true, attempts: (data.attempts as unknown[]) ?? [] };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotUserHistory(limit?: number): Promise<{ success: true; visits: unknown[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotUserHistory')({ limit });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true, visits: (data.visits as unknown[]) ?? [] };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function pilotAdminKillSwitch(scope: 'global' | 'city' | 'partner' | 'campaign', targetId: string, kill: boolean): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotAdminKillSwitch')({ scope, targetId, kill });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotAdminAudit(query: { partnerId?: string; userId?: string; campaignId?: string; limit?: number }): Promise<{ success: true; attempts: unknown[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotAdminAudit')(query);
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true, attempts: (data.attempts as unknown[]) ?? [] };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotAdminUserTrust(userId: string, tier: TrustTier, reason: string): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotAdminUserTrust')({ userId, tier, reason });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotAdminPartnerRisk(partnerId: string, riskProfile: 'low' | 'medium' | 'high', forcePinRequired: boolean): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotAdminPartnerRisk')({ partnerId, riskProfile, forcePinRequired });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotAdminListCampaigns(limit?: number): Promise<{ success: true; campaigns: CampaignDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotAdminListCampaigns')({ limit });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true, campaigns: (data.campaigns as CampaignDoc[]) ?? [] };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotAdminListTrust(tier?: TrustTier, limit?: number): Promise<{ success: true; users: unknown[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotAdminListTrust')({ tier, limit });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true, users: (data.users as unknown[]) ?? [] };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotAdminGetConfig(): Promise<{ success: true; config: Record<string, unknown> } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotAdminGetConfig')({});
    const data = res.data as Record<string, unknown>;
    if (data?.success && data?.config) return { success: true, config: data.config as Record<string, unknown> };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotAdminUpdateConfig(updates: Record<string, unknown>): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotAdminUpdateConfig')(updates);
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotAdminEngineLastRun(): Promise<{ success: true; run: unknown } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotAdminEngineLastRun')({});
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true, run: data.run };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: e instanceof Error ? e.message : 'Network error' }; }
}

export async function pilotEngineTick(nowISO?: string): Promise<{ success: true; slotsReleased: number; windowsOpened: number; runId: string } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotEngineTick')({ nowISO });
    const data = res.data as Record<string, unknown>;
    if (data?.success) return { success: true, slotsReleased: Number(data.slotsReleased), windowsOpened: Number(data.windowsOpened), runId: data.runId as string };
    return { success: false, message: (data?.message as string) ?? 'Failed' };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

// ─── Appendix 3 — Consent ─────────────────────────────────────────────────────

export async function pilotConsentUser(): Promise<{ success: boolean; alreadyConsented?: boolean; message?: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotConsentUser')({});
    return res.data as { success: boolean; alreadyConsented?: boolean };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

export async function pilotConsentPartner(partnerId: string): Promise<{ success: boolean; alreadyConsented?: boolean; message?: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotConsentPartner')({ partnerId });
    return res.data as { success: boolean; alreadyConsented?: boolean };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

export async function pilotConsentStatus(partnerId?: string): Promise<{ success: true; userConsent: boolean; partnerConsent: boolean } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotConsentStatus')({ partnerId });
    const data = res.data as Record<string, unknown>;
    return { success: true, userConsent: !!data.userConsent, partnerConsent: !!data.partnerConsent };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

// ─── Appendix 3 — Entitlements ────────────────────────────────────────────────

export async function pilotEntitlementsUser(): Promise<{ success: true; data: UserEntitlements } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotEntitlementsUser')({});
    const d = res.data as Record<string, unknown>;
    if (d?.success) return { success: true, data: d.data as UserEntitlements };
    return { success: false, message: String(d?.message ?? 'Failed') };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

export async function pilotEntitlementsPartner(partnerId: string): Promise<{ success: true; data: PartnerEntitlements } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotEntitlementsPartner')({ partnerId });
    const d = res.data as Record<string, unknown>;
    if (d?.success) return { success: true, data: d.data as PartnerEntitlements };
    return { success: false, message: String(d?.message ?? 'Failed') };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

// ─── Appendix 3 — Disputes ────────────────────────────────────────────────────

export async function pilotDisputeSubmit(visitId: string, reason: string, submittedBy: 'user' | 'partner'): Promise<{ success: true; disputeId: string } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotDisputeSubmit')({ visitId, reason, submittedBy });
    const d = res.data as Record<string, unknown>;
    if (d?.success) return { success: true, disputeId: d.disputeId as string };
    return { success: false, message: String(d?.message ?? 'Failed') };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

export async function pilotDisputeListPartner(partnerId: string, status?: DisputeStatus, limit = 20): Promise<{ success: true; disputes: DisputeDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotDisputeListPartner')({ partnerId, status, limit });
    const d = res.data as Record<string, unknown>;
    if (d?.success) return { success: true, disputes: (d.disputes ?? []) as DisputeDoc[] };
    return { success: false, message: String(d?.message ?? 'Failed') };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

export async function pilotDisputeListAdmin(status?: DisputeStatus, limit = 50): Promise<{ success: true; disputes: DisputeDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotDisputeListAdmin')({ status, limit });
    const d = res.data as Record<string, unknown>;
    if (d?.success) return { success: true, disputes: (d.disputes ?? []) as DisputeDoc[] };
    return { success: false, message: String(d?.message ?? 'Failed') };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

export async function pilotDisputeResolve(disputeId: string, resolution: 'approved' | 'denied', adminNote: string): Promise<{ success: true; resolution: string; reversalLedgerTxnId?: string } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotDisputeResolve')({ disputeId, resolution, adminNote });
    const d = res.data as Record<string, unknown>;
    if (d?.success) return { success: true, resolution: String(d.resolution), reversalLedgerTxnId: d.reversalLedgerTxnId as string | undefined };
    return { success: false, message: String(d?.message ?? 'Failed') };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

export async function pilotDisputeReview(disputeId: string): Promise<{ success: boolean; message?: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotDisputeReview')({ disputeId });
    return res.data as { success: boolean };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

// ─── Appendix 3 — Restrictions ────────────────────────────────────────────────

export async function pilotRestrictUser(userId: string, type: RestrictionType, reason: string, expiresISO?: string): Promise<{ success: boolean; message?: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotRestrictUser')({ userId, type, reason, expiresISO });
    return res.data as { success: boolean };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

export async function pilotLiftUserRestriction(userId: string): Promise<{ success: boolean; message?: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotLiftUserRestriction')({ userId });
    return res.data as { success: boolean };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

export async function pilotRestrictPartner(partnerId: string, type: RestrictionType, reason: string, expiresISO?: string): Promise<{ success: boolean; message?: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotRestrictPartner')({ partnerId, type, reason, expiresISO });
    return res.data as { success: boolean };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

export async function pilotLiftPartnerRestriction(partnerId: string): Promise<{ success: boolean; message?: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotLiftPartnerRestriction')({ partnerId });
    return res.data as { success: boolean };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

// ─── Appendix 2 — Spend Ledger ────────────────────────────────────────────────

export async function pilotSpendLedger(partnerId: string, monthKey?: string): Promise<{ success: true; entries: PartnerSpendEntry[]; totalDebits: number; totalCredits: number; netUsd: number; monthKey: string } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotSpendLedger')({ partnerId, monthKey });
    const d = res.data as Record<string, unknown>;
    if (d?.success) return { success: true, entries: (d.entries ?? []) as PartnerSpendEntry[], totalDebits: Number(d.totalDebits), totalCredits: Number(d.totalCredits), netUsd: Number(d.netUsd), monthKey: String(d.monthKey) };
    return { success: false, message: String(d?.message ?? 'Failed') };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

// ─── Appendix 2 — Admin Health + Abuse ───────────────────────────────────────

export async function pilotAdminHealth(): Promise<{ success: true; activeCampaigns: number; vv24h: number; failureRate24h: number; openDisputes: number; engineLastRun: unknown; globalKillActive: boolean; activeKillSwitches: number } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotAdminHealth')({});
    const d = res.data as Record<string, unknown>;
    if (d?.success) return { success: true, activeCampaigns: Number(d.activeCampaigns), vv24h: Number(d.vv24h), failureRate24h: Number(d.failureRate24h), openDisputes: Number(d.openDisputes), engineLastRun: d.engineLastRun, globalKillActive: !!d.globalKillActive, activeKillSwitches: Number(d.activeKillSwitches) };
    return { success: false, message: String(d?.message ?? 'Failed') };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

export async function pilotAdminAbuse(limit = 50): Promise<{ success: true; bruteForceFlags: unknown[]; highRejection: unknown[]; restricted: unknown[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'orbPilotAdminAbuse')({ limit });
    const d = res.data as Record<string, unknown>;
    if (d?.success) return { success: true, bruteForceFlags: (d.bruteForceFlags ?? []) as unknown[], highRejection: (d.highRejection ?? []) as unknown[], restricted: (d.restricted ?? []) as unknown[] };
    return { success: false, message: String(d?.message ?? 'Failed') };
  } catch (e) { return { success: false, message: getCallableErrorMessage(e) }; }
}

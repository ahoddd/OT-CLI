/**
 * OrbIntent™ — Client API via Firebase callables.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebaseConfig';
import type { IntentDoc, OfferDoc, RuleDoc, DealDoneCardDoc, OrbIntentConfig, OrbIntentConfigUpdate } from '../constants/orbIntent';

function getFunctionsRegion() {
  try {
    return getFunctions(auth.app, 'us-central1');
  } catch {
    return null;
  }
}

export async function intentCreate(params: {
  cityId: string;
  geo: { lat: number; lng: number };
  radiusMeters: number;
  category: 'food' | 'retail' | 'services' | 'nightlife' | 'appointment';
  budgetMin: number;
  budgetMax: number;
  offerDeadlineSeconds: number;
  fulfillmentDeadlineSeconds: number;
  flexibility: number;
  privacy: 'public' | 'friends' | 'private';
  title: string;
  templateData: Record<string, unknown>;
}): Promise<{ success: true; intentId: string; intent: IntentDoc } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'intentCreate')(params);
    const data = res.data as { success?: boolean; intentId?: string; intent?: IntentDoc; message?: string };
    if (data?.success && data?.intentId) return { success: true, intentId: data.intentId, intent: data.intent! };
    return { success: false, message: data?.message ?? 'Failed to create intent' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function intentGet(intentId: string): Promise<{ success: true; intent: IntentDoc; offers: OfferDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'intentGet')({ id: intentId });
    const data = res.data as { success?: boolean; intent?: IntentDoc; offers?: OfferDoc[]; message?: string };
    if (data?.success && data?.intent) return { success: true, intent: data.intent, offers: data.offers ?? [] };
    return { success: false, message: data?.message ?? 'Not found' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function intentFeed(params: { cityId?: string; category?: string; limit?: number }): Promise<{ success: true; intents: IntentDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'intentFeed')(params);
    const data = res.data as { success?: boolean; intents?: IntentDoc[]; message?: string };
    if (data?.success) return { success: true, intents: data.intents ?? [] };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function intentListMine(limit?: number): Promise<{ success: true; intents: IntentDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'intentListMine')({ limit: limit ?? 30 });
    const data = res.data as { success?: boolean; intents?: IntentDoc[]; message?: string };
    if (data?.success) return { success: true, intents: data.intents ?? [] };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function intentListForPartner(limit?: number): Promise<{ success: true; intents: IntentDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'intentListForPartner')({ limit: limit ?? 30 });
    const data = res.data as { success?: boolean; intents?: IntentDoc[]; message?: string };
    if (data?.success) return { success: true, intents: data.intents ?? [] };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function intentOffer(intentId: string, terms: {
  headline: string;
  details: string;
  price?: number | null;
  discountText?: string | null;
  valueScore?: number;
  addons?: string[];
}): Promise<{ success: true; offerId: string; offer: OfferDoc } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'intentOffer')({ intentId, terms });
    const data = res.data as { success?: boolean; offerId?: string; offer?: OfferDoc; message?: string };
    if (data?.success && data?.offerId) return { success: true, offerId: data.offerId, offer: data.offer! };
    return { success: false, message: data?.message ?? 'Failed to submit offer' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function intentAcceptOffer(intentId: string, offerId: string): Promise<{ success: true; pin: string; qrToken: string } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'intentAcceptOffer')({ intentId, offerId });
    const data = res.data as { success?: boolean; pin?: string; qrToken?: string; message?: string };
    if (data?.success && data?.pin != null) return { success: true, pin: data.pin, qrToken: data.qrToken ?? '' };
    return { success: false, message: data?.message ?? 'Failed to accept offer' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function intentVerifyFulfillment(intentId: string, pinOrQrToken: string): Promise<{ success: true; fulfilledAt: number; cardId: string; card: DealDoneCardDoc } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  const isPin = /^\d{6}$/.test(pinOrQrToken);
  try {
    const res = await httpsCallable(f, 'intentVerifyFulfillment')({ intentId, [isPin ? 'pin' : 'qrToken']: pinOrQrToken });
    const data = res.data as { success?: boolean; fulfilledAt?: number; cardId?: string; card?: DealDoneCardDoc; message?: string };
    if (data?.success) return { success: true, fulfilledAt: data.fulfilledAt ?? Date.now(), cardId: data.cardId ?? '', card: data.card! };
    return { success: false, message: data?.message ?? 'Verification failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function ruleCreate(params: {
  name: string;
  category: 'food' | 'retail' | 'services' | 'nightlife' | 'appointment';
  cityId: string;
  schedule: { type: string; timezone: string; daysOfWeek?: number[]; startHour?: number; endHour?: number };
  constraints: Record<string, unknown>;
  cooldownMinutes: number;
  autoAccept: { enabled: boolean; graceSeconds: number; requiresTrusted: boolean };
  templateData: Record<string, unknown>;
}): Promise<{ success: true; ruleId: string; rule: RuleDoc } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'ruleCreate')(params);
    const data = res.data as { success?: boolean; ruleId?: string; rule?: RuleDoc; message?: string };
    if (data?.success && data?.ruleId) return { success: true, ruleId: data.ruleId, rule: data.rule! };
    return { success: false, message: data?.message ?? 'Failed to create rule' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function ruleUpdate(ruleId: string, updates: Partial<{ enabled: boolean; name: string; schedule: unknown; constraints: unknown; cooldownMinutes: number; autoAccept: unknown }>): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'ruleUpdate')({ ruleId, ...updates });
    const data = res.data as { success?: boolean; message?: string };
    if (data?.success) return { success: true };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function ruleList(limit?: number): Promise<{ success: true; rules: RuleDoc[] } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'ruleList')({ limit: limit ?? 30 });
    const data = res.data as { success?: boolean; rules?: RuleDoc[]; message?: string };
    if (data?.success) return { success: true, rules: data.rules ?? [] };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function ruleRunNow(ruleId: string): Promise<{ success: true; message?: string } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'ruleRunNow')({ ruleId });
    const data = res.data as { success?: boolean; message?: string };
    if (data?.success) return { success: true, message: data?.message };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function dealDoneGet(cardId: string): Promise<{ success: true; card: DealDoneCardDoc } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'dealDoneGet')({ cardId });
    const data = res.data as { success?: boolean; card?: DealDoneCardDoc; message?: string };
    if (data?.success && data?.card) return { success: true, card: data.card };
    return { success: false, message: data?.message ?? 'Not found' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function adminOrbIntentMetrics(): Promise<{ success: true; metrics: unknown } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'adminOrbIntentMetrics')({});
    const data = res.data as { success?: boolean; metrics?: unknown; message?: string };
    if (data?.success) return { success: true, metrics: data.metrics };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function adminOrbIntentUpdateConfig(config: OrbIntentConfigUpdate): Promise<{ success: true } | { success: false; message: string }> {
  const f = getFunctionsRegion();
  if (!f || !auth.currentUser) return { success: false, message: 'Not signed in' };
  try {
    const res = await httpsCallable(f, 'adminOrbIntentUpdateConfig')(config);
    const data = res.data as { success?: boolean; message?: string };
    if (data?.success) return { success: true };
    return { success: false, message: data?.message ?? 'Failed' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}

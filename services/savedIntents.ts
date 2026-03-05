/**
 * SavedIntent persistence — AsyncStorage-backed, idempotent, with expiry.
 * Right-swipe in OrbSwipe creates a SavedIntent; completing a verified action marks it COMPLETED.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedIntent, SavedIntentKind, SavedIntentStatus } from '../constants/SavedIntent';
import { SAVED_INTENT_EXPIRY_DAYS, SAVED_INTENT_MAX_ACTIVE } from '../constants/OrbSwipeConfig';

const STORAGE_KEY = 'ORBTAP_SAVED_INTENTS_V1';

async function loadAll(): Promise<SavedIntent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(intents: SavedIntent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(intents.slice(0, 200)));
  } catch {}
}

function isExpired(intent: SavedIntent): boolean {
  if (!intent.expiresAt) return false;
  return Date.now() > intent.expiresAt;
}

/**
 * Create a SavedIntent. Idempotent: same refId within 24h will not duplicate.
 */
export async function createSavedIntent(params: {
  uid: string;
  kind: SavedIntentKind;
  refId: string;
  displayName?: string;
  displaySub?: string;
  partnerId?: string;
  tier?: string;
  tags?: string[];
}): Promise<SavedIntent | null> {
  const all = await loadAll();
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const existing = all.find(
    (i) => i.refId === params.refId && i.uid === params.uid && i.createdAt > dayAgo && i.status === 'ACTIVE'
  );
  if (existing) return existing;

  const active = all.filter((i) => i.status === 'ACTIVE' && !isExpired(i));
  if (active.length >= SAVED_INTENT_MAX_ACTIVE) return null;

  const intent: SavedIntent = {
    id: `si_${now}_${Math.random().toString(36).slice(2, 8)}`,
    uid: params.uid,
    kind: params.kind,
    refId: params.refId,
    createdAt: now,
    expiresAt: SAVED_INTENT_EXPIRY_DAYS > 0 ? now + SAVED_INTENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000 : undefined,
    context: { source: 'ORBSWIPE', tags: params.tags },
    status: 'ACTIVE',
    displayName: params.displayName,
    displaySub: params.displaySub,
    partnerId: params.partnerId,
    tier: params.tier,
  };

  all.unshift(intent);
  await saveAll(all);
  return intent;
}

export async function getSavedIntents(uid: string, statusFilter?: SavedIntentStatus): Promise<SavedIntent[]> {
  const all = await loadAll();
  const now = Date.now();
  return all.filter((i) => {
    if (i.uid !== uid) return false;
    if (isExpired(i) && i.status === 'ACTIVE') {
      i.status = 'EXPIRED';
    }
    return statusFilter ? i.status === statusFilter : true;
  });
}

export async function getActiveSavedIntents(uid: string, limit = 3): Promise<SavedIntent[]> {
  const intents = await getSavedIntents(uid, 'ACTIVE');
  return intents.slice(0, limit);
}

export async function markIntentCompleted(refId: string, uid: string): Promise<boolean> {
  const all = await loadAll();
  const intent = all.find((i) => i.refId === refId && i.uid === uid && i.status === 'ACTIVE');
  if (!intent) return false;
  intent.status = 'COMPLETED';
  await saveAll(all);
  return true;
}

export async function removeSavedIntent(id: string, uid: string): Promise<void> {
  const all = await loadAll();
  const intent = all.find((i) => i.id === id && i.uid === uid);
  if (intent) {
    intent.status = 'REMOVED';
    await saveAll(all);
  }
}

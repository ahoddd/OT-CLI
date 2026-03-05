/**
 * OrbSwipe analytics — impression, swipe, CTA, verified conversion. Rate-limited, batched.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'ORBTAP_ORBSWIPE_EVENTS_QUEUE';
const MAX_QUEUE = 50;
const BATCH_SIZE = 10;

export type OrbSwipeEventType =
  | 'impression'
  | 'swipe_right'
  | 'swipe_left'
  | 'swipe_up'
  | 'tray_add'
  | 'open_detail'
  | 'cta_click'
  | 'fuse_select'
  | 'open_drop'
  | 'open_mission'
  | 'verified_win'
  | 'sponsored_impression'
  | 'sponsored_open'
  | 'sponsored_dismiss';

export interface OrbSwipeEvent {
  type: OrbSwipeEventType;
  at: number;
  cardId?: string;
  cardType?: string;
  partnerId?: string;
  dropId?: string;
  missionId?: string;
  placement?: 'organic' | 'sponsored';
  sessionId?: string;
}

let sessionId: string = `orbswipe_${Date.now()}`;
let queue: OrbSwipeEvent[] = [];

async function loadQueue(): Promise<OrbSwipeEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  return [];
}

async function saveQueue(q: OrbSwipeEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE)));
  } catch {}
}

export async function logOrbSwipeEvent(event: Omit<OrbSwipeEvent, 'at' | 'sessionId'>): Promise<void> {
  const full: OrbSwipeEvent = { ...event, at: Date.now(), sessionId };
  queue = await loadQueue();
  queue.push(full);
  if (queue.length >= BATCH_SIZE) {
    await flushOrbSwipeEvents();
  } else {
    await saveQueue(queue);
  }
}

export async function flushOrbSwipeEvents(): Promise<void> {
  if (queue.length === 0) queue = await loadQueue();
  if (queue.length === 0) return;
  const toSend = queue.splice(0, BATCH_SIZE);
  await saveQueue(queue);
  if (__DEV__) {
    toSend.forEach((e) => console.log('[OrbSwipe]', e.type, e.partnerId ?? e.cardId));
  }
}

export function getOrbSwipeSessionId(): string {
  return sessionId;
}

export function resetOrbSwipeSession(): void {
  sessionId = `orbswipe_${Date.now()}`;
}

/** Partner-facing summary (mock from queue or future Firestore aggregate). */
export async function getOrbSwipePartnerSummary(partnerId: string): Promise<{
  impressions: number;
  opens: number;
  ctaClicks: number;
  verifiedConversions: number;
}> {
  const q = await loadQueue();
  const partnerEvents = q.filter((e) => e.partnerId === partnerId);
  return {
    impressions: partnerEvents.filter((e) => e.type === 'impression' || e.type === 'sponsored_impression').length,
    opens: partnerEvents.filter((e) => e.type === 'open_detail' || e.type === 'sponsored_open').length,
    ctaClicks: partnerEvents.filter((e) => e.type === 'cta_click').length,
    verifiedConversions: partnerEvents.filter((e) => e.type === 'verified_win').length,
  };
}

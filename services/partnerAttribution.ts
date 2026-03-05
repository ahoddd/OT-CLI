/**
 * Partner ROI — attribution events for views, clicks, reserves, redemptions.
 * Stored locally; can be sent to backend for Partner dashboard.
 */

export type PartnerAttributionEventType = 'view' | 'click' | 'reserve' | 'redeem' | 'proof_view_from_share' | 'claim_click_from_share';

export interface PartnerAttributionEvent {
  type: PartnerAttributionEventType;
  partnerId: string;
  dropId?: string;
  proofId?: string;
  at: number;
}

const STORAGE_KEY = 'ORBTAP_PARTNER_ATTRIBUTION_V1';
const MAX_EVENTS = 500;

let _buffer: PartnerAttributionEvent[] = [];

export function logPartnerAttribution(event: Omit<PartnerAttributionEvent, 'at'>): void {
  const full: PartnerAttributionEvent = { ...event, at: Date.now() };
  _buffer.push(full);
  if (_buffer.length > MAX_EVENTS) _buffer = _buffer.slice(-MAX_EVENTS);
  // Persist async (fire-and-forget)
  try {
    const { AsyncStorage } = require('@react-native-async-storage/async-storage');
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_buffer)).catch(() => {});
  } catch {
    // ignore
  }
}

export function getPartnerAttributionEvents(): PartnerAttributionEvent[] {
  return [..._buffer];
}

/** For Partner dashboard: aggregate by partnerId and type. */
export function getPartnerMetrics(partnerId: string): { views: number; clicks: number; reserves: number; redemptions: number } {
  const list = _buffer.filter((e) => e.partnerId === partnerId);
  return {
    views: list.filter((e) => e.type === 'view').length,
    clicks: list.filter((e) => e.type === 'click').length,
    reserves: list.filter((e) => e.type === 'reserve').length,
    redemptions: list.filter((e) => e.type === 'redeem').length,
  };
}

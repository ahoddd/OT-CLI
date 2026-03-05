/**
 * IntegrityEvent — lightweight anomaly/audit system.
 * When suspicious patterns occur, record an event (type, uid, partnerId, meta).
 * Admin can view flagged events; server should enforce rate limits and trust gates.
 */

export type IntegrityEventType =
  | 'REPEATED_IDENTICAL_REDEEM'
  | 'MANY_REDEEMS_SHORT_TIME'
  | 'REPEATED_MEDIA_HASH'
  | 'VOTING_BURST'
  | 'VOTING_RING'
  | 'HIGH_AUTOCOMPLETE_RATE'
  | 'RATE_LIMIT_HIT'
  | 'TRUST_GATE_BLOCKED'
  | 'WORK_ORDER_DISPUTE'
  | 'WORK_ORDER_RATE_LIMIT'
  | 'WORK_ORDER_MEDIA_DUPLICATE'
  | 'RITUAL_CLAIM_SUCCESS'
  | 'RITUAL_ALREADY_CLAIMED'
  | 'RITUAL_BLOCKED_ELIGIBILITY'
  | 'RITUAL_BADGE_AWARDED';

export interface IntegrityEvent {
  id: string;
  type: IntegrityEventType;
  uid: string;
  partnerId?: string;
  meta?: Record<string, unknown>;
  createdAt: number;
}

export const INTEGRITY_EVENTS_STORAGE_KEY = 'ORBTAP_INTEGRITY_EVENTS_V1';
export const INTEGRITY_EVENTS_MAX = 200;

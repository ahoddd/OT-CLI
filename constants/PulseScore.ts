/**
 * OrbPulse™ — Pulse Score™ computation (deterministic, proof-based).
 * Only verified actions move rank; no likes/boosts.
 */

const NOW_WINDOW_MS = 60 * 60 * 1000;   // 60 min
const TODAY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 h
const TEN_M = 10 * 60 * 1000;
const THIRTY_M = 30 * 60 * 1000;
const SIXTY_M = 60 * 60 * 1000;
const TWO_H = 2 * 60 * 60 * 1000;

/** Recency decay: 1.0 within 10m, 0.7 within 30m, 0.4 within 60m, 0.2 within 2h. */
export function recencyDecay(minutesAgo: number): number {
  const ms = minutesAgo * 60 * 1000;
  if (ms <= TEN_M) return 1.0;
  if (ms <= THIRTY_M) return 0.7;
  if (ms <= SIXTY_M) return 0.4;
  if (ms <= TWO_H) return 0.2;
  return 0.1;
}

/** Weights by action type (MVP: we only have verified redeem; treat as REDEEM). */
export const ACTION_WEIGHTS: Record<string, number> = {
  DROP_REDEEM: 1.5,
  REDEEM: 1.0,
  CHECKIN: 0.8,
  MISSION_COMPLETE: 0.7,
};

export function scoreFromAction(
  pointsAwarded: number,
  minutesAgo: number,
  actionType: string = 'REDEEM'
): number {
  const weight = ACTION_WEIGHTS[actionType] ?? 1.0;
  const decay = recencyDecay(minutesAgo);
  const base = Math.min(pointsAwarded / 50, 3); // cap base so one action isn't huge
  return weight * decay * (1 + base);
}

export interface PulsePartnerRow {
  partnerId: string;
  partnerName: string;
  category: string;
  score: number;
  verifiedCount24h: number;
  lastActivityAt: number;
}

export interface PulseDropRow {
  dropId: string;
  score: number;
  redeemCountNow: number;
}

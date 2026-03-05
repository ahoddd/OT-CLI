/**
 * TrustScore — server-authoritative 0–100 score for social power actions.
 * Used to gate/weight: drop reserves, high-impact actions.
 * Client exposes only minimal "Verified Human" status; raw score is server-only.
 */

export interface TrustSignals {
  accountAgeDays: number;
  verifiedEmail: boolean;
  verifiedPhone: boolean;
  verifiedActionCount: number;
  verifiedActionDiversity: number;
  cleanHistory: boolean;
  deviceIntegrity?: number;
}

/** Server computes and caches; client receives only tier for UI. */
export type VerifiedHumanStatus = 'verified' | 'elevated' | 'new' | 'restricted' | 'unknown';

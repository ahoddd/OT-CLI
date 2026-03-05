/**
 * OrbVote — Admin-adjustable quotas for business and premium tiers.
 * Free tier: X polls per month. Premium tier: Y polls per month.
 */

export interface OrbVoteQuotasConfig {
  /** Free tier: polls per month per business. */
  businessFreeTierPollsPerMonth: number;
  /** Premium tier: polls per month per business. */
  businessPremiumTierPollsPerMonth: number;
  /** Admin/OrbTap-created polls (no quota; admin can create any number). */
  adminUnlimited: boolean;
}

export const DEFAULT_ORBVOTE_QUOTAS: OrbVoteQuotasConfig = {
  businessFreeTierPollsPerMonth: 1,
  businessPremiumTierPollsPerMonth: 5,
  adminUnlimited: true,
};

export const ORBVOTE_QUOTAS_STORAGE_KEY = 'ORBTAP_ORBVOTE_QUOTAS_V1';

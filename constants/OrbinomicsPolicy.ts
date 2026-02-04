/**
 * Orbinomics V1 — Governed economy policy (server-authoritative when wired).
 * MVP: default policy in constants; cache from server when available.
 */

/** Ledger reason codes — align with backend. */
export const LEDGER_REASON = {
  EMIT_VERIFIED_REDEEM: 'EMIT_VERIFIED_REDEEM',
  EMIT_VERIFIED_CHECKIN: 'EMIT_VERIFIED_CHECKIN',
  EMIT_DROP_REDEEM: 'EMIT_DROP_REDEEM',
  EMIT_QUEST_COMPLETE: 'EMIT_QUEST_COMPLETE',
  BURN_DROP_RESERVE_FEE: 'BURN_DROP_RESERVE_FEE',
  BURN_EARLY_ACCESS_UNLOCK: 'BURN_EARLY_ACCESS_UNLOCK',
  BURN_QUEST_REROLL: 'BURN_QUEST_REROLL',
  BURN_QUEST_BOOSTER: 'BURN_QUEST_BOOSTER',
  BURN_STREAK_SHIELD: 'BURN_STREAK_SHIELD',
  BURN_MULTIPLIER_24H: 'BURN_MULTIPLIER_24H',
  BURN_RECEIPT_COSMETICS: 'BURN_RECEIPT_COSMETICS',
  BURN_CIRCLE_BONUS_POOL: 'BURN_CIRCLE_BONUS_POOL',
  BURN_PULSE_ALERTS_FILTERS: 'BURN_PULSE_ALERTS_FILTERS',
  TREASURY_ALLOCATED: 'TREASURY_ALLOCATED',
  ADJUST_ADMIN: 'ADJUST_ADMIN',
} as const;

export type LedgerReasonCode = (typeof LEDGER_REASON)[keyof typeof LEDGER_REASON];

export interface EmissionRates {
  redeem: number;
  checkin: number;
  dropRedeem: number;
  questComplete: number;
  firstVerifiedBonus: number;
  streakBonusCap: number;
}

export interface EmissionCaps {
  perUserDailyEarn: number;
  perPartnerDailyEmit: number;
  perCityDailyEarn: number;
}

export interface BurnRule {
  productKey: string;
  costPoints: number;
  cooldownDays?: number;
  maxPerDay?: number;
}

export interface FeeRules {
  transferFeePercent: number;
  transferFeeFixed: number;
  transferDailyCap: number;
  transferPerTxCap: number;
}

export interface TreasuryRouting {
  feeBurnPercent: number;
  feeTreasuryPercent: number;
}

export interface OrbinomicsPolicy {
  version: string;
  emissionRates: EmissionRates;
  emissionCaps: EmissionCaps;
  burnRules: BurnRule[];
  feeRules: FeeRules;
  treasuryRouting: TreasuryRouting;
  moduleKillSwitches: Record<string, boolean>;
}

export const DEFAULT_ORBINOMICS_POLICY: OrbinomicsPolicy = {
  version: '1.0',
  emissionRates: {
    redeem: 50,
    checkin: 25,
    dropRedeem: 75,
    questComplete: 50,
    firstVerifiedBonus: 100,
    streakBonusCap: 20,
  },
  emissionCaps: {
    perUserDailyEarn: 500,
    perPartnerDailyEmit: 1000,
    perCityDailyEarn: 50000,
  },
  burnRules: [
    { productKey: 'drop_reserve_fee', costPoints: 10, maxPerDay: 5 },
    { productKey: 'early_access_unlock', costPoints: 50, cooldownDays: 1, maxPerDay: 1 },
    { productKey: 'quest_reroll', costPoints: 25, maxPerDay: 2 },
    { productKey: 'quest_booster', costPoints: 30, maxPerDay: 3 },
    { productKey: 'streak_shield', costPoints: 100, cooldownDays: 14, maxPerDay: 1 },
    { productKey: 'multiplier_24h', costPoints: 40, cooldownDays: 7, maxPerDay: 1 },
    { productKey: 'receipt_cosmetics', costPoints: 20 },
    { productKey: 'circle_bonus_pool', costPoints: 15 },
    { productKey: 'pulse_alerts_filters', costPoints: 35, maxPerDay: 1 },
  ],
  feeRules: {
    transferFeePercent: 0.02,
    transferFeeFixed: 1,
    transferDailyCap: 200,
    transferPerTxCap: 100,
  },
  treasuryRouting: {
    feeBurnPercent: 0.7,
    feeTreasuryPercent: 0.3,
  },
  moduleKillSwitches: {},
};

export const ORBINOMICS_POLICY_STORAGE_KEY = 'ORBTAP_ORBINOMICS_POLICY_V1';

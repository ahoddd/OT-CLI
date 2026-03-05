/**
 * Daily Orb Ritual — Admin-configurable payout and badge tuning.
 * Server-authoritative claim; this config is read by client for display and by backend for rules.
 */

export type PointsDistribution = 'WEIGHTED_BUCKETS' | 'TRUNCATED_NORMAL';

export interface PointBucket {
  min: number;
  max: number;
  weight: number;
}

export interface RitualPointsConfig {
  min: number;
  max: number;
  dailyMaxPointsFromRitual: number;
  distribution: PointsDistribution;
  buckets: PointBucket[];
  streakBonus: {
    enabled: boolean;
    perDayBonus: number;
    maxBonus: number;
  };
}

export interface RitualBadgesConfig {
  enabled: boolean;
  probabilitiesByTier: {
    common: number;
    rare: number;
    legendary: number;
    apex: number;
  };
  pityTimerRareAfterNDaysNoRare: number;
  pityTimerLegendaryAfterNDaysNoLegendary: number;
  hardDisableApexUntilAccountAgeDays: number;
  /** When user already has rolled badge: convert to small OT bonus (cents) instead of re-roll. */
  duplicateBadgeBonusPoints: number;
}

export interface RitualEligibilityConfig {
  minAccountAgeHours: number;
  requireVerifiedEmailOrPhone: boolean;
}

export interface DailyOrbRitualConfig {
  enabled: boolean;
  points: RitualPointsConfig;
  badges: RitualBadgesConfig;
  eligibility: RitualEligibilityConfig;
  audit: {
    updatedAt: number;
    updatedBy: string;
  };
}

export const DEFAULT_DAILY_RITUAL_CONFIG: DailyOrbRitualConfig = {
  enabled: true,
  points: {
    min: 1,
    max: 100,
    dailyMaxPointsFromRitual: 100,
    distribution: 'WEIGHTED_BUCKETS',
    buckets: [
      { min: 1, max: 5, weight: 8 },
      { min: 10, max: 25, weight: 42 },
      { min: 26, max: 50, weight: 32 },
      { min: 51, max: 75, weight: 13 },
      { min: 76, max: 100, weight: 5 },
    ],
    streakBonus: {
      enabled: true,
      perDayBonus: 2,
      maxBonus: 20,
    },
  },
  badges: {
    enabled: true,
    probabilitiesByTier: {
      common: 0.02,
      rare: 0.005,
      legendary: 0.0005,
      apex: 0.0001,
    },
    pityTimerRareAfterNDaysNoRare: 7,
    pityTimerLegendaryAfterNDaysNoLegendary: 30,
    hardDisableApexUntilAccountAgeDays: 30,
    duplicateBadgeBonusPoints: 5,
  },
  eligibility: {
    minAccountAgeHours: 0,
    requireVerifiedEmailOrPhone: false,
  },
  audit: {
    updatedAt: 0,
    updatedBy: '',
  },
};

export const DAILY_RITUAL_CONFIG_STORAGE_KEY = 'ORBTAP_DAILY_RITUAL_CONFIG_V1';

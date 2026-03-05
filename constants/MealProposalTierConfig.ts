/**
 * Meal Proposals — partner tier limits (admin-configurable).
 * Silver = free, Gold = premium, Platinum = pro.
 * Pattern matches StampCardsTierConfig.
 */

import type { PartnerTier } from './PartnerTiers';

export interface MealProposalTierLimits {
  maxActiveProposals: number;
  maxPhotos: number;
  schedulingEnabled: boolean;
  targetingEnabled: boolean;
  abTestEnabled: boolean;
  analyticsLevel: 'basic' | 'advanced' | 'full';
  maxProposalsPerDay: number;
  /** Premium/Pro: "Best time to post" + "Recommended price" suggestions. */
  studioInsightsEnabled: boolean;
  /** Pro only: duplicate best performer quick action. */
  duplicateEnabled: boolean;
}

export const DEFAULT_MEAL_PROPOSAL_TIER_CONFIG: Record<PartnerTier, MealProposalTierLimits> = {
  silver: {
    maxActiveProposals: 2,
    maxPhotos: 2,
    schedulingEnabled: false,
    targetingEnabled: false,
    abTestEnabled: false,
    analyticsLevel: 'basic',
    maxProposalsPerDay: 2,
    studioInsightsEnabled: false,
    duplicateEnabled: false,
  },
  gold: {
    maxActiveProposals: 6,
    maxPhotos: 3,
    schedulingEnabled: true,
    targetingEnabled: true,
    abTestEnabled: false,
    analyticsLevel: 'advanced',
    maxProposalsPerDay: 5,
    studioInsightsEnabled: true,
    duplicateEnabled: false,
  },
  platinum: {
    maxActiveProposals: 15,
    maxPhotos: 3,
    schedulingEnabled: true,
    targetingEnabled: true,
    abTestEnabled: true,
    analyticsLevel: 'full',
    maxProposalsPerDay: 10,
    studioInsightsEnabled: true,
    duplicateEnabled: true,
  },
};

export function getMealTierLimits(
  tier: PartnerTier,
  config?: Record<PartnerTier, MealProposalTierLimits> | null,
): MealProposalTierLimits {
  const map = config ?? DEFAULT_MEAL_PROPOSAL_TIER_CONFIG;
  return map[tier] ?? map.silver;
}

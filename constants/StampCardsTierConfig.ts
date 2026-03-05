/**
 * Stamp Cards™ — partner tier limits (admin-configurable).
 * Silver = free, Gold = premium, Platinum = pro.
 */

import type { PartnerTier } from './PartnerTiers';
import type { StampRewardType } from './StampCards';

export interface StampCardsTierLimits {
  maxActivePrograms: number;
  stampsRequiredPresets: number[];
  cooldownHoursPresets: number[];
  allowedRewardTypes: StampRewardType[];
  designLevel: 'basic' | 'advanced' | 'full';
  analyticsLevel: 'basic' | 'advanced' | 'full';
  boostWindowsEligible: boolean;
  multiLocationEligible: boolean;
  staffRolesEligible: boolean;
}

export const DEFAULT_STAMP_CARDS_TIER_CONFIG: Record<PartnerTier, StampCardsTierLimits> = {
  silver: {
    maxActivePrograms: 1,
    stampsRequiredPresets: [5, 10],
    cooldownHoursPresets: [24],
    allowedRewardTypes: ['FREE_ITEM', 'PERCENT_OFF'],
    designLevel: 'basic',
    analyticsLevel: 'basic',
    boostWindowsEligible: false,
    multiLocationEligible: false,
    staffRolesEligible: false,
  },
  gold: {
    maxActivePrograms: 2,
    stampsRequiredPresets: [5, 8, 10, 12],
    cooldownHoursPresets: [12, 24],
    allowedRewardTypes: ['FREE_ITEM', 'PERCENT_OFF', 'BOGO', 'UPGRADE', 'VIP_DROP_ACCESS'],
    designLevel: 'advanced',
    analyticsLevel: 'advanced',
    boostWindowsEligible: true,
    multiLocationEligible: false,
    staffRolesEligible: false,
  },
  platinum: {
    maxActivePrograms: 4,
    stampsRequiredPresets: [5, 8, 10, 12],
    cooldownHoursPresets: [4, 12, 24],
    allowedRewardTypes: ['FREE_ITEM', 'PERCENT_OFF', 'BOGO', 'UPGRADE', 'VIP_DROP_ACCESS', 'OT_POINTS_BONUS'],
    designLevel: 'full',
    analyticsLevel: 'full',
    boostWindowsEligible: true,
    multiLocationEligible: true,
    staffRolesEligible: true,
  },
};

export function getStampTierLimits(tier: PartnerTier, config?: Record<PartnerTier, StampCardsTierLimits> | null): StampCardsTierLimits {
  const map = config ?? DEFAULT_STAMP_CARDS_TIER_CONFIG;
  return map[tier] ?? map.silver;
}

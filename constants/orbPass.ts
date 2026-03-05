/**
 * OrbPass™ — Universal local membership: types and config.
 * Eligibility from existing tiers; redemption flow with PIN/QR verify.
 */

export type RedemptionStatus = 'initiated' | 'locked' | 'verified' | 'completed' | 'cancelled' | 'disputed' | 'reversed';
export type LedgerEntryStatus = 'pending' | 'eligible' | 'paid' | 'held' | 'reversed';

export interface OrbPassCaps {
  redemptionsPerMonth: number;
  maxValuePerMonth: number;
  cooldownHours: number;
}

export interface CategoryCaps {
  food: number;
  retail: number;
  services: number;
  nightlife: number;
  appointment: number;
}

export interface OrbPassConfig {
  enabled: boolean;
  citiesEnabled?: string[];
  tiersEnabled: { free: boolean; premium: boolean; pro: boolean };
  capsByTier: { free: OrbPassCaps; premium: OrbPassCaps; pro: OrbPassCaps };
  categoryCapsByTier: { premium: CategoryCaps; pro: CategoryCaps };
  partnerRules: {
    maxValuePerRedemption: number;
    minPartnerTrustScore: number;
    requireVerification: boolean;
    disputeWindowHours: number;
  };
  antiFraud: {
    maxRedemptionsPerDay: number;
    velocityWindowMinutes: number;
    velocityMaxActions: number;
    deviceBindingRequired: boolean;
  };
  settlement: {
    payoutMode: 'pool' | 'perRedemption';
    monthlyPoolAmount: number;
    payoutWeights: { volume: number; quality: number; incremental: number };
    holdbackPercent: number;
  };
  emergencyKill: {
    disableDiscovery: boolean;
    disableRedemption: boolean;
    disableSettlement: boolean;
  };
}

const DEFAULT_CAPS: OrbPassCaps = {
  redemptionsPerMonth: 0,
  maxValuePerMonth: 0,
  cooldownHours: 24,
};

const DEFAULT_CATEGORY_CAPS: CategoryCaps = {
  food: 3,
  retail: 3,
  services: 2,
  nightlife: 2,
  appointment: 2,
};

export const DEFAULT_ORB_PASS_CONFIG: OrbPassConfig = {
  enabled: false,
  citiesEnabled: [],
  tiersEnabled: { free: false, premium: true, pro: true },
  capsByTier: {
    free: { ...DEFAULT_CAPS, redemptionsPerMonth: 0, maxValuePerMonth: 0 },
    premium: { ...DEFAULT_CAPS, redemptionsPerMonth: 5, maxValuePerMonth: 5000, cooldownHours: 12 },
    pro: { ...DEFAULT_CAPS, redemptionsPerMonth: 15, maxValuePerMonth: 15000, cooldownHours: 6 },
  },
  categoryCapsByTier: {
    premium: { ...DEFAULT_CATEGORY_CAPS },
    pro: { ...DEFAULT_CATEGORY_CAPS, food: 8, retail: 8, services: 5, nightlife: 5, appointment: 5 },
  },
  partnerRules: {
    maxValuePerRedemption: 2000,
    minPartnerTrustScore: 50,
    requireVerification: true,
    disputeWindowHours: 72,
  },
  antiFraud: {
    maxRedemptionsPerDay: 5,
    velocityWindowMinutes: 15,
    velocityMaxActions: 3,
    deviceBindingRequired: false,
  },
  settlement: {
    payoutMode: 'perRedemption',
    monthlyPoolAmount: 0,
    payoutWeights: { volume: 0.5, quality: 0.3, incremental: 0.2 },
    holdbackPercent: 5,
  },
  emergencyKill: {
    disableDiscovery: false,
    disableRedemption: false,
    disableSettlement: false,
  },
};

export interface RedemptionDoc {
  id: string;
  createdAt: number;
  cityId: string;
  userUid: string;
  userTier: string;
  partnerId: string;
  offerTemplateId: string | null;
  valueCents: number;
  status: RedemptionStatus;
  verification: {
    method: 'pin' | 'qr' | 'nfc' | null;
    pin: string | null;
    qrToken: string | null;
    verifiedAt: number | null;
    verifiedByPartnerId: string | null;
  };
  countersSnapshot: {
    userMonthRedemptions: number;
    userMonthValueCents: number;
  };
  audit: { riskScore: number; notes: string | null };
}

export interface PartnerOrbPassOffer {
  id: string;
  title: string;
  description: string;
  valueCents: number;
  redemptionRules: string;
}

export interface PartnerOrbPassSettings {
  enabled: boolean;
  citiesEnabled?: string[];
  categoriesEnabled: string[];
  offerTemplates: PartnerOrbPassOffer[];
  redemptionConstraints: {
    cooldownHours: number;
    perUserPerMonth: number;
    minSpendCents: number | null;
  };
  settlementPrefs: {
    payoutEligible: boolean;
    bankInfoOnFile: boolean;
  };
  trustOverrides: { minTrustScore: number | null };
}

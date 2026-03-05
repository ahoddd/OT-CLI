/**
 * OrbBounty™ — Deal Bounty market: types, category templates, sanity scoring.
 * Two-sided: users post intent, partners bid, user accepts one, fulfillment verified, win card generated.
 */

export type BountyCategory = 'food' | 'retail' | 'services';
export type BountyPrivacy = 'public' | 'friends' | 'private';
export type BountyStatus = 'open' | 'locked' | 'fulfilled' | 'expired' | 'cancelled';
export type BidStatus = 'active' | 'withdrawn' | 'closed' | 'accepted';

export interface BountyBudget {
  min: number;
  max: number;
  currency: 'USD';
}

export interface BountyTimeWindow {
  startAt: number;
  endAt: number;
}

export interface BountyFulfillment {
  pin: string | null;
  qrToken: string | null;
  verifiedAt: number | null;
  verifiedByPartnerId: string | null;
}

export interface BountyMetrics {
  bidCount: number;
  shareCount: number;
  viewCount: number;
}

export interface BountyDoc {
  id: string;
  createdAt: number;
  createdByUid: string;
  createdByDisplay?: string;
  cityId: string;
  geo: { lat: number; lng: number };
  radiusMeters: number;
  category: BountyCategory;
  templateVersion: number;
  title: string;
  budget: BountyBudget;
  timeWindow: BountyTimeWindow;
  ttlSeconds: number;
  privacy: BountyPrivacy;
  sanityScore: number;
  stakeRequired: boolean;
  stakeAmount: number;
  status: BountyStatus;
  lockedPartnerId: string | null;
  lockedBidId: string | null;
  fulfillment: BountyFulfillment;
  metrics: BountyMetrics;
  templateData: Record<string, unknown>;
  /** Platform fee on fulfillment (0–100). Premium partners get 0. Default 10–15. */
  platformFeePercent?: number;
}

export interface BidTerms {
  headline: string;
  details: string;
  price: number | null;
  discount: string | null;
  addons?: string[];
}

export interface BidDoc {
  id: string;
  createdAt: number;
  partnerId: string;
  partnerName: string;
  terms: BidTerms;
  expiresAt: number;
  status: BidStatus;
  rankScore: number;
}

export interface PartnerBountySettings {
  categoriesEnabled: string[];
  serviceRadiusMeters: number;
  minBudget: number;
  minSanityScore: number;
  bidRateLimitPerHour: number;
  enabled: boolean;
}

export interface OrbBountyConfig {
  enabled: boolean;
  stakeRules: { scoreUnder50Stake: number; score50to69Stake: number };
  maxActiveBountiesByTier: { free: number; premium: number; pro: number };
  ttlByCategorySeconds: { food: number; retail: number; services: number };
  partnerBidLimits: { perHour: number; perBounty: number };
  sanityWeights: { budget: number; radius: number; constraints: number; urgency: number };
  citiesEnabled?: string[];
}

export const DEFAULT_ORB_BOUNTY_CONFIG: OrbBountyConfig = {
  enabled: true,
  stakeRules: { scoreUnder50Stake: 50, score50to69Stake: 10 },
  maxActiveBountiesByTier: { free: 1, premium: 3, pro: 5 },
  ttlByCategorySeconds: { food: 86400, retail: 86400, services: 172800 },
  partnerBidLimits: { perHour: 10, perBounty: 1 },
  sanityWeights: { budget: 0.3, radius: 0.2, constraints: 0.25, urgency: 0.25 },
  citiesEnabled: [],
};

export const BOUNTY_CATEGORY_LABELS: Record<BountyCategory, string> = {
  food: 'Food & Drink',
  retail: 'Retail',
  services: 'Services',
};

/** Category templates: required fields per category for CreateBounty form. */
export const BOUNTY_TEMPLATES: Record<
  BountyCategory,
  { titlePrefix: string; requiredFields: string[]; optionalFields: string[] }
> = {
  food: {
    titlePrefix: 'I want',
    requiredFields: ['what', 'when'],
    optionalFields: ['dietary', 'partySize', 'notes'],
  },
  retail: {
    titlePrefix: 'I need',
    requiredFields: ['itemOrService', 'when'],
    optionalFields: ['brandPreference', 'notes'],
  },
  services: {
    titlePrefix: 'I need',
    requiredFields: ['serviceType', 'when'],
    optionalFields: ['duration', 'notes'],
  },
};

/** Deterministic sanity score 0..100. Reproducible and testable. */
export function computeSanityScore(params: {
  budgetMin: number;
  budgetMax: number;
  category: BountyCategory;
  radiusMeters: number;
  ttlSeconds: number;
  constraintCount: number;
  weights: OrbBountyConfig['sanityWeights'];
}): number {
  const { budgetMin, budgetMax, category, radiusMeters, ttlSeconds, constraintCount, weights } = params;
  let score = 100;
  const baselineBudgets: Record<BountyCategory, number> = { food: 15, retail: 25, services: 30 };
  const baseline = baselineBudgets[category];
  const budgetWidth = Math.max(0, budgetMax - budgetMin);
  const budgetMid = (budgetMin + budgetMax) / 2;
  if (budgetMid < baseline * 0.5) score -= weights.budget * 25;
  else if (budgetMid < baseline) score -= weights.budget * 10;
  if (budgetWidth > baseline * 2) score -= weights.budget * 5;
  if (radiusMeters < 500 && ttlSeconds < 3600) score -= weights.radius * 20;
  else if (radiusMeters < 1000) score -= weights.radius * 5;
  if (ttlSeconds < 1800) score -= weights.urgency * 15;
  else if (ttlSeconds < 7200) score -= weights.urgency * 5;
  if (constraintCount > 5) score -= weights.constraints * 20;
  else if (constraintCount > 3) score -= weights.constraints * 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function isBountyHighLikelihood(score: number): boolean {
  return score >= 70;
}

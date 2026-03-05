/**
 * OrbIntent™ Protocol — types, config, intent score, category labels.
 * User intent → offers → accept → verify → Deal Done Card.
 */

export type IntentCategory = 'food' | 'retail' | 'services' | 'nightlife' | 'appointment';
export type IntentPrivacy = 'public' | 'friends' | 'private';
export type IntentStatus = 'open' | 'locked' | 'fulfilled' | 'expired' | 'cancelled';
export type OfferStatus = 'active' | 'withdrawn' | 'closed' | 'accepted';

export interface IntentBudget {
  min: number;
  max: number;
  currency: 'USD';
}

export interface IntentTimeWindow {
  startAt: number;
  endAt: number;
}

export interface IntentFulfillment {
  pin: string | null;
  qrToken: string | null;
  verifiedAt: number | null;
  verifiedByPartnerId: string | null;
  verificationMethod: 'pin' | 'qr' | null;
}

export interface IntentMetrics {
  offerCount: number;
  shareCount: number;
  viewCount: number;
}

export interface RuleRef {
  ruleId: string | null;
}

export interface IntentDoc {
  id: string;
  createdAt: number;
  createdByUid: string;
  cityId: string;
  geo: { lat: number; lng: number };
  radiusMeters: number;
  category: IntentCategory;
  templateVersion: number;
  title: string;
  budget: IntentBudget;
  offerDeadlineAt: number;
  fulfillmentDeadlineAt: number;
  flexibility: number;
  privacy: IntentPrivacy;
  intentScore: number;
  status: IntentStatus;
  lockedPartnerId: string | null;
  lockedOfferId: string | null;
  fulfillment: IntentFulfillment;
  metrics: IntentMetrics;
  ruleRef: RuleRef;
  templateData: Record<string, unknown>;
  /** Set when fulfillment is verified; links to dealDoneCards doc. */
  dealCardId?: string;
}

export interface OfferTerms {
  headline: string;
  details: string;
  price: number | null;
  discountText: string | null;
  valueScore: number;
  addons?: string[];
}

export interface OfferSla {
  respondedInSeconds: number;
}

export interface OfferDoc {
  id: string;
  createdAt: number;
  partnerId: string;
  partnerName: string;
  terms: OfferTerms;
  expiresAt: number;
  status: OfferStatus;
  rankScore: number;
  sla: OfferSla;
}

export type RuleScheduleType = 'cron' | 'daypart';

export interface RuleSchedule {
  type: RuleScheduleType;
  timezone: string;
  daysOfWeek?: number[];
  startHour?: number;
  endHour?: number;
}

export interface RuleConstraints {
  radiusMeters: number;
  budgetMax: number;
  budgetMin: number;
  minValueScore: number;
  trustedOnly: boolean;
  minPartnerTrustScore: number | null;
}

export interface RuleAutoAccept {
  enabled: boolean;
  graceSeconds: number;
  requiresTrusted: boolean;
}

export interface RuleDoc {
  id: string;
  createdAt: number;
  createdByUid: string;
  cityId: string;
  enabled: boolean;
  name: string;
  category: IntentCategory;
  schedule: RuleSchedule;
  constraints: RuleConstraints;
  cooldownMinutes: number;
  autoAccept: RuleAutoAccept;
  templateData: Record<string, unknown>;
}

export interface DealDoneSummary {
  title: string;
  savingsText: string;
  timeToWinSeconds: number;
  verifiedAt: number;
}

export interface DealDoneProof {
  signature: string;
  payload: Record<string, unknown>;
}

export interface DealDoneShare {
  deepLinkPath: string;
}

export interface DealDoneCardDoc {
  id: string;
  createdAt: number;
  intentId: string;
  partnerId: string;
  userUid: string;
  summary: DealDoneSummary;
  proof: DealDoneProof;
  share: DealDoneShare;
}

export interface PartnerIntentSettings {
  enabled: boolean;
  categoriesEnabled: string[];
  serviceRadiusMeters: number;
  minBudget: number;
  minIntentScore: number;
  offerRateLimitPerHour: number;
  slaTargetSeconds: number;
  cohortIds: string[];
}

export interface OrbIntentConfig {
  enabled: boolean;
  citiesEnabled?: string[];
  categoriesEnabled: string[];
  offerDeadlineDefaultsSeconds: Record<IntentCategory, number>;
  fulfillmentDeadlineDefaultsSeconds: Record<IntentCategory, number>;
  intentScoringWeights: {
    budget: number;
    radius: number;
    constraints: number;
    urgency: number;
    flexibility: number;
  };
  gatingRules: {
    scoreUnder50Stake: number;
    score50to69Stake: number;
    minScoreToRouteToPartners: number;
  };
  quotas: {
    maxOpenIntentsFree: number;
    maxOpenIntentsPremium: number;
    maxOpenIntentsPro: number;
  };
  ruleEngine: {
    maxRulesPerUserFree: number;
    maxRulesPerUserPremium: number;
    maxRulesPerUserPro: number;
  };
  autoAcceptPolicy: {
    allowAutoAccept: boolean;
    defaultGraceSeconds: number;
    minPartnerTrustScore: number;
  };
  partnerLimits: {
    offersPerHour: number;
    offersPerIntent: number;
  };
  rankingWeights: {
    value: number;
    trust: number;
    distance: number;
    speed: number;
  };
  emergencyKill: {
    disableRouting: boolean;
    disableOffers: boolean;
    disableAutoAccept: boolean;
  };
}

/** For admin updates: top-level and gatingRules can be partial. */
export type OrbIntentConfigUpdate = Partial<Omit<OrbIntentConfig, 'gatingRules'>> & {
  gatingRules?: Partial<OrbIntentConfig['gatingRules']>;
};

const CATEGORY_DEFAULTS_SECONDS: Record<IntentCategory, number> = {
  food: 3600,
  retail: 3600,
  services: 7200,
  nightlife: 3600,
  appointment: 86400,
};

export const DEFAULT_ORB_INTENT_CONFIG: OrbIntentConfig = {
  enabled: false,
  citiesEnabled: [],
  categoriesEnabled: ['food', 'retail', 'services', 'nightlife', 'appointment'],
  offerDeadlineDefaultsSeconds: { ...CATEGORY_DEFAULTS_SECONDS },
  fulfillmentDeadlineDefaultsSeconds: {
    food: 86400,
    retail: 86400,
    services: 172800,
    nightlife: 43200,
    appointment: 172800,
  },
  intentScoringWeights: {
    budget: 0.25,
    radius: 0.2,
    constraints: 0.25,
    urgency: 0.2,
    flexibility: 0.1,
  },
  gatingRules: {
    scoreUnder50Stake: 50,
    score50to69Stake: 10,
    minScoreToRouteToPartners: 50,
  },
  quotas: {
    maxOpenIntentsFree: 2,
    maxOpenIntentsPremium: 5,
    maxOpenIntentsPro: 10,
  },
  ruleEngine: {
    maxRulesPerUserFree: 0,
    maxRulesPerUserPremium: 3,
    maxRulesPerUserPro: 10,
  },
  autoAcceptPolicy: {
    allowAutoAccept: true,
    defaultGraceSeconds: 300,
    minPartnerTrustScore: 70,
  },
  partnerLimits: {
    offersPerHour: 20,
    offersPerIntent: 1,
  },
  rankingWeights: {
    value: 0.4,
    trust: 0.3,
    distance: 0.2,
    speed: 0.1,
  },
  emergencyKill: {
    disableRouting: false,
    disableOffers: false,
    disableAutoAccept: false,
  },
};

export const INTENT_CATEGORY_LABELS: Record<IntentCategory, string> = {
  food: 'Food',
  retail: 'Retail',
  services: 'Services',
  nightlife: 'Nightlife',
  appointment: 'Appointment',
};

const CATEGORY_BASELINES: Record<IntentCategory, number> = {
  food: 15,
  retail: 25,
  services: 30,
  nightlife: 20,
  appointment: 40,
};

/**
 * Compute intent score 0..100 (reproducible, unit-testable).
 * Penalize low budget, urgent+small radius, many constraints; reward flexibility.
 */
export function computeIntentScore(params: {
  budgetMin: number;
  budgetMax: number;
  category: IntentCategory;
  radiusMeters: number;
  offerDeadlineSeconds: number;
  constraintCount: number;
  flexibility: number;
  weights: OrbIntentConfig['intentScoringWeights'];
}): number {
  const { budgetMin, budgetMax, category, radiusMeters, offerDeadlineSeconds, constraintCount, flexibility, weights } = params;
  let score = 100;
  const base = CATEGORY_BASELINES[category] ?? 20;
  const mid = (budgetMin + budgetMax) / 2;
  if (mid < base * 0.5) score -= weights.budget * 30;
  else if (mid < base) score -= weights.budget * 12;
  if (radiusMeters < 500 && offerDeadlineSeconds < 3600) score -= weights.radius * 25;
  else if (radiusMeters < 1000) score -= weights.radius * 8;
  if (offerDeadlineSeconds < 1800) score -= weights.urgency * 20;
  else if (offerDeadlineSeconds < 3600) score -= weights.urgency * 8;
  if (constraintCount > 5) score -= weights.constraints * 25;
  else if (constraintCount > 3) score -= weights.constraints * 12;
  if (flexibility >= 0.5 && flexibility <= 0.8) score += weights.flexibility * 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function isIntentHighLikelihood(score: number): boolean {
  return score >= 70;
}

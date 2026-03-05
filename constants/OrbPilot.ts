/**
 * OrbPilot™ — Outcome-First Verified-Visit Autopilot
 * All types, enums, and defaults for the OrbPilot engine.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export type SlotStatus = 'released' | 'claimed' | 'used' | 'expired' | 'cancelled';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended' | 'killed';
export type TrustTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type RewardTier = 'base' | 'boost' | 'rescue';
export type Objective = 'fill_rate' | 'new_customers' | 'repeat_customers' | 'cpa_optimize';
export type RejectionReason =
  | 'qr_invalid'
  | 'qr_expired'
  | 'slot_not_claimed'
  | 'slot_wrong_user'
  | 'window_closed'
  | 'geo_too_far'
  | 'geo_accuracy_low'
  | 'pin_wrong'
  | 'pin_expired'
  | 'pin_brute_force'
  | 'cap_user_weekly'
  | 'cap_campaign_daily'
  | 'cooldown_tier'
  | 'trust_tier_insufficient'
  | 'budget_exhausted'
  | 'idempotent_duplicate'
  | 'attempt_expired'
  | 'nonce_reused'
  | 'kill_switch';

export type FlagType = 'global' | 'city' | 'partner' | 'campaign';
export type RiskProfile = 'low' | 'medium' | 'high';
export type WindowState = 'pending' | 'open' | 'closed';
export type VerifyOutcome = 'pending' | 'verified' | 'rejected' | 'expired';

// Appendix 2+3 enums
export type DisputeStatus = 'open' | 'under_review' | 'approved' | 'denied' | 'reversed';
export type RestrictionType = 'temporary_ban' | 'rate_limit' | 'pilot_suspend';
export type ProfitStopLossAction = 'none' | 'p1_deescalate' | 'p2_restrict_eligibility' | 'p3_reduce_slots' | 'p4_pause';
export type UserTierLevel = 'free' | 'premium' | 'pro';
export type PartnerTierLevel = 'free' | 'premium' | 'pro';

// ─── Core Types ───────────────────────────────────────────────────────────────

export interface TimeWindow {
  /** Day of week 0=Sun..6=Sat */
  dow: number[];
  /** HH:MM local partner time */
  startTime: string;
  endTime: string;
}

export interface RewardLadder {
  /** Base OT Points awarded on normal verified visit */
  basePoints: number;
  /** Boost OT Points (fill-rate < boostFillRateThreshold) */
  boostPoints: number;
  /** Rescue OT Points (fill-rate < rescueFillRateThreshold or slow hours) */
  rescuePoints: number;
}

export interface CampaignDoc {
  id: string;
  partnerId: string;
  locationId?: string;
  cityId?: string;
  status: CampaignStatus;
  objective: Objective;
  /** Weekly budget in USD */
  weeklyBudgetUsd: number;
  // ── Appendix 2: Unit Economics ──────────────────────────────────────────────
  /** Average ticket value in USD (for profit math) */
  avgTicketUsd?: number;
  /** Gross margin % as decimal (e.g. 0.65 = 65%) */
  grossMarginPct?: number;
  /** Minimum profit per verified visit in USD before stop-loss escalates */
  profitFloorUsdPerVV?: number;
  /** Maximum discount cost per verified visit in USD (caps reward tier selection) */
  maxDiscountCostUsdPerVV?: number;
  /** Current profit stop-loss stage: none | p1 | p2 | p3 | p4 */
  profitStopLossStage?: ProfitStopLossAction;
  /** ISO when profit stop-loss was last evaluated */
  profitStopLossEvaluatedISO?: string;
  // ── Appendix 3: Consent ─────────────────────────────────────────────────────
  /** ISO when partner accepted OrbPilot terms */
  partnerConsentOrbPilotTermsAcceptedAtISO?: string;
  /** Daily max spend in USD */
  dailyMaxUsd: number;
  /** Remaining weekly budget in USD (decremented on verified only) */
  remainingWeeklyUsd: number;
  /** Remaining daily budget in USD */
  remainingDailyUsd: number;
  /** ISO date of current week start (Monday) */
  weekStartISO: string;
  /** ISO date string of current day */
  dayISO: string;
  /** Recurring weekly schedule windows */
  schedule: TimeWindow[];
  /** ISO date strings to skip (blackout days) */
  blackoutDates: string[];
  rewardLadder: RewardLadder;
  /** Max verified visits per day (all users) */
  maxVVPerDay: number;
  /** Max verified visits per user per 7 days */
  maxVVPerUserPerWeek: number;
  /** Minimum trust tier required */
  minTrustTier: TrustTier;
  /** Radius in meters in which user must be present to claim a slot */
  claimRadiusMeters: number;
  /** Radius in meters user must be in at verify time */
  verifyRadiusMeters: number;
  /** Max GPS accuracy allowed */
  maxAccuracyMeters: number;
  /** Max seconds from initiate to complete */
  completeWithinSeconds: number;
  /** CPA stop-loss threshold in USD */
  cpaMaxUsd: number;
  /** Whether PIN is required (set by admin risk profile or partner config) */
  pinRequired: boolean;
  /** Whether walk-in (no claim step) is allowed */
  walkInEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUid: string;
  /** Admin kill scope if killed */
  killedBy?: string;
  killedAt?: string;
  killReason?: string;
}

export interface WindowDoc {
  id: string;
  campaignId: string;
  partnerId: string;
  state: WindowState;
  /** ISO datetime */
  startISO: string;
  endISO: string;
  /** DOW this window covers */
  dow: number;
  targetSlotsToRelease: number;
  slotsReleased: number;
  slotsClaimed: number;
  slotsUsed: number;
  rewardTier: RewardTier;
  createdAt: string;
}

export interface SlotDoc {
  id: string;
  windowId: string;
  campaignId: string;
  partnerId: string;
  status: SlotStatus;
  rewardTier: RewardTier;
  rewardPoints: number;
  /** ISO when slot was released */
  releasedISO: string;
  /** ISO when slot expires if unclaimed */
  unclaimedExpiresISO: string;
  /** UID of user who claimed */
  claimUserId?: string;
  /** ISO when claimed */
  claimedISO?: string;
  /** ISO when claim expires (user must scan by then) */
  claimExpiresISO?: string;
  /** ISO when used/expired */
  closedISO?: string;
  /** visitId if verified */
  visitId?: string;
}

export interface VisitDoc {
  id: string;
  slotId: string;
  windowId: string;
  campaignId: string;
  partnerId: string;
  /** User id (anonymised in partner views) */
  userId: string;
  outcome: VerifyOutcome;
  rejectionReason?: RejectionReason;
  /** ISO when verification was initiated */
  initiatedISO: string;
  /** ISO when verified */
  verifiedISO?: string;
  /** OT Points granted */
  rewardPoints: number;
  rewardGranted: boolean;
  ledgerTxnId?: string;
  /** Whether this is a new customer (first VV at this partner) */
  isNewCustomer: boolean;
  /** GPS at verify time */
  lat: number;
  lng: number;
  accuracyM: number;
  /** Distance from partner location in meters */
  distanceM: number;
  /** Was PIN used */
  pinUsed: boolean;
  createdAt: string;
  // ── Appendix 3: Dispute + Reversal ──────────────────────────────────────────
  /** Whether this visit reward was reversed via dispute */
  reversed?: boolean;
  /** Ledger transaction ID of the reversal entry */
  reversalLedgerTxnId?: string;
  /** Dispute status if dispute raised */
  disputeStatus?: DisputeStatus;
  /** ISO when dispute was closed */
  disputeClosedISO?: string;
}

export interface UserTrustDoc {
  userId: string;
  tier: TrustTier;
  /** VV in rolling 30 days */
  vv30d: number;
  /** VV that resulted in rejection in rolling 30 days */
  rejections30d: number;
  /** Number of brute force PIN flags */
  pinBruteForceFlags: number;
  /** ISO of last tier evaluation */
  lastEvaluatedISO: string;
  /** ISO of last update */
  lastUpdatedISO: string;
  /** Admin override note */
  adminNote?: string;
}

export interface PartnerVerifyPinDoc {
  partnerId: string;
  /** Current PIN (plaintext, short-lived) */
  pin: string;
  /** ISO when this PIN expires */
  expiresISO: string;
  createdAt: string;
}

export interface VerificationAttemptDoc {
  id: string;
  slotId: string;
  campaignId: string;
  partnerId: string;
  userId: string;
  outcome: VerifyOutcome;
  rejectionReason?: RejectionReason;
  /** ISO when attempt was initiated */
  initiatedISO: string;
  /** ISO when attempt expires */
  attemptExpiresISO: string;
  /** Nonce for complete step */
  nonce: string;
  /** Whether nonce has been consumed */
  nonceUsed: boolean;
  /** Whether PIN is required for this attempt */
  requiresPin: boolean;
  /** Number of PIN attempts */
  pinAttempts: number;
  /** Whether PIN brute force flag was set */
  pinBruteForceFlagged: boolean;
  /** GPS at initiate */
  initLat: number;
  initLng: number;
  initAccuracyM: number;
  /** GPS at complete */
  completeLat?: number;
  completeLng?: number;
  completeAccuracyM?: number;
  completedISO?: string;
  visitId?: string;
  flags: FlagType[];
  createdAt: string;
}

export interface EngineTickRunDoc {
  id: string;
  ranAtISO: string;
  campaignCount: number;
  windowsOpened: number;
  slotsReleased: number;
  decisions: Array<{
    campaignId: string;
    partnerId: string;
    action: 'release' | 'skip' | 'stop_loss' | 'fill_rate_boost' | 'rescue';
    reason: string;
    slotsReleased: number;
    rewardTier: RewardTier;
  }>;
  durationMs: number;
}

export interface OrbPilotOffer {
  slotId: string;
  windowId: string;
  campaignId: string;
  partnerId: string;
  partnerName: string;
  partnerCategory: string;
  /** OT Points on offer */
  rewardPoints: number;
  rewardTier: RewardTier;
  /** Distance from user in meters */
  distanceM: number;
  /** ISO when window closes */
  windowEndsISO: string;
  /** Minutes remaining in window */
  windowMinutesLeft: number;
  /** Partner reliability score 0–100 */
  reliabilityScore: number;
  /** Ranking score for display order */
  rankScore: number;
  /** Minimum trust tier required */
  minTrustTier: TrustTier;
  /** Whether walk-in allowed */
  walkInEnabled: boolean;
}

export interface OrbPilotMetrics {
  partnerId: string;
  campaignId?: string;
  fromISO: string;
  toISO: string;
  totalVV: number;
  newCustomerVV: number;
  repeatCustomerVV: number;
  totalRejectionsFromBudget: number;
  budgetSpentUsd: number;
  cpaMeanUsd: number;
  fillRateMean: number;
  /** Best hours by VV count */
  bestHours: number[];
  reliabilityScore: number;
  vvByDay: Record<string, number>;
  cpaByDay: Record<string, number>;
  fillRateByHour: Record<number, number>;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const OrbPilotDefaults = {
  /** PIN digit length */
  pinLength: 6,
  /** PIN rotation interval in seconds */
  pinRotationSeconds: 45,
  /** How long a PIN remains valid after rotation (grace) */
  pinGracePeriodSeconds: 10,
  /** Max PIN attempts before brute-force lockout */
  maxPinAttempts: 5,
  /** Window (seconds) for PIN attempt rate limiting */
  pinAttemptWindowSeconds: 600,
  /** Claim radius in meters (user must be within to claim) */
  claimRadiusMeters: 500,
  /** Verify radius in meters (user must be at during verification) */
  verifyRadiusMeters: 150,
  /** Max GPS accuracy allowed at verify */
  maxAccuracyMeters: 50,
  /** Max seconds from initiate to complete */
  completeWithinSeconds: 300,
  /** Default CPA stop-loss in USD */
  cpaMaxUsd: 5.0,
  /** OT Point cost in USD (for budget math) */
  otPointCostUsd: 0.01,
  /** Fill-rate threshold for boost (below this = boost tier) */
  boostFillRateThreshold: 0.5,
  /** Fill-rate threshold for rescue (below this = rescue tier) */
  rescueFillRateThreshold: 0.25,
  /** Max verified visits per user per campaign per week */
  maxVVPerUserPerWeek: 3,
  /** Engine tick interval in minutes */
  engineTickIntervalMinutes: 15,
  /** Default slot unclaimed expiry in seconds */
  slotUnclaimedExpirySeconds: 900,
  /** Default claim expiry in seconds (user has this long to go scan) */
  claimExpirySeconds: 1800,
  /** Offer search radius in meters */
  offerSearchRadiusM: 5000,
  /** Max offers returned in nearby query */
  maxOffersNearby: 20,
  /** Trust tier promotion: consecutive VVs required */
  trustPromotionThreshold: 10,
  /** Trust tier demotion: rejections in 30d */
  trustDemotionThreshold: 3,
  /** Minimum reliability score required to appear in offer feed */
  minReliabilityScore: 40,
  /** Default base, boost, rescue points */
  defaultBasePoints: 50,
  defaultBoostPoints: 75,
  defaultRescuePoints: 100,
  /** Walk-in feature disabled by default (flag: isOrbPilotWalkInEnabled) */
  walkInEnabled: false,
};

export const TRUST_TIER_COOLDOWN_SECONDS: Record<TrustTier, number> = {
  bronze: 86400,   // 24h between visits
  silver: 43200,   // 12h
  gold: 21600,     // 6h
  platinum: 3600,  // 1h
};

export const TRUST_TIER_LABEL: Record<TrustTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

export const TRUST_TIER_COLOR: Record<TrustTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  ended: 'Ended',
  killed: 'Killed',
};

export const REWARD_TIER_LABEL: Record<RewardTier, string> = {
  base: 'Base',
  boost: 'Boost',
  rescue: 'Rescue',
};

export const REWARD_TIER_COLOR: Record<RewardTier, string> = {
  base: '#22C55E',
  boost: '#FBBF24',
  rescue: '#EF4444',
};

export const OBJECTIVE_LABEL: Record<Objective, string> = {
  fill_rate: 'Fill Rate',
  new_customers: 'New Customers',
  repeat_customers: 'Repeat Customers',
  cpa_optimize: 'CPA Optimize',
};

export const REJECTION_REASON_LABEL: Record<RejectionReason, string> = {
  qr_invalid: 'Invalid QR code',
  qr_expired: 'QR code expired',
  slot_not_claimed: 'Slot not claimed',
  slot_wrong_user: 'Slot belongs to another user',
  window_closed: 'Visit window closed',
  geo_too_far: 'Too far from location',
  geo_accuracy_low: 'GPS accuracy too low',
  pin_wrong: 'Incorrect PIN',
  pin_expired: 'PIN expired',
  pin_brute_force: 'Too many PIN attempts',
  cap_user_weekly: 'Weekly visit cap reached',
  cap_campaign_daily: 'Daily campaign cap reached',
  cooldown_tier: 'Trust tier cooldown active',
  trust_tier_insufficient: 'Trust tier too low',
  budget_exhausted: 'Campaign budget exhausted',
  idempotent_duplicate: 'Already rewarded for this visit',
  attempt_expired: 'Verification attempt expired',
  nonce_reused: 'Security token already used',
  kill_switch: 'Campaign temporarily paused',
};

// ─── Appendix 2: Profit Guardrails ────────────────────────────────────────────

export const PROFIT_STOP_LOSS_LABEL: Record<ProfitStopLossAction, string> = {
  none: 'Healthy',
  p1_deescalate: 'P1 — De-escalated Reward Tier',
  p2_restrict_eligibility: 'P2 — Eligibility Restricted',
  p3_reduce_slots: 'P3 — Slots Reduced 50%',
  p4_pause: 'P4 — Campaign Paused',
};

export const PROFIT_STOP_LOSS_COLOR: Record<ProfitStopLossAction, string> = {
  none: '#22C55E',
  p1_deescalate: '#FBBF24',
  p2_restrict_eligibility: '#F97316',
  p3_reduce_slots: '#EF4444',
  p4_pause: '#7F1D1D',
};

/** User-side tier entitlements per OrbPilot (Appendix 2 §Tier Gating) */
export const USER_TIER_PILOT_LIMITS: Record<UserTierLevel, {
  maxActiveClaims: number;
  vvPerWeek: number;
  earlyAccessMinutes: number;
}> = {
  free:    { maxActiveClaims: 1, vvPerWeek: 3,  earlyAccessMinutes: 0 },
  premium: { maxActiveClaims: 3, vvPerWeek: 6,  earlyAccessMinutes: 5 },
  pro:     { maxActiveClaims: 5, vvPerWeek: 10, earlyAccessMinutes: 10 },
};

/** Partner-side tier entitlements per OrbPilot (Appendix 2 §Tier Gating) */
export const PARTNER_TIER_PILOT_CAPS: Record<PartnerTierLevel, {
  engineEnabled: boolean;
  maxCampaigns: number;
  advancedControls: boolean;
  maxDailySlots: number;
}> = {
  free:    { engineEnabled: false, maxCampaigns: 0, advancedControls: false, maxDailySlots: 0 },
  premium: { engineEnabled: true,  maxCampaigns: 1, advancedControls: false, maxDailySlots: 20 },
  pro:     { engineEnabled: true,  maxCampaigns: 5, advancedControls: true,  maxDailySlots: 100 },
};

// ─── Appendix 3: Disputes, Consent, Restrictions ──────────────────────────────

export interface DisputeDoc {
  id: string;
  visitId: string;
  slotId: string;
  campaignId: string;
  partnerId: string;
  userId: string;
  status: DisputeStatus;
  /** Reason submitted by partner or user */
  reason: string;
  /** Who submitted the dispute: 'partner' | 'user' | 'admin' */
  submittedBy: 'partner' | 'user' | 'admin';
  submittedByUid: string;
  /** Admin resolution note */
  adminNote?: string;
  /** UID of admin who resolved */
  resolvedByUid?: string;
  resolvedAtISO?: string;
  /** Whether ledger was reversed */
  ledgerReversed?: boolean;
  reversalLedgerTxnId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerSpendEntry {
  id: string;
  partnerId: string;
  campaignId: string;
  visitId?: string;
  disputeId?: string;
  /** 'debit' = charged for VV; 'credit' = refunded via dispute reversal */
  type: 'debit' | 'credit';
  amountUsd: number;
  /** OT Points associated */
  rewardPoints: number;
  /** ISO month key (YYYY-MM) for bucketing */
  monthKey: string;
  createdAt: string;
  note?: string;
}

export interface UserRestriction {
  userId: string;
  type: RestrictionType;
  reason: string;
  /** ISO when restriction expires (null = permanent until lifted) */
  expiresISO?: string;
  createdByUid: string;
  createdAt: string;
  liftedAt?: string;
}

export interface PartnerRestriction {
  partnerId: string;
  type: RestrictionType;
  reason: string;
  expiresISO?: string;
  createdByUid: string;
  createdAt: string;
  liftedAt?: string;
}

export interface ConsentRecord {
  id: string;
  uid: string;
  role: 'user' | 'partner';
  consentType: 'verification_terms' | 'orbpilot_partner_terms';
  acceptedAtISO: string;
  ipHash?: string;
  platform: string;
  appVersion: string;
}

export interface UserEntitlements {
  userId: string;
  tier: UserTierLevel;
  maxActiveClaims: number;
  vvPerWeek: number;
  earlyAccessMinutes: number;
  /** Current active claims count */
  activeClaims: number;
  /** VVs in rolling 7 days */
  vvThisWeek: number;
  canClaim: boolean;
  blockReason?: string;
  consentGiven: boolean;
  restricted: boolean;
}

export interface PartnerEntitlements {
  partnerId: string;
  tier: PartnerTierLevel;
  engineEnabled: boolean;
  maxCampaigns: number;
  advancedControls: boolean;
  maxDailySlots: number;
  /** Active campaigns count */
  activeCampaigns: number;
  canCreateCampaign: boolean;
  blockReason?: string;
  consentGiven: boolean;
  restricted: boolean;
}

export const DISPUTE_STATUS_LABEL: Record<DisputeStatus, string> = {
  open: 'Open',
  under_review: 'Under Review',
  approved: 'Approved',
  denied: 'Denied',
  reversed: 'Reversed',
};

export const DISPUTE_STATUS_COLOR: Record<DisputeStatus, string> = {
  open: '#6B7280',
  under_review: '#FBBF24',
  approved: '#22C55E',
  denied: '#EF4444',
  reversed: '#7C3AED',
};

export const RESTRICTION_TYPE_LABEL: Record<RestrictionType, string> = {
  temporary_ban: 'Temporary Ban',
  rate_limit: 'Rate Limited',
  pilot_suspend: 'Suspended from OrbPilot',
};

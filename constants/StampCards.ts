/**
 * Stamp Cards™ — data models and presets.
 * Server is source of truth; these align with Firestore/Cloud Functions.
 */

export type StampProgramStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED';

export type StampRewardType =
  | 'FREE_ITEM'
  | 'PERCENT_OFF'
  | 'BOGO'
  | 'UPGRADE'
  | 'VIP_DROP_ACCESS'
  | 'OT_POINTS_BONUS';

export type StampTemplate = 'COFFEE' | 'RESTAURANT' | 'RETAIL' | 'SERVICE' | 'EVENT';
export type StampStyle = 'ORB' | 'STAR' | 'SHIELD' | 'CHECK';

export interface StampProgramEligibility {
  requireVerifiedUser: boolean;
  requirePartnerVerified: boolean;
}

export interface StampProgramCaps {
  maxStampsPerUserPerDay: number;
  maxRewardsPerDay: number | null;
}

export interface StampProgramReward {
  type: StampRewardType;
  label: string;
  expiresHoursAfterEarn: number | null;
  otPointsBonus: number | null;
}

export interface StampProgramDesign {
  template: StampTemplate;
  colors: { primary: string; secondary: string };
  iconLogoRef: string | null;
  stampStyle: StampStyle;
}

/** Optional boost window: during [startHour, endHour) UTC, one scan awards 2 stamps. */
export interface StampBoostWindow {
  startHour: number; // 0-23 UTC
  endHour: number;   // 0-23 UTC
}

export interface StampProgram {
  id: string;
  partnerId: string;
  status: StampProgramStatus;
  name: string;
  description: string;
  stampsRequired: number;
  cooldownHours: number;
  eligibility: StampProgramEligibility;
  caps: StampProgramCaps;
  reward: StampProgramReward;
  design: StampProgramDesign;
  /** When set, scans during this UTC hour window award 2 stamps (flag-gated). */
  boostWindows?: StampBoostWindow[];
  createdAt: number;
  updatedAt: number;
}

export type ActiveRewardStatus = 'NONE' | 'EARNED' | 'REDEEMED' | 'EXPIRED';

export interface StampActiveReward {
  earnedAt: number;
  expiresAt: number | null;
  redeemedAt: number | null;
  status: ActiveRewardStatus;
  rewardLabel: string;
  programId: string;
  partnerId: string;
}

export interface StampCardState {
  uid: string;
  programId: string;
  partnerId: string;
  stampCount: number;
  lastStampAt: number | null;
  completedCount: number;
  activeReward: StampActiveReward | null;
  updatedAt: number;
}

export type StampEventType =
  | 'STAMP_EARNED'
  | 'REWARD_EARNED'
  | 'REWARD_REDEEMED'
  | 'STAMP_REVERSED';

export interface StampEvent {
  id: string;
  uid: string;
  programId: string;
  partnerId: string;
  eventType: StampEventType;
  createdAt: number;
  deviceIdHash?: string;
  staffUid?: string;
  meta?: Record<string, unknown>;
}

export type StampReportType = 'WRONG_STAMP' | 'STAFF_ISSUE' | 'OTHER';

export interface StampReport {
  id: string;
  uid: string;
  programId: string;
  partnerId: string;
  type: StampReportType;
  details: string;
  createdAt: number;
  status: 'OPEN' | 'RESOLVED';
}

/** Preset options for stamps required (tier may restrict). */
export const STAMPS_REQUIRED_PRESETS = [5, 8, 10, 12] as const;

/** Preset cooldown hours (tier may restrict). */
export const COOLDOWN_HOURS_PRESETS = [4, 12, 24] as const;

/** Reward type labels for UI. */
export const STAMP_REWARD_TYPE_LABELS: Record<StampRewardType, string> = {
  FREE_ITEM: 'Free item',
  PERCENT_OFF: '% off',
  BOGO: 'BOGO',
  UPGRADE: 'Upgrade',
  VIP_DROP_ACCESS: 'VIP drop access',
  OT_POINTS_BONUS: 'OT Points bonus',
};

/** Template display names. */
export const STAMP_TEMPLATE_LABELS: Record<StampTemplate, string> = {
  COFFEE: 'Coffee',
  RESTAURANT: 'Restaurant',
  RETAIL: 'Retail',
  SERVICE: 'Service',
  EVENT: 'Event',
};

/** Stamp style display names. */
export const STAMP_STYLE_LABELS: Record<StampStyle, string> = {
  ORB: 'Orb',
  STAR: 'Star',
  SHIELD: 'Shield',
  CHECK: 'Check',
};

/** Restricted color palette for design (hex). */
export const STAMP_DESIGN_PALETTES: { primary: string; secondary: string; label: string }[] = [
  { primary: '#1e3a5f', secondary: '#3b82f6', label: 'Night blue' },
  { primary: '#422006', secondary: '#d4af37', label: 'Gold' },
  { primary: '#14532d', secondary: '#22c55e', label: 'Green' },
  { primary: '#4c1d95', secondary: '#a78bfa', label: 'Violet' },
  { primary: '#7c2d12', secondary: '#ea580c', label: 'Warm' },
  { primary: '#1e293b', secondary: '#94a3b8', label: 'Slate' },
];

/** QR payload prefix for stamp scan. */
export const STAMP_QR_PREFIX = 'orbtap://stamp';

/** Build QR payload so staff or customer can scan to add a stamp. */
export function buildStampQrPayload(partnerId: string, programId: string, token?: string): string {
  const params = new URLSearchParams({ partnerId, programId });
  if (token && token.length >= 4) params.set('token', token);
  return `${STAMP_QR_PREFIX}?${params.toString()}`;
}

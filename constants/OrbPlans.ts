/**
 * OrbPlans™ + Sphere Passport™ data model.
 *
 * Lightweight client-side types for sphere-specific plans.
 * Storage (Firestore or local) and reward wiring are layered on top of these types.
 */

export type SphereType = 'COUPLE' | 'FAMILY' | 'SOLO' | 'PAL';

export type PlanMode = 'TONIGHT' | 'WEEKEND' | 'DAY' | 'WEEK' | 'MONTH';

/** User-selected size preset. Micro/Standard/Passport affect generation + rewards. */
export type PlanSize = 'MICRO' | 'STANDARD' | 'PASSPORT';

export type PlanStepType = 'VISIT' | 'DROP' | 'QUEST' | 'CHECKLIST';

export type PlanStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELED';

export type PlanStepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

/** Mirrors VerifiedActionType subsets used by plans. */
export type PlanVerifiedActionType =
  | 'DROP_REDEEM'
  | 'MISSION_COMPLETE'
  | 'VISIT_CHECKIN';

export interface PlanTimeWindow {
  startAt: number;
  endAt: number;
}

export interface PlanConstraints {
  /** Optional plan budget ceiling in cents. */
  budgetCentsMax?: number;
  /** Optional approximate total duration of the plan (minutes). */
  durationMinutes?: number;
  /** Search radius in miles when the plan was generated. */
  radiusMiles: number;
  /**
   * Weather mode snapshot at creation time
   * (e.g. 'CLEAR', 'RAIN', 'SNOW', see useMapWeather).
   */
  weatherModeAtCreate?: string;
  /** Time window for the plan (e.g. tonight 6–10pm). */
  timeWindow: PlanTimeWindow;
}

export interface PlanProgressSummary {
  completedCount: number;
  totalCount: number;
}

export interface PlanStepVerification {
  /**
   * Whether verification is required for the step to count toward rewards.
   * Defaults to true for DROP / QUEST; false for VISIT / CHECKLIST.
   */
  required: boolean;
  /** Type of VerifiedAction to expect when the step is fulfilled. */
  verifiedActionType?: PlanVerifiedActionType;
  /** ID of the VerifiedAction that fulfilled this step (when known). */
  verifiedActionId?: string;
}

export interface PlanStepRewards {
  /** Maximum OT Points that can be earned directly from this step. */
  otPointsEarnMax?: number;
  /**
   * Maximum OT Points bonus this step can contribute when a time window
   * or X-of-Y completion window is satisfied.
   */
  bonusOnWindowCompleteMax?: number;
}

export interface PlanStepTargetRef {
  /** Underlying dropId when type === 'DROP'. */
  dropId?: string;
  /** Underlying missionId when type === 'QUEST'. */
  missionId?: string;
  /** Optional internal navigation route for VISIT / CHECKLIST steps. */
  route?: string;
}

export interface PlanStep {
  id: string;
  planId: string;
  orderIndex: number;
  type: PlanStepType;
  title: string;
  description: string;
  /** Optional partnerId for attribution and rewards. */
  partnerId?: string;
  /** Optional target reference into Drops / Missions / routes. */
  targetRef?: PlanStepTargetRef;
  verification: PlanStepVerification;
  rewards?: PlanStepRewards;
  status: PlanStepStatus;
  completedAt?: number;
}

export interface OrbPlan {
  id: string;
  /** Sphere ID this plan belongs to (required). */
  sphereId: string;
  sphereType: SphereType;
  createdByUid: string;
  /** Optional city / region ids (reuse existing geo patterns). */
  cityId?: string;
  regionId?: string;
  /** Human-readable title (usually from a template). */
  title: string;
  mode: PlanMode;
  /** Micro / Standard / Passport (pick-any) size preset. */
  size: PlanSize;
  constraints: PlanConstraints;
  steps: PlanStep[];
  status: PlanStatus;
  progress: PlanProgressSummary;
  createdAt: number;
  updatedAt: number;
}

/** True when a step type normally expects a VerifiedAction (DROP or QUEST). */
export function isVerifiedStepType(type: PlanStepType): boolean {
  return type === 'DROP' || type === 'QUEST';
}

/** Derive a simple progress summary from an array of steps. */
export function computePlanProgress(steps: PlanStep[]): PlanProgressSummary {
  const totalCount = steps.length;
  const completedCount = steps.filter((s) => s.status === 'COMPLETED').length;
  return { completedCount, totalCount };
}


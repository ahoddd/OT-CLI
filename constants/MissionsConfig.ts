/**
 * Missions — Admin-adjustable config: rewards, partners, deadlines, anti-cheat, doable defaults.
 * Designed so: 1 check-in per mission (purchase/visit), max 3 missions per day for "all day".
 */

export interface MissionsConfig {
  /** OT Points awarded per mission completion (all steps done). */
  rewardPointsPerMission: number;
  /** Sphere XP awarded per mission completion (to each of user's spheres). */
  rewardSphereXpPerMission: number;
  /** 1–5 partner IDs used for today's missions (check-in at purchase/visit). */
  missionPartnerIds: string[];
  /** If true, deadline is end of current day (23:59:59 local). Else hours from mission generation. */
  deadlineEndOfDay: boolean;
  /** Hours from now for deadline when deadlineEndOfDay is false. */
  deadlineHoursFromNow: number;
  /** Bonus OT for completing all missions in a day. */
  dailyFullCompletionBonusPoints: number;
  /** Max steps per mission (1 = one check-in per mission; doable default). Admin can raise to 2–3. */
  maxStepsPerMission: number;
  /** Max missions per day (3 = breakfast + lunch + dinner). Anti-abuse. */
  maxMissionsPerDay: number;
  /** Missions feature on/off. */
  missionsEnabled: boolean;
  /** Min minutes between check-ins at the same partner (anti-gaming). */
  minMinutesBetweenSamePartnerCheckIn: number;
  /** Require scan at partner (proof of visit) to complete step. Always true in practice. */
  requireProofToComplete: boolean;
}

export const DEFAULT_MISSIONS_CONFIG: MissionsConfig = {
  rewardPointsPerMission: 75,
  rewardSphereXpPerMission: 25,
  missionPartnerIds: ['p1', 'p2', 'p3'],
  deadlineEndOfDay: true,
  deadlineHoursFromNow: 24,
  dailyFullCompletionBonusPoints: 50,
  maxStepsPerMission: 1,
  maxMissionsPerDay: 3,
  missionsEnabled: true,
  minMinutesBetweenSamePartnerCheckIn: 5,
  requireProofToComplete: true,
};

export const MISSIONS_CONFIG_STORAGE_KEY = 'ORBTAP_MISSIONS_CONFIG_V2';

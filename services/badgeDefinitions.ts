/**
 * Admin-created badge definitions — Firestore badgeDefinitions.
 * App reads for display; admin creates via Cloud Function.
 */

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebaseConfig';
import type { BadgeDef } from '../constants/Badges';

const COLLECTION = 'badgeDefinitions';

export type BadgeRequirementType = 'verified_actions' | 'min_level' | 'min_ot_spent' | 'manual';

export interface BadgeRequirementConfig {
  /** For verified_actions: which action types count (e.g. EMIT_VERIFIED_REDEEM, MISSION_COMPLETE) */
  actionTypes?: string[];
  /** For verified_actions: required count */
  count?: number;
  /** For min_level: minimum user level */
  minLevel?: number;
  /** For min_ot_spent: minimum total OT points ever spent */
  minOtSpent?: number;
}

export interface BadgeDefinitionDoc {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  order: number;
  requirementType: BadgeRequirementType;
  requirementConfig?: BadgeRequirementConfig;
  createdAt: number;
  createdBy?: string;
}

function docToBadgeDef(docId: string, data: Record<string, unknown>): BadgeDef {
  const createdAt = (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? (data.createdAt as number) ?? 0;
  return {
    id: docId,
    name: (data.name as string) ?? 'Badge',
    description: (data.description as string) ?? '',
    icon: (data.icon as string) ?? 'ribbon',
    color: (data.color as string) ?? '#60A5FA',
    order: typeof data.order === 'number' ? data.order : 999,
    category: (data.category as BadgeDef['category']) ?? 'one_time',
  };
}

/** List all admin-created badge definitions (for app display). */
export async function listBadgeDefinitions(): Promise<BadgeDef[]> {
  const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToBadgeDef(d.id, d.data() as Record<string, unknown>));
}

/** Admin: create a new badge definition via Cloud Function. */
export async function createBadgeDefinition(params: {
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  order: number;
  requirementType: BadgeRequirementType;
  requirementConfig?: BadgeRequirementConfig;
}): Promise<{ success: boolean; id?: string; message?: string }> {
  const functions = getFunctions(undefined, 'us-central1');
  const call = httpsCallable<
    typeof params,
    { success: boolean; id?: string; message?: string }
  >(functions, 'createBadgeDefinition');
  const res = await call(params);
  return { success: res.data.success, id: res.data.id, message: res.data.message };
}

/** Admin: list all badge definitions (for admin hub list). */
export async function listBadgeDefinitionsAdmin(): Promise<BadgeDefinitionDoc[]> {
  const functions = getFunctions(undefined, 'us-central1');
  const call = httpsCallable<unknown, { success: boolean; badges?: BadgeDefinitionDoc[] }>(functions, 'listBadgeDefinitions');
  const res = await call({});
  if (!res.data.success || !res.data.badges) return [];
  return res.data.badges;
}

/** Evaluate custom badge requirements for the current user (or for uid if admin). Awards new badges on the server. */
export async function evaluateUserBadges(uid?: string): Promise<{ success: boolean; awarded?: string[] }> {
  const functions = getFunctions(undefined, 'us-central1');
  const call = httpsCallable<{ uid?: string }, { success: boolean; awarded?: string[] }>(functions, 'evaluateUserBadges');
  const res = await call(uid ? { uid } : {});
  return { success: res.data.success, awarded: res.data.awarded };
}

export const BADGE_ICON_OPTIONS = [
  'ribbon', 'medal', 'trophy', 'star', 'diamond', 'flash', 'flag', 'flame', 'shield-checkmark',
  'qr-code', 'location', 'business', 'people', 'chatbubble', 'megaphone', 'gift', 'checkbox',
  'walk', 'navigate', 'trail-sign', 'airplane', 'finger-print', 'infinite', 'heart', 'bookmark',
] as const;

export const BADGE_COLOR_OPTIONS = [
  '#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#6366F1', '#EAB308', '#9CA3AF',
];

export const BADGE_CATEGORY_OPTIONS: { value: BadgeDef['category']; label: string }[] = [
  { value: 'one_time', label: 'One-time / Milestone' },
  { value: 'missions', label: 'Missions' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'streak', label: 'Streaks' },
  { value: 'scans', label: 'Check-ins' },
  { value: 'partner', label: 'Partners' },
  { value: 'founding', label: 'Founding' },
];

export const VERIFIED_ACTION_TYPES = [
  'EMIT_VERIFIED_REDEEM',
  'EMIT_VERIFIED_CHECKIN',
  'EMIT_QUEST_COMPLETE',
  'EMIT_WORK_ORDER_COMPLETE',
  'EMIT_PLAN_STEP_COMPLETE',
  'EMIT_POLL_VOTE',
  'EMIT_DAILY_ORB_RITUAL',
  'MISSION_COMPLETE',
  'REDEEM',
  'CHECKIN',
];

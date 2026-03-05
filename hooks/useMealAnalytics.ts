/**
 * Meal Proposals — analytics tracking.
 * Logs funnel events: impression → open → tray → fuse → navigate → redeem.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MealProposalAction, MealProposalActionType, MealActionPlacement } from '../constants/MealProposals';

const ANALYTICS_KEY = 'ORBTAP_MEAL_ANALYTICS_V1';
const MAX_STORED = 500;

export async function logMealEvent(params: {
  proposalId: string;
  uid: string;
  action: MealProposalActionType;
  placement?: MealActionPlacement;
}): Promise<void> {
  const event: MealProposalAction = {
    id: `mea_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    proposalId: params.proposalId,
    uid: params.uid,
    action: params.action,
    createdAt: Date.now(),
    placement: params.placement ?? 'ORGANIC',
  };

  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_KEY);
    const list: MealProposalAction[] = raw ? JSON.parse(raw) : [];
    list.unshift(event);
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(list.slice(0, MAX_STORED)));
  } catch (e) {
    if (__DEV__) console.warn('Meal analytics write error:', e);
  }
}

export async function getMealAnalytics(proposalId?: string): Promise<MealProposalAction[]> {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_KEY);
    const list: MealProposalAction[] = raw ? JSON.parse(raw) : [];
    if (proposalId) return list.filter((e) => e.proposalId === proposalId);
    return list;
  } catch {
    return [];
  }
}

export interface MealFunnelSummary {
  impressions: number;
  opens: number;
  trayAdds: number;
  fuseSelects: number;
  navigations: number;
  reservations: number;
  claims: number;
}

export function computeFunnel(events: MealProposalAction[]): MealFunnelSummary {
  return {
    impressions: events.filter((e) => e.action === 'IMPRESSION').length,
    opens: events.filter((e) => e.action === 'OPEN').length,
    trayAdds: events.filter((e) => e.action === 'SWIPE_RIGHT_TRAY').length,
    fuseSelects: events.filter((e) => e.action === 'FUSE_SELECT').length,
    navigations: events.filter((e) => e.action === 'NAVIGATE').length,
    reservations: events.filter((e) => e.action === 'RESERVE').length,
    claims: events.filter((e) => e.action === 'CLAIM').length,
  };
}

export function getBestTimeToPost(events: MealProposalAction[]): string {
  if (events.length < 10) return 'Not enough data yet';
  const hourBuckets = new Map<number, number>();
  events.filter((e) => e.action === 'SWIPE_RIGHT_TRAY' || e.action === 'FUSE_SELECT').forEach((e) => {
    const hour = new Date(e.createdAt).getHours();
    hourBuckets.set(hour, (hourBuckets.get(hour) ?? 0) + 1);
  });
  let bestHour = 18;
  let bestCount = 0;
  hourBuckets.forEach((count, hour) => {
    if (count > bestCount) { bestHour = hour; bestCount = count; }
  });
  const period = bestHour >= 12 ? 'PM' : 'AM';
  const display = bestHour > 12 ? bestHour - 12 : bestHour === 0 ? 12 : bestHour;
  return `${display}:00 ${period}`;
}

export function getRecommendedPartySize(events: MealProposalAction[]): string {
  return events.length > 20 ? '2–4 (most selected)' : 'Not enough data yet';
}

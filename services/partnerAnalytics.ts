/**
 * Partner analytics — record views, follows, reviews, mission completions for partner/admin dashboards.
 * Mission completions are attributed as OrbTap-affiliated leads (leadSource) for rev share.
 */

import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { ORBTAP_LEAD_SOURCE_MISSION } from '../constants/LeadAttribution';
import { db } from '../firebaseConfig';
import { auth } from '../firebaseConfig';

export type PartnerAnalyticsEventType = 'view' | 'follow' | 'review' | 'mission_complete';

/** Metadata for attribution — OrbTap rev share on affiliated leads (missions, map-driven visits). */
export interface PartnerAnalyticsLeadMeta {
  /** e.g. 'orbtap_mission' so partner dashboard and billing can attribute to OrbTap. */
  leadSource: string;
  /** Optional mission id for reporting. */
  missionId?: string;
}

export interface PartnerAnalyticsEvent {
  partnerId: string;
  userId: string;
  eventType: PartnerAnalyticsEventType;
  createdAt: Timestamp;
  /** Optional: for mission_complete, marks lead as OrbTap-affiliated for rev share / reporting. */
  leadSource?: string;
  missionId?: string;
}

const COLLECTION = 'partnerAnalytics';
const MAX_DAYS = 90;
const MAX_DOCS_READ = 500;

function col() {
  return collection(db, COLLECTION);
}

/** Record an event. No-op if not signed in. */
export async function recordPartnerEvent(
  partnerId: string,
  eventType: PartnerAnalyticsEventType,
  meta?: Partial<PartnerAnalyticsLeadMeta>
): Promise<void> {
  const user = auth.currentUser;
  if (!user?.uid) return;
  try {
    await addDoc(col(), {
      partnerId,
      userId: user.uid,
      eventType,
      createdAt: Timestamp.now(),
      ...(meta?.leadSource && { leadSource: meta.leadSource }),
      ...(meta?.missionId && { missionId: meta.missionId }),
    });
  } catch {
    // ignore
  }
}

export async function recordPartnerView(partnerId: string): Promise<void> {
  return recordPartnerEvent(partnerId, 'view');
}

export async function recordPartnerFollow(partnerId: string): Promise<void> {
  return recordPartnerEvent(partnerId, 'follow');
}

export async function recordPartnerReview(partnerId: string): Promise<void> {
  return recordPartnerEvent(partnerId, 'review');
}

/** Record mission completion. Pass meta to attribute lead to OrbTap (rev share / reporting). */
export async function recordPartnerMissionComplete(
  partnerId: string,
  meta?: PartnerAnalyticsLeadMeta
): Promise<void> {
  return recordPartnerEvent(partnerId, 'mission_complete', meta ?? { leadSource: ORBTAP_LEAD_SOURCE_MISSION });
}

export interface PartnerAnalyticsSummary {
  views: number;
  follows: number;
  reviews: number;
  missionsCompleted: number;
  /** Mission completions attributed to OrbTap (leadSource === ORBTAP_LEAD_SOURCE_MISSION). For rev share / billing. */
  missionsCompletedOrbTapAttributed?: number;
}

export interface GetPartnerAnalyticsSummaryOptions {
  /** When set, summary includes missionsCompletedOrbTapAttributed (count of mission_complete with this leadSource). */
  leadSourceForAttribution?: string;
}

/** Aggregate counts for a partner in the last N days. Used by partner dashboard and admin. */
export async function getPartnerAnalyticsSummary(
  partnerId: string,
  days: number = 30,
  options?: GetPartnerAnalyticsSummaryOptions
): Promise<PartnerAnalyticsSummary> {
  const start = Timestamp.fromDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
  const q = query(
    col(),
    where('partnerId', '==', partnerId),
    where('createdAt', '>=', start),
    orderBy('createdAt', 'desc'),
    limit(MAX_DOCS_READ)
  );
  const snap = await getDocs(q);
  const summary: PartnerAnalyticsSummary = { views: 0, follows: 0, reviews: 0, missionsCompleted: 0 };
  const leadSource = options?.leadSourceForAttribution;
  if (leadSource) summary.missionsCompletedOrbTapAttributed = 0;

  snap.docs.forEach((d) => {
    const data = d.data();
    const type = data.eventType as PartnerAnalyticsEventType;
    if (type === 'view') summary.views++;
    else if (type === 'follow') summary.follows++;
    else if (type === 'review') summary.reviews++;
    else if (type === 'mission_complete') {
      summary.missionsCompleted++;
      if (leadSource && data.leadSource === leadSource) (summary.missionsCompletedOrbTapAttributed as number)++;
    }
  });
  return summary;
}

/** Convenience: get only OrbTap-attributed mission completions for a partner (rev share reporting). */
export async function getPartnerOrbTapAttributedMissions(
  partnerId: string,
  days: number = 30
): Promise<number> {
  const summary = await getPartnerAnalyticsSummary(partnerId, days, {
    leadSourceForAttribution: ORBTAP_LEAD_SOURCE_MISSION,
  });
  return summary.missionsCompletedOrbTapAttributed ?? 0;
}

/** Daily activity counts for sparkline charts. Returns last N days, each with total events (views + follows + reviews + missions). */
export async function getPartnerAnalyticsDailyHistory(
  partnerId: string,
  days: number = 14
): Promise<{ date: string; total: number }[]> {
  const start = Timestamp.fromDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
  const q = query(
    col(),
    where('partnerId', '==', partnerId),
    where('createdAt', '>=', start),
    orderBy('createdAt', 'asc'),
    limit(MAX_DOCS_READ)
  );
  const snap = await getDocs(q);
  const byDay: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split('T')[0];
    byDay[key] = 0;
  }
  snap.docs.forEach((d) => {
    const data = d.data();
    const ts = data.createdAt as Timestamp;
    const key = ts.toDate().toISOString().split('T')[0];
    if (byDay[key] !== undefined) byDay[key]++;
  });
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));
}

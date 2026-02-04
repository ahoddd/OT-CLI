/**
 * OrbArena™ — Competition hub types and config.
 * Proof-backed entries, verified human voting, trust-weighted integrity.
 * Blueprint: app/, components/, constants/, docs/BUILD/ only.
 */

export type ContestCadence = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type ContestStatus = 'DRAFT' | 'LIVE' | 'VOTING' | 'CLOSED' | 'ANNOUNCED';
export type EntryStatus = 'ACTIVE' | 'REMOVED' | 'DISQUALIFIED';
export type VoteStatus = 'COUNTED' | 'QUARANTINED' | 'REMOVED';

export const ARENA_CATEGORIES = [
  'BEST_DROP_WIN',
  'BEST_HIDDEN_GEM',
  'BEST_DATE_NIGHT',
  'BEST_UNDER_10_HACK',
  'BEST_PULSE_MOMENT',
] as const;
export type ArenaCategory = (typeof ARENA_CATEGORIES)[number];

export interface Contest {
  id: string;
  cityId: string;
  cadence: ContestCadence;
  startAt: number;
  endAt: number;
  votingStartAt: number;
  votingEndAt: number;
  categories: ArenaCategory[];
  sponsor?: string;
  status: ContestStatus;
  rules?: { entryCapPerUserPerCategory?: number; minVerifiedActions?: number };
}

export interface ArenaEntry {
  id: string;
  contestId: string;
  uid: string;
  category: ArenaCategory;
  verifiedActionId: string;
  partnerId: string;
  caption: string;
  mediaRefs: string[];
  createdAt: number;
  status: EntryStatus;
  stats?: { viewCount?: number; shareCount?: number; saveCount?: number };
}

export interface ArenaVote {
  id: string;
  contestId: string;
  entryId: string;
  voterUid: string;
  voterTrustScoreSnapshot: number;
  weightApplied: number;
  createdAt: number;
  status: VoteStatus;
  clientNonce: string;
}

export interface TrustProfile {
  uid: string;
  trustScore: number;
  computedAt: number;
  components?: Record<string, number>;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const now = Date.now();
const thisMonday = new Date();
thisMonday.setHours(0, 0, 0, 0);
thisMonday.setDate(thisMonday.getDate() - ((thisMonday.getDay() + 6) % 7));
const mon = thisMonday.getTime();
const sat = mon + 5 * 24 * 60 * 60 * 1000;
const sun = mon + 6 * 24 * 60 * 60 * 1000;
const nextMon = mon + WEEK_MS;

/** MVP: one weekly contest (entry Mon–Fri, voting Sat–Sun). */
export function getMockWeeklyContest(): Contest {
  return {
    id: 'arena_weekly_1',
    cityId: 'default',
    cadence: 'WEEKLY',
    startAt: mon,
    endAt: sat,
    votingStartAt: sat,
    votingEndAt: sun + 23 * 60 * 60 * 1000,
    categories: [...ARENA_CATEGORIES],
    status: now < sat ? 'LIVE' : now <= sun + 23 * 60 * 60 * 1000 ? 'VOTING' : 'CLOSED',
    rules: { entryCapPerUserPerCategory: 1, minVerifiedActions: 1 },
  };
}

export const ARENA_CONTESTS_KEY = 'ORBTAP_ARENA_CONTESTS_V1';
export const ARENA_ENTRIES_KEY = 'ORBTAP_ARENA_ENTRIES_V1';
export const ARENA_VOTES_KEY = 'ORBTAP_ARENA_VOTES_V1';
export const ARENA_TRUST_KEY = 'ORBTAP_ARENA_TRUST_V1';

export function getCategoryLabel(cat: ArenaCategory): string {
  const labels: Record<ArenaCategory, string> = {
    BEST_DROP_WIN: 'Best Drop Win',
    BEST_HIDDEN_GEM: 'Best Hidden Gem',
    BEST_DATE_NIGHT: 'Best Date Night',
    BEST_UNDER_10_HACK: 'Best Under $10 Hack',
    BEST_PULSE_MOMENT: 'Best Pulse Moment',
  };
  return labels[cat] ?? cat;
}

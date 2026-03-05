/**
 * Leaderboard Firestore queries — Phase 7 Cloud Function maintains these collections.
 * When isFirestoreLiveEnabled, app reads real rankings; otherwise uses mock/empty.
 */

import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const EXPLORERS_COLLECTION = 'leaderboardExplorers';
const STREAKS_COLLECTION = 'leaderboardStreaks';

export interface LeaderboardExplorerRow {
  id: string;
  name: string;
  val: string;
  badge?: string;
}

export interface LeaderboardStreakRow {
  id: string;
  name: string;
  val: string;
  badge?: string;
}

export async function getLeaderboardExplorers(limitCount: number = 50): Promise<LeaderboardExplorerRow[]> {
  try {
    const q = query(
      collection(db, EXPLORERS_COLLECTION),
      orderBy('xp', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d, i) => {
      const data = d.data();
      const xp = typeof data.xp === 'number' ? data.xp : 0;
      const val = xp >= 1000 ? `${(xp / 1000).toFixed(1)}k XP` : `${xp} XP`;
      return {
        id: (data.userId as string) || d.id,
        name: (data.displayName as string) || 'Explorer',
        val,
        badge: (data.badge as string) || 'Explorer',
      };
    });
  } catch {
    return [];
  }
}

export async function getLeaderboardStreaks(limitCount: number = 50): Promise<LeaderboardStreakRow[]> {
  try {
    const q = query(
      collection(db, STREAKS_COLLECTION),
      orderBy('currentStreak', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const streak = typeof data.currentStreak === 'number' ? data.currentStreak : 0;
      const val = `${streak} Days`;
      return {
        id: (data.userId as string) || d.id,
        name: (data.displayName as string) || 'Explorer',
        val,
        badge: (data.badge as string) || 'Rising',
      };
    });
  } catch {
    return [];
  }
}

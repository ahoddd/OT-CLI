/**
 * Orb Signal markets — when isFirestoreLiveEnabled, fetch from Firestore.
 * Phase 7: admin/partners can create markets; this reads the orbsignalMarkets collection.
 */

import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { OrbSignalMarket } from '../constants/OrbSignal';
import { VOTE_COST } from '../constants/OrbSignal';

const COLLECTION = 'orbsignalMarkets';

function docToMarket(docId: string, data: Record<string, unknown>): OrbSignalMarket {
  const percentages = Array.isArray(data.percentages) ? data.percentages as number[] : [50, 50];
  const outcomes = Array.isArray(data.outcomes) ? data.outcomes as string[] : ['Yes', 'No'];
  return {
    id: docId,
    question: (data.question as string) || 'Unknown',
    outcomes,
    percentages: percentages.length >= 2 ? percentages : [50, 50],
    pool: typeof data.pool === 'number' ? data.pool : 0,
    volume: typeof data.volume === 'number' ? data.volume : 0,
    endsAt: (data.endsAt as string) || '',
    endsAtShort: (data.endsAtShort as string) || '',
    category: ((data.category as string) || 'Local') as OrbSignalMarket['category'],
    partnerId: typeof data.partnerId === 'string' ? data.partnerId : undefined,
    tier: (data.tier === 'silver' || data.tier === 'gold' || data.tier === 'platinum' ? data.tier : undefined) as OrbSignalMarket['tier'] | undefined,
    featured: data.featured === true,
    endingSoon: data.endingSoon === true,
    liveViewers: typeof data.liveViewers === 'number' ? data.liveViewers : undefined,
    voteCost: typeof data.voteCost === 'number' ? data.voteCost : VOTE_COST,
    rewardNote: typeof data.rewardNote === 'string' ? data.rewardNote : undefined,
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : (data.imageUrl === null ? null : undefined),
  };
}

export async function fetchOrbSignalMarketsFromFirestore(limitCount: number = 50): Promise<OrbSignalMarket[]> {
  try {
    const q = query(collection(db, COLLECTION), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToMarket(d.id, d.data() as Record<string, unknown>));
  } catch {
    return [];
  }
}

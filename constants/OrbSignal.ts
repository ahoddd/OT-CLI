/**
 * Orb Signal — OrbTap's prediction layer. Non-cash OT Points only.
 * Shared market type and mock data for list + detail screens.
 */

export type OrbSignalCategory = 'Local' | 'Tech' | 'Pop Culture' | 'City' | 'Partner' | 'Fun';

export interface OrbSignalMarket {
  id: string;
  question: string;
  outcomes: string[];       // e.g. ['Yes', 'No'] or ['Option A', 'Option B']
  percentages: number[];    // current market odds, e.g. [72, 28]
  pool: number;             // total OT Points in the market
  volume: number;           // total volume traded (for display)
  endsAt: string;          // e.g. 'Mar 15, 2026'
  endsAtShort: string;     // e.g. '2d left' or '5h left'
  category: OrbSignalCategory;
  /** Optional partner id for partner-linked signals (e.g. "Will Pub 447 hit 100 check-ins?") */
  partnerId?: string;
  /** Show as featured / trending on list */
  featured?: boolean;
  /** Ending soon — show closing-soon badge and urgency copy */
  endingSoon?: boolean;
  /** Live viewer count (for engagement) */
  liveViewers?: number;
  /** Cost in OT Points to place one vote */
  voteCost: number;
  /** Multiplier description if correct (e.g. "2x OT Points") */
  rewardNote?: string;
  /** Optional hero image URL (e.g. AI-generated); shown on tile when set */
  imageUrl?: string | null;
}

export const VOTE_COST = 10;

export const MOCK_ORB_SIGNAL_MARKETS: OrbSignalMarket[] = [
  {
    id: 'm1',
    question: 'Will Starship launch successfully before March 20?',
    outcomes: ['Yes', 'No'],
    percentages: [72, 28],
    pool: 12400,
    volume: 45200,
    endsAt: 'Mar 20, 2026',
    endsAtShort: '18d left',
    category: 'Tech',
    featured: true,
    endingSoon: false,
    liveViewers: 124,
    voteCost: VOTE_COST,
    rewardNote: 'Earn 2x OT Points if you\'re right',
  },
  {
    id: 'm2',
    question: 'Bitcoin above $100k by Friday?',
    outcomes: ['Yes', 'No'],
    percentages: [58, 42],
    pool: 89200,
    volume: 210000,
    endsAt: 'Mar 8, 2026',
    endsAtShort: '6d left',
    category: 'Tech',
    featured: true,
    endingSoon: true,
    liveViewers: 89,
    voteCost: VOTE_COST,
    rewardNote: 'Correct forecasts boost your Orb Rep',
  },
  {
    id: 'm3',
    question: 'Will Pub 447 hit 100 check-ins this week?',
    outcomes: ['Yes', 'No'],
    percentages: [64, 36],
    pool: 8200,
    volume: 12000,
    endsAt: 'Mar 9, 2026',
    endsAtShort: '1d left',
    category: 'Partner',
    partnerId: 'p3',
    endingSoon: true,
    liveViewers: 23,
    voteCost: VOTE_COST,
    rewardNote: 'Unlock a Pub 447 perk if right',
  },
  {
    id: 'm4',
    question: 'Local weather above 80°F by March 10?',
    outcomes: ['Yes', 'No'],
    percentages: [41, 59],
    pool: 3200,
    volume: 5800,
    endsAt: 'Mar 10, 2026',
    endsAtShort: '8d left',
    category: 'City',
    liveViewers: 12,
    voteCost: VOTE_COST,
  },
  {
    id: 'm5',
    question: 'AI Agent ships a major release this quarter?',
    outcomes: ['Yes', 'No'],
    percentages: [85, 15],
    pool: 45600,
    volume: 98000,
    endsAt: 'Jun 30, 2026',
    endsAtShort: '4mo left',
    category: 'Tech',
    featured: true,
    liveViewers: 56,
    voteCost: VOTE_COST,
    rewardNote: '2x OT Points on correct forecast',
  },
  {
    id: 'm6',
    question: 'Will Great Wolf Lodge hit 500 scans this month?',
    outcomes: ['Yes', 'No'],
    percentages: [78, 22],
    pool: 15000,
    volume: 22000,
    endsAt: 'Mar 31, 2026',
    endsAtShort: '29d left',
    category: 'Partner',
    partnerId: 'p8',
    liveViewers: 34,
    voteCost: VOTE_COST,
    rewardNote: 'Bonus OT Points + resort perk',
  },
];

export function getOrbSignalMarket(id: string): OrbSignalMarket | undefined {
  return MOCK_ORB_SIGNAL_MARKETS.find((m) => m.id === id);
}

export function getFeaturedMarkets(): OrbSignalMarket[] {
  return MOCK_ORB_SIGNAL_MARKETS.filter((m) => m.featured);
}

export function getEndingSoonMarkets(): OrbSignalMarket[] {
  return MOCK_ORB_SIGNAL_MARKETS.filter((m) => m.endingSoon);
}

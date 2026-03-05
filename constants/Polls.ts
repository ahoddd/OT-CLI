import type { PartnerTier } from './PartnerTiers';

export interface Poll {
  id: string;
  question: string;
  options: { label: string; votes: number }[];
  totalVotes: number;
  partnerName: string;
  partnerId?: string;
  type: 'sponsored' | 'featured' | 'standard';
  timeLeft: string;
  /** Partner tier (silver/gold/platinum). Drives border and accent — same colors as partner tiers. */
  partnerTier?: PartnerTier;
  /** Custom accent hex (overrides partnerTier when set). */
  accentColor?: string;
  /** Optional one-liner under question. */
  tagline?: string;
  /** Creation time (ms since epoch). Used for partner delete-within-8h. */
  createdAt?: number;
}

export const MOCK_POLLS: Poll[] = [
  {
    id: 'sp1',
    question: "What should be our next Midnight Drop flavor?",
    options: [
      { label: "Neon Berry", votes: 1240 },
      { label: "Void Vanilla", votes: 890 },
      { label: "Cyber Citrus", votes: 450 }
    ],
    totalVotes: 2580,
    partnerName: "CyberCafe 2077",
    partnerId: "p1",
    type: 'sponsored',
    partnerTier: 'platinum',
    timeLeft: "2h 15m",
    tagline: "Your pick could be the next release.",
  },
  {
    id: 'ft1',
    question: "Best time for a flash sale?",
    options: [
      { label: "Morning Rush (8AM)", votes: 300 },
      { label: "Lunch Break (12PM)", votes: 520 },
      { label: "Night Owl (10PM)", votes: 1100 }
    ],
    totalVotes: 1920,
    partnerName: "Kith NYC",
    partnerId: "p3",
    type: 'featured',
    partnerTier: 'gold',
    timeLeft: "5h 30m"
  },
  {
    id: 'std1',
    question: "Do you prefer coffee or energy drinks?",
    options: [
      { label: "Coffee", votes: 45 },
      { label: "Energy Drinks", votes: 60 }
    ],
    totalVotes: 105,
    partnerName: "Joe & The Juice",
    partnerId: "p5",
    type: 'standard',
    partnerTier: 'gold',
    timeLeft: "1d"
  },
  {
    id: 'std2',
    question: "Rate the new gym layout",
    options: [
      { label: "🔥 Fire", votes: 89 },
      { label: "😐 Okay", votes: 12 },
      { label: "👎 Nah", votes: 5 }
    ],
    totalVotes: 106,
    partnerName: "Equinox Bond",
    partnerId: "p4",
    type: 'standard',
    partnerTier: 'platinum',
    timeLeft: "12h"
  }
];

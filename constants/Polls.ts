export interface Poll {
  id: string;
  question: string;
  options: { label: string; votes: number }[];
  totalVotes: number;
  partnerName: string;
  partnerId?: string; // Optional link to partner profile
  type: 'sponsored' | 'featured' | 'standard';
  timeLeft: string;
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
    timeLeft: "2h 15m"
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
    timeLeft: "12h"
  }
];

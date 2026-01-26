export type Tier = 'common' | 'rare' | 'apex' | 'legendary';

export interface Partner {
  id: string;
  name: string;
  category: string;
  tier: Tier;
  verified: boolean;
  lat: number;
  lon: number;
  description: string;
  address: string;
  hours: string;
  // Computed/joined fields for UI convenience
  perks?: Perk[];
}

export interface Perk {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  tier: Tier;
  terms: string;
  cooldown: string;
}

export const TIER_COLORS = {
  common: '#94a3b8',   // Slate
  rare: '#3b82f6',     // Electric Blue
  apex: '#ef4444',     // Ruby
  legendary: '#eab308', // Gold
};

export const MOCK_PERKS: Perk[] = [
  { id: 'pk1', partnerId: 'p1', tier: 'common', title: 'Free Espresso Shot', description: 'Get a free single shot with any pastry purchase.', terms: 'One per day.', cooldown: '24h' },
  { id: 'pk2', partnerId: 'p2', tier: 'rare', title: 'Day Pass Access', description: 'Full gym access including sauna.', terms: 'New members only.', cooldown: '7 days' },
  { id: 'pk3', partnerId: 'p3', tier: 'apex', title: 'VIP Entry + Drink', description: 'Skip the line and get a house cocktail.', terms: 'Friday/Saturday only.', cooldown: '12h' },
  { id: 'pk4', partnerId: 'p4', tier: 'legendary', title: 'Exclusive Reserve Item', description: 'Access to the hidden menu reserve item.', terms: 'Must show badge.', cooldown: '30 days' },
];

export const MOCK_PARTNERS: Partner[] = [
  {
    id: 'p1',
    name: 'Corner Coffee',
    category: 'Cafe',
    tier: 'common',
    verified: true,
    lat: 40.7128,
    lon: -74.0060,
    description: 'Artisanal coffee spot with a cozy vibe.',
    address: '123 Main St, New York, NY',
    hours: '7AM - 7PM',
  },
  {
    id: 'p2',
    name: 'Neon Gym',
    category: 'Fitness',
    tier: 'rare',
    verified: true,
    lat: 40.7138,
    lon: -74.0070,
    description: 'High-energy fitness center.',
    address: '456 Broadway, New York, NY',
    hours: '24/7',
  },
  {
    id: 'p3',
    name: 'Velvet Lounge',
    category: 'Nightlife',
    tier: 'apex',
    verified: false,
    lat: 40.7118,
    lon: -74.0050,
    description: 'Exclusive underground lounge.',
    address: '789 Bowery, New York, NY',
    hours: '10PM - 4AM',
  },
  {
    id: 'p4',
    name: 'Golden Vault',
    category: 'Luxury',
    tier: 'legendary',
    verified: true,
    lat: 40.7148,
    lon: -74.0040,
    description: 'Members-only luxury goods.',
    address: '101 5th Ave, New York, NY',
    hours: 'By Appointment',
  },
];

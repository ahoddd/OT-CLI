export type Tier = 'common' | 'rare' | 'apex' | 'legendary';

export interface Partner {
  id: string;
  name: string;
  category: string;
  tier: Tier;
  verified: boolean;
  lat: number;
  lon: number;
  perkTitle: string;
  cooldown: string;
}

export const TIER_COLORS = {
  common: '#94a3b8',   // Slate
  rare: '#3b82f6',     // Electric Blue
  apex: '#ef4444',     // Ruby
  legendary: '#eab308', // Gold
};

export const MOCK_PARTNERS: Partner[] = [
  {
    id: 'p1',
    name: 'Corner Coffee',
    category: 'Cafe',
    tier: 'common',
    verified: true,
    lat: 40.7128,
    lon: -74.0060,
    perkTitle: 'Free Espresso Shot',
    cooldown: '24h',
  },
  {
    id: 'p2',
    name: 'Neon Gym',
    category: 'Fitness',
    tier: 'rare',
    verified: true,
    lat: 40.7138,
    lon: -74.0070,
    perkTitle: 'Day Pass Access',
    cooldown: '1 week',
  },
  {
    id: 'p3',
    name: 'Velvet Lounge',
    category: 'Nightlife',
    tier: 'apex',
    verified: false,
    lat: 40.7118,
    lon: -74.0050,
    perkTitle: 'VIP Entry + Drink',
    cooldown: '12h',
  },
  {
    id: 'p4',
    name: 'Golden Vault',
    category: 'Luxury',
    tier: 'legendary',
    verified: true,
    lat: 40.7148,
    lon: -74.0040,
    perkTitle: 'Exclusive Reserve Item',
    cooldown: '30 days',
  },
];

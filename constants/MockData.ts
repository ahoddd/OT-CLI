export type Tier = 'common' | 'rare' | 'legendary' | 'apex';

export const TIER_COLORS = {
  common: '#4ade80',    // Green
  rare: '#60a5fa',      // Blue
  legendary: '#fbbf24', // Gold
  apex: '#ef4444',      // Red/Black
};

export interface Partner {
  id: string;
  name: string;
  category: string;
  tier: Tier;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  description: string;
  hours: string;
  verified: boolean;
  termsShort?: string; 
}

export interface Perk {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  cost: number;
  tier: Tier;
  cooldown: string;
}

// NYC CENTRIC DATA (Reformatted)
export const MOCK_PARTNERS: Partner[] = [
  // --- APEX TIER ---
  { id: 'p1', name: 'CyberCafe 2077', category: 'Tech Lounge', tier: 'apex', location: { lat: 40.7128, lng: -74.0060, address: '101 Broadway' }, description: 'High-fidelity network access.', hours: '24/7', verified: true, termsShort: 'Free access.' },
  { id: 'p2', name: 'The Void Club', category: 'Nightlife', tier: 'apex', location: { lat: 40.7240, lng: -74.0020, address: '44 Houston St' }, description: 'Exclusive underground sound lounge.', hours: '10PM - 6AM', verified: true, termsShort: 'Members only.' },
  { id: 'p3', name: 'Tesla Showroom', category: 'Tech', tier: 'apex', location: { lat: 40.7410, lng: -74.0090, address: '860 Washington St' }, description: 'Experience the future.', hours: '10AM - 8PM', verified: true },

  // --- LEGENDARY TIER ---
  { id: 'p4', name: 'Kith NYC', category: 'Fashion', tier: 'legendary', location: { lat: 40.7260, lng: -73.9980, address: '337 Lafayette St' }, description: 'Streetwear essentials.', hours: '11AM - 7PM', verified: true },
  { id: 'p5', name: 'Equinox Bond St', category: 'Fitness', tier: 'legendary', location: { lat: 40.7280, lng: -73.9950, address: '0 Bond St' }, description: 'Luxury performance training.', hours: '5AM - 11PM', verified: true },
  { id: 'p6', name: 'Nobu Downtown', category: 'Dining', tier: 'legendary', location: { lat: 40.7110, lng: -74.0090, address: '195 Broadway' }, description: 'World-renowned Japanese fusion.', hours: '5PM - 11PM', verified: true },

  // --- RARE TIER ---
  { id: 'p7', name: 'Joe & The Juice', category: 'Cafe', tier: 'rare', location: { lat: 40.7150, lng: -74.0030, address: '123 Church St' }, description: 'Fresh juice and coffee.', hours: '7AM - 9PM', verified: true },
  { id: 'p8', name: 'Apple SoHo', category: 'Tech', tier: 'rare', location: { lat: 40.7230, lng: -74.0010, address: '103 Prince St' }, description: 'Latest hardware.', hours: '10AM - 9PM', verified: true },
  { id: 'p9', name: 'Whole Foods Tribe', category: 'Grocery', tier: 'rare', location: { lat: 40.7180, lng: -74.0110, address: '270 Greenwich St' }, description: 'Organic essentials.', hours: '8AM - 10PM', verified: true },
  { id: 'p10', name: 'Moxy Hotel', category: 'Hospitality', tier: 'rare', location: { lat: 40.7130, lng: -74.0080, address: '26 Ann St' }, description: 'Boutique hotel.', hours: '24/7', verified: true },

  // --- COMMON TIER ---
  { id: 'p11', name: 'Starbucks Reserve', category: 'Cafe', tier: 'common', location: { lat: 40.7140, lng: -74.0070, address: 'Broadway & Park' }, description: 'Premium coffee.', hours: '6AM - 9PM', verified: true },
  { id: 'p12', name: 'Duane Reade', category: 'Retail', tier: 'common', location: { lat: 40.7160, lng: -74.0050, address: '305 Broadway' }, description: 'Daily essentials.', hours: '24/7', verified: false },
  { id: 'p13', name: 'Chase Bank', category: 'Finance', tier: 'common', location: { lat: 40.7170, lng: -74.0040, address: '401 Broadway' }, description: 'Banking and ATMs.', hours: '9AM - 5PM', verified: true },
  { id: 'p14', name: 'Sweetgreen', category: 'Dining', tier: 'common', location: { lat: 40.7190, lng: -74.0060, address: '100 Kenmare St' }, description: 'Healthy salads.', hours: '11AM - 9PM', verified: true },
  { id: 'p15', name: 'Citibike Dock', category: 'Travel', tier: 'common', location: { lat: 40.7210, lng: -74.0080, address: 'Canal St' }, description: 'Bike sharing.', hours: '24/7', verified: false },
];

export const MOCK_PERKS: Perk[] = [
  { id: 'pk1', partnerId: 'p1', title: 'Free Espresso', description: 'Redeem one house coffee.', cost: 500, tier: 'common', cooldown: '24h' },
  { id: 'pk2', partnerId: 'p2', title: 'VIP Entry', description: 'Skip the line.', cost: 5000, tier: 'apex', cooldown: '7d' },
  { id: 'pk3', partnerId: 'p4', title: 'Early Access', description: 'Access to new drops.', cost: 2000, tier: 'legendary', cooldown: '30d' },
  { id: 'pk4', partnerId: 'p1', title: '1h Gig-Speed Wifi', description: 'Unthrottled connection.', cost: 100, tier: 'common', cooldown: '2h' },
];

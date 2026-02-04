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
  /** Partner-uploaded image for Featured spot on hub (prime placement). Optional. */
  featuredImageUrl?: string | null;
  /** Partner logo for modals and detail. Optional. */
  logoUrl?: string | null;
}

export interface Perk {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  cost: number;
  tier: Tier;
  cooldown: string;
  /** Photo of the specific perk (e.g. dish, deal). Optional. */
  imageUrl?: string | null;
}

/** Mission = visit/check-in goal with reward; can be shown on map. */
export interface Mission {
  id: string;
  title: string;
  description: string;
  partnerId?: string;
  location: { lat: number; lng: number; address: string };
  rewardPoints: number;
  type: 'visit' | 'scan' | 'streak' | 'collect';
}

// Poconos / Tannersville PA — Crossings, waterparks, local spots
// Coordinates: Crossings ~41.044, -75.309; Great Wolf ~41.078, -75.32; Kalahari ~41.10, -75.36; Camelback ~41.052, -75.355

export const MOCK_PARTNERS: Partner[] = [
  // --- Requested real spots ---
  { id: 'p1', name: "Zack's Taco Shack", category: 'Dining', tier: 'legendary', location: { lat: 41.0450, lng: -75.3080, address: 'Rt 611, Tannersville' }, description: 'Fresh tacos and burritos.', hours: '11AM - 9PM', verified: true, termsShort: 'One free taco with drink.' },
  { id: 'p2', name: "Nick's Big Belly Deli", category: 'Dining', tier: 'legendary', location: { lat: 41.0465, lng: -75.3100, address: 'Main St, Tannersville' }, description: 'Sandwiches and deli classics.', hours: '7AM - 4PM', verified: true, termsShort: 'Free cookie with sandwich.' },
  { id: 'p3', name: 'Pub 447', category: 'Nightlife', tier: 'apex', location: { lat: 41.0470, lng: -75.3075, address: '447 Rt 611, Tannersville' }, description: 'Local pub and grill.', hours: '4PM - 2AM', verified: true, termsShort: 'Buy one get one draft.', featuredImageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600' },
  { id: 'p4', name: 'Trackside Bar & Grill', category: 'Dining', tier: 'legendary', location: { lat: 41.0435, lng: -75.3110, address: 'Near Crossings, Tannersville' }, description: 'Burgers, wings, and railside vibes.', hours: '11AM - 11PM', verified: true, termsShort: '10% off check.' },
  { id: 'p5', name: "Homie's Tacos", category: 'Dining', tier: 'rare', location: { lat: 41.0480, lng: -75.3095, address: 'Tannersville' }, description: 'Street-style tacos and bowls.', hours: '12PM - 8PM', verified: true, termsShort: 'Free chips & salsa.' },
  { id: 'p6', name: 'Legacy Barbershop', category: 'Services', tier: 'rare', location: { lat: 41.0460, lng: -75.3085, address: 'Tannersville' }, description: 'Classic cuts and fades.', hours: '9AM - 6PM', verified: true, termsShort: 'First visit discount.' },
  { id: 'p7', name: "Brand's Barbershop", category: 'Services', tier: 'rare', location: { lat: 41.0455, lng: -75.3092, address: 'Tannersville' }, description: 'Precision cuts and styling.', hours: '8AM - 7PM', verified: true, termsShort: '$5 off first cut.' },

  // --- Waterparks & Crossings ---
  { id: 'p8', name: 'Great Wolf Lodge', category: 'Hospitality', tier: 'apex', location: { lat: 41.0780, lng: -75.3200, address: '1 Great Wolf Dr, Scotrun' }, description: 'Indoor waterpark and resort.', hours: '24/7', verified: true, termsShort: 'Arcade credits.' },
  { id: 'p9', name: 'Kalahari Resort', category: 'Hospitality', tier: 'apex', location: { lat: 41.1000, lng: -75.3600, address: '250 Kalahari Blvd, Pocono Manor' }, description: 'Indoor waterpark and spa.', hours: '24/7', verified: true, termsShort: 'Splash pass discount.' },
  { id: 'p10', name: 'Camelback Resort', category: 'Hospitality', tier: 'apex', location: { lat: 41.0520, lng: -75.3550, address: '301 Resort Dr, Tannersville' }, description: 'Ski, waterpark, and adventure.', hours: '8AM - 10PM', verified: true, termsShort: 'Aquatopia perk.' },
  { id: 'p11', name: 'The Crossings Premium Outlets', category: 'Retail', tier: 'legendary', location: { lat: 41.0440, lng: -75.3090, address: '1000 Premium Outlets Dr, Tannersville' }, description: 'Designer outlets and dining.', hours: '10AM - 9PM', verified: true, termsShort: 'Guest services reward.' },

  // --- More Poconos demos (fake names) ---
  { id: 'p12', name: 'Mountain Mug Coffee', category: 'Cafe', tier: 'common', location: { lat: 41.0448, lng: -75.3082, address: 'Tannersville' }, description: 'Coffee and pastries.', hours: '6AM - 6PM', verified: true, termsShort: 'Free refill.' },
  { id: 'p13', name: 'Pocono Pizza Co', category: 'Dining', tier: 'common', location: { lat: 41.0472, lng: -75.3105, address: 'Tannersville' }, description: 'Pizza and subs.', hours: '11AM - 10PM', verified: true, termsShort: 'Slice + drink deal.' },
  { id: 'p14', name: 'Slope Side Brewery', category: 'Nightlife', tier: 'rare', location: { lat: 41.0500, lng: -75.3540, address: 'Near Camelback' }, description: 'Craft beer and pub food.', hours: '12PM - 12AM', verified: true, termsShort: 'Flight discount.' },
  { id: 'p15', name: 'Trailhead Gear Shop', category: 'Retail', tier: 'rare', location: { lat: 41.0462, lng: -75.3078, address: 'Tannersville' }, description: 'Outdoor gear and rentals.', hours: '9AM - 7PM', verified: true, termsShort: '10% off rental.' },
  { id: 'p16', name: 'Pocono Creamery', category: 'Dining', tier: 'common', location: { lat: 41.0452, lng: -75.3098, address: 'Tannersville' }, description: 'Ice cream and sweets.', hours: '12PM - 9PM', verified: true, termsShort: 'Free cone upgrade.' },
  { id: 'p17', name: 'Summit Spa', category: 'Services', tier: 'legendary', location: { lat: 41.0510, lng: -75.3530, address: 'Tannersville' }, description: 'Massage and wellness.', hours: '9AM - 8PM', verified: true, termsShort: 'Add-on discount.' },
  { id: 'p18', name: 'The Lodge Kitchen', category: 'Dining', tier: 'rare', location: { lat: 41.0775, lng: -75.3190, address: 'Scotrun' }, description: 'Comfort food and breakfast.', hours: '7AM - 10PM', verified: true, termsShort: 'Kids eat free day.' },
  { id: 'p19', name: 'Outlets Bistro', category: 'Dining', tier: 'common', location: { lat: 41.0438, lng: -75.3092, address: 'Crossings, Tannersville' }, description: 'Quick bites at the outlets.', hours: '10AM - 8PM', verified: true, termsShort: 'Combo discount.' },
  { id: 'p20', name: 'Pocono Adventure Park', category: 'Entertainment', tier: 'legendary', location: { lat: 41.0530, lng: -75.3560, address: 'Tannersville' }, description: 'Ziplines and activities.', hours: '9AM - 5PM', verified: true, termsShort: 'Second activity half off.' },
];

export const MOCK_PERKS: Perk[] = [
  // Zack's Taco Shack
  { id: 'pk1', partnerId: 'p1', title: 'Free Taco', description: 'One free taco with any drink purchase.', cost: 150, tier: 'common', cooldown: '24h' },
  { id: 'pk2', partnerId: 'p1', title: 'Guac Upgrade', description: 'Free guac on any bowl or burrito.', cost: 75, tier: 'common', cooldown: '12h' },
  { id: 'pk3', partnerId: 'p1', title: 'Double Points Day', description: 'Earn 2x OT points on your order.', cost: 300, tier: 'rare', cooldown: '7d' },
  // Nick's Big Belly Deli
  { id: 'pk4', partnerId: 'p2', title: 'Free Cookie', description: 'Free cookie with any sandwich.', cost: 100, tier: 'common', cooldown: '24h' },
  { id: 'pk5', partnerId: 'p2', title: 'Breakfast Combo', description: 'Coffee + pastry for 50 pts off.', cost: 200, tier: 'common', cooldown: '24h' },
  // Pub 447
  { id: 'pk6', partnerId: 'p3', title: 'BOGO Draft', description: 'Buy one get one draft beer.', cost: 500, tier: 'apex', cooldown: '7d' },
  { id: 'pk7', partnerId: 'p3', title: 'Appetizer Half-Off', description: '50% off one appetizer.', cost: 250, tier: 'rare', cooldown: '24h' },
  // Trackside Bar & Grill
  { id: 'pk8', partnerId: 'p4', title: '10% Off Check', description: '10% off your total bill.', cost: 200, tier: 'common', cooldown: '24h' },
  { id: 'pk9', partnerId: 'p4', title: 'Free Wings', description: 'Free order of wings with two drinks.', cost: 400, tier: 'legendary', cooldown: '7d' },
  // Homie's Tacos
  { id: 'pk10', partnerId: 'p5', title: 'Free Chips & Salsa', description: 'Complimentary chips and salsa.', cost: 80, tier: 'common', cooldown: '12h' },
  { id: 'pk11', partnerId: 'p5', title: 'Taco Trio Deal', description: '3 tacos + drink at discount.', cost: 350, tier: 'rare', cooldown: '24h' },
  // Legacy Barbershop
  { id: 'pk12', partnerId: 'p6', title: 'First Visit Discount', description: '$5 off your first cut.', cost: 150, tier: 'common', cooldown: 'once' },
  { id: 'pk13', partnerId: 'p6', title: 'Beard Trim Add-On', description: 'Free beard trim with haircut.', cost: 100, tier: 'common', cooldown: '14d' },
  // Brand's Barbershop
  { id: 'pk14', partnerId: 'p7', title: '$5 Off First Cut', description: 'New customer discount.', cost: 120, tier: 'common', cooldown: 'once' },
  { id: 'pk15', partnerId: 'p7', title: 'Styling Product Sample', description: 'Free sample with cut.', cost: 50, tier: 'common', cooldown: '30d' },
  // Great Wolf Lodge
  { id: 'pk16', partnerId: 'p8', title: 'Arcade Credits', description: '50 bonus arcade credits.', cost: 800, tier: 'apex', cooldown: '7d' },
  { id: 'pk17', partnerId: 'p8', title: 'Souvenir Discount', description: '20% off gift shop.', cost: 400, tier: 'rare', cooldown: '24h' },
  // Kalahari
  { id: 'pk18', partnerId: 'p9', title: 'Splash Pass Discount', description: '10% off waterpark pass.', cost: 1000, tier: 'apex', cooldown: '30d' },
  { id: 'pk19', partnerId: 'p9', title: 'Spa Credit', description: '$10 spa credit.', cost: 600, tier: 'legendary', cooldown: '14d' },
  // Camelback
  { id: 'pk20', partnerId: 'p10', title: 'Aquatopia Perk', description: 'Skip-the-line upgrade.', cost: 500, tier: 'legendary', cooldown: '7d' },
  { id: 'pk21', partnerId: 'p10', title: 'Food Court Combo', description: 'Discounted meal combo.', cost: 250, tier: 'common', cooldown: '24h' },
  // Crossings
  { id: 'pk22', partnerId: 'p11', title: 'Guest Services Reward', description: 'Free gift wrap or info booklet.', cost: 100, tier: 'common', cooldown: '24h' },
  { id: 'pk23', partnerId: 'p11', title: 'Parking Validation', description: 'Validated parking for 2 hours.', cost: 200, tier: 'rare', cooldown: '24h' },
  // Mountain Mug, Pocono Pizza, etc.
  { id: 'pk24', partnerId: 'p12', title: 'Free Refill', description: 'Free coffee refill.', cost: 50, tier: 'common', cooldown: '2h' },
  { id: 'pk25', partnerId: 'p13', title: 'Slice + Drink Deal', description: 'Slice and drink combo price.', cost: 180, tier: 'common', cooldown: '24h' },
  { id: 'pk26', partnerId: 'p14', title: 'Flight Discount', description: '$2 off beer flight.', cost: 150, tier: 'rare', cooldown: '24h' },
  { id: 'pk27', partnerId: 'p15', title: '10% Off Rental', description: '10% off gear rental.', cost: 200, tier: 'rare', cooldown: '7d' },
  { id: 'pk28', partnerId: 'p16', title: 'Free Cone Upgrade', description: 'Upgrade to waffle cone free.', cost: 60, tier: 'common', cooldown: '12h' },
  { id: 'pk29', partnerId: 'p17', title: 'Add-On Discount', description: '20% off one add-on service.', cost: 400, tier: 'legendary', cooldown: '30d' },
  { id: 'pk30', partnerId: 'p18', title: 'Kids Eat Free', description: 'One kids meal free with adult entree.', cost: 300, tier: 'rare', cooldown: '7d' },
  { id: 'pk31', partnerId: 'p19', title: 'Combo Discount', description: 'Combo meal at reduced price.', cost: 120, tier: 'common', cooldown: '24h' },
  { id: 'pk32', partnerId: 'p20', title: 'Second Activity Half Off', description: 'Second activity 50% off.', cost: 600, tier: 'legendary', cooldown: '14d' },
];

/** ID of the partner currently in the Featured Partner spot on the hub (prime real estate). Rotate for paid placements. */
export const FEATURED_PARTNER_ID = 'p3';

/** Top slot 1 on dense grid: Featured Perk. Partners apply in-app; guided tutorials. */
export const FEATURED_PERK_PARTNER_ID = 'p3';

/** Top slot 2 on dense grid: Sponsored Perk. Paid placement; partners apply in-app. */
export const SPONSORED_PERK_PARTNER_ID = 'p1';

export function getFeaturedPartner(): Partner | null {
  return MOCK_PARTNERS.find((p) => p.id === FEATURED_PARTNER_ID) ?? null;
}

/** Ordered list for grid: [Featured, Sponsored, ...rest]. Ensures top two are Featured + Sponsored. */
export function getGridPartnersOrdered(): Partner[] {
  const featured = MOCK_PARTNERS.find((p) => p.id === FEATURED_PERK_PARTNER_ID);
  const sponsored = MOCK_PARTNERS.find((p) => p.id === SPONSORED_PERK_PARTNER_ID);
  const rest = MOCK_PARTNERS.filter(
    (p) => p.id !== FEATURED_PERK_PARTNER_ID && p.id !== SPONSORED_PERK_PARTNER_ID
  );
  const ordered: Partner[] = [];
  if (featured) ordered.push(featured);
  if (sponsored) ordered.push(sponsored);
  ordered.push(...rest);
  return ordered;
}

export const MOCK_MISSIONS: Mission[] = [
  { id: 'm1', title: 'Poconos Food Crawl', description: 'Check in at 3 Poconos dining spots.', partnerId: 'p1', location: { lat: 41.0455, lng: -75.3090, address: 'Tannersville' }, rewardPoints: 150, type: 'visit' },
  { id: 'm2', title: 'Waterpark Triple', description: 'Visit all 3 major indoor waterparks.', location: { lat: 41.0767, lng: -75.3450, address: 'Poconos' }, rewardPoints: 500, type: 'visit' },
  { id: 'm3', title: 'Crossings Shopper', description: 'Scan at Crossings Premium Outlets.', partnerId: 'p11', location: { lat: 41.0440, lng: -75.3090, address: 'Crossings, Tannersville' }, rewardPoints: 100, type: 'scan' },
  { id: 'm4', title: 'Taco Tour', description: 'Visit Zack\'s and Homie\'s Tacos.', partnerId: 'p1', location: { lat: 41.0465, lng: -75.3088, address: 'Tannersville' }, rewardPoints: 200, type: 'visit' },
  { id: 'm5', title: 'Barber Week', description: 'Get a cut at Legacy or Brand\'s.', partnerId: 'p6', location: { lat: 41.0458, lng: -75.3089, address: 'Tannersville' }, rewardPoints: 120, type: 'visit' },
  { id: 'm6', title: '7-Day Streak', description: 'Shatter the orb 7 days in a row.', location: { lat: 41.0440, lng: -75.3080, address: 'OrbTap App' }, rewardPoints: 300, type: 'streak' },
  { id: 'm7', title: 'Pub & Grill Run', description: 'Check in at Pub 447 and Trackside.', partnerId: 'p3', location: { lat: 41.0472, lng: -75.3078, address: 'Tannersville' }, rewardPoints: 180, type: 'visit' },
  { id: 'm8', title: 'Collect 5 Perks', description: 'Redeem 5 different perks this month.', location: { lat: 41.0445, lng: -75.3095, address: 'Poconos' }, rewardPoints: 250, type: 'collect' },
];

/** Partner tiers: Silver (free), Gold (premium), Platinum (pro). Re-exported from PartnerTiers for convenience. */
export type { PartnerTier } from './PartnerTiers';
export { PARTNER_TIER_COLORS } from './PartnerTiers';
import type { PartnerTier } from './PartnerTiers';

/** Reward/streak tier colors (Blueprint: Common, Rare, Apex, Legendary only). Used for streak rings, gamification badges. */
export const TIER_COLORS: Record<'common' | 'rare' | 'apex' | 'legendary', string> = {
  common: '#64748b',
  rare: '#3b82f6',
  apex: '#dc2626',
  legendary: '#eab308',
};

export interface Partner {
  id: string;
  name: string;
  category: string;
  /** Partner tier: Silver (free), Gold (premium), Platinum (pro). */
  tier: PartnerTier;
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
  /** Custom "About" note for users (max 500 chars in UI). */
  about?: string | null;
  /** Show Request Work / Request Catering button on partner page. Default true. */
  showOrbOpsButton?: boolean;
  /** Dining/food partners: offer catering (shows "Request Catering" instead of "Request Work"). */
  offersCatering?: boolean;
  /** Firestore: uid of the user who owns this partner (links users to their business). */
  ownerUid?: string | null;
  /** Contact phone. Optional. */
  phone?: string | null;
  /** Website URL. Optional. */
  website?: string | null;
  /** Instagram handle or URL. Optional. */
  socialInstagram?: string | null;
  /** Twitter/X handle or URL. Optional. */
  socialTwitter?: string | null;
}

export interface Perk {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  cost: number;
  /** Perks inherit partner tier (Silver/Gold/Platinum). Optional boost can override for a period. */
  tier: PartnerTier;
  cooldown: string;
  /** Photo of the specific perk (e.g. dish, deal). Optional. */
  imageUrl?: string | null;
  /** Optional stock for limited-quantity perks (blueprint: stock.remaining). */
  stock?: { remaining?: number };
  /** When false, perk is hidden from discovery. Default true. */
  active?: boolean;
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

/** Optional multi-step definition for a mission (admin can override via config). */
export interface MissionStepDef {
  id: string;
  label: string;
  type: 'check_in' | 'scan' | 'visit' | 'vote' | 'share';
  partnerId?: string;
}

export interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  steps: MissionStepDef[];
  mealSlot?: 'breakfast' | 'lunch' | 'dinner';
}

/** Admin demo/test partner — OrbTap Universe. Shown first for admin so they can test the full app as a partner. */
export const ORBTAP_UNIVERSE_PARTNER_ID = 'orbtap-universe';

/** OrbTap Universe: admin's partner test account. Pro (platinum) by default; tier can be overridden in Admin Hub (Test as partner). */
export const ORBTAP_UNIVERSE_PARTNER: Partner = {
  id: ORBTAP_UNIVERSE_PARTNER_ID,
  name: 'OrbTap Universe',
  category: 'Platform',
  tier: 'platinum',
  location: { lat: 41.044, lng: -75.309, address: 'OrbTap HQ' },
  description: 'Official OrbTap partner account for testing and demos. Use Admin Hub to switch partner tier (Silver/Gold/Platinum) and test the full experience.',
  hours: '24/7',
  verified: true,
  termsShort: 'Demo account — test perks, OrbSwipe, and partner features.',
  about: 'This is the OrbTap admin demo partner. Change "Test as partner" in Admin Hub to see how Silver, Gold, and Platinum partners appear across the app.',
};

/** Demo perks for OrbTap Universe (admin test account). Injected when user is admin so they can test redemption. */
export const ORBTAP_UNIVERSE_PERKS: Perk[] = [
  { id: 'pku1', partnerId: ORBTAP_UNIVERSE_PARTNER_ID, title: 'Demo Perk', description: 'Test redemption flow with OrbTap Universe. Redeem for demo OT Points.', cost: 50, tier: 'platinum', cooldown: '24h', stock: { remaining: 99 } },
  { id: 'pku2', partnerId: ORBTAP_UNIVERSE_PARTNER_ID, title: 'Admin Test Perk', description: 'Use this to test scan, wallet, and proof flows as a partner.', cost: 100, tier: 'platinum', cooldown: '12h', stock: { remaining: 99 } },
];

// Poconos / Tannersville PA — Crossings, waterparks, local spots
// Coordinates: Crossings ~41.044, -75.309; Great Wolf ~41.078, -75.32; Kalahari ~41.10, -75.36; Camelback ~41.052, -75.355

export const MOCK_PARTNERS: Partner[] = [
  // --- Requested real spots ---
  { id: 'p1', name: "Zack's Taco Shack", category: 'Dining', tier: 'platinum', location: { lat: 41.0450, lng: -75.3080, address: 'Rt 611, Tannersville' }, description: 'Fresh tacos and burritos.', hours: '11AM - 9PM', verified: true, termsShort: 'One free taco with drink.', about: "Family-run since 2018. We use local ingredients when we can and keep the vibe casual. Stop by for tacos, burritos, and our famous house salsa.", showOrbOpsButton: true, offersCatering: true },
  { id: 'p2', name: "Nick's Big Belly Deli", category: 'Dining', tier: 'platinum', location: { lat: 41.0465, lng: -75.3100, address: 'Main St, Tannersville' }, description: 'Sandwiches and deli classics.', hours: '7AM - 4PM', verified: true, termsShort: 'Free cookie with sandwich.', showOrbOpsButton: true, offersCatering: true },
  { id: 'p3', name: 'Pub 447', category: 'Nightlife', tier: 'gold', location: { lat: 41.0470, lng: -75.3075, address: '447 Rt 611, Tannersville' }, description: 'Local pub and grill.', hours: '4PM - 2AM', verified: true, termsShort: 'Buy one get one draft.', featuredImageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600', about: "Your neighborhood spot for craft drafts, burgers, and live music on weekends. We're dog-friendly on the patio." },
  { id: 'p4', name: 'Trackside Bar & Grill', category: 'Dining', tier: 'platinum', location: { lat: 41.0435, lng: -75.3110, address: 'Near Crossings, Tannersville' }, description: 'Burgers, wings, and railside vibes.', hours: '11AM - 11PM', verified: true, termsShort: '10% off check.' },
  { id: 'p5', name: "Homie's Tacos", category: 'Dining', tier: 'gold', location: { lat: 41.0480, lng: -75.3095, address: 'Tannersville' }, description: 'Street-style tacos and bowls.', hours: '12PM - 8PM', verified: true, termsShort: 'Free chips & salsa.' },
  { id: 'p6', name: 'Legacy Barbershop', category: 'Services', tier: 'gold', location: { lat: 41.0460, lng: -75.3085, address: 'Tannersville' }, description: 'Classic cuts and fades.', hours: '9AM - 6PM', verified: true, termsShort: 'First visit discount.' },
  { id: 'p7', name: "Brand's Barbershop", category: 'Services', tier: 'gold', location: { lat: 41.0455, lng: -75.3092, address: 'Tannersville' }, description: 'Precision cuts and styling.', hours: '8AM - 7PM', verified: true, termsShort: '$5 off first cut.' },

  // --- Waterparks & Crossings ---
  { id: 'p8', name: 'Great Wolf Lodge', category: 'Hospitality', tier: 'gold', location: { lat: 41.0780, lng: -75.3200, address: '1 Great Wolf Dr, Scotrun' }, description: 'Indoor waterpark and resort.', hours: '24/7', verified: true, termsShort: 'Arcade credits.' },
  { id: 'p9', name: 'Kalahari Resort', category: 'Hospitality', tier: 'gold', location: { lat: 41.1000, lng: -75.3600, address: '250 Kalahari Blvd, Pocono Manor' }, description: 'Indoor waterpark and spa.', hours: '24/7', verified: true, termsShort: 'Splash pass discount.' },
  { id: 'p10', name: 'Camelback Resort', category: 'Hospitality', tier: 'gold', location: { lat: 41.0520, lng: -75.3550, address: '301 Resort Dr, Tannersville' }, description: 'Ski, waterpark, and adventure.', hours: '8AM - 10PM', verified: true, termsShort: 'Aquatopia perk.' },
  { id: 'p11', name: 'The Crossings Premium Outlets', category: 'Retail', tier: 'platinum', location: { lat: 41.0440, lng: -75.3090, address: '1000 Premium Outlets Dr, Tannersville' }, description: 'Designer outlets and dining.', hours: '10AM - 9PM', verified: true, termsShort: 'Guest services reward.' },

  // --- More Poconos demos (fake names) ---
  { id: 'p12', name: 'Mountain Mug Coffee', category: 'Cafe', tier: 'silver', location: { lat: 41.0448, lng: -75.3082, address: 'Tannersville' }, description: 'Coffee and pastries.', hours: '6AM - 6PM', verified: true, termsShort: 'Free refill.' },
  { id: 'p13', name: 'Pocono Pizza Co', category: 'Dining', tier: 'silver', location: { lat: 41.0472, lng: -75.3105, address: 'Tannersville' }, description: 'Pizza and subs.', hours: '11AM - 10PM', verified: true, termsShort: 'Slice + drink deal.' },
  { id: 'p14', name: 'Slope Side Brewery', category: 'Nightlife', tier: 'gold', location: { lat: 41.0500, lng: -75.3540, address: 'Near Camelback' }, description: 'Craft beer and pub food.', hours: '12PM - 12AM', verified: true, termsShort: 'Flight discount.' },
  { id: 'p15', name: 'Trailhead Gear Shop', category: 'Retail', tier: 'gold', location: { lat: 41.0462, lng: -75.3078, address: 'Tannersville' }, description: 'Outdoor gear and rentals.', hours: '9AM - 7PM', verified: true, termsShort: '10% off rental.' },
  { id: 'p16', name: 'Pocono Creamery', category: 'Dining', tier: 'silver', location: { lat: 41.0452, lng: -75.3098, address: 'Tannersville' }, description: 'Ice cream and sweets.', hours: '12PM - 9PM', verified: true, termsShort: 'Free cone upgrade.' },
  { id: 'p17', name: 'Summit Spa', category: 'Services', tier: 'platinum', location: { lat: 41.0510, lng: -75.3530, address: 'Tannersville' }, description: 'Massage and wellness.', hours: '9AM - 8PM', verified: true, termsShort: 'Add-on discount.' },
  { id: 'p18', name: 'The Lodge Kitchen', category: 'Dining', tier: 'gold', location: { lat: 41.0775, lng: -75.3190, address: 'Scotrun' }, description: 'Comfort food and breakfast.', hours: '7AM - 10PM', verified: true, termsShort: 'Kids eat free day.' },
  { id: 'p19', name: 'Outlets Bistro', category: 'Dining', tier: 'silver', location: { lat: 41.0438, lng: -75.3092, address: 'Crossings, Tannersville' }, description: 'Quick bites at the outlets.', hours: '10AM - 8PM', verified: true, termsShort: 'Combo discount.' },
  { id: 'p20', name: 'Pocono Adventure Park', category: 'Entertainment', tier: 'platinum', location: { lat: 41.0530, lng: -75.3560, address: 'Tannersville' }, description: 'Ziplines and activities.', hours: '9AM - 5PM', verified: true, termsShort: 'Second activity half off.' },
  // More demo bars for partners list
  { id: 'p21', name: 'The Pour House', category: 'Nightlife', tier: 'gold', location: { lat: 41.0468, lng: -75.3080, address: 'Rt 611, Tannersville' }, description: 'Craft beer and live music.', hours: '3PM - 2AM', verified: true, termsShort: 'Happy hour 2-for-1.', featuredImageUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600' },
  { id: 'p22', name: 'Mountain Tap Room', category: 'Nightlife', tier: 'platinum', location: { lat: 41.0455, lng: -75.3105, address: 'Main St, Tannersville' }, description: 'Local taps and small plates.', hours: '12PM - 12AM', verified: true, termsShort: 'Free appetizer with two drinks.' },
  { id: 'p23', name: 'Crossings Bar & Lounge', category: 'Nightlife', tier: 'silver', location: { lat: 41.0442, lng: -75.3088, address: 'Crossings, Tannersville' }, description: 'Cocktails and light bites.', hours: '11AM - 10PM', verified: true, termsShort: '$5 off second round.' },
  { id: 'p24', name: 'Pocono Brew Co', category: 'Nightlife', tier: 'gold', location: { lat: 41.0485, lng: -75.3070, address: 'Tannersville' }, description: 'Brewery taproom and tours.', hours: '2PM - 10PM', verified: true, termsShort: 'Flight discount.' },
  { id: 'p25', name: 'Summit Bar', category: 'Nightlife', tier: 'gold', location: { lat: 41.0515, lng: -75.3090, address: 'Near Camelback, Tannersville' }, description: 'Rooftop bar with views.', hours: '4PM - 2AM', verified: true, termsShort: 'Complimentary appetizer.', featuredImageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600' },
];

/** Perks inherit partner tier (Silver/Gold/Platinum). p1–p4 platinum, p5–p11 gold/platinum, p12+ silver/gold/platinum. */
export const MOCK_PERKS: Perk[] = [
  { id: 'pk1', partnerId: 'p1', title: 'Free Taco', description: 'One free taco with any drink purchase.', cost: 150, tier: 'platinum', cooldown: '24h', stock: { remaining: 24 } },
  { id: 'pk2', partnerId: 'p1', title: 'Guac Upgrade', description: 'Free guac on any bowl or burrito.', cost: 75, tier: 'platinum', cooldown: '12h', stock: { remaining: 50 } },
  { id: 'pk3', partnerId: 'p1', title: 'Double Points Day', description: 'Earn 2x OT points on your order.', cost: 300, tier: 'platinum', cooldown: '7d', stock: { remaining: 12 } },
  { id: 'pk4', partnerId: 'p2', title: 'Free Cookie', description: 'Free cookie with any sandwich.', cost: 100, tier: 'platinum', cooldown: '24h', stock: { remaining: 30 } },
  { id: 'pk5', partnerId: 'p2', title: 'Breakfast Combo', description: 'Coffee + pastry for 50 pts off.', cost: 200, tier: 'platinum', cooldown: '24h', stock: { remaining: 15 } },
  { id: 'pk6', partnerId: 'p3', title: 'BOGO Draft', description: 'Buy one get one draft beer.', cost: 500, tier: 'gold', cooldown: '7d', stock: { remaining: 8 } },
  { id: 'pk7', partnerId: 'p3', title: 'Appetizer Half-Off', description: '50% off one appetizer.', cost: 250, tier: 'gold', cooldown: '24h', stock: { remaining: 20 } },
  { id: 'pk8', partnerId: 'p4', title: '10% Off Check', description: '10% off your total bill.', cost: 200, tier: 'platinum', cooldown: '24h', stock: { remaining: 40 } },
  { id: 'pk9', partnerId: 'p4', title: 'Free Wings', description: 'Free order of wings with two drinks.', cost: 400, tier: 'platinum', cooldown: '7d', stock: { remaining: 6 } },
  { id: 'pk10', partnerId: 'p5', title: 'Free Chips & Salsa', description: 'Complimentary chips and salsa.', cost: 80, tier: 'gold', cooldown: '12h', stock: { remaining: 45 } },
  { id: 'pk11', partnerId: 'p5', title: 'Taco Trio Deal', description: '3 tacos + drink at discount.', cost: 350, tier: 'gold', cooldown: '24h', stock: { remaining: 10 } },
  { id: 'pk12', partnerId: 'p6', title: 'First Visit Discount', description: '$5 off your first cut.', cost: 150, tier: 'gold', cooldown: 'once', stock: { remaining: 18 } },
  { id: 'pk13', partnerId: 'p6', title: 'Beard Trim Add-On', description: 'Free beard trim with haircut.', cost: 100, tier: 'gold', cooldown: '14d', stock: { remaining: 25 } },
  { id: 'pk14', partnerId: 'p7', title: '$5 Off First Cut', description: 'New customer discount.', cost: 120, tier: 'gold', cooldown: 'once', stock: { remaining: 14 } },
  { id: 'pk15', partnerId: 'p7', title: 'Styling Product Sample', description: 'Free sample with cut.', cost: 50, tier: 'gold', cooldown: '30d', stock: { remaining: 32 } },
  { id: 'pk16', partnerId: 'p8', title: 'Arcade Credits', description: '50 bonus arcade credits.', cost: 800, tier: 'gold', cooldown: '7d', stock: { remaining: 5 } },
  { id: 'pk17', partnerId: 'p8', title: 'Souvenir Discount', description: '20% off gift shop.', cost: 400, tier: 'gold', cooldown: '24h', stock: { remaining: 22 } },
  { id: 'pk18', partnerId: 'p9', title: 'Splash Pass Discount', description: '10% off waterpark pass.', cost: 1000, tier: 'gold', cooldown: '30d', stock: { remaining: 4 } },
  { id: 'pk19', partnerId: 'p9', title: 'Spa Credit', description: '$10 spa credit.', cost: 600, tier: 'gold', cooldown: '14d', stock: { remaining: 7 } },
  { id: 'pk20', partnerId: 'p10', title: 'Aquatopia Perk', description: 'Skip-the-line upgrade.', cost: 500, tier: 'gold', cooldown: '7d', stock: { remaining: 9 } },
  { id: 'pk21', partnerId: 'p10', title: 'Food Court Combo', description: 'Discounted meal combo.', cost: 250, tier: 'gold', cooldown: '24h', stock: { remaining: 28 } },
  { id: 'pk22', partnerId: 'p11', title: 'Guest Services Reward', description: 'Free gift wrap or info booklet.', cost: 100, tier: 'platinum', cooldown: '24h', stock: { remaining: 50 } },
  { id: 'pk23', partnerId: 'p11', title: 'Parking Validation', description: 'Validated parking for 2 hours.', cost: 200, tier: 'platinum', cooldown: '24h', stock: { remaining: 16 } },
  { id: 'pk24', partnerId: 'p12', title: 'Free Refill', description: 'Free coffee refill.', cost: 50, tier: 'silver', cooldown: '2h', stock: { remaining: 99 } },
  { id: 'pk25', partnerId: 'p13', title: 'Slice + Drink Deal', description: 'Slice and drink combo price.', cost: 180, tier: 'silver', cooldown: '24h', stock: { remaining: 12 } },
  { id: 'pk26', partnerId: 'p14', title: 'Flight Discount', description: '$2 off beer flight.', cost: 150, tier: 'gold', cooldown: '24h', stock: { remaining: 18 } },
  { id: 'pk27', partnerId: 'p15', title: '10% Off Rental', description: '10% off gear rental.', cost: 200, tier: 'gold', cooldown: '7d', stock: { remaining: 11 } },
  { id: 'pk28', partnerId: 'p16', title: 'Free Cone Upgrade', description: 'Upgrade to waffle cone free.', cost: 60, tier: 'silver', cooldown: '12h', stock: { remaining: 35 } },
  { id: 'pk29', partnerId: 'p17', title: 'Add-On Discount', description: '20% off one add-on service.', cost: 400, tier: 'platinum', cooldown: '30d', stock: { remaining: 3 } },
  { id: 'pk30', partnerId: 'p18', title: 'Kids Eat Free', description: 'One kids meal free with adult entree.', cost: 300, tier: 'gold', cooldown: '7d', stock: { remaining: 14 } },
  { id: 'pk31', partnerId: 'p19', title: 'Combo Discount', description: 'Combo meal at reduced price.', cost: 120, tier: 'silver', cooldown: '24h', stock: { remaining: 26 } },
  { id: 'pk32', partnerId: 'p20', title: 'Second Activity Half Off', description: 'Second activity 50% off.', cost: 600, tier: 'platinum', cooldown: '14d', stock: { remaining: 5 } },
  { id: 'pk33', partnerId: 'p21', title: 'Happy Hour 2-for-1', description: 'Two-for-one drafts during happy hour.', cost: 150, tier: 'gold', cooldown: '24h', stock: { remaining: 30 } },
  { id: 'pk34', partnerId: 'p22', title: 'Free Appetizer', description: 'Complimentary appetizer with two drinks.', cost: 250, tier: 'platinum', cooldown: '7d', stock: { remaining: 8 } },
  { id: 'pk35', partnerId: 'p23', title: '$5 Off Second Round', description: '$5 off your second round.', cost: 100, tier: 'silver', cooldown: '24h', stock: { remaining: 42 } },
  { id: 'pk36', partnerId: 'p24', title: 'Flight Discount', description: '$2 off a beer flight.', cost: 120, tier: 'gold', cooldown: '12h', stock: { remaining: 19 } },
  { id: 'pk37', partnerId: 'p25', title: 'Complimentary Appetizer', description: 'Free appetizer with purchase.', cost: 400, tier: 'gold', cooldown: '7d', stock: { remaining: 6 } },
];

/** Demo hours shown wherever hours are displayed for demo/mock partners. */
export const DEMO_HOURS = '9AM – 5PM';

/** Partner IDs from mock data — used to show "Demo hours" label where hours are displayed. */
export const MOCK_PARTNER_IDS = new Set(MOCK_PARTNERS.map((p) => p.id));

export function isDemoPartner(partner: { id: string } | null | undefined): boolean {
  return partner != null && MOCK_PARTNER_IDS.has(partner.id);
}

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

export function getPartnerById(id: string): Partner | undefined {
  return MOCK_PARTNERS.find((p) => p.id === id);
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

/** Multi-step mission templates — used with admin config partner IDs to build daily missions. */
export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: 't1',
    title: 'Local Triple Check-In',
    description: 'Check in at 3 partner spots. Your Spheres earn XP when you complete all steps.',
    mealSlot: 'lunch',
    steps: [
      { id: 's1', label: 'Check in at first partner', type: 'check_in', partnerId: 'p1' },
      { id: 's2', label: 'Check in at second partner', type: 'check_in', partnerId: 'p2' },
      { id: 's3', label: 'Check in at third partner', type: 'check_in', partnerId: 'p3' },
    ],
  },
  {
    id: 't2',
    title: 'Lunch Run',
    description: 'Two stops: grab lunch and a coffee or snack. Complete both to earn.',
    mealSlot: 'lunch',
    steps: [
      { id: 's1', label: 'Check in at dining partner', type: 'check_in', partnerId: 'p1' },
      { id: 's2', label: 'Check in at second spot', type: 'check_in', partnerId: 'p2' },
    ],
  },
  {
    id: 't3',
    title: 'Dinner Double',
    description: 'Hit two partners tonight. Your circles level up with you.',
    mealSlot: 'dinner',
    steps: [
      { id: 's1', label: 'Check in at first location', type: 'check_in', partnerId: 'p1' },
      { id: 's2', label: 'Check in at second location', type: 'check_in', partnerId: 'p2' },
    ],
  },
  {
    id: 't4',
    title: 'Explorer Circuit',
    description: 'Three check-ins across different partners. Big rewards for you and your Spheres.',
    mealSlot: 'dinner',
    steps: [
      { id: 's1', label: 'First stop', type: 'visit', partnerId: 'p1' },
      { id: 's2', label: 'Second stop', type: 'visit', partnerId: 'p2' },
      { id: 's3', label: 'Third stop', type: 'visit', partnerId: 'p3' },
    ],
  },
  {
    id: 't5',
    title: 'Quick Win',
    description: 'One check-in to get your daily mission started.',
    mealSlot: 'breakfast',
    steps: [
      { id: 's1', label: 'Check in at partner', type: 'check_in', partnerId: 'p1' },
    ],
  },
  {
    id: 't6',
    title: 'Lunch Stop',
    description: 'Check in when you grab lunch. Scan at purchase to complete.',
    mealSlot: 'lunch',
    steps: [
      { id: 's1', label: 'Check in at partner', type: 'check_in', partnerId: 'p1' },
    ],
  },
  {
    id: 't7',
    title: 'Dinner Stop',
    description: 'Check in when you order or pay. One stop, real visit.',
    mealSlot: 'dinner',
    steps: [
      { id: 's1', label: 'Check in at partner', type: 'check_in', partnerId: 'p1' },
    ],
  },
];

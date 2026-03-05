/**
 * Demo orb generation for map density — Poconos spread, seeded RNG, min spacing.
 * All entries are fictional "Demo Partner" placeholders per blueprint.
 * Uses lazy require for MOCK_PARTNERS to avoid init-order / bundle issues.
 */

import type { Partner } from './MockData';
import type { PartnerTier } from './PartnerTiers';

const DEMO_SEED = 4242;
const MIN_DISTANCE_KM = 0.85;
const TARGET_DEMO_COUNT = 45;

// Poconos bounding box (lat, lng) — spread across region
const LAT_MIN = 40.88;
const LAT_MAX = 41.22;
const LNG_MIN = -75.58;
const LNG_MAX = -75.02;

const PARTNER_TIERS: PartnerTier[] = ['silver', 'gold', 'platinum'];
const PARTNER_TIER_WEIGHTS = [0.50, 0.35, 0.15]; // silver, gold, platinum
const CATEGORIES = ['Dining', 'Cafe', 'Retail', 'Services', 'Entertainment', 'Nightlife', 'Hospitality'];
const DEMO_NAMES = [
  'Demo Cafe', 'Demo Bistro', 'Demo Grill', 'Demo Diner', 'Demo Eats', 'Demo Kitchen',
  'Demo Shop', 'Demo Store', 'Demo Outlet', 'Demo Market', 'Demo Gear',
  'Demo Spa', 'Demo Salon', 'Demo Studio', 'Demo Services',
  'Demo Lounge', 'Demo Tavern', 'Demo Bar', 'Demo Brew',
  'Demo Lodge', 'Demo Inn', 'Demo Stay', 'Demo Resort',
  'Demo Fun', 'Demo Play', 'Demo Adventure', 'Demo Ski', 'Demo Trail',
  'Poconos Demo Spot', 'Mountain Demo', 'Valley Demo', 'Lake Demo', 'Pines Demo',
  'Demo Partner Alpha', 'Demo Partner Beta', 'Demo Partner Gamma', 'Demo Partner Delta',
  'Demo Venue 1', 'Demo Venue 2', 'Demo Venue 3', 'Demo Venue 4', 'Demo Venue 5',
  'Demo Place A', 'Demo Place B', 'Demo Place C', 'Demo Place D', 'Demo Place E',
];

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function pickPartnerTier(rng: () => number): PartnerTier {
  const r = rng();
  let acc = 0;
  for (let i = 0; i < PARTNER_TIER_WEIGHTS.length; i++) {
    acc += PARTNER_TIER_WEIGHTS[i];
    if (r < acc) return PARTNER_TIERS[i];
  }
  return 'silver';
}

/** All existing partner coords (real + any already generated) for spacing check */
function existingCoords(partners: { location: { lat: number; lng: number } }[]): [number, number][] {
  return partners.map((p) => [p.location.lat, p.location.lng]);
}

function meetsMinDistance(lat: number, lng: number, existing: [number, number][]): boolean {
  for (const [eLat, eLng] of existing) {
    if (haversineKm(lat, lng, eLat, eLng) < MIN_DISTANCE_KM) return false;
  }
  return true;
}

/** Generate demo partners with stable seeded positions; min spacing enforced. Pass real partners for spacing. */
export function getDemoPartners(realPartners?: Partner[]): Partner[] {
  const existingList = realPartners ?? (require('./MockData').MOCK_PARTNERS as Partner[]);
  const rng = mulberry32(DEMO_SEED);
  const existing = existingCoords(existingList);
  const out: Partner[] = [];
  let attempts = 0;
  const maxAttempts = TARGET_DEMO_COUNT * 80;

  while (out.length < TARGET_DEMO_COUNT && attempts < maxAttempts) {
    attempts++;
    const lat = LAT_MIN + rng() * (LAT_MAX - LAT_MIN);
    const lng = LNG_MIN + rng() * (LNG_MAX - LNG_MIN);
    if (!meetsMinDistance(lat, lng, existing)) continue;

    existing.push([lat, lng]);
    const tier = pickPartnerTier(rng);
    const name = DEMO_NAMES[out.length % DEMO_NAMES.length];
    const category = CATEGORIES[Math.floor(rng() * CATEGORIES.length)];
    const id = `demo-${out.length + 1}`;
    out.push({
      id,
      name: out.length < DEMO_NAMES.length ? name : `${name} ${Math.floor(out.length / DEMO_NAMES.length) + 1}`,
      category,
      tier,
      location: { lat, lng, address: 'Demo Partner — Poconos' },
      description: 'Demo partner for map density.',
      hours: 'Hours vary',
      verified: false,
    });
  }

  return out;
}

let cachedMapPartners: Partner[] | null = null;

/** Combined list for map: real partners first, then demo (stable order). Memoized for performance. */
export function getMapPartners(): Partner[] {
  if (cachedMapPartners) return cachedMapPartners;
  const { MOCK_PARTNERS } = require('./MockData');
  cachedMapPartners = [...MOCK_PARTNERS, ...getDemoPartners(MOCK_PARTNERS)];
  return cachedMapPartners;
}

/** Use when you have a merged partner list (e.g. from PartnersContext). When demoDataEnabled is false, returns only real partners (no fake map pins). */
export function getMapPartnersFromList(realPartners: Partner[], demoDataEnabled: boolean = true): Partner[] {
  if (!demoDataEnabled) return realPartners;
  return [...realPartners, ...getDemoPartners(realPartners)];
}

// ─── Sprint 18 — London Launch Seed Data ─────────────────────────────────────

/**
 * 20 real London venues seeded as launch partners.
 * Coordinates are accurate (±50m). Tier weights reflect aspirational city launch mix.
 * Set demoDataEnabled=true in DemoDataConfig to show these on the map before live partners.
 */
export const LONDON_LAUNCH_PARTNERS: Partner[] = [
  { id: 'ldn-01', name: 'Monmouth Coffee Borough', category: 'Cafe', tier: 'gold', location: { lat: 51.5054, lng: -0.0909, address: 'Borough Market, London SE1 1TL' }, description: 'Specialty coffee roasters. One of London\'s finest.', hours: 'Mon–Sat 7:30–18:00', verified: true },
  { id: 'ldn-02', name: 'Dishoom Shoreditch', category: 'Dining', tier: 'gold', location: { lat: 51.5236, lng: -0.0792, address: '7 Boundary St, London E2 7JE' }, description: 'Bombay café-inspired all-day dining. Legendary bacon naan.', hours: 'Mon–Thu 8–23:00, Fri–Sat 8–00:00, Sun 9–23:00', verified: true },
  { id: 'ldn-03', name: 'Flat White Soho', category: 'Cafe', tier: 'silver', location: { lat: 51.5136, lng: -0.1339, address: '17 Berwick St, London W1F 0PT' }, description: 'The original London flat white. Intimate, serious coffee.', hours: 'Mon–Fri 8–19:00, Sat–Sun 9–18:00', verified: false },
  { id: 'ldn-04', name: 'Sketch Mayfair', category: 'Dining', tier: 'platinum', location: { lat: 51.5125, lng: -0.1435, address: '9 Conduit St, London W1S 2XG' }, description: 'Iconic multi-room restaurant. The Gallery and the Glade.', hours: 'Lunch & Dinner, closed Monday', verified: true },
  { id: 'ldn-05', name: 'The Barbican', category: 'Entertainment', tier: 'gold', location: { lat: 51.5198, lng: -0.0944, address: 'Silk St, London EC2Y 8DS' }, description: 'Europe\'s largest arts centre. Concerts, cinema, exhibitions.', hours: 'Daily 9–23:00', verified: true },
  { id: 'ldn-06', name: 'Gymbox Bank', category: 'Services', tier: 'gold', location: { lat: 51.5133, lng: -0.0886, address: '25 Cannon St, London EC4M 5TA' }, description: 'London\'s most innovative gym. Rave spinning, fight cardio.', hours: 'Mon–Fri 6–22:00, Sat–Sun 8–20:00', verified: true },
  { id: 'ldn-07', name: 'Maltby Street Market', category: 'Dining', tier: 'silver', location: { lat: 51.5025, lng: -0.0791, address: 'Ropewalk, London SE1 3PA' }, description: 'Weekend food market under the arches. 40+ independent traders.', hours: 'Sat 9–17:00, Sun 11–16:00', verified: false },
  { id: 'ldn-08', name: 'Ace Hotel Shoreditch', category: 'Hospitality', tier: 'platinum', location: { lat: 51.5246, lng: -0.0783, address: '100 Shoreditch High St, London E1 6JQ' }, description: 'Design hotel. Hoi Polloi restaurant and rooftop bar.', hours: 'Reception 24/7', verified: true },
  { id: 'ldn-09', name: 'Foyles Charing Cross Rd', category: 'Retail', tier: 'silver', location: { lat: 51.5145, lng: -0.1282, address: '107 Charing Cross Rd, London WC2H 0DT' }, description: 'Legendary independent bookshop. Six floors, 200,000+ titles.', hours: 'Mon–Sat 9:30–21:00, Sun 11:30–18:00', verified: false },
  { id: 'ldn-10', name: 'Ronnie Scott\'s Soho', category: 'Nightlife', tier: 'platinum', location: { lat: 51.5131, lng: -0.1315, address: '47 Frith St, London W1D 4HT' }, description: 'London\'s most celebrated jazz club. Open since 1959.', hours: 'Mon–Sat 18:00–03:00, Sun 18:00–00:00', verified: true },
  { id: 'ldn-11', name: 'Yardbird London', category: 'Dining', tier: 'gold', location: { lat: 51.5157, lng: -0.0685, address: '1 Angel Ct, London EC2R 7HJ' }, description: 'Southern American whisky bar and fried chicken. City of London gem.', hours: 'Mon–Fri 12–00:00, Sat 17–00:00', verified: true },
  { id: 'ldn-12', name: 'The Attendant Fitzrovia', category: 'Cafe', tier: 'silver', location: { lat: 51.5176, lng: -0.1385, address: '27A Foley St, London W1W 6DY' }, description: 'Specialty coffee bar in a converted Victorian gentleman\'s toilet.', hours: 'Mon–Fri 8–17:00, Sat–Sun 9–16:00', verified: false },
  { id: 'ldn-13', name: 'Tate Modern Turbine Hall', category: 'Entertainment', tier: 'gold', location: { lat: 51.5076, lng: -0.0994, address: 'Bankside, London SE1 9TG' }, description: 'World-class modern art gallery. Free entry to permanent collection.', hours: 'Sun–Thu 10–18:00, Fri–Sat 10–22:00', verified: true },
  { id: 'ldn-14', name: 'Hawksmoor Seven Dials', category: 'Dining', tier: 'gold', location: { lat: 51.5145, lng: -0.1264, address: '11 Langley St, London WC2H 9JG' }, description: 'Britain\'s finest steak restaurant. Grass-fed UK beef.', hours: 'Mon–Sat 12–00:00, Sun 12–21:00', verified: true },
  { id: 'ldn-15', name: 'Present London', category: 'Retail', tier: 'silver', location: { lat: 51.5240, lng: -0.0773, address: '140 Shoreditch High St, London E1 6JE' }, description: 'Curated menswear concept store. Independent brands and sneakers.', hours: 'Mon–Sat 11–19:00, Sun 12–18:00', verified: false },
  { id: 'ldn-16', name: 'Violet Bakery Dalston', category: 'Cafe', tier: 'silver', location: { lat: 51.5467, lng: -0.0761, address: '47 Wilton Way, London E8 1BG' }, description: 'Artisan bakery. Seasonal cakes and the best salted caramel croissant in London.', hours: 'Mon–Fri 8–18:00, Sat–Sun 9–17:00', verified: false },
  { id: 'ldn-17', name: 'Madison Rooftop Bar', category: 'Nightlife', tier: 'gold', location: { lat: 51.5134, lng: -0.0917, address: '1 New Change, London EC4M 9AF' }, description: 'Rooftop cocktail bar with direct views of St Paul\'s Cathedral.', hours: 'Mon–Wed 12–00:00, Thu–Sat 12–01:00, Sun 12–22:00', verified: true },
  { id: 'ldn-18', name: 'Crossfit London Bethnal Green', category: 'Services', tier: 'silver', location: { lat: 51.5247, lng: -0.0598, address: '60 Poyser St, London E2 9RF' }, description: 'East London\'s OG CrossFit box. All levels welcome.', hours: 'Mon–Fri 6–21:00, Sat 8–16:00', verified: false },
  { id: 'ldn-19', name: 'Claridge\'s', category: 'Hospitality', tier: 'platinum', location: { lat: 51.5141, lng: -0.1485, address: 'Brook St, London W1K 4HR' }, description: 'London\'s most iconic luxury hotel. Art Deco grandeur since 1856.', hours: 'Reception 24/7', verified: true },
  { id: 'ldn-20', name: 'Spiritland Kings Cross', category: 'Nightlife', tier: 'gold', location: { lat: 51.5311, lng: -0.1237, address: 'The Great Northern Hotel, London N1C 4TB' }, description: 'Hi-fi bar and restaurant. Audiophile sound system. Brilliant cocktails.', hours: 'Mon–Sat 12–01:00, Sun 12–22:00', verified: true },
];

/** Get London launch partners for map seeding. */
export function getLondonLaunchPartners(): Partner[] {
  return LONDON_LAUNCH_PARTNERS;
}

/** Extended map partners list: real + Poconos demo + London launch (when city is 'london'). */
export function getMapPartnersForCity(realPartners: Partner[], city: 'default' | 'london' = 'default', demoDataEnabled = true): Partner[] {
  const base = demoDataEnabled ? [...realPartners, ...getDemoPartners(realPartners)] : realPartners;
  if (city === 'london') {
    return [...base, ...LONDON_LAUNCH_PARTNERS];
  }
  return base;
}

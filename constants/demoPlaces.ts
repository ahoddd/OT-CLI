/**
 * Demo places for OrbMap — source of truth for geocode query hints.
 * All business names from repo MOCK_PARTNERS; required 4 have explicit query hints.
 */

import type { PartnerTier } from './PartnerTiers';
import { MOCK_PARTNERS } from './MockData';

export interface DemoPlace {
  id: string;
  displayName: string;
  queryHint: string;
  tier: PartnerTier;
  categories: string[];
  partnerId: string;
}

/** Override query hints for required demo venues (exact geocode strings). */
const REQUIRED_QUERY_HINTS: Record<string, string> = {
  p11: 'The Crossings Premium Outlets, Tannersville PA',
  p9: 'Kalahari Resorts & Conventions, Pocono Mountains PA',
  p8: 'Great Wolf Lodge, Pocono Mountains Scotrun PA',
  p10: 'Aquatopia Indoor Waterpark Camelback Resort, Tannersville PA',
};

/** Demo places derived from MOCK_PARTNERS — one per partner, with geocode hint. */
export function getDemoPlaces(): DemoPlace[] {
  return MOCK_PARTNERS.map((p) => ({
    id: p.id,
    displayName: p.name,
    queryHint: REQUIRED_QUERY_HINTS[p.id] ?? `${p.name}, ${p.location?.address ?? 'Tannersville PA'}`,
    tier: p.tier,
    categories: [p.category],
    partnerId: p.id,
  }));
}

export const DEMO_PLACES = getDemoPlaces();

// ─── Sprint 18 — London Launch Places ────────────────────────────────────────

import { LONDON_LAUNCH_PARTNERS } from './demoOrbs';

/** London launch demo places — maps directly from LONDON_LAUNCH_PARTNERS for geocode queries. */
export function getLondonDemoPlaces(): DemoPlace[] {
  return LONDON_LAUNCH_PARTNERS.map((p) => ({
    id: p.id,
    displayName: p.name,
    queryHint: `${p.name}, ${p.location?.address ?? 'London, UK'}`,
    tier: p.tier,
    categories: [p.category],
    partnerId: p.id,
  }));
}

export const LONDON_DEMO_PLACES = getLondonDemoPlaces();

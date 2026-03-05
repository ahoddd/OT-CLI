/**
 * Discoverable spheres for partner invite flow.
 * Partners see nearby spheres within a chosen range (mi/km).
 * In production this would come from API; here we use demo + circles with optional coordinates.
 */

export interface DiscoverableSphere {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
  /** Optional: for distance filter. If missing, sphere is included in "all" range. */
  lat?: number;
  lng?: number;
}

/** Demo spheres with coordinates (Poconos / Tannersville area — same as MOCK_PARTNERS). */
export const DEMO_NEARBY_SPHERES: DiscoverableSphere[] = [
  { id: 'demo-1', name: 'Neon Raiders', inviteCode: 'NEON-R1', memberCount: 5, lat: 41.045, lng: -75.309 },
  { id: 'demo-2', name: 'Power Couple', inviteCode: 'PWR-001', memberCount: 2, lat: 41.046, lng: -75.308 },
  { id: 'demo-3', name: 'Gym Squad', inviteCode: 'GYM-002', memberCount: 3, lat: 41.047, lng: -75.310 },
  { id: 'demo-4', name: 'Weekend Crew', inviteCode: 'WKD-003', memberCount: 4, lat: 41.044, lng: -75.311 },
  { id: 'demo-5', name: 'Foodie Squad', inviteCode: 'FDS-004', memberCount: 6, lat: 41.048, lng: -75.307 },
  { id: 'demo-6', name: 'Poconos Explorers', inviteCode: 'PEX-005', memberCount: 8, lat: 41.052, lng: -75.315 },
  { id: 'demo-7', name: 'Ski Lodge Gang', inviteCode: 'SLG-006', memberCount: 4, lat: 41.055, lng: -75.355 },
  { id: 'demo-8', name: 'Outlets Shoppers', inviteCode: 'OSH-007', memberCount: 3, lat: 41.044, lng: -75.309 },
];

/** Earth radius in miles for haversine. */
const R_MI = 3959;
const MI_TO_KM = 1.60934;

export function distanceMi(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_MI * c;
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return distanceMi(lat1, lng1, lat2, lng2) * MI_TO_KM;
}

export type DistanceUnit = 'mi' | 'km';

/** Range options: value in miles (converted to km when unit is km for display). */
export const RANGE_OPTIONS_MI = [5, 10, 25, 50] as const;

export function getRangeLabel(valueMi: number, unit: DistanceUnit): string {
  if (unit === 'km') return `${Math.round(valueMi * MI_TO_KM)} km`;
  return `${valueMi} mi`;
}

/**
 * Location helpers: distance (haversine) and display formatting.
 * Used for showing distance from user to partners on map, lists, and sheets.
 */

/** Earth radius in miles (haversine). */
const R_MI = 3959;

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
  return distanceMi(lat1, lng1, lat2, lng2) * 1.60934;
}

/** Format distance for UI: "0.2 mi", "1.5 mi", "12 mi". Uses miles. */
export function formatDistanceMi(mi: number): string {
  if (mi < 0.05) return 'Nearby';
  if (mi < 0.1) return '0.1 mi';
  if (mi < 1) return `${mi.toFixed(1)} mi`;
  if (mi < 10) return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}

/** Format distance for UI in km when preferred. */
export function formatDistanceKm(km: number): string {
  if (km < 0.1) return 'Nearby';
  if (km < 1) return `${km.toFixed(1)} km`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export interface PartnerLocation {
  lat: number;
  lng: number;
  address?: string;
}

/** Distance from user coords to a partner's location in miles. */
export function distanceToPartner(
  userLat: number,
  userLng: number,
  partner: { location?: PartnerLocation | null }
): number | null {
  const loc = partner.location;
  if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return null;
  return distanceMi(userLat, userLng, loc.lat, loc.lng);
}

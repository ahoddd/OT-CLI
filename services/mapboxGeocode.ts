/**
 * Mapbox Geocoding API — forward geocode with Poconos proximity and confidence rules.
 * Cache results locally; flag failures for admin "needs_review".
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { POCONOS_DEFAULT_CENTER, POCONOS_BOUND_RADIUS_MI } from '../constants/MapConstants';

const GEOCODE_CACHE_KEY = 'ORBTAP_GEOCODE_CACHE_V1';
const GEOCODE_NEEDS_REVIEW_KEY = 'ORBTAP_GEOCODE_NEEDS_REVIEW_V1';
const RELEVANCE_THRESHOLD = 0.4;
const GEOCODE_VERSION = 'v1';

function haversineMi(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  resultId: string;
  timestamp: number;
}

export interface GeocodeNeedsReview {
  placeId: string;
  queryHint: string;
  candidates: Array<{ place_name: string; center: [number, number]; relevance: number }>;
  timestamp: number;
}

interface MapboxFeature {
  id: string;
  place_type: string[];
  relevance: number;
  place_name: string;
  center: [number, number];
  geometry?: { coordinates: [number, number] };
}

interface MapboxResponse {
  features?: MapboxFeature[];
}

export async function geocodeDemoPlace(
  placeId: string,
  queryHint: string
): Promise<{ ok: true; data: GeocodeResult } | { ok: false; needsReview: GeocodeNeedsReview }> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token) return { ok: false, needsReview: { placeId, queryHint, candidates: [], timestamp: Date.now() } };

  const proximity = `${POCONOS_DEFAULT_CENTER[0]},${POCONOS_DEFAULT_CENTER[1]}`;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(queryHint)}.json?access_token=${token}&proximity=${proximity}&limit=5&types=address,place,locality,neighborhood`;

  try {
    const res = await fetch(url);
    const data = (await res.json()) as MapboxResponse;
    const features = data?.features ?? [];
    const poconosLat = POCONOS_DEFAULT_CENTER[1];
    const poconosLng = POCONOS_DEFAULT_CENTER[0];

    for (const f of features) {
      const coord = f.geometry?.coordinates ?? f.center;
      if (!coord || coord.length < 2) continue;
      const [lng, lat] = coord;
      const relevance = typeof f.relevance === 'number' ? f.relevance : 0.5;
      const distMi = haversineMi(poconosLat, poconosLng, lat, lng);
      const validType = f.place_type?.some((t) => ['address', 'place', 'locality', 'neighborhood'].includes(t)) ?? true;
      if (relevance >= RELEVANCE_THRESHOLD && distMi <= POCONOS_BOUND_RADIUS_MI && validType) {
        const result: GeocodeResult = {
          lat,
          lng,
          formattedAddress: f.place_name ?? `${lat}, ${lng}`,
          resultId: f.id,
          timestamp: Date.now(),
        };
        return { ok: true, data: result };
      }
    }

    const candidates = features.slice(0, 3).map((f) => {
      const c = f.geometry?.coordinates ?? f.center;
      return {
        place_name: f.place_name ?? '',
        center: c ?? [0, 0],
        relevance: typeof f.relevance === 'number' ? f.relevance : 0,
      };
    });
    return {
      ok: false,
      needsReview: { placeId, queryHint, candidates, timestamp: Date.now() },
    };
  } catch {
    return { ok: false, needsReview: { placeId, queryHint, candidates: [], timestamp: Date.now() } };
  }
}

export async function getCachedGeocode(placeId: string, queryHint: string): Promise<GeocodeResult | null> {
  try {
    const raw = await AsyncStorage.getItem(GEOCODE_CACHE_KEY);
    const cache = raw ? (JSON.parse(raw) as Record<string, GeocodeResult>) : {};
    const key = `${placeId}_${GEOCODE_VERSION}`;
    const entry = cache[key];
    if (entry && entry.lat != null && entry.lng != null) return entry;
  } catch {}
  return null;
}

export async function setCachedGeocode(placeId: string, data: GeocodeResult): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(GEOCODE_CACHE_KEY);
    const cache = raw ? (JSON.parse(raw) as Record<string, GeocodeResult>) : {};
    cache[`${placeId}_${GEOCODE_VERSION}`] = data;
    await AsyncStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

export async function addNeedsReview(entry: GeocodeNeedsReview): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(GEOCODE_NEEDS_REVIEW_KEY);
    const list: GeocodeNeedsReview[] = raw ? JSON.parse(raw) : [];
    const without = list.filter((e) => e.placeId !== entry.placeId);
    without.unshift(entry);
    await AsyncStorage.setItem(GEOCODE_NEEDS_REVIEW_KEY, JSON.stringify(without.slice(0, 50)));
  } catch {}
}

export async function getNeedsReviewList(): Promise<GeocodeNeedsReview[]> {
  try {
    const raw = await AsyncStorage.getItem(GEOCODE_NEEDS_REVIEW_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Forward geocode an address string (e.g. "100 Main St, Tannersville") for admin add-partner. */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token || !address.trim()) return null;
  const proximity = `${POCONOS_DEFAULT_CENTER[0]},${POCONOS_DEFAULT_CENTER[1]}`;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address.trim())}.json?access_token=${token}&proximity=${proximity}&limit=3&types=address,place,locality,poi`;

  try {
    const res = await fetch(url);
    const data = (await res.json()) as MapboxResponse;
    const features = data?.features ?? [];
    const f = features[0];
    if (!f) return null;
    const coord = f.geometry?.coordinates ?? f.center;
    if (!coord || coord.length < 2) return null;
    const [lng, lat] = coord;
    return {
      lat,
      lng,
      formattedAddress: (f.place_name as string) ?? `${lat}, ${lng}`,
    };
  } catch {
    return null;
  }
}

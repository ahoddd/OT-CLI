# OrbMap — Phase 0 Architecture & Implementation Summary

## Blueprint

- **Read:** `OrbTap_Master_Blueprint.md` (root). Constraints: allowed paths `app/`, `app/(tabs)/`, `app/admin/`, `components/`, `constants/`, `assets/`, `docs/BUILD/`; no new top-level folders; tier colors and OrbSheet pattern reused.

## Map implementation (current)

| Item | Path / detail |
|------|----------------|
| Map screen | `app/(tabs)/index.tsx` — MapScreenEntry; map vs grid toggle; LazyOrbTapMap |
| Map component | `components/OrbTapMap.tsx` — Mapbox MapView, Camera, PointAnnotation, LocationPuck |
| Mapbox lib | `@rnmapbox/maps` (package.json); setAccessToken(EXPO_PUBLIC_MAPBOX_TOKEN) |
| Demo pins | `constants/MockData.ts` — **MOCK_PARTNERS** (source of business names + coords) |
| Tier colors | `constants/MockData.ts` — **TIER_COLORS** (common, rare, legendary, apex) |
| Bottom sheet | `components/OrbSheet.tsx` — BottomSheet (gorhom), partner detail, Directions / View profile |
| Map fallback | `components/MapErrorBoundary.tsx` — when map native module fails, show grid |
| Style | EXPO_PUBLIC_MAPBOX_STYLE_URL or Mapbox.StyleURL.Dark/Light; Atmosphere dark |

## Demo business list (source of truth)

- **File:** `constants/MockData.ts`
- **Export:** `MOCK_PARTNERS` — array of Partner with id, name, category, tier, location { lat, lng, address }.
- Required venues already present: The Crossings Premium Outlets (p11), Great Wolf Lodge (p8), Kalahari Resort (p9), Camelback Resort (p10). Aquatopia is at Camelback; geocode hint for it in `constants/demoPlaces.ts`.

## Phase 1 — Poconos default + camera persist

- **Default center:** `constants/MapConstants.ts` — POCONOS_DEFAULT_CENTER = [-75.309, 41.044], POCONOS_DEFAULT_ZOOM = 14.
- **Persist:** On load, read `ORBTAP_MAP_CAMERA_V1` from AsyncStorage; if valid, use as initial center/zoom. On **onMapIdle**, save `{ center, zoom, timestamp }`.
- **Behavior:** Camera uses `followUserLocation={false}` so first open shows Poconos; user can pan/zoom and state is restored on next launch.

## Phase 2 — Geocoding + cache + needs_review

- **Demo places:** `constants/demoPlaces.ts` — getDemoPlaces() from MOCK_PARTNERS; required 4 have explicit query hints (Crossings, Kalahari, Great Wolf, Aquatopia/Camelback).
- **Geocode:** `services/mapboxGeocode.ts` — Mapbox Geocoding v5, forward geocode with `proximity` = Poconos center; limit 5, types address,place,locality,neighborhood.
- **Confidence:** Accept result if relevance ≥ 0.4, distance from Poconos ≤ 60 mi, and place_type in allowed set. Otherwise mark **needs_review**.
- **Cache:** AsyncStorage key `ORBTAP_GEOCODE_CACHE_V1`; key per place = `placeId_geocodeVersion`; value = { lat, lng, formattedAddress, resultId, timestamp }.
- **Needs review:** Failed geocodes stored in `ORBTAP_GEOCODE_NEEDS_REVIEW_V1`; admin section "Map — Demo orbs needs review" shows placeId, queryHint, top 3 candidates (place_name, relevance). Pins currently still use MOCK_PARTNERS coordinates (already correct for Poconos); geocode cache is for verification/future use.

## Phase 3 — WeatherMode

- **Source:** Open-Meteo API (`hooks/useMapWeather.ts`) — lat/lng from map center; current weather_code, temperature_2m, wind_speed_10m.
- **Enum:** `constants/WeatherMode.ts` — CLEAR | CLOUDY | RAIN | SNOW | FOG | WINDY; weatherCodeToMode() maps WMO codes.
- **Refresh:** On map open and debounced when center moves > ~5 km or last fetch > 12 min. Optional admin override to force WeatherMode for testing (not wired in UI yet).
- **Binding:** No snow/rain overlay exists in current code; when added, drive overlay only when effectiveMode === 'SNOW' (or RAIN).

## Phase 4 — Floating map controls

- **Location:** `components/OrbTapMap.tsx` — 3 buttons in a column, position absolute, right 16, bottom 24.
- **Actions:** Zoom In / Zoom Out (Camera ref setCamera with zoomLevel ±1); Locate Me (get current position, flyTo + zoom 15). When location denied, show non-blocking toast "Location denied" for 3 s.
- **Flag:** Shown only when `flags.isMapControlsEnabled` (default true).

## Feature flags (map)

- In `constants/Flags.ts`: isMapDemoOrbsEnabled, isMapGeocodeCacheEnabled, isMapWeatherModeEnabled, isMapControlsEnabled, isMapFiltersEnabled, isMapHappeningNowEnabled — all **true** by default.
- Admin Hub: BOOLEAN_KEYS includes these; when OFF, corresponding UI is hidden (e.g. controls hidden when isMapControlsEnabled false).

## Files changed/added

- `constants/MapConstants.ts` — Poconos default, zoom, storage key, bound radius.
- `constants/Flags.ts` — map flags.
- `constants/demoPlaces.ts` — demo places from MOCK_PARTNERS + required query hints.
- `constants/WeatherMode.ts` — WeatherMode type and code mapping.
- `services/mapboxGeocode.ts` — geocode, cache, needs_review.
- `hooks/useMapWeather.ts` — Open-Meteo, debounce, effectiveMode.
- `components/OrbTapMap.tsx` — Poconos default, camera persist, onMapIdle, 3 floating controls, locate toast.
- `app/admin/index.tsx` — map flags in BOOLEAN_KEYS; "Map — Demo orbs needs review" section.
- `docs/BUILD/MAP_PHASE0_ARCHITECTURE.md` — this file.

## Manual test checklist (map)

1. **Default + persist:** First launch: map opens centered on Poconos (Tannersville area), zoom ~14. Pan/zoom, leave app, reopen: map restores last center/zoom.
2. **Demo orbs:** Crossings, Great Wolf, Kalahari, Camelback (and other MOCK_PARTNERS) appear as tier-colored pins; tap opens OrbSheet with name, tier, address.
3. **Floating controls:** Zoom In / Zoom Out change zoom; Locate Me requests permission, then flies to user location (or shows "Location denied" toast if denied).
4. **Geocode (optional):** Run geocode for a demo place (e.g. from a dev button or admin); if result fails confidence, entry appears in Admin → "Map — Demo orbs needs review" with top 3 candidates.
5. **Flags:** In Admin, turn OFF isMapControlsEnabled: floating buttons disappear. Turn ON again: buttons reappear.
6. **Build:** `npx tsc --noEmit` and app run with no new TypeScript errors.

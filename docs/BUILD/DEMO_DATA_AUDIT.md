# Demo / Mock Data Audit

Single source of truth: **Demo data toggle** in Admin Hub and `useDemoDataEnabled()` (AsyncStorage key `ORBTAP_DEMO_DATA_ENABLED_V1`). When **off**, the app shows only real Firestore/API data; when **on**, mock/demo data is merged where applicable.

## Hooks and screens that respect demo flag

| Surface | Mock source | When demo OFF | When demo ON |
|--------|-------------|----------------|--------------|
| **Partners / Perks** | `MOCK_PARTNERS`, `MOCK_PERKS` | Firestore only (empty state if none) | Firestore + mock merged |
| **Drops** | `MOCK_DROPS` | Firestore DROP posts only | Firestore + MOCK_DROPS |
| **Polls** | `MOCK_POLLS` | Firestore only (empty if none); also requires "Show demo polls" admin toggle | Firestore or MOCK_POLLS if Firestore empty |
| **Orb Feed** | `MOCK_ORB_POSTS` | Firestore posts only | Firestore or MOCK_ORB_POSTS if empty |
| **Featured (Orb hub)** | `MOCK_PARTNERS` (DEMO_FEATURED_IDS) | Config + wildcard only; no demo slides | Config + demo partner slides when no config |
| **Meal Proposals** | `MOCK_MEAL_PROPOSALS` | Stored (AsyncStorage) only | Stored + MOCK_MEAL_PROPOSALS |
| **Orb Signal** | `MOCK_ORB_SIGNAL_MARKETS` | Firestore markets or empty | Firestore or MOCK when Firestore empty/disabled |
| **Map pins** | `getMapPartnersFromList(partners, demoDataEnabled)` | Real partners only | Real + demo orb pins |

## Other mock usage (not gated by single toggle)

- **useShowDemoPolls**: Separate admin toggle for polls only; combined with demo data toggle in `usePolls` so both must be on for mock polls.
- **useReviews**: Uses `MOCK_REVIEWS` (no demo flag yet; consider gating if needed).
- **useSignal**: Returns `markets: MOCK_ORB_SIGNAL_MARKETS` for getMarket; OrbSignal screen uses its own `markets` state (Firestore or demo per flag).
- **demoOrbs / demoPlaces**: Used for map density; gated by `demoDataEnabled` in `getMapPartnersFromList`.

## Empty states

When demo is off and no real data exists, screens show:

- **Discovery (map/grid)**: Empty partner list; map with no pins or fallback copy.
- **Drops**: Empty list.
- **Polls**: Empty list.
- **Orb Signal**: "No active markets" empty state with CTAs.
- **Feed**: Empty feed.
- **Featured carousel**: Only OrbTap Universe + config slots if any; no demo slides.

Last updated: OrbTap 2026 Full Optimization (Phase 2).

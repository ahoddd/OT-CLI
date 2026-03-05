# QA: OrbSignal, Map, and Balance Flows

## Fixes applied

### 1. OrbSignal / balance (subtract on vote)
- **Issue:** Voting Yes/No on OrbSignal was **adding** OT points instead of subtracting.
- **Cause:** `GameContext.purchaseUpgrade` passed `amount: -cost` to `addTransaction({ type: 'spend', ... })`. `WalletContext.addTransaction` applies `delta = -amount` for spends, so `-(-cost)` increased balance.
- **Fix:** Use positive `amount: cost` for spend in `purchaseUpgrade` and `unlockSkin` in `context/GameContext.tsx`. OrbSignal votes now call `purchaseUpgrade(VOTE_COST, 0, 'Orb Signal Vote')` and balance correctly decreases.

### 2. Other spend call sites
- **WalletActions:** Transfer and Sphere contribution used `amount: -totalCost` / `amount: -splitAmountNum`. Updated to positive amounts so balance decreases correctly.

### 3. Map failsafe
- **OrbTapMapFallback** (`components/OrbTapMapFallback.tsx`): Uses `react-native-maps` (Apple/Google Maps) with same behavior as Mapbox: partner markers, zoom in/out, locate me, camera persistence, mission orbs.
- **Wiring:** When Mapbox is unavailable (no token, Expo Go, or Mapbox throws), the app shows the fallback map instead of a text placeholder. `MapErrorBoundary` fallback is the fallback map; on web, placeholder text is still shown.

## QA checklist (manual)

### OrbSignal
- [ ] Open Orb Signal list; balance displays.
- [ ] Tap a market, choose Yes or No, confirm; balance **decreases** by vote cost.
- [ ] Vote again on same/different market when balance allows; balance decreases again.
- [ ] When balance &lt; vote cost, confirm is disabled or fails without changing balance.

### Wallet / balance
- [ ] Map tab: tap orb → balance **increases** (tap reward).
- [ ] Upgrades: purchase upgrade → balance **decreases**.
- [ ] Wallet transfer: send points → balance **decreases** by transfer + fee.
- [ ] Sphere contribution: contribute to circle → balance **decreases** by contribution.

### Map
- [ ] With Mapbox token and dev build: map loads (Mapbox).
- [ ] Without token or in Expo Go (native): fallback map (Apple/Google) loads with orbs, zoom, locate.
- [ ] If Mapbox throws (e.g. native module missing): fallback map is shown.
- [ ] Zoom in/out and “Locate me” work on fallback map.
- [ ] Tapping an orb opens OrbSheet; balance increases on tap.

### Routes
- [ ] OrbSignal: list → detail → vote → back.
- [ ] Map ↔ grid toggle; filters; directory; partner sheet.
- [ ] Wallet, profile, settings, other tabs load without error.

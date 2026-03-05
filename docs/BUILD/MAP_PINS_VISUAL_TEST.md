# Map Pins Visual Test Checklist

Use this to verify OrbPin visuals and demo density after Phase 0–3.

## Phase 0 — Current pipeline
- **Pins rendered in:** `components/OrbTapMap.tsx` via `Mapbox.PointAnnotation` and `OrbMarker`.
- **Tier colors:** `constants/MockData.ts` — `TIER_COLORS` (common, rare, legendary, apex).
- **Data source:** `getMapPartners()` from `constants/demoOrbs.ts` = `MOCK_PARTNERS` + generated demo partners (seeded, min spacing).

## Phase 1 — OrbPin visuals (implemented)
- [ ] **Common:** Solid orb, slate grey (`TIER_COLORS.common`), no transparency; no pulse.
- [ ] **Rare:** Solid orb, electric blue, no transparency; no pulse.
- [ ] **Legendary:** Two-tone gold/navy (`TIER_GRADIENTS.legendary`), fully opaque; subtle gold pulse ring (first 6 premium orbs only; respects Reduce Motion).
- [ ] **Apex:** Two-tone ruby/obsidian (`TIER_GRADIENTS.apex`), fully opaque; subtle red pulse ring (capped at 6).
- [ ] **Selected pin:** Slight scale-up, stronger border; bottom sheet opens.
- [ ] **No washed-out or transparent orb bodies** — opacity 1 on orb body; only glow halo uses opacity.

## Phase 2 — Demo spread
- [ ] Map shows more orbs than before (real + ~45 demo).
- [ ] Demo orbs spread across Poconos (Stroudsburg, Mt Pocono, Lake Harmony, etc.), no single huge cluster.
- [ ] Minimum spacing ~0.85 km between any two pins (no stacking).
- [ ] Demo partners show as “Demo Partner” / “Demo Cafe” style names (fictional placeholders).

## Phase 3 — Polish & performance
- [ ] Pins look crisp (no blur) on device/simulator.
- [ ] Glow is soft and premium, not harsh.
- [ ] Only up to 6 Apex/Legendary orbs pulse at once (no visual noise).
- [ ] Pan/zoom remains smooth; no major FPS drop with full list.

## Regression
- [ ] Tapping a pin still opens the bottom sheet and selects the partner.
- [ ] Zoom / Locate controls and tier legend still work and sit above the tab bar.

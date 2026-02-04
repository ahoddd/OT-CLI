# OrbTap — Phase / Sprint Status

Reference: OrbTap_Master_Blueprint.md (Sprints 0–10).

## Current status (post gap-fix)

| Sprint | Description | Status | Notes |
|--------|-------------|--------|--------|
| 0 | Shell scaffold (boot + tabs) | Done | Tabs + ScreenWrapper |
| 1 | Feature flags + Admin Hub (local) | Done | Full flags in FlagContext; Admin has System Info + Audit Log; compliance routes added |
| 2 | Mapbox Map + Orb Pins + OrbSheet | Done | Map, orbs, OrbSheet |
| 3 | Partner & Perk pages | Done | /partner/[id], /perk/[id]; Follow + Report entry points |
| 4 | Verified Redemption + Wallet Ledger | Partial | Wallet/ledger present; QR flow and verifiedAction refs to be completed |
| 5 | Proof Card + Share | Done | /proof/[id] + share |
| 6 | Follow + Circles | Done | Follow list; /spheres, /invite/[code] |
| 7 | OrbTap Hub + Streak | Done | /orb hub + streak UX |
| 8 | OrbSignal MVP | Done | /orbsignal list + prediction market UI |
| 9 | Legal + Settings + Support | Done | Legal directory, acceptable-use, data/delete; settings; support; report |
| 10 | Observability + Release readiness | Pending | Crash reporting, analytics, store prep |

## Gap-fix items completed

- **Compliance routes:** `/legal/acceptable-use`, `/data/delete`, `/legal` (directory), `/auth` (redirect to login).
- **Feature flags:** FlagContext uses full `constants/Flags.ts`; `flags`, `setFlag(key, value)`, `resetFlags()`; persist to `ORBTAP_FLAGS`; audit log to `ORBTAP_FLAGS_AUDIT`.
- **Admin Hub:** Uses new useFlags API; System Info (App 1.0.0, Expo SDK); Audit Log (last 5); Map Provider pills; no `any`.
- **Docs:** ROUTES_MAP.md, PHASE_STATUS.md (this file).

## Next priorities (Launch Readiness)

1. Verified Redemption: end-to-end QR → verifiedAction + ledger entry with refs.
2. Wallet ledger: add `adjust`, `reason`, `ref` to entries when wiring redemption.
3. Observability: crash reporting + minimal analytics (Sprint 10).
4. NO_DEAD_BUTTONS.md: keep updated as UI actions change.

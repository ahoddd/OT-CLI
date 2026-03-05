# OrbTap UI QA Checklist

Use this checklist for visual and behavioral QA of the UI system (Classic vs Kit v1, Dark vs Light).

## Before release

- [ ] **UI version toggle** — Admin Hub → UI Version: switch Classic ↔ Kit v1; app does not crash; no dead screens.
- [ ] **Theme** — Settings (or system): switch Light/Dark; all migrated screens look correct in both modes.
- [ ] **Migrated screens** — Home (map), Wallet, Auth (login/signup), Partner profile, Drop detail, Proof receipt, Settings, Partner dashboard: no regressions; when Kit v1, token-based styling and optional Kit components apply.
- [ ] **Scroll safety** — No hidden CTAs; scrollable content has bottom padding (safe area + token padding).
- [ ] **Badges** — Verified / Sponsored / Silver–Gold–Platinum badges readable in Light and Dark.
- [ ] **Tap targets** — Buttons and list rows meet minimum 44pt where applicable.
- [ ] **TypeScript** — `npx tsc --noEmit` passes.
- [ ] **Consistency scan** — `node scripts/scan-ui-consistency.js`; fix or allowlist any reported violations.

## Per-screen (Kit v1 + Dark, then Kit v1 + Light)

- [ ] Auth (login, signup)
- [ ] Home (map tab)
- [ ] Wallet
- [ ] Partner profile
- [ ] Drop detail
- [ ] Proof receipt
- [ ] Settings
- [ ] Partner dashboard landing

## Screenshots

Capture and store in `docs/BUILD/ui_screenshots/` per UI_SCREENSHOT_PACK.md (one Dark + one Light per core screen for Kit v1; optional Classic vs Kit v1 for Home and Wallet).

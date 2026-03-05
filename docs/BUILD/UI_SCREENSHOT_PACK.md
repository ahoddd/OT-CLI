# OrbTap UI Screenshot Pack

## Purpose

Document and prove UI appearance for Kit v1 (and optionally Classic) across Dark and Light modes.

## Where to store

- **Folder:** `docs/BUILD/ui_screenshots/`
- **Naming:** `{screen}-{mode}-{uiVersion}.png` (e.g. `home-dark-kit_v1.png`, `wallet-light-kit_v1.png`).

## Required captures

For **each** core screen:

- **Auth** (login or signup): 1 Dark (Kit v1), 1 Light (Kit v1).
- **Home** (map tab): 1 Dark (Kit v1), 1 Light (Kit v1). Optional: same for Classic to show toggle.
- **Wallet:** 1 Dark (Kit v1), 1 Light (Kit v1). Optional: same for Classic.
- **Partner profile:** 1 Dark (Kit v1), 1 Light (Kit v1).
- **Drop detail:** 1 Dark (Kit v1), 1 Light (Kit v1).
- **Proof receipt:** 1 Dark (Kit v1), 1 Light (Kit v1).
- **Settings:** 1 Dark (Kit v1), 1 Light (Kit v1).
- **Partner dashboard landing:** 1 Dark (Kit v1), 1 Light (Kit v1).

## How to capture

1. Set Admin Hub → UI Version to **Kit v1** (or Classic for optional comparison).
2. Set device/emulator to **Dark** or **Light** (Settings → theme or system).
3. Navigate to the screen, then take a screenshot (device or simulator).
4. Save into `docs/BUILD/ui_screenshots/` with the naming above.

## Checklist

See `docs/BUILD/UI_QA_CHECKLIST.md` for the full QA checklist that references this pack.

# OrbSwipe v1.1

OrbSwipe v1.1 adds user controls, Tonight Recap share card, low-supply fallback, and partner Swipe Studio. Additive only; no changes to core OrbSwipe architecture.

## Admin-configurable page name

- **Names section:** Admin Hub → Product → **Names**. Entries:
  - **Directory: OrbSwipe** (`dir_orbswipe`) — label in Master Directory and All Pages grid.
  - **Screen: OrbSwipe page title** (`screen_orbswipe_title`) — header on `/orbswipe` and used for Orb hub CTA and partner Cockpit title.
- When the admin changes either value, it applies app-wide: directory, search, Orb hub tile (“[Name] Tonight”), `/orbswipe` screen title, and partner “OrbSwipe Cockpit” (uses same screen title + “ Cockpit”).

## Phase A — User controls (Tune)

- **Entry:** “Tune” (options) icon on OrbSwipe deck header when `isOrbSwipeV11ControlsEnabled` is on.
- **Sheet:** Radius presets (1 / 5 / 10 / 15 mi), Indoor-only toggle, “Show fewer sponsored” (only if user has a paid tier and the option is shown), “Hide categories” chips (Food, Dessert/Coffee, Activity, Shopping, Services, Nightlife, Family). Persisted to `ORBTAP_ORBSWIPE_PREFS_V1`.
- **Per-card (when implemented):** “Show fewer like this” (downrank category/partner 7 days), “Hide this partner” (reuses block; stored in same prefs).
- **Deck composition:** Radius, indoor-only, hidden categories, and hidden partners are applied when building the deck.

## Phase B — Tonight Recap share card

- **When:** After Fuse My Night is completed and at least one verified step is done.
- **Content:** “Tonight on OrbTap”, 1–2 completed stops (partner names), verified stamp, OT Points earned, optional savings line. Share button opens `ShareToSocialSheet` with message + `orbswipeDeepLink()`.
- **Implementation:** `TonightRecapShareCard` + existing share pipeline; no new share system.

## Phase C — Low supply fallback

- **Condition:** Deck composition returns &lt; 8 cards (`ORBSWIPE_LOW_SUPPLY_THRESHOLD`).
- **Banner:** “Few picks right now” with:
  1. **Expand radius** — next preset (e.g. 10 → 15 mi).
  2. **Indoor / filters** — opens Tune sheet.
  3. **Map picks** — navigate to map tab.
- **Fuse fallback:** If tray has items but Fuse cannot produce options: show “Add one more to your tray to Fuse, or expand radius in Tune” (and optionally “Reserve best single drop”, “Navigate to closest saved”, “Try again with expanded radius” when wired).

## Phase D — Partner Swipe Studio (Pro only)

- **Entry:** Partner Dashboard → “OrbSwipe Cockpit” (when `isOrbSwipeEnabled`). Cockpit route: `/partner/orbswipe`.
- **Pro panel:** When `isOrbSwipePartnerSwipeStudioEnabled` and partner tier is Pro (Platinum): “Swipe Studio” panel with:
  - Best time to post (from last 14 days conversions by hour).
  - Best performing template (CTR or verified conversions).
  - Recommended headline length (short wins).
  - Recommended window length for Drop Promo (e.g. 2–3 h).
- **Quick actions:** “Create new card using best template”, “Schedule for best time” (tier-gated). Data from existing OrbSwipe analytics; no external AI.

## Feature flags (default ON)

- `isOrbSwipeV11ControlsEnabled`
- `isOrbSwipeRecapShareEnabled`
- `isOrbSwipeLowSupplyFallbackEnabled`
- `isOrbSwipePartnerSwipeStudioEnabled`

## Files (main)

- `app/orbswipe.tsx` — user OrbSwipe screen (header uses `screen_orbswipe_title`).
- `app/partner/orbswipe.tsx` — partner cockpit + Swipe Studio.
- `hooks/useOrbSwipePreferences.ts` — radius, indoor, hide categories, hidden partners.
- `components/OrbSwipeControlsSheet.tsx` — Tune sheet.
- `components/TonightRecapShareCard.tsx` — recap + share.
- `constants/OrbSwipeConfig.ts` — radius presets, categories, thresholds.
- `constants/AdminConfig.ts` — `dir_orbswipe`, `screen_orbswipe_title`, quick action, directory id.
- `constants/Flags.ts` — OrbSwipe and v1.1 flags.
- `constants/AppLinks.ts` — `orbswipeDeepLink()`.

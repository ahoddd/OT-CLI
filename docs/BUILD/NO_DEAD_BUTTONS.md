# No Dead Buttons — OrbTap MVP

Reference: OrbTap_Master_Blueprint.md. Every navigation entry point must work; every button must have an implemented, testable action (or be removed).

## Rule

- **PASS:** Every CTA either performs an action or is removed.
- **FAIL:** Placeholder buttons, dead links, or buttons that do nothing.

## Tabs (bottom nav)

| Tab | Route | Primary action |
|-----|--------|----------------|
| Map | `/(tabs)` | Map + orb pins; tap orb → OrbSheet; Directions / View Perk / Redeem / Follow |
| Scan | `/(tabs)/scan` | QR scanner → verify → OT Points + proof |
| Orb | `/(tabs)/orb` | Hub: directory, featured, quick actions, streak |
| Wallet | `/(tabs)/wallet` | Balance, ledger, receipts, spend catalog |
| Profile | `/(tabs)/profile` | Account, follow list, circles entry, settings, Admin Hub (if admin) |

## Pre-auth experience (landing, login, signup)

- **Landing (`/`):** Hero + four feature rows (LandingCard) + CTAs. "Get started" → `/auth/signup`, "I have an account" → `/auth/login`. Rows: "Take a look inside" → `/features`, "How OrbTap works" → `/learn`, "See a Proof Card" → proof modal, "For businesses" → `/partner-apply`. Proof modal CTA → `/auth/signup`. All use pre-auth design system (PreAuthTheme, PrimaryButton, SecondaryButton, LandingCard).
- **Login (`/auth/login`):** Back → `/`, Sign in (PrimaryButton), Forgot password, "Claim your spot" → `/auth/signup`. Behavior unchanged (biometric, remember me).
- **Signup (`/auth/signup`):** Back → `/`, Create account (PrimaryButton), Terms/Privacy links → `/legal/terms`, `/legal/privacy`. Post-signup → `/auth/onboarding` then redirect by role.

## Key entry points

- **Admin Hub:** Profile → Admin Hub link → `/admin` (flags, layout, audit).
- **Missions:** Directory / hub → Missions → `/missions` (mood + plan → generate; view on map).
- **Spheres:** Profile or directory → Spheres → `/spheres`, `/spheres/[id]` (create, invite, pool, missions CTA).
- **OrbSignal:** Directory / hub → Orb Signal → `/orbsignal`, `/orbsignal/[id]` (forecast with OT spend).
- **Legal:** Settings → Legal → `/legal`, `/legal/privacy`, `/legal/terms`, `/legal/guidelines`, `/legal/acceptable-use`.
- **Support / Report / Data delete:** Settings or in-app → `/support`, `/report`, `/data/delete`.

## When updating

After adding or changing any UI action (button, link, tab):

1. Confirm the target route or handler exists and works.
2. Update this doc if you add or remove a major entry point or CTA.

## Recent fixes (anti-drift)

- **Spheres [id]:** Removed "View profile" from member actions alert (no uid available; Block only).
- **Partner dashboard:** Replaced premium-only header download button (dead onPress) with spacer View.
- **Settings — App version row:** onPress now copies version to clipboard and shows confirmation (no dead button).
- **Landing:** "For businesses" card → `/partner-apply`. Partner-apply success copy updated.
- **Admin Partner applications:** "Approve & add to map" → `createPartnerFromApplication` (creates partner, links user); "Approve only" and "Reject" unchanged.
- **Partner dashboard (no business linked):** Empty state + "Apply to get on the map" → `/partner-apply`.
- **Partner dashboard (no perks):** First-perk onboarding card → `/partner/perks`.
- **Partner Growth Suggestions:** create_card → `/partner/posts/create` or `/partner/orbswipe`; schedule → `/pulse`; duplicate → Alert "Coming soon".
- **Pre-auth redesign:** Landing uses LandingCard (no KitFeatureCard), PrimaryButton/SecondaryButton, PREAUTH tokens. Login and signup use same glass surface, PreAuthInput, PrimaryButton; no behavior or route changes.

## Phase C re-audit (Full App Audit)

- All tab and key entry points verified; CTAs have working destinations or were removed.
- Auth guard on tabs: unauthenticated users redirect to `/`; partner dashboard redirects non-partners to `/(tabs)/orb`.
- Sensitive screens (`/data/delete`, `/work-orders/[id]`) redirect to `/auth/login` when `!user`.
- Conversion copy centralized in `constants/ConversionCopy.ts`; invite and partner teaser copy used from there.
- **Empty states:** KitEmptyState (or equivalent) used on map (no partners), missions (no missions), pulse (no tiles), bookmarks (no items). Tier visibility in CommandCenterHeader, profile, leaderboard.
- **Store compliance:** Routes `/legal/privacy`, `/legal/terms`, `/support`, `/report`, `/data/delete` exist and are linked from settings. TAP_TARGET_MIN (44pt) used on critical CTAs (auth, scan success, proof, wallet).

## 2026 Full Optimization pass

- **Photo moderation:** Display photo upload runs through `moderateDisplayPhoto` (validation + content check); errors surfaced in Settings.
- **Mission sponsorship:** Partner Sponsor Mission screen calls `sponsorMission` Cloud Function; OT deducted and `missionSponsorship` doc created; wallet balance refreshed on success.
- **Landing / Web:** LandingCard and preauth buttons have `accessibilityLabel` and `accessibilityRole`; web landing store buttons have a11y; JSON-LD SoftwareApplication added for SEO.
- **Demo data:** Single toggle (`demoDataEnabled`) controls all mock surfaces (Partners, Drops, Polls, Feed, Featured, Meal Proposals, Orb Signal); see `docs/BUILD/DEMO_DATA_AUDIT.md`.

Last updated: OrbTap 2026 Full Optimization.

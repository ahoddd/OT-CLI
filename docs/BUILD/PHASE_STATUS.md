# OrbTap — Phase / Sprint Status

Reference: OrbTap_Master_Blueprint.md (Sprints 0–10).

## Current status (post gap-fix)

| Sprint | Description | Status | Notes |
|--------|-------------|--------|--------|
| 0 | Shell scaffold (boot + tabs) | Done | Tabs + ScreenWrapper |
| 1 | Feature flags + Admin Hub (local) | Done | Full flags in FlagContext; Admin has System Info + Audit Log; compliance routes added |
| 2 | Mapbox Map + Orb Pins + OrbSheet | Done | Map, orbs, OrbSheet |
| 3 | Partner & Perk pages | Done | /partner/[id], /perk/[id]; Follow + Report entry points |
| 4 | Verified Redemption + Wallet Ledger | Done | Server-first: awardVerifiedAction + spendWallet when signed in; client fallback when no auth |
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

## Proof-Powered City OS (wired)

- **Core loop**: Discover (Pulse/Drops/Quests) → Reserve/Start → Verified action (QR/drop redeem/quest complete) → OrbProof receipt → OT Points (Orbinomics) → Share. Ledger reasons: EMIT_VERIFIED_REDEEM, EMIT_DROP_REDEEM, EMIT_QUEST_COMPLETE.
- **Server-authoritative**: When signed in, `createVerifiedAction` calls `awardVerifiedAction`; `spend` calls `spendWallet`. See `services/verifyApi.ts` and `docs/BUILD/FRAUD_DEFENSE_API.md`.
- **OrbProof**: VerifiedAction + receipt; Proof receipts list on Wallet; /proof/[id] + share.
- **OrbDrops**: /drop/[id] reserve (fee via Orbinomics) + redeem → createVerifiedAction + success/proof.
- **OrbQuests**: Mission complete with partnerId mints VerifiedAction (MISSION_COMPLETE); Pulse uses actionType for scoring.
- **OrbPulse**: Feed from verifiedActions only; actionType (REDEEM, DROP_REDEEM, MISSION_COMPLETE) for weights.
- **Feature flags**: Module and sink flags ON by default; OrbArena ON by default.
- **Integrity**: IntegrityEvent types + useIntegrity + Admin “Integrity events” panel; TrustScore types for server.

- **OrbFeed (Commerce Feed):** /feed, /feed/[id], /partner/posts/create; OrbPost types + CTAs; useOrbFeed modes; directory entry; partner composer; flags ON by default (purchases OFF). Backend stubs/API pending.
- **OrbArena:** Integrity panel (verified votes, clean %); eligibility copy for submit/vote; share entry card (deep link); proof-weighted voting; no pay-to-play.

## Meal Proposals (wired)

- **Data model**: MealProposal, MealPlan, MealProposalAction, MealSphereVote — `constants/MealProposals.ts`
- **Tier config**: Silver/Gold/Platinum limits — `constants/MealProposalTierConfig.ts`
- **Feature flags**: 10 flags in `constants/Flags.ts`, admin-configurable via Admin Hub
- **Partner Composer**: Template-based 4-step flow (type → vibe → details → preview/publish) — `components/MealProposalComposer.tsx`
- **Partner Studio**: `/partner/meal-proposals` — create, manage, analytics, tier-gated
- **Meal Mode**: Full-screen `/meal-mode` — top rail filters, swipe deck, tray, Fuse My Meal
- **OrbSwipe integration**: `MEAL_PROPOSAL_CARD` type, `MEAL_PROPOSAL` SavedIntent kind, deck composition
- **Fuse My Meal**: Deterministic scoring (votes → time → verified → popularity), 3 options (Best Pick, Value, Tonight)
- **Plan creation**: MealPlan with steps: Navigate → Drop Reserve → QR Redeem → Verified Review
- **Verified completion**: MEAL_PLAN_COMPLETE VerifiedAction, proof receipt, OT Points
- **Sphere Mode**: Pre-filtered meal discovery from sphere page, in-sphere voting
- **Compare**: Side-by-side comparison sheet for 2-3 tray proposals
- **Verified Review**: Post check-in CTA, linked to proofId, one per (uid, partnerId, proofId)
- **Meal Recap Share**: Share card with deep link back to Meal Mode
- **Trust/Safety**: No external content, verified-only publish, report, pricing confirmation
- **Analytics**: Full funnel (impression → open → tray → fuse → navigate → reserve → redeem)
- **Dashboard link**: Partner Dashboard → "Meal Studio" card

## Sprint 10A — Discovery Hub Revamp (Complete)

**Goal:** Replace the monolithic map tab with a tri-modal Discovery Hub that outperforms Airbnb, Yelp, Pokémon GO, and DoorDash.

### What was built
| Component | File | Status |
|-----------|------|--------|
| `DiscoveryToggle` | `components/DiscoveryToggle.tsx` | Done |
| `DiscoveryFilterBar` | `components/DiscoveryFilterBar.tsx` | Done |
| `PartnerGridCard` | `components/PartnerGridCard.tsx` | Done |
| `PartnerGridView` | `components/PartnerGridView.tsx` | Done |
| `MapNearbyTray` | `components/MapNearbyTray.tsx` | Done |
| `LiveActivityPill` | `components/LiveActivityPill.tsx` | Done |
| `InlineOrbSwipe` | `components/InlineOrbSwipe.tsx` | Done |
| Discovery Hub refactor | `app/(tabs)/index.tsx` | Done |

### Three Discovery Modes
- **Map Mode**: Full-screen Mapbox (or fallback) + floating `MapNearbyTray` + `LiveActivityPill` + `OrbSheet` partner detail
- **Grid Mode**: Sectionized 2-col `PartnerGridView` (Hot Now → Featured → Nearby → Best Deals → All)
- **Swipe Mode**: Inline `InlineOrbSwipe` deck (skip/save/detail) → funnels to full `/orbswipe`

### Shared State (index.tsx)
- `activeView: 'map' | 'grid' | 'swipe'` — unified view switch
- `activeFilters: FilterId[]` — chip filter bar (All · Open Now · Deals · Gold+ · Following · Near Me)
- Advanced filter modal: tier, category, hot-spots-only
- `filteredPartners` useMemo applies all active filters to partner list across all views

### OrbTap Twist
Combines gamified map exploration (tier orb pins + hotspot pulses), swipeable grid discovery, and Tinder-style planning — all from one unified screen with a single `DiscoveryToggle`. Every mode drives the same North Star loop: **Discover → Visit → Scan → OT Points**.

---

## Phase 0 — Full-Repo Audit (Complete 2026-03-04)

**Deliverables produced:**
- `docs/BUILD/SCREEN_MAP.md` — 178 screens catalogued, all routes, roles, entry points
- `docs/BUILD/NORTH_STAR_AUDIT.md` — 8 loop breaks identified with exact file paths + fixes; North Star sharpened (COMMIT step added; City Identity meta-reward; everyday use audit)
- `docs/BUILD/UI_AUDIT.md` — hardcoded color inventory (30+ files), component inconsistency map, dark/light failures, performance hotspots, accessibility gaps, NavOrb upgrade spec
- `docs/BUILD/BENCHMARK_PATTERNS.md` — 10 patterns from Uber/Duolingo/Apple Wallet/DoorDash/Tinder/Instagram/Airbnb/Google Maps with exact OrbTap implementation guidance

**Key findings:**
- North Star loop has 8 break points; most critical: no COMMIT step, first-win not guaranteed in onboarding, Proof Card undercelebrated
- UI: ~40% of screens have hardcoded colors; 5+ competing button/card patterns; 4/10 accessibility score
- NavOrb needs swirl + color drift + 3D depth (Phase 5 locked)
- Partner ROI dashboard missing conversion funnel and repeat-visitor metric
- Push notifications are the biggest missing retention mechanic (server-side TODO)

**Status:** AWAITING USER CONFIRMATION TO PROCEED TO PHASE 1

---

## Next priorities (Launch Readiness)

1. Observability: crash reporting + minimal analytics (Sprint 10B).
2. NO_DEAD_BUTTONS.md: keep updated as UI actions change.
3. Server: rate limits, trust score, idempotency keys on critical endpoints.

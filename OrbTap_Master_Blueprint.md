========================================================
OrbTap — TERMINAL-ONLY BUILD OVERRIDE (MANDATORY / HIGHEST PRIORITY)

THIS DOCUMENT OVERRIDES ALL OTHER INSTRUCTIONS IF THERE IS ANY CONFLICT.
IF ANY OTHER DOCUMENT CONFLICTS WITH THIS, IGNORE THE OTHER DOCUMENT.

MODE

You are Gemini (Canvas) operating in "TERMINAL BUILDER MODE" only.

You are NOT allowed to create Canvas files, attachments, downloads, or paste full file contents as chat output.

You will build by issuing ONLY terminal command blocks that I can paste into my Mac terminal.

ABSOLUTE RULES (NO EXCEPTIONS)

NO CHAT FILE OUTPUTS / NO DOWNLOADS / NO "HERE'S THE FILE"

Do NOT generate files as chat attachments, Canvas artifacts, zip downloads, or "copy this file content".

Do NOT output full file contents in chat.

ALL file creation/edits MUST be done via terminal commands I can paste and run locally.

REPO LOCATION (SINGLE SOURCE OF TRUTH)

The OrbTap repo already exists at:
~/Desktop/OT-CLI

EVERY terminal command block MUST begin with:
cd ~/Desktop/OT-CLI

NEVER assume paths. VERIFY file existence with ls/find/rg before editing.

TERMINAL COMMAND REQUIREMENTS (PASTE-SAFE)

Commands must be SHORT and paste-safe. NO giant one-liners.

Avoid fragile quoting and anything likely to trigger zsh issues.

Prefer small, verifiable steps with explicit checks after edits.

If an edit is large, split it into multiple terminal blocks.

EDIT METHOD (ONLY THESE)

Preferred:

Small python3 patch scripts with:
a) explicit anchor checks
b) timestamped .bak backups
c) clear success/fail output

Allowed ONLY if short and safe:

cat > path/to/file <<'EOF' … EOF

Disallowed:

long inline node -e one-liners

complex regex one-liners

anything likely to truncate in chat or terminal paste

ONE SPRINT AT A TIME + STOP

Implement EXACTLY ONE Sprint, then STOP.

After each Sprint, request proofs and DO NOT proceed until proofs are clean.

REQUIRED PROOFS AFTER EVERY SPRINT (PASTE FULL OUTPUT)

git diff --stat

npx tsc --noEmit --pretty false --incremental false

npx expo-doctor

Boot proof: npx expo start

confirm the new/changed screens load

confirm required navigation paths work

ALLOWED PATHS ONLY

You may only create/modify files in:
app/, app/(tabs)/, app/admin/, components/, constants/, assets/, docs/BUILD/, ./

No other folders. If something seems needed elsewhere, STOP and request approval.

STATE-READ FIRST (MANDATORY BEFORE EDITS)

Before any edits in each Sprint, run and show commands for:

git status --porcelain

ls -lah on the target directories/files

rg -n to confirm anchors exist

npx tsc --noEmit --pretty false --incremental false (or head if large)

If TSC fails, fixes must be prioritized to get TSC green within the Sprint.

ACK REQUIREMENT (MUST MATCH EXACTLY)

Before you do anything, reply with EXACTLY:
"LOCK ACK ✅ — TERMINAL BUILDER MODE — Starting Sprint 1"

If you cannot comply with ALL rules above, reply:
"CANNOT COMPLY"
and stop.

OUTPUT FORMAT CONTRACT (MANDATORY)

For each Sprint you will output ONLY:
(A) "FILES TO CREATE/MODIFY" list (plain text)
(B) terminal command blocks ONLY (each begins with: cd ~/Desktop/OT-CLI)
(C) "PROOFS REQUIRED" list

Then STOP and wait for proofs.

========================================================
END TERMINAL-ONLY BUILD OVERRIDE

========================================================
ORBTAP — MASTER MVP BLUEPRINT (LOCKED) — EXECUTION RULES

ROLE

You are Gemini (Canvas) acting as the sole "Builder" for OrbTap MVP.

You must follow this Blueprint EXACTLY.

Terminal-Only Build Override above is higher priority than everything.

NON-NEGOTIABLE RULES (NO DRIFT)

NO DRIFT / NO EXTRA FEATURES

Do not add, remove, rename, or "improve" scope beyond what this Blueprint explicitly states.

If something is ambiguous, choose the smallest, safest MVP interpretation that preserves forward-compatibility.

ONE SPRINT AT A TIME

Implement exactly one Sprint, then STOP and request proofs.

Do not start the next Sprint until proofs are clean and confirmed.

ALLOWED PATHS ONLY

You may only create/modify files in:
app/, app/(tabs)/, app/admin/, components/, constants/, assets/, docs/BUILD/, ./

No new folders outside these paths.

TERMINAL COMMAND FORMAT (MANDATORY)

Every terminal command block MUST start with:
cd ~/Desktop/OT-CLI

Commands must be short, paste-safe, and verified.

No fragile quoting; avoid truncation risks.

NO BROKEN ROUTES / NO DEAD BUTTONS

Every navigation entry point must work.

Every button must have an implemented, testable action (or be removed).

Update docs/BUILD/NO_DEAD_BUTTONS.md whenever UI actions change.

STRICT TYPE SAFETY

TypeScript must pass with zero errors at the end of every Sprint.

REQUIRED PROOFS AFTER EVERY SPRINT (PASTE FULL OUTPUT)

git diff --stat

npx tsc --noEmit --pretty false --incremental false

npx expo-doctor

Boot proof: npx expo start (confirm screens + required flows work)

DESIGN/TIERS (LOCKED FOR MVP)

Only these membership tiers exist for UI and plans:
Silver (free), Gold (premium), Legendary (pro)

Do NOT use the old 4/6-tier rarity names (Common, Rare, Apex, Mythic, Elite) for membership or badges. Membership tokens (Silver/Gold/Platinum or Silver/Gold/Legendary) are separate from any internal rarity mapping for orbs/partners.

BACKEND / INTEGRATIONS

Use Firebase only if this Blueprint explicitly says to wire it in during MVP.

Do not add Supabase unless this Blueprint explicitly requires it (default: DO NOT add).

OUTPUT CONTRACT

For each Sprint you will produce:
A) "FILES TO CREATE/MODIFY" list
B) Terminal commands (each block begins with: cd ~/Desktop/OT-CLI)
C) A "PROOFS REQUIRED" section

Then STOP and wait for proofs.

ACKNOWLEDGEMENT

Reply with:
"LOCK ACK ✅ — TERMINAL BUILDER MODE — Starting Sprint 1"

Then proceed exactly as specified.

========================================================
END EXECUTION RULES

🏆==========================================================
MASTER MVP BLUEPRINT — ORBTAP (LAUNCH CORE) — "CITY OS MVP"

VERSION: 1.1 (MVP-LOCKED — MEMBERSHIP TIERS: SILVER/GOLD/LEGENDARY ONLY)
OWNER: Gemini (Builder). ChatGPT (Spec Author).
GOAL: Ship a bootable, polished, legally-safe, viral-capable MVP that proves OrbTap's North Star loop and can scale into the full ecosystem without rewrites.

A) NORTH STAR MVP (WHAT "SUCCESS" MEANS)

North Star Action: VERIFIED WIN

A user discovers a real local perk/partner → performs a verified action (QR / partner confirm) → receives OT Points → receives a shareable "Proof Card" → optionally follows the partner / shares to a Circle.

MVP must prove:

Reliable boot + navigation

Fast discovery (map + list)

Trust & clarity (partner pages + verification badge + rules)

Verified redemption flow (QR)

Wallet & ledger accuracy (OT Points)

Viral proof artifact ("Proof Card" share)

Lightweight social loop (Follow partner + Invite-only Circles)

OrbSignal MVP (social forecasting with non-cash points and reputation, no wagering)

B) MVP SCOPE (IN) vs (OUT)

IN (MVP)

App shell + Tab navigation + ScreenWrapper

Feature Flags system + Local Admin Hub (must be stable)

Mapbox map (core) with glowing orb pins + bottom sheet OrbSheet

Partner directory + partner profile pages

Perk listings + perk detail

Verified Redemption (QR-based) + anti-fraud caps + audit logs

Wallet (OT Points balance + ledger) + receipts

Proof Card generator + Share sheet

Follow partners (persisted)

Invite-only Circles (CoupleSphere / FamiSphere / PalSphere) + simple shared progress

OrbTap "Streak" (daily check-in OR daily verified win streak) — minimal

OrbSignal MVP (social forecasting, non-cash points + reputation, no wagers)

Settings + Legal + Support + Safety:

Privacy Policy, Terms, Community Guidelines, Acceptable Use, Safety/Reporting, Data Deletion Request

Contact/Support screen and in-app report flows

Observability:

Crash reporting + basic analytics events (low-cost; Firebase recommended)

Monetization foundations (MVP-ready, not bloated):

Freemium defaults (high value)

Premium User tier hooks

Premium Partner tier hooks

Admin switches to adjust limits and promos without code changes

OUT (DEFER)

Global social feed ("For You / Following" content feed)

Payments / OT Coin crypto / cash-out

OrbShop marketplace checkout

OrbPros marketplace jobs

POS integrations (Square/Clover)

RFID/NFC redemption

Advanced moderation dashboards (keep stubs/flags only)

C) COMPETITOR BENCHMARK TARGETS (MVP BEATS THESE AT LAUNCH)

Discovery & Map: Google Maps, Yelp, Groupon
Wallet & receipts: Apple Wallet, Cash App (clarity + polish, not features)
Short dopamine loops: Duolingo streak psychology (without spam)
Forecasting UX: Robinhood prediction UI simplicity (OrbSignal must be cleaner)
Partner pages: Instagram Business / Google Business Profile (trust + clarity)

MVP UX mandate:

"One-hand" navigation

Bottom sheet interactions feel premium (fast, smooth, clear CTAs)

No clutter: calm, high-contrast Nightglass with tier accents

Dopamine: micro-animations, streak feedback, "Proof Card" shareable flex

D) TECH STACK & PLATFORM RULES (MVP)

Frontend:

Expo SDK 54 + expo-router

React Native

TypeScript strict

ScreenWrapper everywhere

One canonical bottom-sheet pattern (no multiple competing sheet systems)

Backend (MVP):

Firebase: Auth + Firestore + Cloud Functions + Hosting rewrites

No Supabase in MVP unless absolutely required (default: DO NOT add)

Map: Mapbox (token via env)

Saved Firebase wiring (use exactly):

Firebase project: orbtap

Firebase Hosting: https://orbtap.web.app

API base (behind Hosting rewrite): https://orbtap.web.app/api

Functions (2nd gen) export: api

IMPORTANT: never hardcode secrets in repo; use EXPO_PUBLIC_* only for safe public values.

E) ROUTES (MVP FINAL ROUTE MAP)

Tabs (OrbNavbar visible):

/(tabs)/map                 (default)

/(tabs)/scan               (QR scanner + verify entry)

/(tabs)/orb                (OrbTap hub: streak + quick actions)

/(tabs)/wallet             (balance + ledger + receipts)

/(tabs)/profile            (account + follow list + circles entry + settings)

Non-tab routes (OrbNavbar hidden unless specified):

/partner/[id]

/perk/[id]

/proof/[id]

/spheres

/spheres/[id]

/invite/[code]

/orbsignal

/orbsignal/[marketId]

/admin

/settings

/legal

/legal/privacy

/legal/terms

/legal/guidelines

/legal/acceptable-use

/support

/report

/data/delete

/auth   (must exist even if minimal)

Docs source of truth:

docs/BUILD/ROUTES_MAP.md

F) DATA MODEL (FIRESTORE) — MVP

Users

users/{uid}

displayName

createdAt

lastActiveAt

homeCityId (optional)

tier: "free" | "premium" | "pro"     // user membership: Silver (free), Gold (premium), Legendary (pro)

settings: { notificationsOptIn, emailOptIn, … }

streak: { current, best, lastWinDate } (or lastCheckInDate)

reputation: { orbRep, orbSignalRep }

entitlements: { maxFollows?, maxCircles?, streakMultiplier? } // optional, can be derived

Partners

partners/{partnerId}

name

category

location: { lat, lon, address }

tier: "silver" | "gold" | "legendary"  // partner display tier (maps to plan)

verifiedBadge: boolean

hero: { imageUrl? }

hours?

contact: { phone?, website?, instagram? }

plan: "free" | "pro"                  // partner subscription: Silver (free), Gold/Legendary (pro)

createdAt, updatedAt

Perks

perks/{perkId}

partnerId

title

description

termsShort

redemptionRules: { type: "qr" | "partnerConfirm", cooldownHours, maxPerUserPerDay }

tier: "silver" | "gold" | "legendary"  // perk display tier

active: boolean

startAt, endAt (optional)

stock: { remaining? } (optional)

createdAt, updatedAt

Follow Partners

users/{uid}/followsPartners/{partnerId}

createdAt

Circles (Invite-only)

circles/{circleId}

type: "couple" | "fami" | "pal"

name

ownerUid

createdAt

circles/{circleId}/members/{uid}

role: "owner" | "member"

joinedAt

invites/{code}

circleId

createdAt

expiresAt

maxUses

uses

Verified Actions + Ledger

verifiedActions/{actionId}

uid

partnerId

perkId

method: "qr" | "partnerConfirm"

status: "verified" | "rejected" | "pending"

pointsAwarded

createdAt

ledgers/{uid}

balance

updatedAt

ledgers/{uid}/entries/{entryId}

type: "earn" | "spend" | "adjust"

amount

reason

ref: { actionId?, perkId?, partnerId? }

createdAt

Proof Cards

proofs/{proofId}

uid

actionId

partnerId

perkId

pointsEarned

tier: "silver" | "gold" | "legendary"

createdAt

shareToken (optional)

public: boolean (default false)

Reports / Safety

reports/{reportId}

reporterUid

targetType: "partner" | "user" | "perk"

targetId

reasonCode

freeText

createdAt

status: "new" | "reviewed" | "closed"

OrbSignal (MVP)

orbSignalMarkets/{marketId}

title

description

category

status: "open" | "closed"

closeAt

outcomes

createdAt

orbSignalForecasts/{forecastId}

uid

marketId

outcome

confidence (0-100)

forecastPoints (NON-CASH)

createdAt

orbSignalResults/{marketId}

winningOutcome

resolvedAt

resolutionNote

OrbSignal compliance:

No money, no wagering, no cash-out, no "odds" framing.

Points are purely in-app reputation/utility.

Disclaimers on OrbSignal screens.

G) ORBINOMICS (MVP-SAFE)

OT Points are:

Promotional/loyalty utility points for in-app perks/rewards.

Not currency, not redeemable for cash, not guaranteed to increase in monetary value.

"Value increases" may only mean improved utility options in-app, NEVER investment framing.

MVP mechanics:

Earn:

Verified win awards OT Points (tier-weighted)

Spend (MVP-light):

Spend points on "Reserve Drop" / "Extra OrbTap attempt" / "Boost Streak" (purely utility)

Scarcity & fairness:

Daily caps on earns/spends

Cooldowns per perk

Reputation:

OrbRep tracks verified actions and trust (not spend)

Future OT Coin (DEFER):

Separate from OrbSignal Forecast Points.

Requires legal review; no mixed messaging in MVP.

H) UI/UX LOCKS (MVP)

Design system (Nightglass):

Background: near-black, subtle gradient

Cards: translucent dark, hairline borders

Text: high contrast, accessible sizes

Membership tier colors (ONLY THESE for badges/UI):

Silver = slate grey (free)

Gold = gold / amber gradient (premium)

Legendary = two-toned purple/gold or premium glow (pro)

(Rarity/orb display may map internally to these three tiers.)

Map pins:

MUST be glowing orb markers (tier-colored)

Orb marker states:

normal

focused (brighter glow)

verified badge dot overlay for verified partners/perks

Bottom sheet (OrbSheet):

One canonical sheet component:

snap points (collapsed / mid / full)

hero row: partner name + tier + verified badge

primary CTA row: "Get Directions", "View Perk", "Redeem", "Follow"

clarity section: termsShort + cooldown + limits

"Proof" indicator when verified action completed

Dopamine loops (MVP):

Reward animation after verified win (premium, not childish)

Streak micro-celebration

Proof Card is the main "shareable flex"

Accessibility:

Tap targets >= 44pt

Contrast

Reduced motion support

I) FREEMIUM + PREMIUM (USERS + PARTNERS) — MVP PLAN (HIGH-DEMAND)

Core principle:

Free must feel complete and generous.

Premium must feel irresistibly useful, not pay-to-win.

Premium enhances speed, convenience, and access—never "buy trust."

USER TIERS

Free (default; highly desirable)
Must include:

Full map discovery + orb pins + OrbSheet

Full partner + perk viewing

Verified redemption (QR) with fair daily caps

Wallet + ledger + Proof Cards + Sharing

Follow partners (up to a generous cap, e.g., 50)

Circles (up to 2 circles, or 1 per type) with invites

OrbSignal (read + limited forecasts/day)

Streak tracking

Premium (high-demand)
Must add:

Higher convenience limits (not exploitative):

More follows (e.g., 250)

More circles (e.g., 10)

More OrbSignal forecasts/day + small rep multiplier (non-cash)

Early access / priority windows for "Drops" (reservation windows)

"Proof Card Styles" (cosmetic premium templates) + watermark removal on share (cosmetic)

Advanced filters:

"Verified-only", "Legendary tier nearby", "Open now"

Saved routes / favorites + smart notifications (opt-in) for followed partners

Priority support channel (email form tag)

PARTNER TIERS

Partner Free (MVP launch-friendly)
Must include:

Partner profile page with verified badge capability (admin controlled)

Up to N active perks (e.g., 2–3)

Redemption via standard QR

Basic analytics snapshot:

views, taps, redemptions count (lightweight)

Respond-to-report workflow (basic)

Partner Pro (high-demand, ROI obvious)
Must add:

More active perks (e.g., 10+)

"Drop scheduling" (time windows + limited quantity)

Enhanced placement opportunities (flag-controlled featured rotation)

Better analytics:

conversion funnel (view → tap → redeem)

retention: repeat redeemers

Branding upgrades:

hero media, "story" section, menu links

Partner tools:

generate QR codes per perk

export redemption logs (CSV)

Optional verification upgrade path:

partnerConfirm method for high-tier perks (gold/legendary), reduces fraud

Admin must control:

Pricing knobs and entitlements via config docs and flags (MVP local, future server).

Compliance note:

No "points become money" language.

Premium is convenience + cosmetics + discovery power.

J) LEGAL / SAFETY / COMPLIANCE (MVP MUST-HAVES)

Required screens/routes:

/legal/privacy

/legal/terms

/legal/guidelines

/legal/acceptable-use

/support

/report

/data/delete

Required in-app behaviors:

Consent & disclosures:

Location permission explanation and fallback (manual browse)

Analytics disclosure (minimal; opt-out if needed)

Reporting:

Report Partner / Report Perk / Report User entry points

Blocking:

Block user within circle member lists (minimum viable)

Age gate (light):

Restricted categories must remain OFF by flags in MVP

OrbSignal disclaimers:

"Entertainment/information only, not financial advice, no wagering."

Store readiness:

Privacy labels prepared (data types collected)

Support contact method

Terms & privacy accessible from settings and onboarding/auth entry

K) ADMIN HUB (LOCAL MVP) — FEATURE FLAGS + AUDIT LOG

Admin Hub must provide:

Versions display (expo, rn, router, app version)

Flag toggles with persistence (AsyncStorage for MVP)

Audit log of flag changes

Kill switches:

disable OrbSignal

disable Redemption

disable Share

disable Map live calls (fallback to mock)

"Reset flags to default" button

Entry point:

Profile screen must have a non-dead "Admin Hub" link/button.

Docs updates required:

docs/BUILD/FLAGS_MAP.md

docs/BUILD/ADMINHUB_SCHEMA.md

docs/BUILD/NO_DEAD_BUTTONS.md

L) BUILD PHASING (SPRINTS) — GEMINI EXECUTES IN ORDER

SPRINT 0: Shell scaffold (already)
Acceptance: boot + tabs + ScreenWrapper.

SPRINT 1: Feature flags + Admin Hub (LOCAL) — fix all TS errors, no zod required
Acceptance:

Typecheck clean

Flags persist after restart

Admin Hub reachable from Profile

Expo doctor clean

Docs updated

SPRINT 2: Mapbox Map + Orb Pins + OrbSheet (tier orbs: silver/gold/legendary)
Deliverables:

Mapbox token wiring (EXPO_PUBLIC_MAPBOX_TOKEN)

Live location optional; graceful fallback

Load partners/perks (mock JSON → Firestore switch)

Orb pins are glowing tier orbs

Tap pin opens OrbSheet with Follow + CTAs
Acceptance:

Smooth, premium feel

SPRINT 3: Partner & Perk pages (trust-first)
Deliverables:

/partner/[id] and /perk/[id] fully implemented

Follow + Report entry points
Acceptance:

No dead buttons

SPRINT 4: Verified Redemption + Wallet Ledger
Deliverables:

/scan QR flow

Create verifiedAction + ledger entry + balance update + proof creation
Anti-fraud:

cooldowns, daily caps
Acceptance:

Verified win works end-to-end

SPRINT 5: Proof Card + Share
Deliverables:

/proof/[id] premium proof card + share
Acceptance:

share works iOS/Android

SPRINT 6: Follow Partners + Circles (invite-only)
Deliverables:

Follow list in profile

/spheres hub + /invite/[code]

Basic shared progress
Acceptance:

report + block exists

SPRINT 7: OrbTap Hub + Streak
Deliverables:

/orb hub with quick actions + streak UX
Acceptance:

dopamine without spam

SPRINT 8: OrbSignal MVP (safe)
Deliverables:

/orbsignal list + /orbsignal/[marketId] detail + forecast flow + manual resolve path
Acceptance:

compliant disclaimers, no betting framing

SPRINT 9: Legal + Settings + Support polish
Deliverables:

all legal pages + settings hub + support/report flows
Acceptance:

store-ready legal access

SPRINT 10: Observability + Release Readiness
Deliverables:

crash reporting + minimal analytics events

acceptance gates + device tests + screenshots
Acceptance:

ready for deployment and store submission prep

M) FEATURE FLAGS (MVP REQUIRED SET)

Flags must exist, be typed, and controllable in Admin Hub:

isMapboxEnabled

isFirestoreLiveEnabled (fallback to mock)

isRedemptionEnabled

isShareEnabled

isFollowEnabled

isCirclesEnabled

isOrbSignalEnabled

isOrbTapStreakEnabled

isPremiumUserEnabled (enables premium UI hooks)

isPartnerProEnabled (enables partner pro features)

isDebugMenuEnabled

Default values (MVP safe):

Mapbox ON

FirestoreLive ON only when configured; otherwise OFF with mock ON

Redemption ON when stable

Share ON

Follow ON

Circles ON

OrbSignal ON if stable; else OFF but route still renders stub

Premium hooks OFF until pricing/entitlements confirmed

DebugMenu OFF

N) FIREBASE WIRING (MVP)

Gemini must:

Initialize Firebase client in app using env values.

Use EXPO_PUBLIC_* for non-secret public config.

Ensure API base is:

https://orbtap.web.app/api

Implement Firestore rules for MVP collections:

partners/perks readable

user-owned writes limited (follows, forecasts, reports, circle membership via invite)

ledger/verified actions ideally server-written; if client-first, lock down tightly and plan migration

O) DOCUMENTATION (MUST STAY TRUE)

Update these every sprint:

docs/BUILD/ROUTES_MAP.md

docs/BUILD/FLAGS_MAP.md

docs/BUILD/ADMINHUB_SCHEMA.md

docs/BUILD/NO_DEAD_BUTTONS.md

docs/BUILD/PHASE_STATUS.md

P) ACCEPTANCE TESTS (EVERY SPRINT)

Always produce proofs:

git diff --stat

npx tsc --noEmit --pretty false --incremental false

npx expo-doctor

App boot log excerpt

No-dead-buttons doc updated (rows checked)

Screenshots for new screens stored in docs/screenshots

Q) ABSOLUTE DO-NOT-BREAK LIST

App must never boot to blank screen

No missing routes

Network failure → graceful fallback

No feature blocks discovery/redeem

No investment language about points

No auto opt-in notifications

No global user directory (invite-only circles only)

============================================================
END MASTER MVP BLUEPRINT

========================================================
ORBTAP — MVP MASTER CHECKLIST (OBJECTIVE, END-TO-END)
FOR GEMINI QA + BUILD VERIFICATION (NO DRIFT)

PURPOSE OF THIS DOC

This is the objective "definition of done" for OrbTap MVP.

Gemini must use it as a build + QA rubric after every Sprint and again at Launch Readiness.

Focus: (1) how OrbTap must FEEL, (2) what must WORK, (3) how Orbinomics must be SAFE + scalable.

No subjectivity: each item is pass/fail with observable proofs.

========================================================

PRODUCT NORTH STAR (MVP)
========================================================
North Star Action = VERIFIED WIN
A user:

Discovers a perk/partner (Map + list)

Opens OrbSheet (premium bottom sheet)

Chooses an action (View Perk / Redeem / Follow)

Completes Verification (QR in MVP)

OT Points awarded + Ledger updated

Proof Card generated + Share works

User can Follow partner and optionally share into a Circle

PASS/FAIL

PASS if the above loop can be done start-to-finish without crashes, dead buttons, blank states, or confusing steps.

========================================================
2) WHAT ORBTAP MUST FEEL LIKE (OS-GRADE UX)

A) "Trillion-dollar" OS feel (objective)

60fps sheet animations (no jank on iPhone + mid Android)

One-hand navigation always works (thumb zone)

Every primary interaction is via polished bottom sheets (OrbSheet)

No clutter: calm Nightglass surfaces + tier accents

Everything is scroll-safe, keyboard-safe, bottom-nav-safe

B) Dopamine is inevitable (objective, not childish)

Micro-feedback on taps (press states + subtle haptics where available)

"Verified Win" moment has a premium celebration (short, tasteful)

Streak tick-up feels rewarding but never spammy

Proof Card is the core flex artifact (clean, share-ready)

C) No confusion / no dead ends (objective)

Every route exists and renders

Every CTA either performs an action OR is removed (no placeholders)

Network failures never show blank screens; they show a designed fallback

========================================================
3) MVP TIERS (LOCKED — ONLY THESE EXIST)

ONLY:

Silver (slate grey — free)

Gold (gold/amber — premium)

Legendary (two-tone purple/gold — pro)

Objective checks:

No Mythic or Elite referenced anywhere (strings, types, UI, docs, data)

Map pins requirement:

Pins are glowing ORBS using tier colors

Focused state = stronger glow + clarity

Verified badge dot overlay for verified partners/perks

========================================================
4) MVP ROUTE MAP (MUST EXIST + WORK)

Tabs:

/(tabs)/map (default)

/(tabs)/scan

/(tabs)/orb

/(tabs)/wallet

/(tabs)/profile

Non-tab:

/partner/[id]

/perk/[id]

/proof/[id]

/spheres

/spheres/[id]

/invite/[code]

/orbsignal

/orbsignal/[marketId]

/admin

/settings

/legal

/legal/privacy

/legal/terms

/legal/guidelines

/legal/acceptable-use

/support

/report

/data/delete

/auth

PASS/FAIL:

PASS if every route can be navigated to from at least one UI entry point and renders a non-empty screen.

========================================================
5) MVP FEATURES — WHAT MUST WORK

A) Map Discovery

Mapbox loads with correct token wiring

Partners/perks appear as tier orbs

Tapping an orb opens OrbSheet with:

partner name + tier + verified badge

CTAs: Get Directions / View Perk / Redeem / Follow

termsShort + limits + cooldown displayed clearly

Fallback: if Map fails, a list view still enables discovery

B) Partner + Perk Pages (Trust-first)

Partner page shows:

verified badge (if applicable)

location + hours + contact links (if present)

perks list

Follow button

Report entry point

Perk page shows:

tier + rules + cooldowns + daily caps

Redeem entry point (routes to Scan)

Report entry point

C) Verified Redemption (QR) + Anti-fraud

QR scan starts from /(tabs)/scan

Successful scan creates:

verifiedAction

ledger entry

balance update

proof record

Anti-fraud enforced (MVP):

cooldownHours respected

maxPerUserPerDay respected

duplicate scan or rapid attempts blocked gracefully with explanation

D) Wallet (OT Points)

Wallet shows:

current balance

ledger entries list (earn/spend/adjust)

receipts/proof links

If network fails, balance/entries degrade gracefully (cached or "last known + refresh")

E) Proof Card + Share

Proof Card route /proof/[id] renders a shareable artifact:

partner + perk + tier

points earned

timestamp

verified badge indicator

Share works on iOS + Android without crashing

F) Follow Partners

Follow/unfollow works

Follow list visible in Profile

Follow state reflected on partner page + OrbSheet

G) Circles (Invite-only)

/spheres hub exists

Create circle, invite link/code, join flow works

Minimal shared progress exists (counts or streak)

Basic block/report exists in circle context (minimum viable)

H) OrbTap Hub + Streak

/orb hub shows:

streak

quick actions (Map, Scan, Wallet, Orbsignal)

Streak increments only on:

daily verified win OR daily check-in (choose 1 and lock)

Clear rules: how to keep streak, how it resets

I) OrbSignal MVP (Compliance-safe)

/orbsignal list + /orbsignal/[marketId] detail

Forecast = non-cash points + reputation only

No odds framing, no wagering language, no cash-out

Disclaimers visible in OrbSignal screens

J) Admin Hub + Flags + Audit

/admin reachable from Profile

Toggle flags persist

Audit log records changes

Kill switches exist for:

OrbSignal

Redemption

Share

Map live calls (fallback to mock)

========================================================
6) ORBINOMICS (MVP-SAFE) — ENGINE SPEC

A) Core Safety Rule (non-negotiable)

OT Points are promotional/utility points.

Not money, not investment, not redeemable for cash.

"Value appreciation" means IN-APP UTILITY increases over time (more/better options),
NOT monetary appreciation.

B) Supply/Flow Concepts (MVP)

Earned via Verified Wins (primary)

Spent via Utility sinks (burn)

Admin adjustments allowed (rare, logged)

C) Earning (MVP)

Verified win awards points based on tier weighting:

Silver: low

Gold: medium

Legendary: very high (scarce)

Caps:

daily earn cap (per user)

per-perk daily cap (cooldown + max/day)

D) Spending / Burn (MVP)
Approved sinks (burn mechanics):

Reserve Drop (utility reservation window)

Extra OrbTap attempt (optional, capped)

Boost streak protection (one-time "streak shield", limited frequency)

Cosmetic Proof Card styles (premium cosmetics only)

Rule:

Spending ALWAYS reduces balance via ledger entry type=spend.

No negative balances.

E) "Appreciation" Mechanism (objective, compliance-safe)
OT Points "appreciate" in VALUE by:

Increasing what points can DO (more utility sinks, better drop access, better perks catalog),

Improving exchange rate for specific utilities (e.g., seasonal discount on reservation cost),

Increasing scarcity of high-tier opportunities (limited drops) while maintaining fairness.

NEVER:

Promise points increase in cash value

Imply investment returns

Enable cash-out

========================================================
7) BURN MECHANICS FOR SENDING / RECEIVING / SPLITTING (MVP SPEC)

NOTE: In MVP, OT Points are NOT transferable between random users as cash-like value.
To avoid money-transmitter risk and fraud, "send/split" must be limited, utility-only,
and Circle-based with strict constraints.

A) Allowed transfer modes (MVP-safe)

Circle Contribution (utility pool)

Users can contribute OT Points to a Circle "pool" ONLY.

Pool can only be spent on approved sinks that benefit the Circle:

Reserve Drop for group event

Group streak boost (if enabled)

Group unlock (cosmetic badge, non-cash)

Partner Gift Codes (optional, safer than user-to-user)

Points can be converted into a partner-issued "redeem code" (non-cash) if implemented later.

In MVP: keep as a stub/flag unless already required.

B) Burn + Split logic (objective)
All transfers create:

Sender ledger entry: type=spend (amount = full amount leaving sender)

Receiver/pool ledger entry: type=earn (amount = net received)

Burn ledger entry: type=spend (system sink) OR stored as metadata in the transfer record

Define:

Transfer Fee (Burn Fee) = small % or flat fee, only to prevent abuse/spam.

Split transfer = multiple recipients or allocations from one source action.

MVP recommended parameters (safe defaults; admin-configurable)

Burn fee: 1–3% (cap the fee; minimum 1 point, maximum 25 points)

Daily transfer cap: low (e.g., 200 points/day)

Per-transfer cap: low (e.g., 100 points)

Only within Circles OR to self accounts (no public directory)

Cooldown between transfers (e.g., 60 seconds)

All transfers require:

explicit confirmation step

visible explanation that this is non-cash utility

C) Splitting algorithm (objective)
Inputs:

totalAmount (integer points)

recipients: list with weights or equal split

Steps:

Compute burnFee = clamp(round(totalAmount * feePct), minFee, maxFee)

netAmount = totalAmount - burnFee

Allocate netAmount:

equal split: floor(netAmount / n) each, remainder distributed +1 to first R recipients

weighted: compute proportional shares, floor, distribute remainder by largest fractional parts

Ledger:

Sender spend: totalAmount

Burn sink: burnFee (system)

Recipients earn entries sum to netAmount

Invariants:

totalAmount = burnFee + sum(allocations)

allocations are non-negative integers

sender balance never goes below 0

D) Fraud controls (mandatory)

No transfers to unknown users

No transfers that bypass verification loop

Transfer activity logged in audit log

Abnormal patterns trigger soft lock (flag + admin review)

========================================================
8) MONETIZATION (MVP: FREEMIUM + PREMIUM) — MUST FEEL FAIR

Free (must be complete)

Full discovery, redemption, wallet, proof share, follow, limited circles, limited OrbSignal

Premium user (irresistible but not pay-to-win)

Convenience limits (more follows/circles/forecasts)

Better discovery filters (verified-only, legendary nearby, open now)

Cosmetic Proof Card styles (no gameplay advantage)

Early access windows to drops (time-based access, not unlimited gains)

Partner Pro

More perks, scheduling, analytics, QR tooling, export logs, optional partnerConfirm path

Objective constraint:

Premium never "buys trust" and never bypasses verification.

========================================================
9) LEGAL + COMPLIANCE (MVP MUST-HAVES)

Must ship:

Privacy Policy

Terms

Community Guidelines

Acceptable Use

Support + Contact route

Report route

Data deletion request route

Must display:

Location permission disclosures

Analytics disclosures (minimal + opt-out if present)

OrbSignal disclaimers (no wagering, not financial advice)

Must avoid:

Investment language for OT Points

Gambling framing for OrbSignal

========================================================
10) ENGINEERING QUALITY GATES (PASS/FAIL)

Every Sprint ends with proofs:

git diff --stat

npx tsc --noEmit --pretty false --incremental false  (0 errors)

npx expo-doctor  (clean or explained + ticketed)

Boot proof: app launches + required navigation works

docs updated:

docs/BUILD/ROUTES_MAP.md

docs/BUILD/FLAGS_MAP.md

docs/BUILD/ADMINHUB_SCHEMA.md

docs/BUILD/NO_DEAD_BUTTONS.md

docs/BUILD/PHASE_STATUS.md

Hard "do not break"

No blank screen boot

No missing routes

Network failure never bricks the app

No dead buttons

No auto opt-in notifications

No public user directory

========================================================
11) LAUNCH READINESS (MVP GO/NO-GO)

GO only if:

Verified Win loop works 10/10 times on device

Map + OrbSheet feel premium and stable

Redemption + wallet ledger is correct and consistent

Proof share works on iOS + Android

Legal routes exist and are accessible from Settings

Flags allow quick kill-switch if issues arise

Crash reporting + minimal analytics are enabled and validated

========================================================
END CHECKLIST

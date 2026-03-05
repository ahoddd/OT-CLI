# OrbSwipe Fortifications — Implementation Spec

## Overview

Five additive fortifications to make OrbSwipe best-in-class for conversion, retention, virality, partner ROI, and trust.

---

## Phase A — Fuse Engine Never Fails

**Problem:** Low supply makes OrbSwipe feel dead when drops/missions are scarce.

**Solution:** `useFuseEngine` hook always returns actionable outcomes.

### Supply Sources (priority order)
1. Live drops within radius (highest priority)
2. Missions/quests within radius (partner-linked)
3. Partner list within radius (verified partners fallback)
4. Expand radius and retry (only if truly empty)

### Fuse Output Contract
Always returns up to 3 `FuseOutcome` objects (at least 1):
- `RESERVE_BEST_DROP` — best available live drop
- `NAVIGATE_CLOSEST_TRAY_ITEM` — if tray has items, navigate to closest one
- `NAVIGATE_CLOSEST_VERIFIED_PARTNER` — verified partner fallback
- `EXPAND_RADIUS_AND_RETRY` — expand to next radius preset

### No Picks State
When no supply at all, shows 3 actions:
1. Expand radius (next preset)
2. Pick a city (if city selector exists)
3. Open Map Picks (fly to top partners)

### Files
- `hooks/useFuseEngine.ts` — core hook
- `app/orbswipe.tsx` — UI integration (empty state uses Fuse outcomes)
- `constants/OrbSwipeConfig.ts` — `FUSE_*` config constants

---

## Phase B — Card Detail as Premium OrbSheet

**Goal:** Reduce navigation friction and improve conversion.

### Implementation
`OrbSwipeCardDetailSheet` — modal bottom sheet shown when user swipes up on a card.

### Content
- Partner name + Verified badge
- Tier indicator (color dot)
- Distance + scarcity (timer/quantity for drops)
- One PRIMARY CTA (large button): Reserve / Start / Navigate
- Secondary actions: Save, Add to Tray, Show on Map
- "Why you're seeing this" line (Nearby/Trending/Limited/Sponsored)

### Routing Rule
- Does not navigate away unless primary CTA requires it
- When navigating, passes `from=orbswipe` context

### Files
- `components/OrbSwipeCardDetailSheet.tsx` — bottom sheet component
- `app/orbswipe.tsx` — integrated via `isOrbSwipeCardDetailSheetEnabled` flag

---

## Phase C — SavedIntent Pipeline

**Goal:** Right swipes create durable "intent" objects used across the app.

### SavedIntent Model
```typescript
{
  id: string;
  uid: string;
  kind: 'DROP' | 'PARTNER' | 'MISSION' | 'MENU_ITEM';
  refId: string;
  createdAt: number;
  expiresAt?: number;       // default 7 days
  context: { source: 'ORBSWIPE'; tags?: string[] };
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REMOVED';
  displayName?: string;
  displaySub?: string;
  partnerId?: string;
  tier?: string;
}
```

### Creation Rules
- Swipe right creates a SavedIntent (idempotent; no duplicate same refId within 24h)
- Adding to Tray also creates/links to SavedIntent
- Verified action completion marks intent COMPLETED

### Where SavedIntents Surface
1. **Home screen** — "Saved for Tonight" module (max 3) after Live Pulse
2. **Wallet** — "Saved for Tonight" module before "Earn More" section

### Files
- `constants/SavedIntent.ts` — type definitions
- `services/savedIntents.ts` — CRUD service (AsyncStorage-backed)
- `components/SavedIntentModule.tsx` — collapsible UI module
- `app/orbswipe.tsx` — creates intents on swipe right
- `app/(tabs)/index.tsx` — surfaces module
- `app/(tabs)/wallet.tsx` — surfaces module
- `app/scan/success.tsx` — marks intent completed

---

## Phase D — Bring-a-Friend Passes

**Goal:** Viral loop that is real and not abusable. No rewards for invites unless friend completes verified win.

### FriendPass Model
```typescript
{
  id: string;
  creatorUid: string;
  partnerId: string;
  partnerName: string;
  dropId?: string;
  createdAt: number;
  expiresAt: number;         // default 48 hours
  limit: number;             // max claims (default 1)
  claimedBy: string[];
  rewardSpec: { friendBonusPoints: number; creatorBonusPoints: number };
  status: 'ACTIVE' | 'EXPIRED' | 'USED_UP';
}
```

### Flow
1. User completes OrbSwipe-origin verified win
2. FriendPassOffer shown in scan/success screen
3. User creates pass → share deep link
4. Friend opens link, claims pass
5. Friend must complete verified win to activate reward
6. Only then: friend gets bonus, creator gets tiny bonus

### Anti-abuse
- Friend and creator cannot be same account
- Rate limit: max 5 passes per creator per week
- Idempotent claims (cannot claim twice)
- Configurable expiry, max claims, bonus caps

### Ledger Reasons
- `EMIT_FRIEND_PASS_FRIEND_BONUS` — friend's bonus after verified win
- `EMIT_FRIEND_PASS_CREATOR_BONUS` — creator's small bonus

### Files
- `constants/FriendPass.ts` — type definitions
- `services/friendPass.ts` — CRUD + claim service
- `components/FriendPassOffer.tsx` — offer UI in scan success
- `app/scan/success.tsx` — integration point
- `constants/OrbinomicsPolicy.ts` — new ledger reasons
- `constants/OrbSwipeConfig.ts` — `FRIEND_PASS_*` config constants

---

## Phase E — Partner Cockpit Growth Suggestions

**Goal:** Make Pro partners feel like OrbTap prints them customers, deterministically.

### Inputs
- OrbSwipe analytics events (impressions, opens, CTA clicks, verified conversions)
- Bucketed by: hour of day, card type, conversion rates

### Output (deterministic, not AI)
Pro sees full panel, Premium sees one tip, Free sees none.

Suggestions:
1. "Best time to post today" — top conversion hour
2. "Best template this week" — highest conversion rate
3. "Recommended drop window length" — 2–3h if high conversion
4. "Recommended headline length" — short wins

Each suggestion has a one-tap action:
- "Create card using best template"
- "Schedule for best time"
- "Duplicate best performer"

### Tier Gate
| Partner Tier | View |
|---|---|
| Platinum (Pro) | Full panel (up to 4 suggestions) |
| Gold (Premium) | Tip of the week (1 suggestion) |
| Silver (Free) | None |

### Files
- `hooks/useGrowthSuggestions.ts` — deterministic suggestions engine
- `components/PartnerGrowthSuggestions.tsx` — UI panel
- `app/partner/dashboard.tsx` — integration point
- `constants/OrbSwipeConfig.ts` — `GROWTH_SUGGESTIONS_TIERS` config

---

## Feature Flags

All flags default ON (`true`):

| Flag | Default | Description |
|---|---|---|
| `isOrbSwipeFuseNeverFailsEnabled` | `true` | Fuse Engine fallback |
| `isOrbSwipeCardDetailSheetEnabled` | `true` | Card Detail bottom sheet |
| `isOrbSwipeSavedIntentsEnabled` | `true` | SavedIntent pipeline |
| `isOrbSwipeFriendPassesEnabled` | `true` | Friend Passes |
| `isOrbSwipePartnerGrowthSuggestionsEnabled` | `true` | Partner Growth Suggestions |

When any flag is OFF, the feature hides cleanly with no errors.

---

## Admin Controls

Tunable via `constants/OrbSwipeConfig.ts`:

| Config | Default | Description |
|---|---|---|
| `FUSE_RADIUS_PRESETS_MI` | `[1, 5, 10, 15, 25]` | Expand radius steps |
| `FUSE_MIN_SUPPLY_THRESHOLD` | `1` | Min supply before fallback |
| `FUSE_MAX_RESULTS` | `3` | Max Fuse outcomes |
| `SAVED_INTENT_EXPIRY_DAYS` | `7` | Intent auto-expire |
| `SAVED_INTENT_MAX_ACTIVE` | `20` | Max active intents |
| `FRIEND_PASS_EXPIRY_HOURS` | `48` | Pass auto-expire |
| `FRIEND_PASS_MAX_PER_WEEK` | `5` | Rate limit per creator |
| `FRIEND_PASS_MAX_CLAIMS` | `1` | Max claims per pass |
| `FRIEND_PASS_FRIEND_BONUS_POINTS` | `25` | Friend bonus |
| `FRIEND_PASS_CREATOR_BONUS_POINTS` | `10` | Creator bonus |
| `GROWTH_SUGGESTIONS_TIERS` | `{silver: 'none', gold: 'tip', platinum: 'full'}` | Per-tier visibility |

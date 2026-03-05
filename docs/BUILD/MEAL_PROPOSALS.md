# Meal Proposals — Spec & Tier Gates

## Overview
Partners publish Breakfast/Lunch/Dinner "Meal Proposals" that appear in OrbSwipe for individual users (Solo) and spheres (CoupleSphere, PalSphere, FamilySphere). Users swipe proposals into Tray, then "Fuse My Meal" creates a dining plan/mission with optional Drop reservation and QR-verified check-in.

## Data Model

### MealProposal
- `id`, `partnerId`, `status` (DRAFT|PUBLISHED|PAUSED|EXPIRED|REMOVED)
- `mealType` (BREAKFAST|LUNCH|DINNER), `title` (6-60 chars), `description` (20-240 chars)
- `photos` (0-3), `pricing` (per person or total, currency, tax/tip note)
- `partySize` (min/max/recommended), `menuItems` (1-10 items)
- `availability` (days of week, start/end, expiry), `targeting` (radius, tags, sphere targets)
- `cta` (NAVIGATE|RESERVE|CLAIM|BOOK), `trust` (requiresPartnerVerified, moderation)
- `analytics` counters (impressions, opens, trayAdds, fuseSelects, navigations, reservations, verifiedRedemptions)

### MealPlan
- Created from Fuse: `scope` (SOLO|SPHERE), `sphereId`, `selectedProposalId`, `partnerId`
- `steps`: NAVIGATE_TO_PARTNER → DROP_RESERVE → QR_REDEEM → VERIFIED_REVIEW
- `status` (ACTIVE|COMPLETED|CANCELED), `verifiedActionId`, `proofId`

### MealProposalAction (analytics)
- Full funnel: IMPRESSION → OPEN → SWIPE_RIGHT_TRAY → FUSE_SELECT → NAVIGATE → RESERVE → CLAIM

## Tier Gates (Partner)

| Feature | Silver (Free) | Gold (Premium) | Platinum (Pro) |
|---------|--------------|----------------|----------------|
| Max active proposals | 2 | 6 | 15 |
| Max photos | 2 | 3 | 3 |
| Scheduling | No | Yes | Yes |
| Targeting (radius/tags) | No | Yes | Yes |
| A/B testing | No | No | Yes |
| Analytics level | Basic | Advanced | Full |
| Max proposals/day | 2 | 5 | 10 |
| Studio insights | No | Yes | Yes |
| Duplicate best performer | No | No | Yes |

All limits are admin-configurable via `constants/MealProposalTierConfig.ts`.

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `orbswipe.mealProposals` | ON | Global toggle |
| `partner.mealProposalComposer` | ON | Partner composer |
| `orbswipe.mealTrayFuse` | ON | Tray + Fuse My Meal |
| `orbswipe.mealAnalytics` | ON | Analytics tracking |
| `orbswipe.mealTierGates` | ON | Tier enforcement |
| `orbswipe.mealScheduling` | ON | Scheduling (Premium/Pro) |
| `orbswipe.mealTargeting` | ON | Targeting (Premium/Pro) |
| `orbswipe.mealABTest` | OFF | A/B testing (Pro only) |
| `orbswipe.mealSphereVote` | ON | In-sphere voting |
| `orbswipe.mealVerifiedReview` | ON | Verified review after check-in |

## Routes

| Route | File | Description |
|-------|------|-------------|
| `/meal-mode` | `app/meal-mode.tsx` | Full-screen Meal Mode |
| `/partner/meal-proposals` | `app/partner/meal-proposals.tsx` | Partner Meal Studio |

## Entry Points
- Partner Dashboard → "Meal Studio" card
- Sphere detail page → "OrbSwipe Meals" card (pre-filtered to sphere type)
- Direct navigation to `/meal-mode`

## User Flow
1. Open Meal Mode (full-screen, no chrome)
2. Top rail filters: Meal type, Budget, Party size, Radius, Vibe chips
3. Swipe cards: Right = add to tray, Left = dismiss, Up = "Lock it in" (detail)
4. Tray fills → "Fuse My Meal" CTA appears
5. Fuse returns 1-3 options: Best Pick, Best Value, Best Tonight
6. Select → MealPlan created with steps
7. Navigate → QR Check-in → VerifiedAction (MEAL_PLAN_COMPLETE)
8. Recap share card → Verified review CTA

## Sphere Features
- Sphere Mode: Opens Meal Mode pre-filtered to sphere type
- Sphere Vote: Members tap 👍 on tray items; votes affect Fuse ranking
- "Ready?" indicator shows how many members have voted

## Compare
- When Tray has 2+ proposals, "Compare" button opens side-by-side sheet
- Shows: price, distance, top 3 menu items, vibe tags, availability

## Trust / Safety
- No external links/phone/email in proposal fields (blocked at input)
- Partner must be verified to publish (drafts allowed if not)
- Report proposal button in detail sheet
- "Pricing is accurate" confirmation checkbox required at publish
- User can report "price inaccurate" from card

## Verified Review Unlock
- After QR check-in (MEAL_PLAN_COMPLETE), user can leave a verified review
- Review linked to proofId; one per (uid, partnerId, proofId)
- Min 8 chars for text (optional if rating-only)
- Review shows "Verified via Meal Check-in" badge

## Partner Studio Insights (Premium/Pro)
- Best time to post (based on 14-day conversion data)
- Recommended party size (based on selections)
- Pro: Duplicate best performer quick action

## Analytics Funnel
- Tracked: impressions → opens → tray adds → fuse selects → navigations → reservations → verified redemptions
- Partner dashboard shows funnel per proposal and aggregate
- Admin: top partners by verified completions

# OrbTap — Benchmark Patterns (Phase 0)

Generated: 2026-03-04

This document identifies specific, implementable UX patterns from top apps that OrbTap should adopt.
No web browsing was used — these are based on deep product knowledge.
Each pattern includes: what it is, why it works, and exactly how to implement it in OrbTap's stack.

---

## Pattern 1 — Uber: One Dominant CTA Per Screen

### What Uber Does
Every Uber screen has exactly ONE primary CTA that is visually dominant. Secondary actions are dimmed or hidden in overflow menus. The primary action is always visible, always reachable with one thumb, and always describes the outcome — not the action.

Examples:
- Uber Home: Giant "Where to?" bar (not "Search" — the OUTCOME)
- Ride confirmation: One giant "Confirm UberX — $12.50" (not "Confirm")
- "Your driver is 3 min away" — one action: "Contact" (not a list of options)

### Why It Works
Decision fatigue kills conversion. When users see multiple equal-weight CTAs they hesitate. One dominant CTA eliminates hesitation and drives the single highest-value next action.

### OrbTap Implementation

**OrbSheet (partner detail):**
```
CURRENT: [Get Directions] [View Perk] [Follow] [Share]  ← 4 equal pills
SHOULD BE:
  ● PRIMARY (full-width): "Redeem Perk — 50 OT Points"     ← outcome-named
  ● SECONDARY (row): [Directions] [Follow] [More ↓]         ← utility
```

**Perk Detail:**
```
CURRENT: Multiple CTAs + info sections without clear hierarchy
SHOULD BE:
  ● PRIMARY: "Scan to Redeem" (full-width, gold, large)
  ● SECONDARY: "Save for Tonight" (ghost)
  ● Tertiary: Info accordion below
```

**Scan Success:**
```
CURRENT: Multiple equal-weight options
SHOULD BE:
  ● PRIMARY: "Share Your Proof" (full-width) → drives viral loop
  ● SECONDARY: "See My Wallet" (ghost)
```

**Files to Update:**
- `components/OrbSheet.tsx` — CTA hierarchy
- `app/perk/[id].tsx` — single dominant CTA
- `app/scan/success.tsx` — "Share" as hero CTA

---

## Pattern 2 — Apple Wallet: Stacked Card UX

### What Apple Wallet Does
- Cards stack visually with slight vertical offset (depth perception)
- Tapping a card expands it to full detail
- Swipe to switch between cards (horizontal at collapsed, vertical within)
- Card visual matches the card's identity (brand color, logo, relevant data)
- Passes animate smoothly with spring physics

### Why It Works
Stacked cards convey "I have things of value here" at a glance. The stack interaction creates satisfying discoverability without overwhelming the user with a list.

### OrbTap Implementation

**Stamp Cards (Wallet tab):**
```
CURRENT: StampCardStack exists but uses basic list rendering
SHOULD BE:
  - Cards visually stack with transform: [{ translateY: index * -8 }]
  - Closest-to-reward card is on top
  - Tap to expand → spring animation to full card detail
  - Progress dots baked into the card face (not below)
```

**Proof Cards (Wallet ledger):**
```
CURRENT: Flat list of ledger entries
SHOULD BE:
  - Top 3 most recent Proof Cards stacked (like boarding passes)
  - Below: flat "All transactions" ledger
  - Each stacked card has partner branding + OT earned
```

**Files to Update:**
- `components/StampCardStack.tsx` — add transform offset + spring expand
- `app/(tabs)/wallet.tsx` — proof card stack at top
- `components/RewardLockerSection.tsx` — integrate with stack UI

---

## Pattern 3 — Tinder / Hinge: Swipe Physics

### What Tinder Does
- Cards have realistic spring physics (not CSS transitions)
- Card rotation correlates with horizontal velocity (feels physical)
- Action indicators (heart/X) appear at threshold velocity, not just direction
- Snap-back when released under threshold (commitment required)
- Undo available (reduces anxiety, increases risk-taking)
- Card below is visible before swipe completes (depth queue)
- Haptic on cross threshold + on decision

### Why It Works
Physicality creates engagement. When an interface responds like a real object, interaction becomes pleasurable. Decision friction (undo + threshold) makes the choice feel considered, not accidental.

### OrbTap Implementation

**OrbSwipe (`app/orbswipe.tsx` + `components/OrbSwipeCardStack.tsx`):**
```
CURRENT: Swipe exists but needs physics audit
ISSUES FOUND:
  - Rotation may not be velocity-based (check gesture velocity usage)
  - Action indicators (Add/Skip) appear immediately on drag, not at threshold
  - No visible card underneath during swipe
  - Missing: undo last swipe

SHOULD BE:
  - Rotation: card.rotate = gesture.translationX / SCREEN_W * 15 (deg)
  - Action alpha: Math.min(1, Math.abs(translationX) / (SCREEN_W * 0.3))
  - Threshold: SCREEN_W * 0.35 → commit; below → snap back with spring
  - Haptic on threshold cross
  - Card N+1 visible behind with scale: 0.95, opacity: 0.7
  - "Undo" button appears after first swipe
```

**Meal Mode (`app/meal-mode.tsx`):**
```
Same physics — already uses OrbSwipe stack. Verify physics are consistent.
```

**Files to Update:**
- `components/OrbSwipeCardStack.tsx` — velocity-based rotation, threshold haptic
- `components/OrbSwipeCardView.tsx` — action indicators at threshold only
- `app/orbswipe.tsx` — undo button, card depth

---

## Pattern 4 — DoorDash: Commerce Hierarchy

### What DoorDash Does
- Restaurant card: photo → name → category → rating → delivery info → distance
- Information hierarchy is ALWAYS: visual → name → category → key metric → action
- Menu sections collapse to save scroll; expand on tap
- "Add to cart" is always visible (sticky), never requires scroll
- Price always visible before CTA (no surprises)
- "Popular" and "Recommended" chips guide decision-making (social proof on item level)
- Active orders shown in persistent pill (you always know where you are in a flow)

### Why It Works
Commerce hierarchy (visual → social proof → friction reduction → CTA) converts browsers to buyers. The persistent "active order" pill prevents abandonment — you always know you're in a flow.

### OrbTap Implementation

**Partner Card (Grid view):**
```
CURRENT: PartnerGridCard shows name + category + some info
SHOULD MATCH DoorDash hierarchy:
  1. Hero image (top 40% of card) ← most important
  2. Partner name (bold, 17px) + tier badge
  3. Category · distance · "Open Now" chip
  4. Top perk teaser: "Free Coffee with 150 OT" ← drives desire
  5. Verified badge (trust signal)
  6. (No explicit CTA — tapping the card IS the action)
```

**Perk Detail (`app/perk/[id].tsx`):**
```
CURRENT: Good info but missing social proof
ADD:
  - "247 people redeemed this month" (social proof)
  - "Last redeemed 4 min ago" (urgency)
  - Cooldown timer if applicable
  - Cost breakdown: "150 OT = ~$3 value" (framing)
```

**Active Plan Pill (OrbSwipe → Execute):**
```
CURRENT: OrbSwipe tray exists but not persistent across app
SHOULD BE:
  - When user has active plan (saved OrbSwipe tray), show persistent pill
  - Pill: "Tonight: 3 stops · ~240 OT" (tap to expand tray)
  - Visible on home, wallet, profile tabs
  - Dismiss only after completion or explicit cancel
```

**Partner Menu (`app/partner/menu/index.tsx`):**
```
DoorDash-style collapsed sections:
  [Starters (3)] [expand ↓]
  [Mains (7)] [expand ↓]
  [Drinks (4)] [expand ↓]
Current: All items always visible (scroll heavy)
```

**Files to Update:**
- `components/PartnerGridCard.tsx` — 5-tier hierarchy
- `app/perk/[id].tsx` — social proof + urgency
- `app/(tabs)/_layout.tsx` — persistent active plan pill
- `app/partner/menu/index.tsx` — collapsed sections

---

## Pattern 5 — Duolingo: Streak Psychology (Without Being Annoying)

### What Duolingo Does
- Streak counter is ALWAYS visible on home screen (first thing you see)
- Daily goal is small (5 min) — achievable reduces quit rate
- Streak at risk: yellow flame → orange flame → "You're about to lose your streak!" (proactive, not punishing)
- Streak freeze: costs in-app currency (utility sink that feels fair)
- Streak milestone celebrations: 7, 30, 100, 365 days
- "You're on a roll" positive reinforcement after completion
- Miss a day: "Your streak is safe with a streak shield" — never shame, always a path forward

### Why It Works
Variable reward schedules + loss aversion + achievability + milestones = the most powerful habit loop in consumer apps. Duolingo retains users primarily through streak anxiety (FOMO for their own progress), not content quality.

### OrbTap Implementation

**Streak (already exists — enhance it):**
```
CURRENT: DailyStreakOrb in orb hub; streak tracking works
MISSING:
  1. Streak is NOT visible on home (Discovery Hub) — ADD streak chip to header
  2. No "streak at risk" evening push notification
  3. Streak shields exist (power-up) but not surfaced at risk moment
  4. Milestone celebrations for 7/30/100 days need animation + badge
  5. Miss day: show recovery path ("Activate streak shield to protect it")
```

**Daily Missions:**
```
CURRENT: Missions exist with daily reset
MISSING:
  1. Mission completion animation needs more celebration
  2. "2/3 missions done — Bonus round unlocked" banner → ✅ Sprint 12 added this
  3. Push notification at 9am: "Your missions are ready"
  4. Optional: "Bonus mission" at 6pm if all 3 done (drives evening engagement)
```

**Files to Update:**
- `app/(tabs)/index.tsx` — streak chip in header
- `app/(tabs)/orb.tsx` — streak shield surfaced at-risk
- `hooks/useStreak.ts` — add "at risk" detection
- `services/pushNotifications.ts` — morning + evening streak notifications

---

## Pattern 6 — Robinhood: Prediction UI Clarity (OrbSignal)

### What Robinhood Does for Predictions/Crypto
- Large, clear primary number (price) dominates
- % change uses color + direction arrow (no ambiguity)
- Charts are clean with single interaction mode (tap = price at point)
- Forecasts show upside/downside scenario clearly
- Disclosures are present but not overwhelming
- Actions are clear: one dominant CTA per state

### Why It Works
Financial anxiety disappears when information is clear, hierarchical, and unambiguous. Robinhood democratized investing by making it look simple (even if it isn't).

### OrbTap OrbSignal Implementation
```
CURRENT: OrbSignal list and detail exist but UI complexity is mixed
SHOULD APPLY Robinhood clarity:

Market Detail (/orbsignal/[id]):
  1. Market question (large, clear, 1-2 lines max)
  2. Current "odds" bar (visual proportion of forecasts A vs B)
  3. Your position (if any): "You predicted A with 1,200 FP"
  4. Time remaining: countdown timer
  5. Disclaimer: 1 line, small text ("Entertainment only. Not financial advice.")
  6. ONE CTA: "Make your forecast" or "Change forecast"

Market List:
  1. Category chip filter (All · Politics · Sports · Local · Business)
  2. Each card: Question + visual bar + time remaining + forecast count
  3. "Trending" badge on hot markets
```

**Files to Update:**
- `app/orbsignal/index.tsx` — category filter + cleaner card
- `app/orbsignal/[id].tsx` — Robinhood-style hierarchy
- `components/SignalCard.tsx` — visual bar + time remaining

---

## Pattern 7 — Instagram: Social Proof Loop

### What Instagram Does
- Activity feed shows friends' actions first (not chronological)
- "X and 47 others liked this" — aggregated social proof
- Share to Stories creates viral content with one tap
- Profile is a portfolio — curated identity, not a settings page
- "Following" tab shows what people I follow are engaging with

### Why It Works
Social proof triggers FOMO and validation simultaneously. Seeing friends act makes you want to act. Profiles as portfolios make users invested in curating them.

### OrbTap Implementation

**OrbPulse (the Instagram feed equivalent):**
```
CURRENT: OrbPulse shows all verified actions in city
ADD:
  1. "From People You Follow" section at top of feed (before "City" feed)
  2. Friend activity: "[Friend] just verified at [Partner] — 3 min ago"
  3. Aggregate: "12 people in your city visited [Partner] today"
  4. "Trending in [City]" section with partner photo + verification count
```

**Profile (the portfolio):**
```
CURRENT: Profile shows XP, badges, streak — feels like dashboard
REFRAME AS: "Your verified city record"
  1. Header: "[Name]'s OrbTap Profile" → "[Name] in [City]"
  2. Verified visits count prominently (like "posts" on Instagram)
  3. Top partners (3 most visited) shown as mini cards
  4. Streak displayed as primary status symbol
  5. Recent proof cards as grid (like Instagram grid)
```

**Files to Update:**
- `app/pulse.tsx` — "Following" section at top
- `app/(tabs)/profile.tsx` — portfolio framing
- `hooks/useSocial.ts` — expose following feed separately

---

## Pattern 8 — Airbnb: Trust-First Discovery

### What Airbnb Does
- Every listing: photos first (visual promise)
- Immediately: reviews count + rating (trust signal, not buried)
- Superhost badge prominent (verified quality)
- Price/value visible without opening detail (no bait-and-switch)
- "X people are looking at this right now" — scarcity signal
- Map + list are equally first-class modes of discovery

### Why It Works
Trust is the conversion bottleneck in all marketplace apps. When users trust the listing, they convert. Airbnb solved this by making trust signals visible at every decision point.

### OrbTap Implementation

**Partner Cards:**
```
CURRENT: Name + category + tier badge
ADD:
  - Verified badge prominently (not small)
  - Review count: "★ 4.8 (23 reviews)"
  - "X people visited this week" — scarcity/social proof
  - "Gold Partner" tier label (not just a small icon)
```

**OrbSheet:**
```
CURRENT: Partner info + perks
ADD:
  - 1-2 top reviews inline (Airbnb-style snippet)
  - "Verified Partner since [date]" trust signal
  - "X OrbTap verifications this month"
```

**Perk Detail:**
```
CURRENT: Terms + cooldown
ADD:
  - "247 redeemed" count (social proof)
  - Partner "trust score" (if implemented)
  - Clear expiry/cooldown communication
```

**Files to Update:**
- `components/PartnerGridCard.tsx` — reviews + verification count
- `components/OrbSheet.tsx` — trust signals
- `app/perk/[id].tsx` — social proof numbers

---

## Pattern 9 — Snapchat/BeReal: Authenticity Signals

### What BeReal Does
- Proof of presence is the product (you were ACTUALLY there)
- No editing, no filters = trust
- "BeReal" notification drives synchronized participation
- Seeing friends' "real" moments creates intimacy

### Why OrbTap Should Use This
OrbTap's QR verification IS BeReal's "proof of presence" mechanic. This is a genuinely differentiated insight that no loyalty app has made central to their UX.

### OrbTap Implementation

**Proof Cards should LEAN INTO authenticity:**
```
CURRENT: Proof Card shows partner + OT earned + timestamp
ADD:
  - "Verified in person" prominent badge
  - Timestamp down to the minute ("Today at 7:43 PM")
  - "You were actually here. That's rare." copy
  - Option: selfie attachment (opt-in) to proof card for authenticity

FRAMING: Not "You earned points" but "You were there. Proven."
```

**OrbPulse feed:**
```
- Each card: "[Name] was verified at [Partner] at [time]"
- Not "earned 50 OT" (makes it feel like a game)
- "Was there" (makes it feel like a memory/status)
```

**Files to Update:**
- `app/proof/[id].tsx` — "Verified in person" hero badge
- `app/scan/success.tsx` — "You were there. Proven." celebration copy
- `app/pulse.tsx` — authentic "was there" framing

---

## Pattern 10 — Google Maps: Navigation as Product

### What Google Maps Does for Local Discovery
- Star ratings on map pins (visible without tapping)
- "Open now" chip on list items
- "Popular times" chart (FOMO + planning tool)
- "People also visit" suggestions drive exploration
- Directions integrated with transit + walk + drive
- Photos from visitors (not just the business)

### OrbTap Implementation

**Map Orb Pins:**
```
CURRENT: Tier-colored orb pins with verified dot
ADD:
  - "Open now" green dot or "Closes in 1h" amber dot on pin
  - On focused state: show perk teaser "Free Coffee" below name
  - On clustered view: show cluster count with tier color of dominant tier
```

**MapNearbyTray:**
```
CURRENT: Shows nearby partners in horizontal scroll
ADD:
  - "Popular right now" ranking (by recent verified actions)
  - "Closes soon" urgency on cards with closing time
  - "Someone verified here 12 min ago" social proof
```

**Files to Update:**
- `components/OrbPin.tsx` — open now indicator
- `components/MapNearbyTray.tsx` — real-time popularity
- `components/OrbSheet.tsx` — "Popular times" chart for pro partners

---

## Implementation Priority Summary

| Pattern | Impact | Effort | Phase |
|---------|--------|--------|-------|
| Uber: Single dominant CTA | ★★★★★ | Low | Phase 2 |
| Duolingo: Streak psychology | ★★★★★ | Medium | Phase 2 |
| Apple Wallet: Stacked cards | ★★★★ | Medium | Phase 2 |
| Airbnb: Trust-first discovery | ★★★★ | Medium | Phase 2 |
| BeReal: Authenticity signals | ★★★★ | Low | Phase 2 |
| DoorDash: Commerce hierarchy | ★★★★ | Medium | Phase 2 |
| Instagram: Social proof loop | ★★★★ | High | Phase 3 |
| Google Maps: Navigation | ★★★ | Medium | Phase 3 |
| Tinder: Swipe physics | ★★★ | Medium | Phase 5 |
| Robinhood: Prediction clarity | ★★★ | Low | Phase 2 |

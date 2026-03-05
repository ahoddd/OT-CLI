# OrbTap — North Star Audit (Phase 0)

Generated: 2026-03-04

---

## Section 1: North Star Assessment — Should We Keep or Replace?

### Verdict: SHARPEN, DON'T REPLACE

The existing North Star loop is fundamentally correct and defensible. Discarding it would be a mistake — it maps cleanly to a real behavior pattern (visit → verify → reward) that has proven product-market fit with Foursquare, Shopkick, and loyalty apps globally.

**However**, the current North Star has three structural weaknesses that prevent it from being habit-forming and profitable at scale:

1. **Missing COMMIT step** — users jump from "Discover" straight to "Verify" with no planning/reservation moment. This skips the single most powerful behavioral mechanic in all of commerce: **commitment creates follow-through.** When you plan to go somewhere, you go. When you don't plan, you don't.

2. **The "why" is too abstract** — "Earn OT Points" is not intrinsically motivating. The deeper motivation is **social status, bragging rights, and verified identity**. The app has this (Proof Cards!) but buries it under the point economy framing.

3. **Everyday pull is too thin** — the current loop only works when you're physically at a location. What brings users back on days they're not going anywhere? OrbSignal, OrbPulse, and Missions exist but aren't prominent enough.

---

## Section 2: Proposed North Star — Sharpened Version

### OrbTap's True North Star: "Verified Status in Your City"

> **OrbTap = The unfakeable record of your city life.**
>
> You discover what's hot → you commit to a plan → you show up and prove it → you earn rare artifacts → you build a verified city identity → others follow your lead.

### The 7-Step Loop (Sharpened)

```
DISCOVER → COMMIT → SHOW UP & VERIFY → EARN ARTIFACT → BUILD IDENTITY → SHARE & FLEX → UNLOCK ACCESS
```

| Step | What Happens | Current State | Gap |
|------|-------------|---------------|-----|
| **1. DISCOVER** | User finds what's hot near them — live map, OrbPulse, OrbSwipe | ✅ Working (Discovery Hub) | OrbPulse not prominent enough on home; "Tonight" not surface-level |
| **2. COMMIT** | User reserves a drop, locks a plan, or adds to OrbSwipe tray | ⚠️ Partial (OrbSwipe tray exists) | No prominent "lock tonight's plan" CTA from home; Drop reservation not in main flow |
| **3. SHOW UP & VERIFY** | QR scan at location → verified action minted | ✅ Working | Scan success celebration underpowered; no "you committed, now go" reminder push |
| **4. EARN ARTIFACT** | Proof Card generated with partner + points + tier + timestamp | ✅ Working | Proof Card not celebrated enough; hidden behind /proof/[id] route |
| **5. BUILD IDENTITY** | Profile = verified city resume — badges, streak, rank | ⚠️ Partial | Profile shows XP/badges but framing isn't "city identity" — feels like a dashboard not a resume |
| **6. SHARE & FLEX** | Share Proof Card, post to OrbPulse, challenge friends | ✅ Working | Share sheet works; OrbPulse connection is there but not frictionless enough |
| **7. UNLOCK ACCESS** | Verified track record → better perks, early drops, Legendary tier | ⚠️ Partial (tier system exists) | Tier benefits not clearly communicated; access gating is mostly cosmetic right now |

---

## Section 3: Break Points — Exact Locations and Fixes

### Break 1: No COMMIT Step in the Main Flow

**Problem:** Map → OrbSheet → "View Perk" → Perk Detail → "Redeem" (jumps to scanner). There is no "I'm planning to go here tonight" step between discovery and redemption.
**Impact:** Low follow-through, low return visits, weak evening habit.
**Behavioral Science:** Commitment devices (Cialdini, Kahneman) massively increase follow-through. "I'll go tonight" triggers completion.

**Files involved:**
- `components/OrbSheet.tsx` — primary CTA bar
- `app/(tabs)/index.tsx` — Discovery Hub
- `app/orbswipe.tsx` — has tray but not connected to map

**Fix:**
- Add "Plan Tonight" / "Save for Later" as a prominent secondary CTA in OrbSheet alongside "Redeem"
- Surface OrbSwipe tray as "Tonight's Plan" chip on the Discovery Hub header
- Add evening push notification: "Your plan for tonight → 3 spots saved, ready to go?"
- On Scan Success: show "Next stop in your plan →" if user has saved intent

---

### Break 2: First Verified Win Not Guaranteed in Onboarding

**Problem:** `app/auth/onboarding.tsx` shows slides and invite prompt but does NOT guide the user to their first scan. New users often never complete their first verified win.
**Impact:** Catastrophic — if user doesn't get a first win in session 1, 70% never come back (industry standard).
**Behavioral Science:** Onboarding must deliver the core value promise within 60 seconds. "I showed up, I scanned, I earned" must happen in the first session.

**Files involved:**
- `app/auth/onboarding.tsx` — final slide goes to `/invite/` instead of Map
- `components/GettingStartedUserChecklist.tsx` — exists but hidden behind dismissal

**Fix:**
- Final onboarding slide: "Ready for your first verified win? Let's find one now" → pushes to `/(tabs)` with Discovery Hub in Grid mode + filter "Nearby + Open Now" pre-applied
- `GettingStartedUserChecklist` should be prominent on first session, not dismissable until step 1 complete
- Add "First Win" milestone: first scan triggers special celebration animation + bonus OT Points + prompted to share

---

### Break 3: Proof Card Undercelebrated

**Problem:** After scanning, user sees `ScanSuccessScreen` but must tap "View Proof" to see the card. The most shareable artifact is behind an extra tap.
**Impact:** Low share rate → broken viral loop → no organic growth.

**Files involved:**
- `app/scan/success.tsx` — "View Proof" is a secondary action, not the hero
- `app/proof/[id].tsx` — card exists but requires navigation

**Fix:**
- Inline the Proof Card preview directly on `ScanSuccessScreen` (not full screen, but enough to see it)
- "Share this" should be the primary CTA, not secondary
- Confetti/particle animation on first win (tasteful, not casino)
- Add: "X people in your city earned this today" → social proof that drives sharing desire

---

### Break 4: Wallet Is Passive, Not Motivating

**Problem:** `app/(tabs)/wallet.tsx` shows balance and ledger, but doesn't answer "What should I do next to earn more?" clearly.
**Impact:** Users check balance, feel good or indifferent, then close. No next action.

**Files involved:**
- `app/(tabs)/wallet.tsx` — balance + ledger + stamp cards
- `components/Wallet/WalletActions.tsx` — exists but could be more prominent

**Fix:**
- Hero section: "You're 150 OT away from [next milestone/perk]" — progress bar toward goal
- "Earn more today" contextual strip: 3 nearby partners with active perks they haven't redeemed
- "Spend wisely" strip: top 3 power-ups by value
- Stamp card progress front-and-center (most tangible progress indicator)

---

### Break 5: OrbPulse Not Surface-Level Enough

**Problem:** OrbPulse (the live verified proof feed) is a killer retention mechanic — seeing friends/others verify creates FOMO. But it's buried at `/pulse`, not on the home tab.
**Impact:** Users miss the social proof that would drive daily opens.

**Files involved:**
- `app/(tabs)/index.tsx` — no OrbPulse integration in default state
- `components/LiveActivityPill.tsx` — exists but only shows in map mode

**Fix:**
- Add "Live Now" strip to Discovery Hub above filter bar (3 most recent verified actions in city, auto-updating)
- In Grid mode: interleave "Recent Wins" cards between partner grid sections
- In Orb Hub: "Live in [City]" module showing 3-5 proof cards from last hour

---

### Break 6: Partner ROI Dashboard Incomplete Funnel

**Problem:** `app/partner/dashboard.tsx` shows verified visits and impressions but the conversion funnel (View → Sheet Open → Perk Tap → Redeem → Return Visit) is not visualized as a funnel.
**Impact:** Partners can't see where they're losing users → can't optimize → don't see OrbTap's value → churn.

**Files involved:**
- `app/partner/dashboard.tsx` — has chart bars but not funnel
- `services/partnerAnalytics.ts` — data exists
- `app/partner/orbpilot/analytics.tsx` — OrbPilot analytics separate

**Fix:**
- Add conversion funnel visualization: `Impressions → Profile Views → Perk Views → Scans → Verified → Return`
- Add "Repeat Visitors" metric (users who scanned >1 time in 30d) — this is the killer metric for partner ROI
- Add "Revenue estimate" based on verified visits × average spend (admin-configurable multiplier)
- Export button for verified visit log (CSV) — partners need this for accounting

---

### Break 7: No Proactive Daily Engagement Mechanic (Morning Hook)

**Problem:** The app has no reason to open it before leaving the house. Missions exist but their notification is not set up.
**Impact:** Low DAU, no morning habit formation.

**Files involved:**
- `services/pushNotifications.ts` — infrastructure exists but push sending is TODO
- `app/missions.tsx` — missions exist but not pushed daily
- `hooks/useStreak.ts` — streak tracking exists

**Fix:**
- 9am push: "Your daily missions are ready — earn up to 450 OT today"
- 6pm push: "You haven't verified today — don't break your [N]-day streak"
- "Tonight" planning notification (opt-in): "3 spots are going live tonight near you →"
- These need Cloud Functions implementation (currently stubbed)

---

### Break 8: Tier Advancement Isn't Motivating Enough

**Problem:** Silver → Gold → Platinum/Legendary tier progression exists but users don't see a clear, compelling list of what they unlock at each tier that would make them want to level up.

**Files involved:**
- `constants/TierBenefits.ts` — exists
- `app/premium.tsx` — benefits listed but not compared side-by-side
- `app/(tabs)/profile.tsx` — shows current tier but no "upgrade path" urgency

**Fix:**
- Profile: show progress bar toward next tier with "N verified wins away from Gold"
- Premium page: 3-column comparison table (Silver / Gold / Platinum) with specific numbers
- After each verified win: show "You're getting closer to Gold — N wins to go" micro-animation

---

## Section 4: Everyday Use Case Audit

OrbTap must be useful at three moments of the day to become a habit:

| Time | Use Case | Current Support | Gap |
|------|----------|----------------|-----|
| **Morning (7-9am)** | "What can I earn today? What are today's missions?" | Missions tab + orb hub | No morning push, missions not front-and-center on wake |
| **Midday (12-2pm)** | "Where should I eat? What deals are near me?" | Discovery Hub + map | Strong here — grid + swipe works well |
| **Evening (6-10pm)** | "What's happening tonight? Where should I go?" | OrbSwipe + Tonight page | Tonight page underutilized; needs evening push |
| **Any time (ambient)** | "What are people doing in my city?" | OrbPulse | OrbPulse buried; needs home integration |
| **Social moment** | "Look what I just did at [partner]" | Proof Card share | Share UX good but reach-back viral loop weak |

---

## Section 5: Partner Everyday Value Audit

For OrbTap to succeed, partners must see it as **better than Google/Instagram for driving local foot traffic**. Current gaps:

| Partner Need | Current State | Gap |
|-------------|---------------|-----|
| Drive new customers | Map + OrbSheet | Partners don't control their own first impression well enough |
| Drive repeat visits | Stamp Cards, repeat visitor metrics | Stamp card analytics thin; no "retention rate" KPI |
| Understand ROI | Verified visits count | No revenue estimate, no funnel, no comparison to baseline |
| Reach new audiences | OrbSwipe, OrbPilot | Powerful but complex to set up — onboarding too long |
| Handle operations | Work Orders, Opportunities | Good features but UX is partner-unfriendly |

---

## Section 6: North Star KPIs (What to Measure)

| KPI | Definition | Target |
|-----|-----------|--------|
| **First Win Rate** | % of new users who complete ≥1 verified scan within 24h of signup | >40% |
| **Day-7 Retention** | % of new users returning within 7 days | >30% |
| **Streak >7 days** | % of MAU with active streak >7 days | >15% |
| **Share Rate** | % of Proof Cards shared after generation | >20% |
| **Partner Scan Rate** | Verified scans / partner / week | >10 |
| **Partner Retention** | Partner active after 90 days | >60% |
| **Revenue per partner** | Monthly partner revenue (premium) | TBD |

---

## Section 7: Summary of Priorities

### P0 — Fix these first (breaks the core loop)
1. Guarantee first verified win in onboarding
2. Add COMMIT step (Save for Later / Plan Tonight) to OrbSheet
3. Prove Proof Card more prominently on Scan Success
4. Wire daily push notifications (missions + streak + tonight)

### P1 — Fix these next (materially improves retention)
5. OrbPulse live strip on home Discovery Hub
6. Wallet "earn next" contextual strip
7. Tier advancement progress indicator on Profile
8. Partner funnel visualization on Dashboard

### P2 — Fix these for scale (business + partner success)
9. Partner "repeat visitor" metric
10. Revenue estimate on partner dashboard
11. Partner onboarding simplification
12. Push notifications for drops going live

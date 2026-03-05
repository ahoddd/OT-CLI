# OrbTap — Business Flow

**Document purpose:** Single source of truth for how OrbTap works from user, partner, and platform perspectives. Includes North Star alignment, tier flows, UX journeys, backend status, red flags, and profitability. Use for investor alignment, product decisions, and ensuring OrbTap is realistic, doable, and profitable.

**Last updated:** From codebase and existing BUILD docs.

---

## Table of contents

1. [Executive summary & North Star](#1-executive-summary--north-star)
2. [User flow by membership tier](#2-user-flow-by-membership-tier)
3. [Partner flow by membership tier](#3-partner-flow-by-membership-tier)
4. [User UX / flow through the app](#4-user-ux--flow-through-the-app)
5. [Partner UX / flow through the app](#5-partner-ux--flow-through-the-app)
6. [Backend: wired vs not wired](#6-backend-wired-vs-not-wired)
7. [Improvements & recommendations](#7-improvements--recommendations)
8. [Red flags (realism review)](#8-red-flags-realism-review)
9. [Profitability & unit economics](#9-profitability--unit-economics)
10. [Competition moat & scale](#10-competition-moat--scale)
11. [Pivot assessment](#11-pivot-assessment)

---

## 1. Executive summary & North Star

### North Star: Verified Win

A user **discovers** a real local partner (Map or list) → **opens** OrbSheet (tap orb) → **chooses** View Perk / Redeem / Follow / Directions → **verifies** at venue (QR scan) → **receives** OT Points + Ledger update + Proof Card → **optionally** follows partner and shares Proof.

**Success =** this loop is completable without dead ends, blank states, or confusing steps.

### Business flow (earn → spend)

OrbTap is built around: **discover & verify → earn OT Points → spend on perks and upgrades.**

| Pillar | Description |
|--------|-------------|
| **Discover** | Map, directory, missions, OrbSwipe, OrbPulse, OrbFeed show partner businesses. |
| **Earn OT** | Verified scan, mission complete, OrbVote, drop redeem, referral, daily ritual, stamp complete, work order, plan step. All gated by proof or engagement so points have value. |
| **Spend** | Wallet (Vault) is the hub: redeem at partners (perks), drop reserve, power-ups (upgrades), Orb Signal vote. Every OT display is tappable → Wallet. |

### Design principle: OrbTap never loses money

- **OT Points** are promotional utility points (not currency, not cash-redemption). Emission caps and cooldowns limit cost per user/partner.
- **Revenue** comes from user/partner subscriptions (Premium, Pro) and optional partner billing for verified actions. Subscriptions fund perks and platform.
- **Unit economics** must ensure subscription + partner revenue ≥ cost of OT emission + platform cost (see [§9](#9-profitability--unit-economics)).

---

## 2. User flow by membership tier

### Tier definitions (source of truth)

| Tier | Key | How determined | Tagline |
|------|-----|----------------|---------|
| **Free** | `free` | Default when not Premium/Pro | Earn points, redeem perks, climb the leaderboard. |
| **Premium** | `premium` | `premiumMember: true` in preferences | Extra perks, city compare, priority support. |
| **Pro** | `pro` | `partnerMode: true` or Pro subscription | Partner tools + Premium benefits. |

**Implementation:** `useEffectiveTier()` returns `tier`, `isPremium`, `isPro`, `isPartner`. Admin can "Test as" Free/Premium/Pro (or partner Silver/Gold/Platinum) in Admin Hub.

---

### Free (user)

| Area | What Free users get | Limits |
|------|---------------------|--------|
| **Map & discovery** | Map, OrbSheet, partner profile, perks, directory, missions, OrbSwipe, OrbPulse, OrbFeed, bookmarks | — |
| **Verify & earn** | Scan at venue (perk redeem, stamp earn), daily ritual, mission complete, stamp complete, drop redeem, work order approve, plan step, OrbVote, referral, proof streak | Subject to caps/cooldowns (backend) |
| **Wallet** | Full OT balance, ledger view, Stamp Cards link, proof list | — |
| **Spend** | Perk redeem, drop reserve, upgrades (quest reroll, streak shield, etc.), Orb Signal vote | — |
| **Social** | Spheres, follow, invite, share proof | **Limited follows (e.g. 3)**; leaderboard view-only |
| **Stats** | Core stats | **7-day only**; no 30-day, no export, no city compare |
| **OrbPass** | Not included | Shown as locked; CTA to Premium |
| **Drops** | Can reserve/redeem | No early access |
| **Badge** | No Premium/Pro badge | — |

**Upgrade CTAs:** Wallet, Profile, Missions, Scan success, Stats, Compare accounts, Leaderboard, Follow limit reached.

---

### Premium (user)

| Area | What Premium adds over Free |
|------|-----------------------------|
| **OrbPass** | Exclusive monthly perks at partner venues |
| **Stats** | 30-day stats & trends, export reports, compare to city rank |
| **Badge** | Premium (gold) badge on profile and proofs |
| **Drops** | Early drop access (reserve before Free) |
| **Follows** | Unlimited partner follows |
| **Spheres** | Up to 10 Spheres |
| **Power-ups** | Full access (streak shield, reroll, multiplier, etc.) |
| **Orb Signal** | More daily forecasts (e.g. 10/day) |
| **Other** | Saved routes & alerts |

---

### Pro (user)

| Area | What Pro adds over Premium |
|------|----------------------------|
| **Drops** | Earliest drop access (before Premium and Free) |
| **Badge** | Pro (platinum) badge |
| **Earn** | 1.2× XP & OT multiplier (earn 20% more on scan, mission, streak) |
| **Spheres** | Unlimited Spheres |
| **Orb Signal** | Unlimited daily forecasts |
| **Support** | Dedicated support channel |
| **Product** | Early access to new features; priority featured in Pulse |

---

## 3. Partner flow by membership tier

### Partner tier definitions

| Tier | Key | Perks cap | Analytics | Other |
|------|-----|-----------|-----------|--------|
| **Silver** | `silver` | Up to 3 active perks | 7-day | On map, profile, verified checkmark, OrbOps work orders |
| **Gold** | `gold` | Up to 10 active perks | 30-day, funnel, CSV export | Featured placement, drops, Premium badge, priority support |
| **Platinum** | `platinum` | Unlimited active perks | Full + export | Sponsored carousel, priority placement, dedicated success contact, Pro badge |

Partner tier is stored on the partner document (e.g. `partners/{id}.tier`). Admin or billing can set/upgrade.

---

### Silver (partner)

- List venue on map; public profile (hours, address).
- Up to **3 active perks**.
- **7-day analytics** (profile views, engagement).
- Verified checkmark; receive OrbOps work orders and catering requests.

---

### Gold (partner)

- Everything in Silver, plus:
- **10 active perks**; **30-day analytics**, conversion funnel, **CSV export**.
- Featured placement opportunities; drops and flash offers; **Premium (Gold) badge**; priority support.

---

### Platinum (partner)

- Everything in Gold, plus:
- **Unlimited active perks**; **Pro badge**; **sponsored carousel slots**; **priority placement** in search and discovery; **dedicated success contact**; early access to new OrbTap features; custom campaign support.

---

### Partner flows (all tiers)

| Flow | Steps |
|------|--------|
| **Onboard** | Apply (partner-apply) → Admin approves & adds to map → Partner links account (`users/{uid}.partnerId`) → Dashboard appears. |
| **Perks** | Create/edit perks in Partner Perks → Perks appear on map and OrbSheet. |
| **Stamp Cards** | Stamp Studio: create programs → Customers earn stamps via Scan → Partner redeems rewards (Stamp Redeem: code/PIN or QR). |
| **Redeem (perk)** | Customer shows QR at venue → Partner (or staff) uses Scan tab or verify token flow → Backend credits customer OT and marks token used. |
| **OrbSwipe** | OrbSwipe Cockpit: see leads, drops, reviews; Pro: Swipe Studio. |
| **Meal Proposals** | Meal Studio: create meal proposals → Show in OrbSwipe / Meal Mode. |
| **Feed** | Create post (Commerce Feed) when OrbFeed + composer enabled. |
| **Opportunities** | Create opportunities; accept/reject applicants; verify completion. |
| **OrbPass** | Configure offers; customers initiate redemption → Partner verifies (partner-verify). |
| **OrbBounty / Deal Match** | Partners bid/offer; customer accepts → Partner verifies fulfillment → Win/Deal card. |
| **Analytics** | Dashboard shows profile views, follows, missions (from partnerAnalytics). Silver: 7-day; Gold/Platinum: 30-day, funnel, export. |

---

## 4. User UX / flow through the app

### Entry (first-time)

1. **Landing** → Sign up / Log in / Features / Learn / Partner apply.
2. **Sign up** → Create account → **Onboarding** (theme, welcome).
3. **Post-onboarding** → Redirect to Map tab (default home).

### Discovery paths

| Entry | Path |
|-------|------|
| **Map** | See orbs → Tap orb → **OrbSheet** → View Perk / Redeem / Follow / Directions. |
| **Directory / Search** | Open directory → Pick Map, Missions, OrbSwipe, OrbPulse, Feed, etc. |
| **Missions** | Generate missions (mood/plan) → See partner steps → Tap step → Map or OrbSheet → Go to venue. |
| **Spheres** | Spheres list → Sphere detail → OrbPlans (generate plan) → Plan steps → Partner/venue. |
| **OrbSwipe** | Swipe deck (drops, missions, partners, meal proposals) → Save to Tray → Fuse My Night or go to partner. |
| **OrbPulse** | Live feed (trending partners/drops, proof-based) → Tap tile → Partner or drop. |
| **OrbFeed** | Commerce feed (partner posts) → Post detail → CTA → Partner or perk. |
| **Bookmarks** | Saved partners → Partner profile. |

### Verify & earn

| Action | UX |
|--------|-----|
| **Perk redeem** | Perk screen or OrbSheet → Redeem → **Scan** → Scan partner QR (or show my QR for partner to verify) → Success screen (OT + Proof) → Proof card / Share. |
| **Stamp earn** | Scan → Scan partner stamp QR → Stamp success; card progress in Stamp Cards / Reward Locker. |
| **Stamp reward redeem** | Reward Locker → Show QR/code → Partner redeems in Stamp Redeem screen. |
| **Drop** | Drop detail → Reserve (spend OT if fee) → Redeem at venue → OT + proof. |
| **Work order** | Work orders list → Create or open detail → Partner accepts/schedules/milestones → Customer approves → OT + receipt. |
| **Daily ritual** | Orb tab → Daily ritual → 3 taps → Shatter → OT (+ optional badge). |
| **Missions** | Complete steps (e.g. check-in at partner) → Mission complete → OT. |
| **OrbVote** | Vote on poll → OT. |
| **Referral** | Invite link → Referee signs up → Both get OT. |

### Wallet (Vault)

- **Balance** visible app-wide; every OT pill/count tappable → Wallet.
- Wallet: Balance, Stamp Cards entry, Earn next, Spend (upgrades), Proof/history, Notifications, Stats, Premium CTA (if Free).

### Spend

- **Perk:** Choose perk → Show QR at venue → Partner verifies (no OT cost; redemption is the "spend" of the action).
- **Drop reserve:** Pay OT fee (if any) from Wallet.
- **Upgrades:** Quest reroll, booster, streak shield, 24h multiplier, receipt cosmetics, circle pool, pulse filters — OT deducted from Wallet.
- **Orb Signal:** Vote with OT (cost per vote).

---

## 5. Partner UX / flow through the app

### Entry (partner)

1. **Partner apply** (from landing or directory) → Submit application.
2. **Admin** approves & adds to map → Partner document created/linked.
3. Partner account: **Partner mode** (or separate partner login) → **Partner tabs**: Dashboard, Perks, Orb, Feed, Settings.

### Dashboard

- Summary: profile views, follows, missions (from partnerAnalytics).
- Shortcuts: OrbSwipe Cockpit, Meal Proposals, Opportunities, Stamp Studio, Stamp Redeem, Create post, Billing (when wired).

### Perks

- List/create/edit perks. Perks appear on map and OrbSheet; customers redeem via Scan.

### Stamp Studio

- Create stamp programs (name, required stamps, reward, design). Customers earn stamps by scanning at venue; Reward Locker holds earned rewards; partner redeems via Stamp Redeem (code/PIN or QR).

### Stamp Redeem

- Enter customer reward code or scan customer QR → Mark reward redeemed.

### OrbSwipe Cockpit

- View OrbSwipe performance, leads, drops, reviews. Pro: Swipe Studio.

### Meal Proposals

- Create meal proposals for OrbSwipe / Meal Mode; optional Sphere vote, verified review.

### Opportunities

- Create opportunities → Applicants apply → Partner accept/reject → Verify completion.

### Feed (Commerce)

- Create post (when OrbFeed + composer enabled); posts appear in OrbFeed.

### Redeem flows (partner side)

- **Perk:** Customer shows one-time QR → Partner uses Scan tab or partner verify flow → Backend credits customer, marks token used.
- **OrbPass:** Partner inbox → Pending redemptions → Partner verify (PIN/token) → Customer completes redemption.
- **OrbBounty / Deal Match:** Partner bids/offers → Customer accepts → Partner verifies fulfillment (PIN/QR) → Win/Deal card.

### Settings

- Partner settings: Billing & payments (when wired), profile, notifications.

---

## 6. Backend: wired vs not wired

### Wired (server-authoritative)

| Area | Implementation |
|------|----------------|
| **Verified action (perk redeem)** | `apiAwardVerifiedAction` (or equivalent) callable; writes VerifiedActions + Ledger; idempotent; rate-limited. |
| **Perk redeem token verify** | `verifyPerkRedeemToken` — partner verifies customer QR; credits customer OT. |
| **Daily Orb Ritual** | `claimDailyOrbRitual` — one claim per user per day; writes Ledger + ritual claim doc. |
| **Bonus tap (ad)** | `claimBonusOrbTapAfterAd` — after ad, bonus OT; writes Ledger. |
| **Ledger read** | `getLedgerBalance` — returns current OT balance from Firestore. |
| **Spend (burn)** | Callable that validates product key, caps, cooldowns; deducts from Ledger; writes entry. |
| **Stamp Cards** | `stampCardsEarnStamp`, `stampCardsRedeemReward`; Stamp program/state in Firestore. |
| **Work orders** | Create, accept, milestones, submit, customer approve; `approveWorkOrder` mints VerifiedAction + Ledger + JobProofReceipt. |
| **Referral** | `onUserReferralWritten` trigger — when referred user doc has `referredBy`, award OT to both. |
| **OrbPass** | Initiate redemption, partner verify, complete; Ledger/settlement in orbPass. |
| **OrbBounty** | Create, bid, accept, lock, verify fulfillment, win card; callables in orbBounty. |
| **OrbIntent (Deal Match)** | Create intent, offer, accept, verify, deal card; callables in orbIntent. |
| **Polls** | Create, vote (OrbVote); vote can award OT (client or server per implementation). |
| **Integrity / audit** | `recordIntegrityEvent` for key actions. |

### Not wired / to do

| Area | Status | Notes |
|------|--------|--------|
| **Tier from Stripe** | Not wired | Tier is from **preferences** (AsyncStorage: `premiumMember`, `partnerMode`). Stripe webhook should update Firestore `users/{uid}.tier` (or partner plan); app should read tier from Firestore or auth claims for production. |
| **Checkout / Billing Portal** | Links only | App opens Stripe Checkout/Billing Portal URLs; no Cloud Functions `createCheckoutSession` or `createBillingPortalSession` yet. Webhook for `customer.subscription.*` not implemented. |
| **Partner billing (per action)** | Optional | STRIPE_SOFT_LAUNCH suggests partner subscription includes N redemptions/month; no usage-based billing yet. |
| **1.2× Pro multiplier** | Likely client or stub | Pro users should earn 20% more OT on eligible actions; backend emission rates may need tier-aware logic. |
| **Early drop access (Premium/Pro)** | Gating | Drop access by tier (early for Premium/Pro) — check if enforced in backend or only UI. |
| **OrbPass eligibility** | API | OrbPass checks eligibility (Premium+); ensure backend enforces tier. |

### Recommendations (backend)

- Implement Stripe webhook → Firestore tier/plan; app reads tier from Firestore (or custom claims) so entitlement is server-authoritative.
- Add `createCheckoutSession` and `createBillingPortalSession` so in-app upgrade opens correct Stripe session.
- Enforce Pro 1.2× multiplier in emission callables where OT is awarded.
- Ensure drop reserve and OrbPass eligibility check tier server-side where it matters.

---

## 7. Improvements & recommendations

### For users

- **Onboarding:** Short "Verified Win" tutorial (discover → scan → earn → proof) to increase first redemption.
- **Earn next:** Wallet "Earn next" and Missions/Scan success CTAs already drive behavior; keep one clear next action per screen.
- **Proof sharing:** Deep links and share copy that reinforce "proof-backed, real place" to improve virality and trust.
- **OrbSwipe / Fuse:** Clear "Tonight" and "Fuse My Night" so one tap leads to plan or partner; reduce friction from deck to venue.

### For partners

- **Dashboard first-run:** Empty state with checklist (add perks, create stamp program, share profile) so value is obvious.
- **Analytics:** 7-day (Silver) vs 30-day (Gold/Platinum) clearly labeled; funnel (view → tap → redeem) helps ROI story.
- **Stamp redeem:** QR scan for reward redemption (in addition to code/PIN) to speed checkout and reduce errors.
- **Billing:** When Stripe is wired, single "Billing & payments" entry that opens Portal or partner plan page.

### For OrbTap (platform)

- **Tier enforcement:** Move tier from prefs to Firestore + Stripe webhook so Premium/Pro cannot be self-granted.
- **Caps & cooldowns:** All emission and spend caps/cooldowns enforced in backend; document in one place (e.g. OrbinomicsPolicy + backend constants).
- **OT display:** Every OT display tappable to Wallet (OTPointsBalanceLink) — already in place; keep consistent.
- **Admin:** Test-as-tier and feature flags allow safe rollout; maintain clear flag categories and default-on for core loops.

---

## 8. Red flags (realism review)

Items here need product/ops review. Fix or accept explicitly.

---

### 🔴 Red flag: Tier is not Stripe-backed

**Section:** [§2](#2-user-flow-by-membership-tier), [§6](#6-backend-wired-vs-not-wired)

**Issue:** User/partner tier is determined by **preferences** (AsyncStorage: `premiumMember`, `partnerMode`). There is no server-side check against a paid subscription. In production, users could theoretically toggle Premium/Pro if prefs were editable, or tier could be out of sync with Stripe.

**Required for "realistic and profitable":** Stripe webhook updates Firestore (e.g. `users/{uid}.tier`, `partners/{id}.plan`); app and backend read tier from Firestore or auth custom claims. Remove or downgrade reliance on client-only prefs for entitlement.

---

### 🔴 Red flag: Subscription revenue vs OT cost

**Section:** [§9](#9-profitability--unit-economics)

**Issue:** If OT emission per user (especially heavy earners) exceeds revenue per user (subscription + partner share), OrbTap loses money. Caps and cooldowns exist but must be validated against real usage and pricing.

**Required:** Model: (Revenue per user + partner revenue) ≥ (OT cost per user + platform cost). Run with conservative assumptions and adjust caps or pricing until unit economics hold.

---

### 🔴 Red flag: Partner billing for verified actions

**Section:** [§6](#6-backend-wired-vs-not-wired), [§9](#9-profitability--unit-economics)

**Issue:** STRIPE_SOFT_LAUNCH describes partners paying for verified redemptions (subscription or per action). This is not fully implemented. If OrbTap's design assumes "partners pay per scan," that revenue is missing until wired.

**Required:** Decide whether soft launch is "partner subscription only" (no per-action billing) or "partner subscription + overage/usage." Document and implement accordingly so revenue assumptions match reality.

---

### 🔴 Red flag: OrbPass default OFF

**Section:** [§2](#2-user-flow-by-membership-tier)

**Issue:** OrbPass is gated by `isOrbPassEnabled` (flag) and by tier (Premium+). If OrbPass stays off or underused, a key Premium differentiator is weak.

**Required:** Ensure OrbPass is on in production for target markets and that partners have offers; monitor adoption. If demand is low, strengthen other Premium benefits or marketing.

---

### 🔴 Red flag: Pro 1.2× multiplier

**Section:** [§2](#2-user-flow-by-membership-tier), [§6](#6-backend-wired-vs-not-wired)

**Issue:** Pro users are promised 20% more OT on eligible actions. If this is only client-side or not applied in all emission paths, Pro value and unit economics are wrong.

**Required:** Enforce 1.2× in backend wherever OT is awarded (e.g. scan, mission, ritual, work order) and document; or explicitly scope where it applies.

---

## 9. Profitability & unit economics

### Revenue streams

| Stream | Description | Status |
|--------|-------------|--------|
| **User Premium** | Monthly/yearly subscription (e.g. $4.99/mo, $39.99/yr). | Stripe links in app; webhook + tier sync not wired. |
| **User Pro** | Higher subscription (e.g. $9.99/mo, $79.99/yr). | Same as above. |
| **Partner Gold** | Partner Premium (e.g. $19.99/mo, $159.99/yr). | Same. |
| **Partner Platinum** | Partner Pro (e.g. $49.99/mo, $399.99/yr). | Same. |
| **Partner usage** | Per verified action or overage (optional). | Not implemented. |

### Cost drivers

| Driver | Mitigation |
|--------|------------|
| **OT emission** | Emission rates and caps in OrbinomicsPolicy; backend enforces idempotency and caps. Daily/user and per-partner caps limit runaway cost. |
| **Fraud** | Self-redemption blocked (partner owner cannot redeem own perks); cooldowns and rate limits. |
| **Infra** | Firestore, Cloud Functions, Stripe — scale with usage; keep serverless. |

### Break-even (simplified)

- **Assumption:** Revenue from subscriptions (user + partner) must cover OT cost + platform + support.
- **OT cost:** Estimate average OT earned per user per month; multiply by "cost" per OT (e.g. partner perk value share or nominal cost). Caps keep heavy users bounded.
- **Realistic path:** Price Premium/Pro so that conversion rate × price × LTV > CAC and > OT + platform cost per user. Partner tiers priced to reflect value (analytics, placement, perks cap) and to support platform.

### Scale

- More users → more scans and redemptions → more value to partners → more partner sign-ups and upgrades.
- More partners → more discovery and perks → more user engagement and upgrade potential.
- Viral levers: referral (OT bonus), share proof, Spheres, Missions — all drive organic growth if conversion and retention are strong.

---

## 10. Competition moat & scale

### Moat (from COMPETITIVE_STRATEGY)

- **Verified visits + proof + missions:** Competitors often lack verification or proof; OrbTap ties rewards to real visits and shareable proof.
- **Map + missions + proof + wallet in one flow:** Single app for discover → verify → earn → spend differentiates from loyalty-only or map-only apps.
- **Local-first, partner-backed:** Real businesses, real perks; not abstract rewards catalog.

### Feature-by-feature

- Map: "Verified spots · tap orbs for rewards."
- Daily ritual: "Real rewards at real places."
- Missions: "Proof-backed. Real places. Real perks."
- Wallet: "Earned from verified visits & redemptions."
- Scan/Proof: "Scan. Prove. Share. Verified local win."

### Scale expectations

- **Demand:** Local discovery + rewards + proof has demand if execution is strong and partners see ROI (foot traffic, analytics).
- **Risks:** Low partner density in early cities; low user conversion to Premium/Pro; high OT cost if caps are too loose. Address via tier enforcement, caps, and partner success.

---

## 11. Pivot assessment

### Will OrbTap fail as-is?

- **No pivot recommended** if:
  - Tier and billing are wired (Stripe + Firestore) so revenue is real.
  - Unit economics hold (subscription + partner revenue ≥ cost).
  - Core loop (Verified Win) is reliable and marketed clearly.
  - Partner onboarding and analytics show clear value (foot traffic, redemption counts).

OrbTap's design (proof-backed, local, real rewards, two-sided) is differentiated and can be profitable with disciplined caps, pricing, and execution.

### When to consider pivot

- If **partner adoption** stays very low in multiple markets despite product quality → consider partner-led incentives or different go-to-market (e.g. verticals, white-label).
- If **user conversion to paid** is persistently near zero and OT cost is material → tighten free benefits, strengthen Premium/Pro value, or test pricing.
- If **regulatory or store** rules force major changes (e.g. IAP-only for digital goods) → adapt billing (Stripe on web, IAP in app) per legal guidance.

### Conclusion

OrbTap does not need a pivot by design. It needs: (1) Stripe and tier wired so the business can charge, (2) unit economics validated and enforced, (3) red flags in this document resolved or accepted, and (4) consistent execution on North Star and competitive differentiation. With that, the app is built to be a competition killer and industry disrupter in its space.

---

*End of Business Flow document.*

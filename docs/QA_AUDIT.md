# OrbTap — QA Audit: Users, Partners, Admin & Tiers

This document summarizes the QA audit of the OrbTap app: business flows for **users**, **partners**, and **admin**, plus **paid tiers** (Premium/Pro) vs **free** and upgrade **teasers/CTAs**.

---

## 1. Tier system (source of truth)

- **Free (Silver):** Default. Limited partner follows (3), view-only leaderboard, no OrbPass, no 30-day stats/export/city compare, no early drops, no Premium/Pro badge.
- **Premium (Gold):** `premiumMember: true` in preferences. Unlimited follows, OrbPass, 30-day stats, export, city compare, early drops, Premium badge, priority support.
- **Pro (Platinum):** `partnerMode: true` in preferences (same as “partner” in UI). Everything in Premium + Pro badge, earliest drops, dedicated support; for partners: unlimited perks, priority placement.

**Hook:** `useEffectiveTier()` → `tier`, `isPremium`, `isPro`, `isPartner`. Admin can “Test as” Free/Premium/Pro in Admin Hub.

---

## 2. User (consumer) flow — audit

| Area | Status | Notes |
|------|--------|--------|
| **Auth** | OK | Login, signup, onboarding; profile from Firestore. |
| **Map & discovery** | OK | Map tab, partner pins, partner profile, perks. |
| **Scan & proof** | OK | QR scan → success → OrbProof; scan success has Premium teaser. |
| **Wallet** | OK | Balance, history, spend; Premium CTA for free, Pro tease for premium. |
| **Stats** | OK | Core stats free; 30-day/export/city compare gated. “See Your Full Potential” section with “Explore Premium” and “Or explore Pro for dedicated support”. |
| **Leaderboard** | OK | View rankings (all tiers). Free: “Premium: Compare your rank to your city” teaser → `/premium`. |
| **OrbPass** | OK | Eligibility from API (Premium+). When not eligible: message + “Compare plans & upgrade” and “Go to Premium”. |
| **Partner follows** | Fixed | Free limited to 3 follows. At limit, tap Follow → alert “Follow limit reached” + “Upgrade” → compare-accounts. |
| **Bookmarks** | OK | Bookmarks screen; no separate cap (follow limit is “partner follows” in useSocial). |
| **Missions / Pulse / Drops** | OK | Missions, Pulse, drops; premium features teased where relevant. |
| **Orb Signal** | OK | Vote once per market; “You voted Yes/No” blocks repeat vote. |
| **Premium / Pro pages** | OK | `/premium`, `/pro`; benefits, pricing, “Compare Free vs Premium vs Pro”, upgrade CTAs. |
| **Compare-accounts** | OK | Table Free vs Premium vs Pro; “Explore OrbTap Pro”; “Upgrade to Premium”. |

---

## 3. Partner flow — audit

| Area | Status | Notes |
|------|--------|--------|
| **Partner dashboard** | OK | Entry from profile/menu. Hero: Premium active or “Unlock Premium Partner” teaser. Pro tease when Premium: “Go Pro for unlimited perks and priority placement” → `/pro`. |
| **Analytics** | OK | 7-day for free partners; 30-day for Premium (partner dashboard + stats). |
| **Perks** | OK | Silver 3 max, Gold up to 10, Platinum unlimited (compare table + PartnerTiers). |
| **OrbPass** | OK | Partner inbox / redemption flow; eligibility and caps from config. |
| **OrbOps, opportunities, polls, feed** | OK | Partner-facing screens and admin flags. |
| **Badge** | OK | Silver = verified; Gold = Premium badge; Platinum = Pro badge (PartnerProBadge). |

---

## 4. Admin flow — audit

| Area | Status | Notes |
|------|--------|--------|
| **Access** | OK | Admin Hub gated by `isAdminEmail(user?.email)` (see `constants/Admin.ts`). Add production admin emails there. |
| **Flags** | OK | Feature flags (stats, leaderboard, OrbPass, etc.) in Admin Hub. |
| **Test as** | OK | “Test as” Free / Premium / Pro to verify tiered UI. |
| **Content** | OK | Partners, featured, users, Orb Signal, badges, polls, onboarding, tutorials, etc. |
| **Pricing** | OK | Premium/Pro pricing in Admin; used by compare-accounts, premium, pro. |
| **Announcements / push** | OK | Global announcements, push config. |

---

## 5. Paid vs free — consistency

| Feature | Free | Premium | Pro | Teaser / CTA |
|---------|------|---------|-----|--------------|
| Partner follows | 3 max | Unlimited | Unlimited | Partner page: alert at 3 + “Upgrade”. |
| OrbPass | No | Yes | Yes | OrbPass screen: benefits + “Compare plans & upgrade” / “Go to Premium”. |
| 30-day stats / export / city compare | No | Yes | Yes | Stats: “See Your Full Potential” + “Explore Premium” / “Or explore Pro”. |
| Leaderboard city compare | No | Yes | Yes | Leaderboard: “Premium: Compare your rank to your city” → `/premium`. |
| Early / earliest drops | No | Early | Earliest | Pulse: "Premium & Pro get early access to drops"; Drop detail: "Premium members get early access to reserve drops" → `/premium`. |
| Badge | No | Premium | Pro | Profile/dashboard show badge; free sees upgrade CTAs. |
| Partner 30-day analytics | No | Yes | Yes | Partner dashboard: “Get 30-day analytics & export — Upgrade to Premium”. |
| Partner unlimited perks | No | 10 max | Unlimited | Compare + Pro tease on partner dashboard. |

---

## 6. Upgrade CTAs (no dead ends)

- **Premium:** Settings, Stats, Wallet, OrbPass (when not eligible), Leaderboard (teaser), Bookmarks (teaser), Pulse (early-access teaser), Drop detail (early-access teaser), Compare-accounts, Premium page, Partner dashboard (for partners).
- **Pro:** Premium page (“OrbTap Pro” card), Compare-accounts (“Explore OrbTap Pro”), Stats (“Or explore Pro”), Wallet (Pro tease), Partner dashboard (“Go Pro for unlimited perks…”).

---

## 7. Fixes applied during this audit

1. **Partner follow limit (free):** On partner profile, if user is free and already following 3 partners, tapping Follow shows alert “Follow limit reached” with “Upgrade” → compare-accounts. Prevents unlimited follows for free.
2. **Leaderboard Premium teaser:** Free users see a “Premium: Compare your rank to your city” row that links to `/premium`.
3. **Bookmarks Premium teaser:** Free users see "Premium: Follow unlimited partners" with link to `/premium`.
4. **Pulse early-access teaser:** Free users see "Premium & Pro get early access to drops" with link to `/premium`.
5. **Drop detail early-access teaser:** Free users see "Premium members get early access to reserve drops" with link to `/premium` when the drop can be reserved or redeemed.

---

## 8. Recommendations

- **Backend:** Enforce partner-follow limit (3) and OrbPass eligibility server-side where applicable.
- **Admin emails:** Keep `constants/Admin.ts` in sync with production admin emails; consider moving to env or secure config.
- **Analytics:** Ensure 30-day stats and partner analytics respect `isPremium` / `isPartner` in API.
- **Copy:** Keep compare-accounts and premium/pro pages in sync with `PartnerTiers` and `PremiumPricing` so benefits and limits stay consistent across the app.

---

*Last updated: QA audit (users, partners, admin, tiers, teasers).*

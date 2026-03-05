# Stamp Cards — Strategy: How Users Get Cards & How Partners Give Them Out

**Goal:** Drive real foot traffic to businesses, benefit users with tangible rewards, and make OrbTap the go-to platform for proof-backed loyalty. Every loop should be clear, low-friction, and mutually valuable.

---

## How users obtain stamp cards

**Core principle:** A stamp card is created automatically when the user earns their first stamp at a partner. There is no separate "sign up for this card" step — **visit + scan = you have the card**. That reduces friction and ties cards to real visits.

### Acquisition loops (in order of impact)

| Loop | How it works | Why it drives foot traffic |
|------|----------------|----------------------------|
| **1. Scan at venue** | User is at partner location → sees partner’s Stamp QR (counter, window, table) → opens OrbTap Scan → scans QR → first stamp earned, card created. | **Primary loop.** User is already there; scan locks in the visit and starts repeat-visit habit. |
| **2. Map → partner → stamp** | User browses map, taps a partner pin → OrbSheet shows "Stamp progress" chip (or "Get your first stamp") → tap opens Stamp Cards with that partner focused, or Scan. User goes to venue to scan. | Surfaces stamp programs at discovery time; "X/10 stamps" or "Scan to start" creates intent to visit. |
| **3. Partner profile** | User lands on partner page (search, deep link, feed) → PartnerStampCardModule shows program + "Scan to stamp" / progress → CTA to open Scan or directions. | Converts profile views into "I’ll go there to stamp" intent. |
| **4. Stamp Cards page (empty state)** | User has no cards → sees "No stamp cards yet" + "Scan a partner QR at a venue to start" + **Find partners** (map). | Pushes users to map to discover partners, then visit and scan. |
| **5. Wallet accordion** | User opens Stamp Cards section → sees cards or empty state → "View all" → Stamp Cards page with "Scan to stamp" / "Find partners". | Keeps stamp cards visible and links to full page for scan + discovery. |

### Product tactics

- **No pre-registration:** Card state is created on first successful stamp. No forms, no "Join this program" — just scan.
- **Single source of truth:** Stamp Cards page + Wallet accordion both show the same cards (Reward Locker first, then MY CARDS). One tap to full page from Wallet.
- **Discovery from empty state:** "Find partners" on Stamp Cards page goes to map so users can choose a place, go, then scan.
- **OrbSheet stamp chip:** When a partner has a stamp program and the user has state (or could start), show progress or "Get your first stamp" so the map drives "go there and scan."

---

## How partners give out their stamp cards

**Core principle:** Partners distribute their program by making the Stamp QR visible at the point of visit and by sharing it in channels that drive people to the venue.

### Distribution channels (in order of impact)

| Channel | How partners use it | Why it drives foot traffic |
|--------|----------------------|----------------------------|
| **1. QR at venue** | Partner creates program in Stamp Studio → downloads/saves Stamp QR → displays at counter, window, table, or door. Copy: "Scan with OrbTap to earn a stamp." | **Primary.** Only people at the venue can scan; every scan is a verified visit. |
| **2. Share QR (save/share)** | Stamp Studio has "Save or share stamp QR" → partner shares image via messaging, email, or social with copy: "Scan this at [Venue] to add a stamp." | Brings the QR to people who aren’t at the venue yet; they must come in to scan. |
| **3. Partner profile & map** | Partner’s stamp program is visible on their OrbTap profile and on the map (OrbSheet). Users discover the program before visiting. | Discovery → intent → visit → scan. |
| **4. Deep link (future)** | Shareable link to partner’s stamp program or "Get this card" page (e.g. orbtap://partner/[id]/stamp) that opens app and shows program + "Visit & scan at [Venue]." | Social and marketing can link directly to the program; CTA is always "visit to scan." |
| **5. In-app partner promos** | Partner posts in OrbFeed or runs a drop: "Show your stamp card at the counter for double stamp this week." | Combines stamp program with time-bound offers to increase visits. |

### Partner-facing tactics

- **Stamp Studio copy:** Explicit line: "Display at your venue — customers scan with OrbTap to add a stamp. Put it on the counter or in your window." Plus: "Sharing the QR online? Remind people to scan when they visit so it counts."
- **Drive foot traffic tip:** In Stamp Studio or partner dashboard: "Stamp cards work best when the QR is at the point of visit. Every scan is a verified visit and a step toward a reward — that brings them back."
- **Reward design:** Encourage rewards that require return visits (e.g. "Free item after 10 stamps" with cooldown) so one card drives multiple trips.

---

## Why this helps OrbTap succeed

| Stakeholder | Benefit |
|-------------|--------|
| **Users** | One app for map, missions, proof, and stamps. No fake check-ins; rewards are tied to real visits. Clear path: discover on map → visit → scan → earn stamps → redeem. |
| **Partners** | Repeat visits from stamp mechanics; verified visits only; QR at venue + shareable QR so they can promote "come in and scan." |
| **OrbTap** | Stamp cards reinforce the moat: **map + missions + proof + wallet + stamps**. More scans → more verified actions → stronger proof layer and more engagement. Foot traffic is the core metric; every stamp is a proof-backed visit. |

---

## Implementation checklist (current + optional)

- [x] User: card created on first stamp (backend).
- [x] User: Stamp Cards page empty state → "Find partners" → map.
- [x] User: OrbSheet stamp chip → link to Stamp Cards (focus partner).
- [x] User: Wallet single Stamp Cards section (accordion + Reward Locker); no duplicate button.
- [x] Partner: Stamp Studio QR + save/share; copy about displaying at venue.
- [x] User: Accordion right action tappable → open Stamp Cards page ("Scan to stamp" / "X active · Y reward ready").
- [x] Partner: Stamp Studio short "Drive foot traffic" tip under venue QR.
- [ ] Partner: Deep link or "Share your stamp program" with orbtap://partner/[id]/stamp (future).

---

*This strategy keeps acquisition and distribution simple, ties every card to real visits, and makes partners the natural channel for driving people to the venue to scan.*

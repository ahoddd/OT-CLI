# OrbTap — Full QA Audit Report (Feb 2026)

**Scope:** Post–partner-applications and sponsored-ad schedule work. Top-to-bottom audit for function correctness and App Store / Play Store readiness.

---

## 1. Completed in this session

### Wallet — single sponsored tile
- **Done.** Wallet page has exactly **one** `SponsoredAdSlot` (carousel). That single slot can show up to 3 ads via the existing carousel; no duplicate tiles.

### Partner applications — in-app apply + admin approval
- **In-app apply:** Partners can apply from:
  - **Wallet:** Sponsored slot placeholder “Get this spot” → `/partner-apply`
  - **Orb (Home):** “Partners: Apply for Featured or Sponsored” CTA → `/partner-apply`
  - **Features:** “Partner with OrbTap” on businesses tab → `/partner-apply`
- **Backend:** Applications are written to Firestore `partnerApplications` with `status: 'pending'`. Cloud Functions: `listPartnerApplicationsAdmin`, `updatePartnerApplicationStatus`; on approve, referral bonus is awarded via `onPartnerApplicationUpdated`.
- **Admin Hub:** New section **Partner applications** (super-admin only):
  - Filter: Pending / All
  - List: business name, contact, placement interest, ad details, status
  - Actions: **Approve** (then create ad in Sponsored ads when ready), **Reject** (with confirmation)

### Admin ad controls (when / where / how long)
- **Placement:** Already supported (orb carousel, daily ritual reward). Admin chooses when creating an ad.
- **Schedule:** Optional **Start** and **End** dates (YYYY-MM-DD) added to the “Add ad” form. Stored as `startAt` / `endAt` (ms) in Firestore.
- **Backend:** `listSponsoredAds` (user-facing) now filters out ads where `now < startAt` or `now > endAt`. Admin list still shows all ads with schedule in the row (e.g. `2026-02-01 → 2026-02-28`).
- **Other controls:** Active toggle, order, carousel transition seconds, max carousel slots, daily ritual reward toggle — already in Admin → Sponsored ads.

---

## 2. QA audit — what was checked

### Critical flows
- **Auth:** Landing → Login/Signup → Onboarding; redirect when logged in (`app/index.tsx`).
- **Wallet:** Single `SponsoredAdSlot`; actions (Send, Receive, Split, Redeem); data deletion link from Settings.
- **Data deletion:** `/data/delete` uses `submitDataDeletionRequest()` → Firestore `dataDeletionRequests`; success/error handling and copy are in place.
- **Partner apply:** Form validation, `submitPartnerApplication()` → Firestore; success state and share flow.
- **Admin:** Partner applications section loads list, filter Pending/All, Approve/Reject; Sponsored ads create with optional Start/End date; list shows schedule.

### Dev-only UI (store-safe)
- **Settings:** “ADMIN OVERRIDE (DEV)” is wrapped in `__DEV__` — not shown in release.
- **Scan:** “DEV: SIMULATE SCAN” is wrapped in `__DEV__` — not shown in release.

### Backend / types
- Sponsored ad `sanitizeAdDoc` includes `startAt`, `endAt`, `createdAt`, `updatedAt`; `listSponsoredAds` filters by schedule.
- Partner application admin returns `createdAt`/`updatedAt` as numbers (Timestamp → millis).

### Existing store-readiness docs
- `docs/QA_STORE_READINESS_REPORT.md` and `docs/STORE_SUBMISSION_AUDIT.md` remain the source of truth for:
  - Android package name (`com.anonymous.orbtap` → production ID)
  - Public Privacy Policy / Terms URLs
  - Mapbox secret in repo → move to env
  - Physical address in store listings
  - Scrolling / safe area on devices
  - Data deletion backend (already implemented: Firestore `dataDeletionRequests`)

---

## 3. Fixes applied in this audit

- **Admin Partner applications:** Full UI added (filter, list, Approve/Reject, refresh). Reject uses `Alert.alert` (no `Alert.prompt`) for cross-platform compatibility.
- **Sponsored ads:** Schedule (Start/End date) in create form and in list; backend filters by `startAt`/`endAt` for user-facing `listSponsoredAds`.
- No new crashes or missing guards were introduced; existing DEV gates and data-deletion backend were confirmed.

---

## 4. Recommendations before submission

1. **Must (from existing docs):** Change Android package to production ID; add public Privacy (and Terms) URLs; move Mapbox download token to env; provide physical address in both store listings.
2. **Recommended:** Real-device pass on scrollable screens (Wallet, Feed, Pulse, Settings, etc.) to confirm bottom padding and tab bar clearance.
3. **Optional:** Add an “Edit” action for sponsored ads in Admin (e.g. change active, start/end dates) without deleting and re-creating.

---

## 5. Summary

- **Wallet:** One sponsored carousel slot only; carousel can show 3 ads.
- **Partner applications:** In-app apply from Wallet, Orb, and Features; admin can view, approve, or reject in Hub → Partner applications.
- **Admin ad controls:** Placement, active, order, carousel config, and optional **Start/End** schedule; user-facing list respects schedule.
- **QA:** Critical flows and dev-only UI verified; data deletion and partner-apply backends confirmed. Remaining steps are the pre-submission items already listed in the existing store readiness and submission audit docs.

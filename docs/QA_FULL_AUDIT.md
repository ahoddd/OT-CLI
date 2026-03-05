# OrbTap — Full QA Audit

**Date:** 2025  
**Scope:** Routes, CTAs, Firebase/Firestore, features, App Store & Play Store readiness.

---

## 1. Route & navigation audit

### 1.1 Route targets verified (all have matching `app/` files)

| Target | File | Status |
|--------|------|--------|
| `/` | `app/index.tsx` | OK |
| `/(tabs)` | `app/(tabs)/_layout.tsx` (index) | OK |
| `/(tabs)/scan`, `/(tabs)/wallet`, `/(tabs)/orb`, etc. | `app/(tabs)/*.tsx` | OK |
| `/auth/login`, `/auth/signup`, `/auth/onboarding` | `app/auth/*.tsx` | OK |
| `/features` | `app/features.tsx` | OK |
| `/partner-apply` | `app/partner-apply.tsx` | OK |
| `/admin`, `/admin/partner-form`, `/admin/perks`, `/admin/polls` | `app/admin/*.tsx` | OK |
| `/spheres`, `/spheres/[id]`, `/spheres/join` | `app/spheres/*.tsx` | OK |
| `/leaderboard` | `app/leaderboard.tsx` + tab | OK |
| `/vote` | `app/vote/index.tsx` | OK |
| `/stats` | `app/stats.tsx` + tab | OK |
| `/missions` | `app/missions.tsx` + tab | OK |
| `/pulse` | `app/pulse.tsx` + `(tabs)/pulse.tsx` | **Verify:** two files may resolve to same path; confirm which is used |
| `/partners` | `app/partners.tsx` | OK |
| `/arena` | `app/arena/index.tsx` + tab | OK |
| `/compare-accounts`, `/premium` | `app/compare-accounts.tsx`, `app/premium.tsx` | OK |
| `/orbpass`, `/orbpass/history`, `/orbpass/partner-inbox`, `/orbpass/partner-verify` | `app/orbpass/*.tsx` | OK |
| `/orbpass/offer/[id]`, `/orbpass/redeem/[redemptionId]` | `app/orbpass/offer/[id].tsx`, `app/orbpass/redeem/[redemptionId].tsx` | OK |
| `/intent`, `/intent/create`, `/intent/[id]`, `/intent/verify`, `/intent/offer/create` | `app/intent/*.tsx` | OK |
| `/intent/locked/[id]`, `/intent/deal/[cardId]` | `app/intent/locked/[id].tsx`, `app/intent/deal/[cardId].tsx` | OK |
| `/deal/[cardId]` | `app/deal/[cardId].tsx` (redirects to `/intent/deal/[cardId]`) | OK |
| `/bounty`, `/bounty/create`, `/bounty/[id]`, `/bounty/locked/[id]`, `/bounty/win/[id]`, `/bounty/bid/create`, `/bounty/verify/[id]` | `app/bounty/*.tsx` | OK |
| `/scan/success` | `app/scan/success.tsx` | OK |
| `/proof/[id]` | `app/proof/[id].tsx` | OK |
| `/partner/[id]` | `app/partner/[id].tsx` | OK |
| `/partner/dashboard`, `/partner/posts/create`, `/partner/menu`, `/partner/menu/edit`, `/partner/menu/upload` | `app/partner/*.tsx` | OK |
| `/partner/polls`, `/partner/polls/create`, `/partner/opportunities`, etc. | `app/partner/*/*.tsx` | OK |
| `/work-orders`, `/work-orders/create`, `/work-orders/[id]` | `app/work-orders/*.tsx` | OK |
| `/perk/[id]` | `app/perk/[id].tsx` | OK |
| `/report` | `app/report.tsx` (params: partnerId, name) | OK |
| `/legal/*` (terms, privacy, help, guidelines, acceptable-use) | `app/legal/*.tsx` | OK |
| `/data/delete` | `app/data/delete.tsx` | OK (account/data deletion — required for stores) |
| `/feed`, `/feed/[id]` | `app/feed/index.tsx`, `app/feed/[id].tsx` | OK |
| `/drop/[id]` | `app/drop/[id].tsx` | OK |
| `/orbsignal`, `/orbsignal/[id]`, `/orbsignal/m1` | `app/orbsignal/*.tsx` | OK |
| `/notifications`, `/notification-settings` | `app/notifications/index.tsx`, `app/notification-settings.tsx` | OK |
| `/invite/[code]`, `/invite/index` | `app/invite/*.tsx` | OK |
| `/opportunities`, `/opportunities/[id]`, `/opportunities/my-applications` | `app/opportunities/*.tsx` | OK |
| `/learn`, `/tutorials`, `/settings`, `/bookmarks`, `/knowledge`, `/upgrades`, `/people` | Corresponding `app/*.tsx` | OK |

### 1.2 Fix applied during audit

- **Partner dashboard → Opportunities:** Link previously used hardcoded `partnerId: 'p1'`. Updated to use `partnerId` (current partner) so the correct partner context is passed.

### 1.3 Dynamic / notification routes

- **NotificationResponseHandler:** Pushes `item.data.screen` from push payload. Ensure backend only sends valid in-app paths (e.g. `/vote`, `/(tabs)/wallet`) to avoid dead navigations.

---

## 2. Firebase & Firestore

### 2.1 Deployment checklist

- **Firebase project:** Configured in `firebaseConfig.ts` (and/or env). Not committed; use `.env` / EAS secrets.
- **Firestore rules:** `firestore.rules` — deploy with `firebase deploy --only firestore:rules`.
- **Firestore indexes:** `firestore.indexes.json` — deploy with `firebase deploy --only firestore:indexes`.
- **Cloud Functions:** `functions/` — build with `npm run build` in `functions/`, deploy with `firebase deploy --only functions`.  
  - **Note:** `functions/tsconfig.json` no longer extends Expo base; uses Node-friendly `moduleResolution: "node"` to avoid build errors.

### 2.2 Client usage

- Auth, Firestore, and callable functions used across app (wallet, missions, partners, orb intent, orb bounty, orb pass, etc.). Balance and ledger sync from server where implemented.
- **Wallet:** `getWalletBalance` (or equivalent) used when user is signed in; spend/add transaction wired to backend where applicable.

### 2.3 No automatic deploy from repo

- This repo does **not** run `firebase deploy` or push to your Firebase project. You must deploy manually or via CI with your credentials.

---

## 3. Feature completeness (no dead CTAs)

- **Wallet:** Balance, history, power-ups, proof receipts, “Full activity in Stats,” earn-next and OrbVote CTAs — all route to existing screens.
- **Missions:** Scan CTAs → `/(tabs)/scan`; Spheres/Wallet CTAs → correct tabs.
- **OrbPass:** History, partner inbox, compare/premium, offer → redeem flow — routes exist.
- **Intent (Deal Match):** Create, list, detail, offer, verify, locked, deal card — all routes and params verified.
- **Bounty:** List, create, detail, bid, locked, win, verify — all routes exist.
- **Partner dashboard:** Menu (with `partnerId`), opportunities (now with `partnerId`), polls, posts — routes and params correct.
- **Settings:** Delete account → `/data/delete` (data deletion screen exists and is reachable).
- **MasterDirectory / AllPagesGridModal / SearchOverlay:** Routes align with `app/` structure and visibility flags.

---

## 4. App Store Connect & Play Store guidelines

### 4.1 Already in place

- **Privacy policy & terms:** In-app routes (`/legal/privacy`, `/legal/terms`) and content (e.g. `LegalContent`). Users can read them inside the app.
- **Data deletion:** `/data/delete` screen; submit flow (e.g. Firestore) implemented. Settings → “Delete my account” → confirm → navigate to `/data/delete`.
- **Account deletion path:** Clear user path to request/delete account and data (required by both stores).
- **Permissions:** iOS usage descriptions in `app.json` (camera, photo library, location, Face ID). Android permissions via Expo config.
- **Legal index:** `/legal` lists Acceptable Use, Guidelines, Help, Privacy, Terms (alphabetical).

### 4.2 Required before submission (see also `docs/STORE_SUBMISSION_AUDIT.md`)

1. **Public Privacy Policy (and Terms) URL**  
   - App Store Connect and Play Console require a **public URL** (e.g. https://yoursite.com/privacy) in the store listing.  
   - In-app legal is good; you still need a hostable URL for the store forms.

2. **Android package name**  
   - Prefer a production ID (e.g. `com.orbtap.app`) over `com.anonymous.orbtap`; align `build.gradle` and package paths.

3. **Secrets**  
   - Mapbox and other API keys/tokens in env or EAS secrets; do not commit. Use `EXPO_PUBLIC_*` or build-time injection where appropriate.

4. **Age rating & content**  
   - Complete the age rating (and content) questionnaires in both stores. If the app has UGC or social features, declare and describe moderation/safety (e.g. legal/guidelines and reporting).

5. **Scrolling & reachability**  
   - Ensure scrollable screens have sufficient bottom padding (e.g. 100–120) so the last row and CTAs are above tab bar and safe area. Address any “unreachable” buttons (e.g. Admin partner list already fixed in a prior pass).

6. **Build & signing**  
   - **iOS:** Distribution certificate and provisioning profile; device capabilities (e.g. push, Face ID) match usage.  
   - **Android:** Upload key; App Signing by Google Play; increment `versionCode` per Play upload.

7. **Privacy manifests (iOS, 2024+)**  
   - If you use third-party SDKs that require privacy manifests or “required reason” APIs, ensure manifests and approved reasons are in place so the app is not rejected for missing or invalid metadata.

### 4.3 Quick checklist

- [ ] Public Privacy Policy URL in App Store Connect and Play Console.
- [ ] Public Terms URL if required by your region or store.
- [ ] Android package name set to production ID if desired.
- [ ] No secrets in repo; Mapbox and others in env/EAS.
- [ ] Age rating and content questionnaires completed.
- [ ] All scrollable screens have safe bottom padding; no unreachable CTAs.
- [ ] Production signing and build config for release.
- [ ] Test on real iOS and Android devices; fix crashes and layout issues.

---

## 5. Summary

- **Routes:** All audited navigation targets have a corresponding `app/` route; one potential duplicate path (`/pulse`) noted for verification.
- **Fix applied:** Partner dashboard “Manage opportunities” now passes `partnerId` instead of `'p1'`.
- **Firebase/Firestore:** Deployment is manual; functions build with current `functions/tsconfig.json`. No dead client paths identified for wallet, missions, orb intent, bounty, orb pass, or partner flows.
- **Store readiness:** In-app legal, data deletion, and account deletion paths are present. Fulfill store-specific requirements (public URLs, package name, secrets, age rating, signing, and device testing) before submission.

For more detail on store submission, see **`docs/STORE_SUBMISSION_AUDIT.md`**.

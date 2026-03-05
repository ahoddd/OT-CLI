# OrbTap — QA & Store Readiness Report

**Date:** February 2026  
**App:** OrbTap (Expo / React Native)  
**Target:** Apple App Store & Google Play Store

This report summarizes a full QA pass and what must be fixed or confirmed before submission so OrbTap is ready for approval on both stores.

---

## Fixes already applied (this session)

1. **Account deletion (Apple requirement)**  
   - **Added:** Settings → Danger Zone → **Delete account** row that navigates to `/data/delete` (data deletion request flow).  
   - **Updated:** Help Center (“How do I delete my account?”) now explains: go to Settings → Danger Zone → Delete account and submit your email; request processed within 30 days.  
   - **Why:** Apple requires in-app account deletion for apps that allow account creation (Guideline 5.1.1(v)).

2. **Legal contact placeholders**  
   - **Updated:** Terms and Privacy Policy contact sections no longer use literal `[Address]`. They now say “see app store listing for address.”  
   - **You should:** Add your real business address in App Store Connect and Google Play Console (and optionally update in-app legal text to match).

---

## Must fix before submission

### 1. Android package name (Google Play)

- **Current:** `com.anonymous.orbtap` in `app.json` and `android/app/build.gradle` (applicationId + namespace).
- **Risk:** Rejection or “unprofessional” feedback; package is hard to reclaim later.
- **Action:** Change to a production ID (e.g. `com.orbtap.app`). iOS already uses `com.orbtap.app` in `app.json`; align Android and run `expo prebuild --clean` if you use prebuild.

### 2. Privacy Policy & Terms — public URLs

- **Requirement:** Both stores require a **public URL** for Privacy Policy (and often Terms) in the store listing form. In-app legal screens are not enough for the form.
- **Action:** Host Privacy Policy and Terms on a webpage (e.g. `https://orbtap.com/legal/privacy`, `https://orbtap.com/legal/terms`) and enter those URLs in:
  - App Store Connect (App Information → Privacy Policy URL; optional Terms URL if prompted).
  - Google Play Console (Policy status → App content → Privacy policy).

### 3. Mapbox secret in repo

- **Current:** `app.json` plugins contain a Mapbox **secret** token (`RNMapboxDownloadToken` starting with `sk.eyJ...`). This is a secret key, not a public token.
- **Risk:** If the repo is public (or leaked), the token can be abused (quota/cost); revoking it can break builds.
- **Action:** Move the download token to environment variables (e.g. EAS Secrets or `.env` with `EXPO_PUBLIC_*` or a build-time env). Remove the token from `app.json` and ensure `.env` is in `.gitignore`. Use a config plugin or `app.config.js` to read the token from env. The map **access** token is already read from `EXPO_PUBLIC_MAPBOX_TOKEN` in `OrbTapMap.tsx`; the **download** token used by the native plugin must also come from env.

### 4. Physical address for contact

- **Current:** Legal text says “see app store listing for address.”
- **Action:** In both store consoles, provide a valid physical address (and support email). Optionally update `constants/LegalContent.ts` with the same address so in-app legal matches the listing.

---

## Strongly recommended

### 5. Hide or gate dev-only UI in production

- **Settings:** “ADMIN OVERRIDE (DEV)” (Map Provider toggles) is visible to all users. Consider wrapping in `__DEV__` or a feature flag so it does not appear in release builds.
- **Scan:** “DEV: SIMULATE SCAN” is useful in simulators but visible in production. Consider showing only when `__DEV__` is true or when no camera permission.
- **Signup:** There is a `__DEV__` block in signup; confirm it does not expose test accounts or unsafe shortcuts in release.

### 6. Android location permission

- **Current:** iOS has `NSLocationWhenInUseUsageDescription`. The app uses location (map, “nearby”).
- **Action:** Confirm Android declares the appropriate location permission (e.g. `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`) via Expo config or manifest, and that the store listing and in-app flows explain why location is used.

### 7. Scrolling and safe area

- **Current:** Many screens use `paddingBottom: 100–120` or `paddingBottom: 24 + insets.bottom`; some (e.g. feed, pulse, tutorials) use 40. On devices with tab bar and safe area, the last items may be tight.
- **Action:** Manually test key scrollable screens (Feed, Pulse, Tutorials, Settings, etc.) on real devices and ensure the last button/list item is comfortably reachable above the tab bar. Increase `paddingBottom` where needed (e.g. 100–120 or `insets.bottom + 80`).

### 8. Data deletion backend

- **Current:** `/data/delete` collects the user’s email and shows “Request submitted… We will process it within 30 days.” There is no visible backend call (e.g. to Cloud Function or Firestore) that actually records the request.
- **Action:** Implement server-side handling (e.g. Firestore write or callable function) so deletion requests are stored and can be processed. Otherwise reviewers may question whether account deletion is actually supported.

---

## Checklist before first submission

**Required**

- [ ] Change Android package from `com.anonymous.orbtap` to production ID (e.g. `com.orbtap.app`) and align `build.gradle`.
- [ ] Add **public** Privacy Policy (and Terms) URLs in App Store Connect and Google Play Console.
- [ ] Move Mapbox **download** token out of `app.json` into env/secrets; remove from repo.
- [ ] Provide a valid physical address (and support email) in both store listings; optionally update in-app legal.

**Recommended**

- [ ] Hide or gate “ADMIN OVERRIDE (DEV)” and “DEV: SIMULATE SCAN” in release builds.
- [ ] Confirm Android location permission and rationale in listing and in-app.
- [ ] Test all main scrollable screens on real devices; fix reachability where needed.
- [ ] Implement backend handling for data deletion requests from `/data/delete`.

**Store forms and build**

- [ ] Complete age rating and content questionnaires in both stores.
- [ ] Declare data collection (e.g. location, account, usage) in App Store Connect and Play Console (Data safety / Privacy nutrition label).
- [ ] Use production signing: iOS distribution cert + provisioning; Android upload key + Play App Signing; increment `versionCode` for each Play upload.
- [ ] Run full regression on real iOS and Android devices (login, map, orb, wallet, settings, legal, data deletion); fix any crashes or layout issues.

---

## Summary

- **Account deletion** and **Help text** are fixed in-app; **legal contact** placeholders are updated.  
- Before submission you **must**: fix Android package name, add public Privacy (and Terms) URLs, remove Mapbox secret from repo, and provide a real address in store listings.  
- Then complete store questionnaires, signing, and device testing. After that, OrbTap should be in good shape for Apple and Google review.

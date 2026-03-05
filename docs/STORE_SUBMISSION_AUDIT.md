# App Store & Google Play Submission Audit

**Date:** Current  
**App:** OrbTap (Expo / React Native)

---

## Report summary (fix before submitting)

Below are issues that commonly cause rejection or delay. **No code changes were made** per your request; this is report-only.

---

### 1. **Android package name (Google Play)**

- **Issue:** `app.json` has `"package": "com.anonymous.orbtap"`. Google Play prefers a non-anonymous, app-specific package (e.g. `com.orbtap.app`).
- **Risk:** Rejection or “unprofessional” feedback; harder to reclaim the same package later.
- **Recommendation:** Change Android package to `com.orbtap.app` (or your chosen domain-style ID) and align `android/app/build.gradle` and Java/Kotlin package paths. Do this before first production upload.

---

### 2. **iOS / Android permission descriptions**

- **Status:** Present in `app.json`:
  - `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSFaceIDUsageDescription` (iOS)
  - Expo plugins set camera and photos for Android.
- **Gap:** No explicit **location permission for Android** in the snippet (e.g. `ACCESS_FINE_LOCATION`). If the app uses location (e.g. map), ensure Android has the correct permission and a short rationale if required by Play policy.
- **Recommendation:** Confirm every permission you use has a clear, user-facing reason in store listing and in-app (e.g. settings or first-use prompt).

---

### 3. **Privacy policy & terms**

- **Status:** In-app legal routes exist (e.g. `app/legal/privacy.tsx`, terms, guidelines) and pull from `LegalContent`.
- **Requirement:** Both stores require a **public URL** to Privacy Policy (and often Terms) in the store listing. The app can deep-link to in-app legal; the store form needs a real URL.
- **Recommendation:** Host privacy (and terms) on a webpage and add that URL in App Store Connect and Google Play Console. Link the same URL from in-app “Privacy” / “Terms” if desired.

---

### 4. **Mapbox token in config**

- **Issue:** `app.json` plugins reference `RNMapboxMapsImpl` and a Mapbox download token. If this token is in version control or in a public repo, it can be abused (quota, cost).
- **Risk:** The token may be considered a secret; exposure can lead to revoke and build failures.
- **Recommendation:** Move Mapbox tokens to environment variables (e.g. `EXPO_PUBLIC_MAPBOX_*`) and ensure `.env` (and any files with secrets) are in `.gitignore`. Use EAS or CI secrets for production builds.

---

### 5. **Scrolling & reachability (in-app UX)**

- **Issue:** Some screens use modest `paddingBottom` on scroll content (e.g. 48–100). On devices with safe area / tab bar / notches, the last buttons or list items can be hard or impossible to reach.
- **Risk:** Not a direct store rejection, but poor UX can lead to negative reviews and lower approval confidence.
- **Recommendation:** Ensure every scrollable screen has enough bottom padding (e.g. 100–120+) so all buttons and list ends are clearly reachable above the tab bar and safe area. Applied in separate scrolling fix.

---

### 6. **No obvious crashes or placeholder content**

- **Status:** No intentional placeholder “lorem” or “test” content was found in the main user flows. Auth, wallet, and core flows use real UI and data structures.
- **Recommendation:** Run a full regression (login, map, orb, wallet, settings) on real devices and fix any crashes or missing error handling before submission.

---

### 7. **Age rating & content**

- **Recommendation:** Complete the age rating questionnaire in both stores. If the app allows user-generated content or social features, declare it and add moderation/safety measures in the listing and in-app (you have legal/guidelines routes; ensure they’re linked where relevant).

---

### 8. **Build & signing**

- **Recommendation:** For production:
  - **iOS:** Use a non-development provisioning profile and distribution certificate; ensure “Requires Full Screen” and device capabilities match your usage (e.g. push, Face ID).
  - **Android:** Use an upload key and enable App Signing by Google Play. Ensure `versionCode` is incremented per Play Store upload.

---

## Checklist before first submission

- [ ] Change Android package from `com.anonymous.orbtap` to a production ID (e.g. `com.orbtap.app`) if desired.
- [ ] Add a public Privacy Policy (and Terms) URL to both store listings.
- [ ] Move Mapbox (and any other) secrets to env vars; do not commit secrets.
- [ ] Confirm every permission has a clear rationale and is used in the app.
- [ ] Fix scrolling so all content and buttons are reachable (see scrolling fix).
- [ ] Run on real iOS and Android devices; fix crashes and layout issues.
- [ ] Complete store questionnaires (age rating, content, data collection).
- [ ] Use production signing and build config for release builds.

---

*This audit is report-only; no code was changed as part of this audit.*

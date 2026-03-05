# App Store Connect — OrbTap Submission Checklist

Use this checklist so OrbTap meets Apple’s requirements for submission. Items that live in the **repo or app** are done here; items that are **only in App Store Connect** must be completed in the portal.

---

## 1. App and build (repo / EAS)

| Item | Status | Where |
|------|--------|--------|
| **Bundle ID** | ✅ | `com.orbtap.app` in `app.config.js` and `ios/` |
| **Version** | ✅ | `app.config.js` → `expo.version` (e.g. 1.0.0) |
| **Build number** | ✅ | EAS `autoIncrement: true` in `eas.json` |
| **Copyright** | ✅ | `ios/OrbTap/Info.plist` + `app.config.js` → `NSHumanReadableCopyright`: "© 2025 OrbTap. All rights reserved." |
| **Export compliance** | ✅ | `ITSAppUsesNonExemptEncryption: false` in Info.plist (HTTPS/standard encryption only) |
| **App Store Connect App ID** | ✅ | `eas.json` → `submit.production.ios.ascAppId`: "6759234456" |

---

## 2. Legal and policies (in app and for store)

| Item | Status | Where |
|------|--------|--------|
| **Privacy Policy** | ✅ | In app: Settings → Privacy Policy → `/legal/privacy`. Use same URL in App Store Connect. |
| **Terms of Service** | ✅ | In app: Settings → Terms of Service → `/legal/terms`. Use same URL in App Store Connect if required. |
| **Legal & policies hub** | ✅ | Settings → "Legal & policies" → `/legal` (Terms, Privacy, Acceptable Use, Community Guidelines, Help). |
| **Privacy Policy URL (store)** | Required | In App Store Connect, set **Privacy Policy URL** to your live URL (e.g. `https://orbtap.com/legal/privacy`). Defined in repo: `constants/AppLinks.ts` → `PRIVACY_POLICY_URL`. |
| **Terms URL** | Optional for store | `constants/AppLinks.ts` → `TERMS_URL`. Add in App Store Connect if the form asks. |
| **Legal address** | Optional | Set `EXPO_PUBLIC_LEGAL_ADDRESS` or add in store listing. `LegalContent.ts` uses it for contact. |

---

## 3. Screenshots (App Store Connect)

Screenshots are **uploaded in App Store Connect**, not shipped in the app. Prepare 1–10 per device size; formats: JPEG, JPG, or PNG.

**Where to prepare:** Use simulator or device captures, then resize if needed. Specs and a short guide are in **`assets/app-store-screenshots/README.md`**.

**Required for OrbTap (iPhone only if you only support iPhone):**

- **6.7" (e.g. iPhone 15 Pro Max):** 1290 × 2796 px (portrait) — **required** if no 6.9" set.
- **6.5" (e.g. iPhone 14 Plus):** 1284 × 2778 px (portrait) — required if no 6.7"/6.9" provided; otherwise Apple may scale.

If the app runs on **iPad**, add iPad sizes per `assets/app-store-screenshots/README.md`.

Upload these in: **App Store Connect → Your App → App Store → [Version] → Screenshots**.

---

## 4. App Store Connect — required metadata (portal only)

Fill these in **App Store Connect** for the app and each version:

| Field | Required | Notes |
|-------|----------|--------|
| **Name** | Yes | 2–30 characters. e.g. "OrbTap". |
| **Subtitle** | Yes | Max 30 characters. Short tagline. |
| **Privacy Policy URL** | Yes | Must match a live URL (e.g. `https://orbtap.com/legal/privacy`). |
| **Primary Category** | Yes | e.g. Lifestyle or Navigation. |
| **Secondary Category** | No | Optional. |
| **Age Rating** | Yes | Complete questionnaire; OrbTap is likely 4+ or 9+ depending on content. |
| **Content Rights** | Yes | Confirm you have rights to all content (including third-party). |
| **Description** | Yes | Full app description. |
| **Keywords** | No | Improves search. |
| **Support URL** | Yes | e.g. `https://orbtap.com/legal/help` or your help page. |
| **Marketing URL** | No | Optional. |

---

## 5. Trademark and copyright

- **Copyright:** Shown in app (About/Settings) and in store via **Copyright** field in App Store Connect. Repo uses: "© 2025 OrbTap. All rights reserved."
- **Trademark:** If you use third-party names or logos, ensure you have rights and comply with Apple’s guidelines. "OrbTap" and in-app branding are your own.

---

## 6. Export compliance

- **In repo:** `ITSAppUsesNonExemptEncryption` is set to `false` (standard HTTPS/OS encryption only).
- **In App Store Connect:** When submitting the build, answer the export compliance question (typically "No" for only standard encryption). If you later use custom or non-exempt encryption, set the key and compliance answers accordingly.

---

## 7. Build and submit

1. **Build:** `eas build --platform ios --profile production`
2. **Submit:** `eas submit --platform ios --profile production` (uses `ascAppId` from `eas.json`).
3. In App Store Connect, attach the build to the correct version, complete any missing metadata and screenshots, then submit for review.

---

## 8. Quick reference — where things are in the repo

- **Copyright / export compliance:** `app.config.js` (ios.infoPlist), `ios/OrbTap/Info.plist`
- **Privacy/Terms URLs:** `constants/AppLinks.ts`
- **Legal copy (Terms, Privacy, etc.):** `constants/LegalContent.ts`
- **In-app legal entry:** Settings → Support & Legal (Help, Legal & policies, Terms, Privacy)
- **Screenshot specs:** `assets/app-store-screenshots/README.md`
- **EAS submit config:** `eas.json` → `submit.production.ios.ascAppId`

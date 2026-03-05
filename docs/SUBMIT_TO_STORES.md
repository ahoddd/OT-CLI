# Submit OrbTap to App Store Connect & Google Play

Step-by-step to ship the **current version** (1.0.0) to both stores using EAS Build and EAS Submit.

---

## Prerequisites

- **Apple Developer** account ($99/year) and **App Store Connect** access  
- **Google Play Console** account ($25 one-time) and a published app (or first-time setup)  
- **EAS CLI** logged in: `npx eas-cli login`  
- **Expo account** linked to this project (projectId in `app.config.js`)

---

## 1. Pre-submission checklist

Do these once before building for store submission.

### 1.1 Version and build numbers

- **Version:** `1.0.0` is set in `app.config.js` (expo.version). For future releases, bump here and in `package.json`.
- **iOS:** Build number is auto-incremented by EAS (`autoIncrement: true` in `eas.json` production profile).
- **Android:** `versionCode` is also auto-incremented by EAS for production builds.

No change needed for first submission unless you want a different version string.

### 1.2 Public URLs (required by both stores)

You must have **live URLs** for:

| Field | Example | Where to add |
|-------|--------|----------------|
| **Privacy Policy** | `https://www.orbtap.com/legal/privacy` | App Store Connect → App Information; Play Console → Policy → App content → Privacy policy |
| **Terms of Service** (optional but good) | `https://www.orbtap.com/legal/terms` | Same areas if the form has a field |

If your site is not live yet, use a placeholder that redirects or host a static page (e.g. GitHub Pages, Firebase Hosting) with the same content as your in-app legal. The stores need a URL; in-app-only is not enough for the form.

### 1.3 Store listing content (prepare in advance)

Have ready:

- **App name:** OrbTap  
- **Subtitle / short description:** e.g. “Discover real places. Earn points. Redeem perks.”  
- **Full description:** 1–2 paragraphs for store listing.  
- **Category:** e.g. Lifestyle (iOS), Social or similar (Android).  
- **Keywords** (iOS) / **Short description** (Android, 80 chars).  
- **Support URL:** e.g. `https://www.orbtap.com/support` or a contact page.  
- **Marketing URL** (optional).  
- **Screenshots:**  
  - **iOS:** 6.7", 6.5", 5.5" (iPhone); iPad if you support it.  
  - **Android:** Phone and 7" tablet (if applicable).  
- **App icon:** 1024×1024 (you’re using `assets/images/icon.png`).

### 1.4 Secrets and env (EAS)

- **Mapbox:** If you use a Mapbox **download** token in native config, store it in EAS Secrets and read it in `app.config.js` from env (do not commit it).  
- **Other:** Any `EXPO_PUBLIC_*` or build-time env vars should be set in [EAS Project → Secrets](https://expo.dev/accounts/[account]/projects/orbtap/secrets) or in the build profile `env` in `eas.json`.

### 1.5 Signing (first time)

- **iOS:** EAS can manage distribution certificate and provisioning profile. Ensure the Apple Developer team and bundle ID `com.orbtap.app` are correct in App Store Connect.  
- **Android:** EAS can generate an upload keystore, or you can use your own. For Play App Signing, Google will use the key you upload (or the one EAS created) as the upload key.

---

## 2. Build production artifacts

From the project root:

```bash
# Install EAS CLI if needed
npm install -g eas-cli

# Log in (if not already)
eas login

# Build for iOS (App Store)
eas build --platform ios --profile production

# Build for Android (Play Store)
eas build --platform android --profile production
```

Or both in one go:

```bash
eas build --platform all --profile production
```

- Builds run on Expo’s servers.  
- When the build finishes, you get a link to the build page (and optionally a build ID).  
- **iOS:** Download the `.ipa` or use “Submit to App Store” from the build page.  
- **Android:** Download the `.aab` (Android App Bundle) or use “Submit to Google Play” from the build page.

---

## 3. Submit to App Store Connect (iOS)

### Option A: EAS Submit (recommended)

After the iOS production build has completed:

```bash
# Submit the latest production iOS build
eas submit --platform ios --profile production --latest
```

- EAS will prompt for Apple ID and app-specific password (or use stored credentials).  
- It uploads the `.ipa` to App Store Connect and creates (or updates) the version in the “TestFlight” / “App Store” tab.

### Option B: Manual upload

1. In [expo.dev](https://expo.dev) → your project → Builds, open the latest **iOS production** build.  
2. Download the `.ipa`.  
3. Use **Transporter** (Mac App Store) or **Xcode → Window → Organizer** to upload the `.ipa` to App Store Connect.

### After upload (App Store Connect)

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **OrbTap**.  
2. Create a new version (e.g. 1.0.0) if it doesn’t exist.  
3. **Build:** Select the build you just uploaded.  
4. Fill in:  
   - **Privacy Policy URL** (required)  
   - **Category**, **Description**, **Keywords**, **Support URL**, **Screenshots**, **App icon** (if not already set).  
5. **App Privacy:** Complete the “App Privacy” / nutrition label (data collection and use).  
6. **Age Rating:** Complete the questionnaire.  
7. **Pricing:** Free or paid.  
8. When everything is complete, submit for **Review**.

---

## 4. Submit to Google Play (Android)

### Option A: EAS Submit (recommended)

After the Android production build has completed:

```bash
# Submit the latest production Android build
eas submit --platform android --profile production --latest
```

- You’ll be prompted for the **Google Play service account** JSON key (or existing credentials).  
- **First-time Google Play:** In Play Console, create the app (if needed), then in Google Cloud Console create a **service account** with **Google Play Android Developer** API access, grant it access in Play Console → Users and permissions, and download the JSON key. Use that key when EAS asks for credentials.  
- EAS uploads the `.aab` to the **Internal testing** track by default (configurable in `eas.json`).

### Option B: Manual upload

1. In [expo.dev](https://expo.dev) → your project → Builds, open the latest **Android production** build.  
2. Download the `.aab`.  
3. In [Google Play Console](https://play.google.com/console) → your app → **Release** → **Production** (or **Internal testing**), create a new release and upload the `.aab`.

### After upload (Play Console)

1. **Store listing:** Complete **Main store listing** (short description, full description, graphics, Privacy policy URL, etc.).  
2. **Data safety:** Declare data collection and usage (required).  
3. **Content rating:** Complete the questionnaire.  
4. **Target audience:** Set age groups if required.  
5. **Pricing:** Free or paid.  
6. Save and then **Send for review** (or promote the release to Production when ready).

---

## 5. EAS Submit configuration (optional)

Your `eas.json` has a minimal submit config. To point production submits to a specific track or Apple-specific options, you can extend it:

**iOS (App Store Connect):**

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID"
      }
    }
  }
}
```

**Android (Play Store track):**

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./path/to/play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

- `track` can be `internal`, `alpha`, `beta`, or `production`.  
- Use `serviceAccountKeyPath` or set credentials in EAS (eas credentials).

---

## 6. Quick command reference

| Step | Command |
|------|--------|
| Build iOS for store | `eas build --platform ios --profile production` |
| Build Android for store | `eas build --platform android --profile production` |
| Build both | `eas build --platform all --profile production` |
| Submit iOS (after build) | `eas submit --platform ios --profile production --latest` |
| Submit Android (after build) | `eas submit --platform android --profile production --latest` |
| Check build status | Open the link printed after `eas build`, or run `eas build:list` |

---

## 7. If you hit issues

- **EAS Build fails:** Check the build log on expo.dev; common fixes: run `npx expo prebuild --clean` if you changed native config, then trigger a new build.  
- **App Store rejection:** Address the reason in Resolution Center; often privacy policy URL, data collection declaration, or missing account deletion.  
- **Play rejection:** Check Policy status and fix any “App content” or “Data safety” issues.  
- **Signing:** Use `eas credentials` to configure or fix iOS/Android credentials.

For more on compliance (versions, icon, future updates), see **`docs/STORE_COMPLIANCE.md`**.  
For pre-submission QA (privacy URL, package name, data deletion), see **`docs/QA_STORE_READINESS_REPORT.md`**.

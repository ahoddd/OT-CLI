# Firebase Phone Verification — Setup for OrbTap

Phone verification during onboarding helps block bots and fraudulent sign-ups. **Both web and native use Firebase** to send the SMS; no Twilio or custom backend.

- **Web:** Firebase JS SDK `linkWithPhoneNumber` + invisible **reCAPTCHA**. Firebase sends the SMS.
- **Native (Expo / iOS / Android):** **@react-native-firebase/auth** — `verifyPhoneNumber` → user enters code → `linkWithCredential`. Firebase sends the SMS.

## Prerequisites

- **Blaze (pay-as-you-go) plan** — Firebase Phone Auth SMS is billed per verification.
- **Firebase project** (e.g. `orbtap`).
- **Native config:** For Expo/native, add `GoogleService-Info.plist` (iOS) and `google-services.json` (Android). The `@react-native-firebase/app` and `@react-native-firebase/auth` Expo plugins are already in `app.config.js`. Phone auth requires a **development build** (EAS Build or `expo run:ios` / `expo run:android`); it does not run in Expo Go.

---

## 1. Enable Phone sign-in in Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com) → your project.
2. Go to **Authentication** → **Sign-in method**.
3. Click **Phone** and turn **Enable** on.
4. Save.

---

## 2. Web flow (reCAPTCHA)

- **Authorized domains:** In **Authentication** → **Settings** → **Authorized domains**, ensure your web domain is listed (e.g. `localhost`, `orbtap.com`).
- **reCAPTCHA:** Firebase uses reCAPTCHA to prevent abuse. The app uses an **invisible** reCAPTCHA; no extra keys are required for the default setup.
- **Flow:** User enters phone (E.164), taps **Send code** → Firebase sends SMS → user enters 6-digit code → **Verify**. The client then writes `phoneNumber` and `phoneVerifiedAt` to Firestore `users/{uid}`.

---

## 3. Native flow (@react-native-firebase/auth)

On Expo and native apps, the Firebase **JS** SDK’s phone auth is not available (it requires RecaptchaVerifier, which is web-only). The app uses **@react-native-firebase/auth** instead: Firebase still sends the SMS; only the client API is different.

### 3.1 Setup

- **Packages:** `@react-native-firebase/app` and `@react-native-firebase/auth` are already installed. The Expo config plugins are in `app.config.js`.
- **Native config files:** Add your Firebase project’s config so the native SDK can connect:
  - **iOS:** `GoogleService-Info.plist` — download from [Firebase Console](https://console.firebase.google.com) → Project settings → your iOS app. Place it in the project (the plugin may expect it in the project root or `ios/`; see [Expo + React Native Firebase](https://rnfirebase.io/#expo)).
  - **Android:** `google-services.json` — download from Firebase Console → your Android app. Place it in the project root or `android/` as required by the plugin.
- **Development build:** Phone auth uses native modules. Use `expo run:ios`, `expo run:android`, or EAS Build. It will **not** work in Expo Go.

### 3.2 Flow in the app

1. User enters phone (E.164) and taps **Send code**.
2. App calls `auth().verifyPhoneNumber(phoneNumber)` from `@react-native-firebase/auth`. Firebase sends the SMS. The listener resolves with a `verificationId`.
3. User enters the 6-digit code and taps **Verify**.
4. App builds a credential with `PhoneAuthProvider.credential(verificationId, code)` and calls `currentUser.linkWithCredential(credential)`.
5. App writes `phoneNumber` and `phoneVerifiedAt` to Firestore `users/{uid}` (same as web).

### 3.3 iOS / Android specifics

- **iOS:** Follow [Firebase iOS phone auth docs](https://firebase.google.com/docs/auth/ios/phone-auth) (URL scheme for reCAPTCHA if used). The `@react-native-firebase/auth` Expo plugin helps with reCAPTCHA setup.
- **Android:** Follow [Firebase Android phone auth docs](https://firebase.google.com/docs/auth/android/phone-auth). For manual testing you can force reCAPTCHA via `auth().settings.appVerificationDisabledForTesting` (see RN Firebase docs).

---

## 4. App flow (summary)

| Platform | Flow |
|----------|------|
| **Web** | Enter phone → Send code (reCAPTCHA + Firebase SMS) → Enter code → Verify → client writes `users/{uid}`. |
| **Expo / iOS / Android** | Enter phone → Send code (Firebase `verifyPhoneNumber` → Firebase SMS) → Enter code → Verify (`linkWithCredential`) → client writes `users/{uid}`. |

- **Onboarding:** After “Choose your path”, the user sees **Verify your phone**. Both web and native can send a code and verify; user can **Skip** and verify later (e.g. in Settings).
- **Firestore:** After successful verification, `users/{uid}` has `phoneNumber` and `phoneVerifiedAt`. Your rules allow users to update their own document.

---

## 5. Optional: Require phone for sensitive actions

To reduce fraud, require `phoneVerifiedAt` for certain actions (e.g. redeeming high-value perks). In Cloud Functions or client logic, check `userDoc.phoneVerifiedAt` before allowing the action.

---

## 6. Quotas and costs

- **Web and native:** Firebase Phone Auth SMS is billed per verification (see [Firebase pricing](https://firebase.google.com/pricing)). No Twilio or other SMS provider is used.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Enable **Phone** in Authentication → Sign-in method |
| 2 | **Web:** Add domain to Authorized domains; no extra reCAPTCHA key for default setup |
| 3 | **Native:** Add `GoogleService-Info.plist` and `google-services.json`; use a development build (not Expo Go) |
| 4 | App: onboarding phone step works on web (Firebase JS) and in Expo/native (@react-native-firebase/auth); Firebase sends SMS in both cases; Firestore `phoneNumber` / `phoneVerifiedAt` |

After setup, test on **web** (Send code → Verify) and in a **development build** for iOS/Android (Send code → Verify).

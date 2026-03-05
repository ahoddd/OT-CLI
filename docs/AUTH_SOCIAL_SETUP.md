# Social Sign-In (Google & Apple) Setup

OrbTap supports **Sign in with Google** and **Sign in with Apple** on both **web** and **native** (iOS). Android shows Google when configured; Apple is iOS-only on native.

## 1. Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Authentication** → **Sign-in method**.
2. Enable **Google**: turn on, set support email, save. Copy the **Web client ID** (and optionally Web client secret if you use a backend).
3. Enable **Apple**: turn on, follow the prompts (Apple Developer account required). For web you may need to add your domain and redirect URLs.

## 2. Environment

- **Web**: No extra env needed. Firebase uses the project’s Google/Apple config; the app uses `signInWithPopup`.
- **Native Google**: In `.env` set:
  ```bash
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_from_firebase
  ```
  Use the same Web client ID from Firebase → Authentication → Google → Web SDK configuration. For native, add the redirect URI from Expo (e.g. `https://auth.expo.io/@your-username/orbtap`) in [Google Cloud Console](https://console.cloud.google.com) → APIs & Credentials → your OAuth 2.0 Client ID → Authorized redirect URIs.
- **Native Apple (iOS)**: The `expo-apple-authentication` plugin in `app.config.js` adds the Sign in with Apple capability. Ensure your Apple Developer account has Sign in with Apple enabled for the app.

## 3. Behavior

- **Login** (`/auth/login`): “Continue with Google” and “Continue with Apple” at the top; then “or continue with email” and the email/password form.
- **Sign up** (`/auth/signup`): Same social buttons; new social users get a Firestore profile via `initializeUserProfile` and are sent to onboarding.
- New users signing in with Google or Apple get a `users/{uid}` document created automatically if it doesn’t exist.

## 4. Troubleshooting

- **Google on native**: “Google sign-in is not configured” → set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and add the Expo redirect URI in Google Cloud Console.
- **Apple on web**: Ensure Firebase Apple provider is enabled and your domain is allowed.
- **Apple on iOS**: Build with EAS or `expo prebuild` so the capability is applied; Simulator may have limitations.

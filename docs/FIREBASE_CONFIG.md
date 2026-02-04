# OrbTap Firebase configuration

Reference config for the OrbTap project. Use this for local/dev; in production prefer environment variables so you can rotate keys without code changes.

## Project config (client)

```js
const firebaseConfig = {
  apiKey: "AIzaSyCaYOzOPnjEwfylnCV9AwDhB42fpQ-CNZU",
  authDomain: "orbtap.firebaseapp.com",
  projectId: "orbtap",
  storageBucket: "orbtap.firebasestorage.app",
  messagingSenderId: "850131821354",
  appId: "1:850131821354:web:2bedd32c5aeecf74e97453"
};
```

- **Project ID:** `orbtap`
- **Hosting (if used):** `https://orbtap.web.app`
- **API base (Cloud Functions):** `https://us-central1-orbtap.cloudfunctions.net` or your deployed Functions URL

## Wiring in the app

- **Entry point:** `firebaseConfig.ts` at project root initializes the Firebase app, Auth (with React Native persistence), and Firestore.
- **Auth:** `context/AuthContext.tsx` uses `onAuthStateChanged(auth, ...)`. Login/signup use `app/auth/login.tsx` and `app/auth/signup.tsx` (Cloud Functions for verify-before-create).
- **Firestore:** Exported as `db` from `firebaseConfig.ts`. Use for:
  - `users/{uid}` — profile, username, discoverable
  - `users/{uid}/friends/{friendUid}`
  - `users/{uid}/friendRequestsSent/{targetUid}`, `friendRequestsReceived/{fromUid}`
  - `spheres/{sphereId}` — sphere metadata (inviteCode, isPublic, etc.)
  - `spheres/{sphereId}/messages/{messageId}` — encrypted chat payloads (ciphertext, iv, at, senderId, senderDisplayName)
- **Cloud Functions:** `functions/` — verify-before-create (requestVerificationCode, verifyEmailCode), remote redemption (createRedemptionToken, redeemRemoteToken).

## Optional env overrides (Expo)

You can override config with `EXPO_PUBLIC_*` so the same codebase can point at different projects:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

If these are set, `firebaseConfig.ts` uses them; otherwise it uses the default config above.

## Firestore rules and indexes

- **Rules:** `firestore.rules` at project root defines read/write for users, friends, friend requests, sphere messages, redemption tokens, and partners. Deploy with `firebase deploy --only firestore:rules` after adding Firestore to your project.
- **Chat index:** For sphere chat, create a composite index in Firebase Console: Collection `spheres/{sphereId}/messages`, fields `at` (Ascending), limit 200. Or deploy via `firebase firestore:indexes` if you add an `firestore.indexes.json`.

## Security

- **API key in client:** Firebase client API keys are safe to ship; they identify the project, not authorize. Restrict usage in [Firebase Console](https://console.firebase.google.com) (API key restrictions, Auth/Firestore rules).
- **Secrets:** Never put Cloud Functions secrets (e.g. `encryption_key`, `resend_api_key`) in client code or in this doc. Use Firebase Functions config or environment variables in CI.

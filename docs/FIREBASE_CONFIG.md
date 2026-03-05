# OrbTap Firebase configuration

Reference config for the OrbTap project. Use this for local/dev; in production prefer environment variables so you can rotate keys without code changes.

## Project config (client)

**Do not put API keys in source.** Use environment variables only. See `.env.example`.

```js
// firebaseConfig.ts reads from process.env; example shape:
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,  // required; set in .env
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

- **Firestore rules:** `firestore.rules` at project root defines read/write for all OrbTap collections: users (and subcollections), sphere messages, partners, perks, verification/redemption (backend only), ledgers/verifiedActions/arena/work orders (backend only), polls, posts, globalAnnouncements, supportRequests, dataDeletionRequests, partnerApplications, config, and rate-limit/invite/backend collections. Deploy with `firebase deploy --only firestore:rules`.
- **Storage rules:** `storage.rules` allows partner post images (`posts/{partnerId}/**`), menu uploads (`menus/{partnerId}/**`), user avatars (`users/{userId}/**`), and featured images (`featured/**`). Deploy with `firebase deploy --only storage` so partner Create Post and menu uploads work.
- **Menu upload path:** Rules require `request.auth.uid == partnerId` for `menus/{partnerId}/**`. The app passes the signed-in user’s UID as the path segment when uploading (`storagePathUid` in `uploadMenuImage`), so production uploads succeed. Demo/mock can use a test user whose UID matches the mock partner id (e.g. `p1`).
- **Indexes:** `firestore.indexes.json` defines composite indexes for globalAnnouncements, polls, posts, workOrders, arenaVotes, ledger entries (collection group), proofPacks, and sphere messages (collection group). Deploy with `firebase deploy --only firestore:indexes`. New indexes may take a few minutes to build.
- **Full list:** See **[FIRESTORE_COLLECTIONS_DEPLOY.md](./FIRESTORE_COLLECTIONS_DEPLOY.md)** for every collection, who uses it, and the deploy checklist.

## Verification emails (6-digit signup codes)

Signup sends a 6-digit code to the user's email via **Resend** from **orbtap.com**. See **[VERIFICATION_EMAIL_SETUP.md](./VERIFICATION_EMAIL_SETUP.md)** for:

- Adding and verifying orbtap.com in Resend
- Setting `env.resend_api_key`, `env.orbtap_from_email`, and `env.encryption_key`
- Redeploying functions after config changes

## Redeploying Cloud Functions

After changing function code or config, build and deploy:

```bash
cd functions && npm run build && cd .. && firebase deploy --only functions
```

Full steps and one-off deploys: **[DEPLOY_CLOUD_FUNCTIONS.md](./DEPLOY_CLOUD_FUNCTIONS.md)**.

## Login fails after changing API key

If sign-in worked before and stops after rotating the Firebase API key:

1. **.env** — Ensure `EXPO_PUBLIC_FIREBASE_API_KEY` is set to the **new** key (no quotes). Restart the dev server after changing `.env`.
2. **Google Cloud Console** — [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials): the key in `.env` must exist and **API restrictions** must include **Identity Toolkit API** (Firebase Auth). If you restricted the key to specific APIs and left this out, login will fail.
3. **Application restrictions** — If you restricted the key to "iOS apps" or "Android apps", the bundle ID / package name must be `com.orbtap.app` and (for Android) the signing certificate SHA-1 must be added. Testing from a different platform (e.g. web or Expo Go) may be blocked until that platform is allowed.
4. **Firebase Console** — [Authentication → Sign-in method](https://console.firebase.google.com/project/orbtap/authentication/providers): ensure **Email/Password** (or the method you use) is **Enabled**.

## Security

- **API key in client:** Firebase client API keys are safe to ship; they identify the project, not authorize. Restrict usage in [Firebase Console](https://console.firebase.google.com) (API key restrictions, Auth/Firestore rules).
- **Secrets:** Never put Cloud Functions secrets (e.g. `encryption_key`, `resend_api_key`) in client code or in this doc. Use Firebase Functions config or environment variables in CI.

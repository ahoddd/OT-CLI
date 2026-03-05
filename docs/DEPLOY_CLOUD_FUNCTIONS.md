# How to redeploy Cloud Functions

OrbTap uses Firebase Cloud Functions (e.g. `requestVerificationCode`, `verifyEmailCode`, `searchDiscoverableUsers`). After changing function code or config, redeploy as below.

## Prerequisites

- Node.js 20, 22, or 24 (Firebase only supports these; `functions/package.json` has `"node": "20"`).
- Firebase CLI: `npm install -g firebase-tools`.
- Logged in: `firebase login`.
- **Active Firebase project** (required for deploy). Do this once from the repo root:
  ```bash
  firebase use orbtap
  ```
  If your project ID is different, use it instead of `orbtap`. To list projects: `firebase projects:list`. This creates/updates `.firebaserc` in the repo.

## 1. Install dependencies and build

From the **repo root** (OT-CLI), install and build in the `functions` folder:

```bash
cd functions
npm install
npm run build
cd ..
```

If you see **"Cannot find module 'firebase-functions'"** or **"Cannot find module 'resend'"**, run `npm install` inside `functions` and try again.

Or from repo root if you have a root script:

```bash
npm run build --prefix functions
```

The build compiles TypeScript in `functions/src/` to `functions/lib/`. Deploy uses `lib/`, not `src/`.

## 2. Deploy

From the **repo root** (OT-CLI), deploy only functions (no Firestore/hosting):

```bash
firebase deploy --only functions
```

If you see **"No currently active project"**, set the project first (one-time):

```bash
firebase use orbtap
```

Or deploy to a specific project without setting it as default:

```bash
firebase deploy --only functions --project orbtap
```

Do **not** run `npm run build` or `npm run deploy` from the repo root — there is no top-level `build` script. Always run build from inside `functions`.

To deploy a single function:

```bash
firebase deploy --only functions:requestVerificationCode
firebase deploy --only functions:verifyEmailCode
```

## 3. (Optional) Set or change config

If you need to set or update env (e.g. Resend API key, from-email, encryption key):

```bash
firebase functions:config:set env.resend_api_key="re_xxx"
firebase functions:config:set env.orbtap_from_email="OrbTap <verify@orbtap.com>"
firebase functions:config:set env.encryption_key="64-char-hex"
```

Then redeploy so new config is picked up:

```bash
cd functions && npm run build && cd .. && firebase deploy --only functions
```

## 4. View logs

After deploy, check logs for errors:

```bash
firebase functions:log
```

Or in [Firebase Console](https://console.firebase.google.com) → your project → **Functions** → **Logs**.

## Quick one-liner (from repo root)

```bash
cd functions && npm run build && cd .. && firebase deploy --only functions
```

This builds and deploys all functions to the project selected by `firebase use` (e.g. `orbtap`).

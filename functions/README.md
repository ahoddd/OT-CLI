# OrbTap Verify — Anti-Bot Email Verification

**Verify-Before-Create**: No account is created until the user proves they control the email with a 6-digit code. This makes bulk signups and bots impractical.

## Why it works

1. **No account without proof** — Bots can't create thousands of accounts without valid email access.
2. **Rate limiting** — Max 3 codes per email per hour; max 10 codes per IP per day (configurable in code).
3. **One-time codes** — 6-digit code expires in 10 minutes and is deleted after use.
4. **No password on client until verified** — Production flow stores encrypted signup data server-side only until code is verified.

## Setup

1. **Install dependencies**
   ```bash
   cd functions && npm install
   ```

2. **Set config** (Resend for email, encryption key for password storage)
   ```bash
   firebase functions:config:set env.encryption_key="YOUR_64_CHAR_HEX_KEY"
   firebase functions:config:set env.resend_api_key="re_xxxxxxxx"
   firebase functions:config:set env.orbtap_from_email="OrbTap <verify@yourdomain.com>"
   ```
   Generate a 64-char hex key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. **Verify your domain in Resend** and use that address in `orbtap_from_email`.

4. **Deploy**
   ```bash
   npm run build
   firebase deploy --only functions
   ```

## Firestore rules

Ensure only the Cloud Functions (admin) can read/write `verificationCodes` and `verificationRateLimit`. Do not expose these collections to client SDK.

## Dev bypass

When running the app in `__DEV__`, the client does not call these functions. Use code **123456** to create an account without receiving an email.

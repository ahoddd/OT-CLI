# OrbTap verification emails (Firebase)

Signup uses **Firebase’s built-in email verification**: the user creates an account with email and password, then Firebase sends a **verification link** to their email. The user clicks the link to verify (no 6-digit code). The email content and sender are configured in **Firebase Console → Authentication → Templates**.

## Checklist (so verification actually sends)

1. **Firebase Console → Authentication → Sign-in method**: Enable **Email/Password**. If it’s disabled, signup will fail before any email is sent.
2. **Authentication → Templates**: Edit **Email address verification** (sender name, subject, body with `%LINK%`). Save.
3. **Deploy Cloud Functions**: Deploy so **initializeUserProfile** exists (user profile + Firestore). The verification email itself is sent by Firebase Auth when the app calls `sendEmailVerification(user)` — no Cloud Function sends it.

## Flow

1. User fills the signup form (username, email, password, date of birth, terms).
2. App calls `createUserWithEmailAndPassword`, then **awaits** `sendEmailVerification(user)` so the email is queued before continuing.
3. App calls **initializeUserProfile** to create the user doc in Firestore and founding stats.
4. User sees “Account created — check your email for a verification link” and is taken to onboarding.
5. User clicks the link in the email → Firebase marks the email as verified.

## 1. Configure the email template in Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Authentication** → **Templates**.
2. Click **Email address verification** (or the pencil to edit).
3. Set:
   - **Sender name:** e.g. `OrbTap`
   - **Subject:** e.g. `Verify your email for %APP_NAME%`
   - **Message:** Use the placeholder Firebase provides for the verification link (e.g. `%LINK%` or the action URL). Example:

   ```
   Hello %DISPLAY_NAME%,

   Follow this link to verify your email address.

   %LINK%

   If you didn't ask to verify this address, you can ignore this email.

   Thanks,
   Your %APP_NAME% team
   ```

4. **From** will be something like `verify@orbtap.firebaseapp.com` (Firebase’s default). You cannot change this to a custom domain in the template UI unless you use a custom SMTP domain if available for your project.
5. Save.

## 2. Deploy Cloud Functions

The **initializeUserProfile** callable runs after signup to create the user document and update founding stats. Deploy functions so it’s available:

```bash
cd functions && npm run build && cd .. && firebase deploy --only functions
```

See [DEPLOY_CLOUD_FUNCTIONS.md](./DEPLOY_CLOUD_FUNCTIONS.md) for full steps.

## 3. Verify it works

1. Open the app and go to sign up.
2. Enter username, email, password, date of birth, confirm age and terms, tap **Create account**.
3. You should be taken to onboarding. Check the inbox for the verification email (from Firebase, using your template).
4. Click the link in the email. The account’s email is then marked verified in Firebase Auth.

If no email arrives:

- In **Authentication → Sign-in method**, ensure **Email/Password** is enabled.
- In **Authentication → Users**, confirm the user was created (then Firebase has definitely attempted to send).
- Check spam/junk and “Promotions” (Gmail).
- In **Templates**, confirm the **Email address verification** template is saved and the body includes the link placeholder (e.g. `%LINK%`).
- For custom domains or high volume, see Firebase’s docs on email configuration and quotas.

## Legacy: 6-digit code flow (Resend)

The previous flow used a 6-digit code sent via **Resend** and Cloud Functions **requestVerificationCode** / **verifyEmailCode**. That flow is no longer used for signup. Those functions can remain deployed for backward compatibility but are not called by the current app.

# User Referral Program

## Flow

1. **Share** — User A taps "Invite friends" on Profile (or "Invite now" at end of onboarding). Share sheet opens with message + link: `https://orbtap.com/invite?invite={userA_uid}`.
2. **Land** — User B opens link → `/invite` (invite landing) shows "You're invited" and "Create account".
3. **Sign up** — User B goes to signup with `?invite=userA_uid` preserved. After account creation, `recordReferredBy(newUid, referrerUid)` writes `referredBy` to `users/{newUid}`.
4. **Award** — Cloud Function `onUserReferralWritten` triggers on `users/{uid}` update when `referredBy` is set. Awards **50 OT Points** to both referee and referrer, sets `userReferralBonusAwarded: true`.

## App

- **AppLinks:** `userInviteUrl(referrerUid)`, `USER_INVITE_MESSAGE`
- **services/userReferral.ts:** `recordReferredBy(userId, referrerUid)`
- **app/auth/signup.tsx:** Reads `invite` param, calls `recordReferredBy` after create
- **app/invite/index.tsx:** Landing for `?invite=uid` → CTA to signup with param
- **app/(tabs)/profile.tsx:** "Invite friends" card with Share (already present)
- **app/auth/onboarding.tsx:** "Invite now" button on final step

## Backend

- **Firestore:** `users/{uid}.referredBy`, `users/{uid}.userReferralBonusAwarded`
- **Cloud Function:** `onUserReferralWritten` (Firestore `users/{uid}` onUpdate) — credits both via ledgers

## Deep link

Configure universal links / app links so `https://orbtap.com/invite?invite=xxx` opens the app to the invite landing (or signup with param).

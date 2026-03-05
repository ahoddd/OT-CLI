# Partner Referral Program

## How it works

1. **Apply** — Partner submits application at `/partner-apply`
2. **Share** — On success screen, "Share my referral link" opens native share with URL: `{ORBTAP_APP_LINK}/partner-apply?ref={applicationId}`
3. **Refer** — Another business opens the link; `ref` param prefills the referral code field
4. **Approve** — Admin approves in Admin Hub (Partner applications). Use **Approve & add to map** to approve and create the partner on the map in one step; or **Approve only** to just set status.
5. **Bonus** — Cloud Function `onPartnerApplicationUpdated` awards 100 OT Points to both referee and referrer (when referral code was used).

## Admin workflow

To approve and add a partner to the map (recommended):

1. Open the app → Profile → Admin Hub → Partner applications.
2. For a pending application, tap **Approve & add to map**. This approves the application, creates a partner document (with `ownerUid` = applicant's userId), sets `users/{userId}.partnerId`, and writes `partnerIdCreated` on the application. The partner appears on the map; they can add perks from their dashboard.
3. Alternatively, tap **Approve only** to set status without creating a partner (e.g. for ad-only applicants). You can create the partner later via Partners → Add partner to map (manual).

The referral bonus function runs when status becomes `approved` and writes `partnerReferralBonusAwarded: true` to avoid double-awarding.

## Requirements

- Referee application must have `referredByCode` (the referrer's application document ID)
- Both referee and referrer must have `userId` set (logged-in when applying) to receive points
- If referee has no userId, only the referrer is credited

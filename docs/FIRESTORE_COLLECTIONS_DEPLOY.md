# OrbTap Firestore Collections & Deploy Checklist

All Firestore collections used by the OrbTap app and Cloud Functions, with rules and indexes. Deploy so nothing is missed.

---

## Collections overview

| Collection (or path) | Used by | Rules | Indexes |
|----------------------|--------|-------|---------|
| **users** / users/{uid} | Client (profile, people), Functions (verify, wallet, invite) | read: discoverable \|\| owner \|\| friend; write: owner | — |
| **users/{uid}/friends** | Client (useFriends) | owner read/write | — |
| **users/{uid}/friendRequestsSent** | Client (useFriends) | owner read/write | — |
| **users/{uid}/friendRequestsReceived** | Client (useFriends) | owner read/write | — |
| **users/{uid}/followsPartners** | Client (followPartners) | owner read/write | — |
| **users/{uid}/devicePushTokens** | Client (pushNotifications), Functions (push) | owner read/write | — |
| **users/{uid}/private/notificationPreferences** | Client (notificationPreferences), Functions (push) | owner read/write | — |
| **users/{uid}/notifications** | Client (userNotifications), Functions (createUserNotifications, deleteOrbSignalForecast) | owner read/update/delete; create false (Functions only) | notifications: deletedAt+createdAt; deletedAt (collection group) |
| **spheres/{sphereId}/messages** | Client (useSphereChat) | auth read/create; no update/delete | messages: at ASC (collection group) |
| **verificationCodes** | Functions only | false | — |
| **verificationRateLimit** | Functions only | false | — |
| **redemptionTokens** | Functions only | false | — |
| **partners** | Client (partnersFirestore), Functions | auth read; write false | — |
| **perks** | Client (partnersFirestore), Functions | auth read; write false | partnerId (single-field auto) |
| **meta** | (legacy / reserved) | false | — |
| **metaStats** | Functions only (founding stats, verify) | false | — |
| **verifiedActions** | Functions only | false | uid (single-field auto) |
| **ledgers** / ledgers/{uid}/entries | Functions only | false | entries: type, reason, createdAt (see below) |
| **earnIdempotency** | Functions only | false | — |
| **arenaVotes** | Functions only | false | voterUid + createdAt |
| **voteIdempotencyKeys** | Functions only | false | — |
| **contestIntegrity** | Functions only | false | — |
| **trustScores** | Functions only | false | — |
| **integrityEvents** | Functions only | false | — |
| **ritualClaims** | Functions only | false | — |
| **workOrders** | Functions only (listWorkOrders returns data) | false | requesterUid+updatedAt; partnerId+updatedAt |
| **proofPacks** | Functions only | false | workOrderId |
| **jobProofReceipts** | Functions only | false | — |
| **partnerProofPortfolios** | Functions only | false | — |
| **workOrderAudit** | Functions only | false | — |
| **rateLimitVerify** | Functions only | false | — |
| **rateLimitVote** | Functions only | false | — |
| **rateLimitSpend** | Functions only | false | — |
| **rateLimitWorkOrder** | Functions only | false | — |
| **inviteCodes** | Functions only (applyInviteCode) | false | — |
| **config** | Functions only (push config) | false | — |
| **globalAnnouncements** | Client (useGlobalAnnouncement), Functions (create) | auth read; write false | active + createdAt desc |
| **supportRequests** | Client (supportRequests) | auth create; read/update/delete false | — |
| **dataDeletionRequests** | Client (dataDeletionRequests) | anyone create; read/update/delete false | — |
| **partnerApplications** | Client (partnerApplications), Functions (referral) | anyone create; read/update/delete false | — |
| **orbsignalForecasts** | Client (orbsignalForecasts), Functions (list/delete) | read/create: owner; delete false (Functions only) | userId ASC, createdAt DESC |
| **polls** | Client (polls.ts), Functions (triggers) | read all; auth create/update | createdAt desc |
| **pollVotes** | Client (polls.ts) | read all; auth create | — |
| **posts** | Client (orbPosts), Functions (triggers) | auth read/create | moderationStatus+publishedAt; createdAt |

---

## Deploy commands

Run from project root.

1. **Deploy Firestore rules** (all collections above are covered in `firestore.rules`):
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Firestore indexes** (composite indexes used by app and functions):
   ```bash
   firebase deploy --only firestore:indexes
   ```
   After deploy, new indexes may take a few minutes to build. Check status in Firebase Console → Firestore → Indexes.

3. **Deploy Cloud Functions** (so backend writes to the right collections):
   ```bash
   cd functions && npm run build && cd .. && firebase deploy --only functions
   ```

4. **Full Firestore + Functions** (when you change both):
   ```bash
   firebase deploy --only firestore,functions
   ```

---

## Indexes in firestore.indexes.json

You must deploy these so they exist in Firebase. In the Firebase Console you may only see a few (e.g. “receipts” or single-field auto indexes) until you run `firebase deploy --only firestore:indexes`. All composite indexes below are defined in `firestore.indexes.json` at the project root.

- **globalAnnouncements:** `active` ASC, `createdAt` DESC (client + functions).
- **polls:** `createdAt` DESC.
- **posts:** `moderationStatus` ASC, `publishedAt` DESC; and `createdAt` DESC.
- **workOrders:** `requesterUid` ASC, `updatedAt` DESC; and `partnerId` ASC, `updatedAt` DESC (listWorkOrders).
- **arenaVotes:** `voterUid` ASC, `createdAt` ASC (quarantine check).
- **entries** (collection group): `type` ASC, `reason` ASC, `createdAt` ASC; and same with `createdAt` DESC (ledger spend rules).
- **proofPacks:** `workOrderId` ASC.
- **messages** (collection group): `at` ASC (sphere chat).
- **notifications** (collection group): `deletedAt` ASC, `createdAt` DESC (inbox); `deletedAt` DESC (trash).
- **orbsignalForecasts:** `userId` ASC, `createdAt` DESC (list user forecasts).

---

## Client-only collections (no Functions write)

These are written by the client; rules allow the appropriate create/update:

- users, users subcollections (friends, friendRequests*, followsPartners, devicePushTokens, private/notificationPreferences)
- spheres/{id}/messages
- supportRequests, dataDeletionRequests, partnerApplications
- polls, pollVotes
- posts

---

## Backend-only collections (Cloud Functions only)

Rules: `allow read, write: if false` so only Admin SDK (Cloud Functions) can access:

- verificationCodes, verificationRateLimit, redemptionTokens
- meta, metaStats
- verifiedActions, ledgers, ledgers/{uid}/entries
- earnIdempotency, arenaVotes, voteIdempotencyKeys, contestIntegrity
- trustScores, integrityEvents, ritualClaims
- workOrders, proofPacks, jobProofReceipts, partnerProofPortfolios, workOrderAudit
- rateLimitVerify, rateLimitVote, rateLimitSpend, rateLimitWorkOrder
- inviteCodes, config

---

## Do I need to create collections or data manually?

**No.** Firestore creates a collection when the first document is written. You do **not** need to create empty collections in the console. As soon as the app or Cloud Functions write to a path (e.g. `users/abc123`, `orbsignalForecasts/xyz`), that collection appears. Ensure **rules** and **indexes** are deployed so reads/writes and queries work.

**Summary:** Deploy rules + indexes (and functions). Collections and documents are created by the app and functions at runtime.

---

## Verification

After deploy:

1. **Rules:** In Firebase Console → Firestore → Rules, confirm no syntax errors and that the rules file matches what you deployed.
2. **Indexes:** In Firestore → Indexes, confirm all composite indexes show “Enabled”. Fix any that fail (e.g. wrong collection group or field names).
3. **Functions:** In Firebase Console → Functions, confirm all expected functions are deployed and trigger correctly (e.g. verify, redeem, wallet, work orders, invite, push).

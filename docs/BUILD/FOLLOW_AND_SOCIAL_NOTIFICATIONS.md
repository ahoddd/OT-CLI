# Follow & Social Notifications

OrbTap sends targeted, high-value notifications so users stay engaged and businesses get more traffic. All push respects user preferences in **Settings → Notification preferences**.

## Partner-follow notifications

When a user **follows** a partner (`users/{uid}/followsPartners/{partnerId}`), they can receive:

| Trigger | In-app | Push | Pref |
|--------|--------|------|------|
| **New OrbFeed post** by that partner | ✅ All followers | ✅ If **Partner updates** on | `partnerUpdates` |
| **New OrbVote poll** by that partner | ✅ All followers | ✅ If **Partner updates** on | `partnerUpdates` |

- **Commerce Feed (OrbFeed):** `onPostCreated` (Firestore `posts/{postId}` onCreate) → `getFollowerUidsForPartner(partnerId)` → in-app + optional push.
- **OrbVote:** `onPollCreated` (Firestore `polls/{pollId}` onCreate) → same for followers when `partnerId` is set; plus existing broadcast to all users with polls enabled.

Follow documents store `partnerId` so Cloud Functions can query `collectionGroup('followsPartners').where('partnerId', '==', partnerId)` (index required).

## Friend-activity notifications

When a **friend** does something, the user can get notified (default on):

| Trigger | In-app | Push | Pref |
|--------|--------|------|------|
| **Friend checked in / earned OT** (verified action) | ✅ All friends | ✅ If **Friend activity** on | `friendActivity` |
| **Friend placed an Orb Signal forecast** | ✅ All friends | ✅ If **Friend activity** on | `friendActivity` |

- **Verified action:** `onVerifiedActionCreated` (Firestore `verifiedActions/{actionId}` onCreate) → `getFriendUids(uid)` → in-app + optional push. Body includes partner name and OT earned.
- **Orb Signal forecast:** `onOrbSignalForecastCreated` (Firestore `orbsignalForecasts/{forecastId}` onCreate) → same friend list → in-app + optional push.

Friends are read from `users/{uid}/friends` (doc IDs = friend UIDs).

## Implementation details

- **Helpers (functions):** `getFollowerUidsForPartner(partnerId)`, `getFriendUids(uid)`, `sendInAppAndPushToUsers(uids, payload, { pushPrefKey })`.
- **In-app:** Every targeted notification is written to `users/{uid}/notifications` with `type`, `title`, `body`, `data` (e.g. `url`, `postId`, `partnerId`).
- **Push:** Expo Push; only sent when `pushEnabled` and the relevant pref (e.g. `partnerUpdates`, `friendActivity`) allow it.
- **Deep links:** `data.url` is used by `NotificationResponseHandler` (e.g. `/feed/{postId}`, `/vote`, `/orbsignal`).

## Indexes

- **followsPartners** (collection group): `partnerId` ASC (for follower lookup by partner).

## User preferences (Firestore `users/{uid}/private/notificationPreferences`)

- `partnerUpdates` — Partner updates (posts/polls from followed partners). Default **off**.
- `friendActivity` — Friend activity (check-ins, Orb Signal forecasts). Default **on**.

See **Settings → Notification preferences** in the app.

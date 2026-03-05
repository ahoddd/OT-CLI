# Notifications Firestore index

The in-app notification center queries `users/{uid}/notifications` with:

- `where('deletedAt', '==', null)`
- `orderBy('createdAt', 'desc')`

That requires a **composite index** on the `notifications` collection group:

- **deletedAt** (Ascending)
- **createdAt** (Descending)

## If you see "The query requires an index"

1. **Deploy indexes from the repo** (after `firebase login`):
   ```bash
   npx firebase deploy --only firestore:indexes
   ```

2. **Or create the index in Firebase Console**  
   When the error appears, it includes a link like:
   ```
   https://console.firebase.google.com/v1/r/project/orbtap/firestore/indexes?create_composite=...
   ```
   Open that link in a browser (while logged into the Firebase project) and click **Create index**. Wait a few minutes for the index to build.

The index is already defined in **`firestore.indexes.json`** (collection group `notifications`, fields `deletedAt` ASC, `createdAt` DESC). Deploying indexes applies it to your project.

---

## Notification wiring (in-app + push)

- **Notification center (in-app):** `app/notifications/index.tsx` — inbox + trash, real-time via `subscribeInbox` from `services/userNotifications.ts`. Entry: Settings → "Notification center" and Profile → bell icon.
- **Push registration:** `PushRegistration` in `app/_layout.tsx` registers the Expo push token to Firestore when the user is signed in and push is enabled in preferences.
- **Tap handling:** `NotificationResponseHandler` in `app/_layout.tsx` opens the app to the screen in `data.url` when the user taps a push notification.
- **Settings:** Settings → "Push notifications" → `app/notification-settings.tsx` (preferences for push).
- **Backend:** Cloud Function `createUserNotifications` creates in-app notifications (and optional push) for broadcasts, poll reminders, etc. Admin can send to notification center (and optionally push) from the admin hub.

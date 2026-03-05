# Poll Push Notifications — Scaffolding

The app now registers for Expo Push and stores tokens in `users/{uid}/devicePushTokens/{tokenId}`.

## Completed
- `expo-notifications` + `expo-device` installed
- `services/pushNotifications.ts` — register, save token to Firestore
- `components/PushRegistration.tsx` — auto-registers when user signs in
- Firestore rules: `users/{uid}/devicePushTokens/{tokenId}` (owner read/write)

## Cloud Function Triggers (TODO)

To send poll-related push notifications:

### 1. New poll created
**Trigger:** `onCreate` on `polls/{pollId}`
- Query `users` or `devicePushTokens` to get subscribers
- Option: maintain `pollSubscribers` or `notificationPreferences` — users who opted into poll notifications
- Send via [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/) with payload:
  - `title`: "New poll: {question}"
  - `body`: "Vote now and earn 5 OT"
  - `data.url`: `/feed?mode=polls` or `/vote` for deep link

### 2. Voting deadline approaching
**Trigger:** Scheduled (e.g. Cloud Scheduler every hour) or `onUpdate` when `endsAt` changes
- Query polls where `endsAt` is within next 24h and not yet notified
- For each, get tokens of users who haven't voted
- Send reminder: "Poll closes in X hours — cast your vote!"
- Mark poll as `deadlineReminderSent: true` to avoid duplicate sends

### Sending via Expo Push API
```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[xxxx]",
    "title": "New poll",
    "body": "Vote now!",
    "data": { "url": "/feed?mode=polls" }
  }'
```

### EAS Project ID
For push to work in production, run `eas init` and add `projectId` to app config. See [Expo Push setup](https://docs.expo.dev/push-notifications/push-notifications-setup/).

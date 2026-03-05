# Stamp Cards — Config Schema

Server-authoritative config. Stored in Firestore (e.g. `config/stampCards` or `config/stampCardsAdmin`). Admin Hub reads/writes via getStampCardsConfig / setStampCardsConfig (when implemented).

## Top-level config

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enableStampCards` | boolean | true | Global kill switch for Stamp Cards module. |
| `requirePartnerVerified` | boolean | true | Only verified partners can run ACTIVE programs. |
| `globalOtPointsCompletionBonusCap` | number | 25 | Max OT Points per completion bonus (admin cap). |
| `globalOtPointsBonusCapPerUserPerDay` | number | 50 | Max OT Points from stamp bonuses per user per day. |
| `allowedRewardTypes` | string[] | all v1 types | Allowed reward types (FREE_ITEM, PERCENT_OFF, BOGO, UPGRADE, VIP_DROP_ACCESS, OT_POINTS_BONUS). |
| `defaultCooldownPresets` | number[] | [4, 12, 24] | Cooldown hour options. |
| `defaultStampsRequiredOptions` | number[] | [5, 8, 10, 12] | Stamps required options. |
| `rateLimitScanAttemptsPerUidWindowMs` | number | 3600000 | 1h window for rate limit. |
| `rateLimitScanAttemptsPerUidMax` | number | 30 | Max scan attempts per uid per window. |

## Tier config (StampCardsTierConfig)

Per-partner tier (silver / gold / platinum) limits — see `constants/StampCardsTierConfig.ts` and admin-overridable doc `config/stampCardsTier`:

- `maxActivePrograms`
- `stampsRequiredPresets`
- `cooldownHoursPresets`
- `allowedRewardTypes`
- `designLevel` (basic | advanced | full)
- `analyticsLevel`
- V1.1: `boostWindowsEligible`, `multiLocationEligible`, `staffRolesEligible`

## Program-level: boost windows

When tier has `boostWindowsEligible` and the feature flag `stampCardsBoostWindows` is on, partners can set **double-stamp windows** (UTC) on a program in Stamp Studio. During a window, each scan awards 2 stamps instead of 1.

- `boostWindows`: optional array of `{ startHour: number, endHour: number }` (0–23 UTC). Example: `[{ startHour: 11, endHour: 14 }]` = lunch window.
- Evaluated server-side in `stampCardsEarnStamp`; idempotency and cooldown unchanged.

## Push reminders

- **Config**: `config/push` doc has `stampReminderEnabled` (default true). When true:
  - **Callable** `stampCardsSendReminders` (admin-only): run on demand to send push to users with a reward **expiring in 24h** (EARNED, `expiresAt` in window).
  - **Scheduled** `stampCardsRemindersScheduled`: runs daily at **10:00 UTC** and sends the same reminders (no admin action required).
- **User prefs**: `users/{uid}/private/notificationPreferences.stampReminders` (default true). Cloud Functions respect this when sending stamp reminder push.

## Admin actions (audited)

- Pause a partner's program: set program `status` to `PAUSED`.
- View flagged partners/users: query `stampEvents` / `stampReports` by status.
- Change global config: update config doc; log to audit.

## Ledger reasons (Orbinomics)

- `EMIT_STAMP_EARNED`: 0 points (proof only).
- `EMIT_STAMP_CARD_COMPLETE_BONUS`: completion bonus (capped).
- `EMIT_STAMP_CARD_OT_BONUS`: reward type OT_POINTS_BONUS (capped).
- `EMIT_STAMP_REWARD_REDEEMED`: 0 points (proof only).

All awarding is server-side in stamp Cloud Functions; idempotent and rate-limited.

## Deployment / next steps

1. **Deploy functions**: `cd functions && npm run build && firebase deploy --only functions` (deploys `stampCardsSendReminders` and `stampCardsRemindersScheduled`).
2. **Firestore index**: Deploy indexes so the reminder query works: `firebase deploy --only firestore:indexes` (or ensure `stampCardState` index on `activeReward.status` is created).
3. **Push config**: In Admin → Push, ensure **Stamp card reminders** is on (or set `config/push` doc with `stampReminderEnabled: true`). Use **Run stamp reminders now** to test.
4. **User prefs**: Users control stamp reminders in Settings → Notification preferences → Stamp card reminders.

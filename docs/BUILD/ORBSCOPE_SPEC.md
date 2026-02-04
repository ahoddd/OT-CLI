# OrbScope™ — Daily Vibe (Product Spec)

Opt-in only. One card per day. Routes users into Drops, Quests, Pulse, Circle, or First OrbProof. No new tab; no content sink.

## Blueprint alignment

- **Paths**: `app/`, `app/(tabs)/`, `components/`, `constants/`, `hooks/`, `context/`, `docs/BUILD/`.
- **Routing**: No new routes; "Do it" uses existing `/pulse`, `/missions`, `/spheres`, `/(tabs)/scan`.
- **Design**: Nightglass; existing layout wrappers and spacing on Home.
- **Flags**: `isOrbScopeEnabled`, `isOrbScopeShareCardEnabled`, `isOrbScopeStreakEnabled`, `isOrbScopeNotificationsEnabled` (default OFF).

## Generation rules (deterministic)

Today's OrbScopeDaily is generated at first need (first app open or first Home visit) and cached for the day (same message if reopened).

**Action-type priority:**

1. **FIRST_PROOF** — User has zero verified actions → nudge to scan and earn first OrbProof.
2. **DROP** — Live drops exist (at least one drop with `endAt > now`) → scarcity.
3. **QUEST** — Today's missions exist → direction.
4. **CIRCLE** — User has at least one circle and date-seed % 4 === 0 → occasional social.
5. **PULSE** — Default → discovery (OrbPulse Live).

Template is chosen by `getRandomTemplateForActionType(actionType, dateKey)` so the same dateKey always yields the same template for the day.

## Action routing (Do it)

| actionType   | Route           |
|-------------|-----------------|
| DROP        | `/pulse`        |
| QUEST       | `/missions`     |
| PULSE       | `/pulse`        |
| CIRCLE      | `/spheres`      |
| FIRST_PROOF | `/(tabs)/scan`  |

## Data model

- **OrbScopeSettings**: In Preferences: `orbScopeEnabled` (bool). Optional later: zodiacSign, categories.
- **OrbScopeDaily**: `dateKey`, `vibeId`, `vibeText`, `actionType`, `actionPrompt`, `actionRef?`, `createdAt`. Stored in AsyncStorage under `ORBTAP_ORBSCOPE_DAILY_V1` (single object; overwritten each day).
- **OrbScopeStreak**: `currentStreakCount`, `lastViewedDateKey`, `lastCompletedActionDateKey`. Stored under `ORBTAP_ORBSCOPE_STREAK_V1`. Streak increments only on daily view (consecutive days). Bonus for verified action completion is server-authoritative (MVP: client tracks only).

## UI placement

- **Home** (`app/(tabs)/index.tsx`): One OrbScope card module below the header bar, above Live Pulse. Rendered only when `flags.isOrbScopeEnabled && prefs.orbScopeEnabled` and daily is loaded.
- **Settings**: "OrbScope: Daily Vibe" toggle (switchKey `orbScopeEnabled`).

## Share card

- When `isOrbScopeShareCardEnabled`: OrbScopeShareCardView is rendered off-screen and captured via `react-native-view-shot`. Share sheet receives message + optional image (file URI). No fake scarcity on the card; "Open OrbTap" / deep link marker only.
- Deep link: message includes `ORBTAP_APP_LINK`; in-app routing to the action is via normal navigation (no custom scheme required for MVP).

## Acceptance tests

1. **Opt-in**: Toggle OrbScope on in Settings; card appears on Home. Toggle off; card disappears.
2. **Daily stability**: Same dateKey → same vibe message for the day.
3. **Routing**: "Do it" navigates to the correct screen per actionType.
4. **No bloat**: No new main tab; no feed; only one card.
5. **Share**: Share opens native sheet; message (and image when flag on) present.
6. **Streak**: When streak flag on, viewing card updates streak; display shows "N day streak" when N > 0.
7. **UI safety**: Card uses existing layout; no overlap or clipped content.

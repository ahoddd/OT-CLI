# Daily Orb Ritual — Config Schema

Admin-configurable payout and badge tuning. Stored in AsyncStorage key `ORBTAP_DAILY_RITUAL_CONFIG_V1`. Server may read from Firestore in future; client uses this for display and fallback.

## DailyOrbRitualConfig

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Master kill switch for ritual rewards. |
| `points` | RitualPointsConfig | Points min/max, daily cap, distribution, streak bonus. |
| `badges` | RitualBadgesConfig | Badge tier probabilities, pity timers, duplicate handling. |
| `eligibility` | RitualEligibilityConfig | Min account age, verified email/phone. |
| `audit` | { updatedAt, updatedBy } | Last save metadata. |

## RitualPointsConfig

| Field | Type | Description |
|-------|------|-------------|
| `min` | number | Minimum OT Points per claim. |
| `max` | number | Maximum OT Points per claim. |
| `dailyMaxPointsFromRitual` | number | Hard cap per user per day from ritual. |
| `distribution` | 'WEIGHTED_BUCKETS' \| 'TRUNCATED_NORMAL' | How to sample amount. |
| `buckets` | PointBucket[] | For WEIGHTED_BUCKETS: [{ min, max, weight }]. Weights normalized in code. |
| `streakBonus` | { enabled, perDayBonus, maxBonus } | Extra points per consecutive day; cap. |

## RitualBadgesConfig

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Whether to roll a badge at all. |
| `probabilitiesByTier` | { common, rare, legendary, apex } | Probability per tier (0–1). Heavily favor common/rare. |
| `pityTimerRareAfterNDaysNoRare` | number | After N days with no rare, increase rare chance (optional). |
| `pityTimerLegendaryAfterNDaysNoLegendary` | number | Same for legendary. |
| `hardDisableApexUntilAccountAgeDays` | number | No apex badge until account age ≥ this. |
| `duplicateBadgeBonusPoints` | number | When user already has rolled badge: give this many OT Points instead of re-roll. |

## Eligibility

| Field | Type | Description |
|-------|------|-------------|
| `minAccountAgeHours` | number | Account must be at least this old to claim. |
| `requireVerifiedEmailOrPhone` | boolean | Require verified email or phone. |

## Defaults (constants/DailyRitualConfig.ts)

- Points: min 10, max 100, dailyMax 100, WEIGHTED_BUCKETS with 4 buckets.
- Badge probs: common 16%, rare 4%, legendary 0.3%, apex 0.05%.
- Pity: rare after 7 days, legendary after 30; apex disabled until 30 days account age.
- Duplicate badge → 5 OT Points bonus.

## Ledger

- Reason: `EMIT_DAILY_ORB_RITUAL` (OrbinomicsPolicy.ts).

## Server (Cloud Function claimDailyOrbRitual)

- Idempotent per user per UTC calendar day.
- Returns: pointsAwarded, badgeAwarded?: { badgeId, tier }, alreadyClaimed, claimedAt, nextEligibleAt.
- MVP: points from fixed range (10–100); badge roll from tier probs. Config can be read from Firestore later.

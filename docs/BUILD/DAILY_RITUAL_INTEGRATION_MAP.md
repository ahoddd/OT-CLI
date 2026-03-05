# Daily Orb Tap Ritual + Badges — Integration Map (Phase 0)

**Scope:** Daily Orb Tap reward (OT Points reveal after 3rd tap), admin-configurable payout/badges, 40-badge collectible system on Profile. Server-authoritative claim; no architecture/nav refactors.

---

## 1. Orb tap screen / 3-tap + break animation

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Orb hub (ritual container) | `app/(tabs)/orb.tsx` | DAILY RITUAL section; uses `DailyStreakOrb` with `onRitualComplete`; `ritualCompleteToday` / `streak.lastCheckInDate === getToday()` for “Done for today”. |
| 3-tap + shatter + reveal | `components/DailyStreakOrb.tsx` | Tap count 0→1→2, crack overlay, 3rd tap sets `shattering` → scale/opacity to 0 → `onShatterComplete`. Currently: client-only random prize, `addTransaction`, `checkIn()`, streak badges. **Extend:** After break animation, call server claim (daily ritual endpoint); on response show points + optional badge; subtext “Daily Ritual”; CTA Done + optional View Wallet / View Badges. |

---

## 2. Wallet / Orbinomics ledger

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Ledger reason constants | `constants/OrbinomicsPolicy.ts` | Add `EMIT_DAILY_ORB_RITUAL` to `LEDGER_REASON`. |
| Wallet add + persist | `context/WalletContext.tsx` | `addTransaction({ type, amount, reason, ref })`; applies fee rate for earn; persists to AsyncStorage. Ritual will call this only after server confirms (or server returns balance and we sync). |
| Server award API | `services/verifyApi.ts` | `awardVerifiedAction({ refType, refId, reasonCode, ... })`; Cloud Function. **Add** `claimDailyOrbRitual()` (or new callable) that returns `pointsAwarded`, `badgeAwarded?`, `alreadyClaimed`, `claimedAt`, `nextEligibleAt`; idempotent per user per day. |

---

## 3. Admin Hub config patterns

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Config hook pattern | `hooks/useOrbVoteConfig.ts` | Load/save from AsyncStorage; `DEFAULT_*`, storage key, `saveConfig`, `resetToDefaults`. Reuse for Daily Orb Ritual config. |
| Config constants | `constants/OrbVoteConfig.ts` | Type + `DEFAULT_*` + storage key. **Add** `constants/DailyRitualConfig.ts` (or extend a shared config) with `DailyOrbRitualConfig` type and defaults. |
| Admin UI | `app/admin/index.tsx` | System section has Orbinomics, OrbVote, Missions, etc. **Add** “Daily Orb Ritual” subsection: toggles (enabled, points, badges), min/max, buckets/weights, daily cap, badge tier probs, pity timers, eligibility; save + last updated; use existing section/card styles. |

---

## 4. Profile page (badges)

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Profile screen | `app/(tabs)/profile.tsx` | Uses `useBadges()`, `earnedBadges`, `foundingStats`, `hasBadge`. Has styles `badgesSection`, `badgeStrip`, `badgeEmpty`. **Add** “Badges” section: grid of earned (ritual + existing) badges, tier counts, tap → detail modal. Optional: small badge count chip in header. |
| Badge pill component | `components/BadgePill.tsx` | Takes `BadgeDef`, `earned`, size, showName, onPress. Works with current `BadgeDef` (id, name, icon, color, etc.). New registry can supply same shape or extend. |

---

## 5. Existing badge / collectibles system

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Badge definitions | `constants/Badges.ts` | `BadgeId` union, `BadgeDef` (id, name, description, icon, color, order, category). **Extend:** Add 40 ritual badges (new IDs + tier + earnMethod RITUAL_RANDOM); keep existing 18; total 58 or separate “RitualBadge” registry. Spec: 40 badges, 4 tiers (COMMON/RARE/LEGENDARY/APEX). Prefer **separate** `RitualBadgeRegistry` + `RitualBadgeId` so existing flows unchanged; merge display on Profile. |
| Earned badges state | `hooks/useBadges.ts` | `earnedIds: BadgeId[]`, `earnBadge(id)`, `hasBadge(id)`, AsyncStorage + Firestore `users/{uid}.badges`. **Extend:** Store ritual-earned badge IDs in same list (or separate `ritualEarnedIds` and merge in hook). When server returns `badgeAwarded`, call `earnBadge(badgeId)`. |
| Streak (day boundary) | `hooks/useStreak.ts` | `getToday()`, `checkIn()`, `lastCheckInDate`. Ritual “once per day” can use same date boundary; server must use same (e.g. UTC date or app-timezone date). |

---

## 6. Backend (Cloud Functions)

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Callable / REST | `functions/src/index.ts` | Add `claimDailyOrbRitual` (or similar): validate auth, check last claim date, if already claimed today return idempotent payload; else compute points (from config), roll badge (from config probs + pity), credit wallet (ledger reason EMIT_DAILY_ORB_RITUAL), record claim + optional badge, return payload. Rate limit per uid. Log integrity events. |

---

## 7. Feature flags

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Default flags | `constants/Flags.ts` | Add `ritualDailyOrbEnabled`, `ritualPointsEnabled`, `ritualBadgesEnabled`, `ritualAdminConfigEnabled` (all true by default). |
| Admin categories | `constants/AdminConfig.ts` | Add flag labels and category for ritual flags if they appear in Hub. |

---

## 8. Integrity / audit

| Purpose | Exact path | Notes |
|--------|------------|--------|
| Event types | `constants/IntegrityEvent.ts` | Add `RITUAL_CLAIM_SUCCESS`, `RITUAL_ALREADY_CLAIMED`, `RITUAL_BLOCKED_ELIGIBILITY`, `RITUAL_BADGE_AWARDED`. Client or server logs these where appropriate. |

---

## 9. Files to add (new)

- `constants/DailyRitualConfig.ts` — DailyOrbRitualConfig type, defaults, storage key.
- `constants/RitualBadges.ts` — 40-badge registry (id, tier, name, description, iconAsset, earnMethod).
- `hooks/useDailyRitualConfig.ts` — Load/save ritual config (Admin).
- `services/ritualApi.ts` — `claimDailyOrbRitual()` callable wrapper.
- `docs/BUILD/RITUAL_CONFIG.md` — Config schema.
- `docs/BUILD/DAILY_RITUAL_BADGES_TEST_CHECKLIST.md` — Manual test checklist.

---

## 10. Files to extend (existing)

- `components/DailyStreakOrb.tsx` — After shatter: call server claim; show points + “Daily Ritual”; optional badge chip + “New Badge!”; Done / View Wallet / View Badges.
- `app/(tabs)/orb.tsx` — Gate ritual section by `ritualDailyOrbEnabled`; pass config/streak to orb if needed.
- `constants/OrbinomicsPolicy.ts` — Add `EMIT_DAILY_ORB_RITUAL`.
- `context/WalletContext.tsx` — Optional: apply ritual balance from server response (or keep addTransaction with server amount).
- `constants/IntegrityEvent.ts` — New ritual event types.
- `constants/Flags.ts` — Ritual feature flags.
- `constants/AdminConfig.ts` — Ritual flag labels/category.
- `app/admin/index.tsx` — Daily Orb Ritual config subsection (form + save).
- `app/(tabs)/profile.tsx` — Badges section: grid of earned badges (ritual + existing), tier counts, detail modal.
- `hooks/useBadges.ts` — Support ritual badge IDs; `earnBadge` for ritual awards.
- `functions/src/index.ts` — `claimDailyOrbRitual` implementation (idempotent, caps, badge roll, ledger).

---

*Discovery complete. Proceed to Phase 1 implementation after approval.*

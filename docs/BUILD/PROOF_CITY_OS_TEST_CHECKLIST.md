# Proof-Powered City OS — Manual Test Checklist

Use this to validate the core loop and fraud foundation end-to-end.

## 1. Verified action mints receipt

- [ ] **QR redeem**: Open Scan tab → (or DEV: Simulate Scan) complete a redeem → success screen shows points and "View Proof Card" → tap View Proof Card → Proof card shows partner, points, tier, timestamp → Share works.
- [ ] **Drop redeem**: Home → See All (Pulse) → tap a Drop tile → Reserve (pay fee if any) → tap "Redeem at venue · Get proof" → success screen → View Proof Card → receipt and share.
- [ ] **Quest complete (partner-linked)**: Missions → Generate missions → Complete a mission that has a partner → Wallet balance increases; Pulse should reflect the verified action (mission_complete weight).

## 2. Points granted via Orbinomics policy

- [ ] After QR redeem: Wallet → Recent Activity shows an earn with reason `EMIT_VERIFIED_REDEEM` (or display text from policy).
- [ ] After drop redeem: Ledger shows earn with `EMIT_DROP_REDEEM`; balance increased by drop redeem rate (e.g. 75).
- [ ] After quest complete: Ledger shows `EMIT_QUEST_COMPLETE`; balance increased by mission reward (net of fee).
- [ ] Spend power-up: Use a power-up (e.g. Drop Reserve, Quest Reroll) → balance decreases; ledger shows corresponding BURN_* reason.

## 3. Pulse reflects verified actions only

- [ ] With no verified actions: Pulse "See All" / Live Pulse shows "Pulse is warming up" or "Plan for later" (no fake trending).
- [ ] After at least one QR redeem or drop redeem or partner-linked quest complete: Pulse Live shows trending partners/drops driven by verified count; "Verified Momentum — proof-based only" visible.

## 4. Fraud gates (eligibility, rate limits, trust score)

- [ ] **Cooldown**: Redeem same perk twice within 24h → second attempt blocked with "Cooldown active" (or similar).
- [ ] **Daily cap**: After 5 redemptions in a day, next redeem blocked with "Daily limit reached".
- [ ] **Spend caps**: Use same power-up up to max per day → next use blocked with "Max N per day" or cooldown message.
- [ ] Admin Hub → Integrity events: panel shows "No integrity events" or list (if any recorded); Refresh works.

## 5. Feature flags ON by default

- [ ] Fresh install or Reset Defaults in Admin → OrbProof, OrbDrops, OrbQuests, OrbPulse, OrbWallet, Orbinomics, wallet spend sinks, OrbArena flags are ON.
- [ ] Toggling flags off in Admin disables corresponding UI (e.g. Pulse off → Pulse screen shows "Pulse is off").

## 6. Never-dead fallbacks

- [ ] Home with no live Pulse tiles: "Plan for later" strip appears with Quests, Pulse, Arena (if enabled), Wallet.
- [ ] Pulse screen with no data: "Pulse is warming up" + copy suggesting verify, quests, drops.

## 7. Proof receipts list (Verified Action Ledger)

- [ ] Wallet tab → after at least one verified action → "Proof receipts" section shows entries → tap one → opens Proof card with correct partner/points/tier.

---

## 8. Server-authoritative security (backend callables)

Use Firebase callables `awardVerifiedAction`, `submitArenaVote`, `spendWallet`, `getContestIntegrity` with auth. Run against emulator or deployed functions.

### 8.1 Idempotency — double-submit vote does not double count

- [ ] Call `submitArenaVote` with same `(contestId, category, entryId)` and same `voterUid` twice (same or different clientNonce).
- [ ] First call returns `success: true`, `idempotent: false`, `voteId`, `status` (COUNTED or QUARANTINED).
- [ ] Second call returns `success: true`, `idempotent: true`, same `voteId`; only one vote is stored; contest integrity `totalVotes` does not increase on second call.

### 8.2 Idempotency — double-redeem does not double reward

- [ ] Call `awardVerifiedAction` with same `(uid, refType, refId, reasonCode)` twice (e.g. same perk redeem).
- [ ] First call returns `success: true`, `idempotent: false`, `actionId`, `pointsAwarded`, `balance`.
- [ ] Second call returns `success: true`, `idempotent: true`, same `actionId` and `pointsAwarded`; balance is unchanged; only one verifiedAction and one ledger earn entry exist.

### 8.3 Rate limits trigger

- [ ] **Redeem**: Call `awardVerifiedAction` more than 30 times in one hour (same uid) → next call returns `success: false`, `message: 'Rate limit exceeded. Try again later.'` (or equivalent).
- [ ] **Vote**: Call `submitArenaVote` more than 50 times per uid or 100 times per IP in one hour → next call returns rate limit error.
- [ ] **Spend**: Call `spendWallet` more than 40 times per uid in one hour → next call returns rate limit error.

### 8.4 Low-trust votes blocked or downweighted

- [ ] **Blocked**: User with 0 verified actions calls `submitArenaVote` → returns `success: false`, `message: 'At least one verified action required to vote.'`; an IntegrityEvent `VOTE_BLOCKED_LOW_VERIFIED` is recorded.
- [ ] **Blocked**: User with trust score &lt; 20 (e.g. new account, no diversity) calls `submitArenaVote` → returns `success: false`, `message: 'Trust score too low to vote.'`; `VOTE_BLOCKED_LOW_TRUST` recorded.
- [ ] **Downweighted**: User with trust score in [20, 50) gets vote accepted with `weightApplied` &lt; 1 (e.g. 0.4); vote may be stored as COUNTED with reduced weight for tally.

### 8.5 Vote quarantine

- [ ] New account (created &lt; 24h ago) submits vote → returns `success: true` but `status: 'QUARANTINED'`; `VOTE_QUARANTINED_NEW_ACCOUNT` recorded; contest integrity `quarantinedCount` increments.
- [ ] User submits 10+ votes within 5 minutes → subsequent vote in same window returns `status: 'QUARANTINED'`; `VOTE_QUARANTINED_BURST` recorded.

### 8.6 Integrity events server-side

- [ ] After a blocked or quarantined vote, query Firestore `integrityEvents` (or an admin endpoint) and confirm an event document exists with `type`, `uid`, `createdAt`, and relevant `meta`.

### 8.7 getContestIntegrity

- [ ] Call `getContestIntegrity({ contestId: 'arena_weekly_1' })` → returns `success: true`, `totalVotes`, `quarantinedCount`, `lowTrustCount`, `cleanVotesPercent`.

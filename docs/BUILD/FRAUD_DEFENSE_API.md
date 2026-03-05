# Server-Authoritative Fraud Defense API

Backend: Firebase Cloud Functions (`functions/src/index.ts`). All callables require auth unless noted.

## Collections (Firestore)

| Collection | Purpose |
|------------|--------|
| `verifiedActions` | Server-awarded verified actions (earn). |
| `ledgers/{uid}` | Balance doc; `ledgers/{uid}/entries` = transaction log. |
| `earnIdempotency` | Idempotency keys for earn (uid_refType_refId_reasonCode) and spend (spend_uid_clientNonce). |
| `arenaVotes` | Arena votes (contestId, category, entryId, voterUid, status, weightApplied). |
| `voteIdempotencyKeys` | One vote per (contestId, category, voterUid). |
| `contestIntegrity` | Per-contest aggregated: totalVotes, quarantinedCount, lowTrustCount. |
| `trustScores` | Cached trust score per uid (score, components, computedAt). |
| `integrityEvents` | Server-recorded integrity events (type, uid, partnerId?, meta, createdAt). |
| `rateLimitVerify` | Fixed-window redeem/verify per uid. |
| `rateLimitVote` | Fixed-window vote per uid and per IP. |
| `rateLimitSpend` | Fixed-window spend per uid. |

## Endpoints

### awardVerifiedAction

**Request (data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refType | string | no | Default `perk`. Used with refId for idempotency. |
| refId | string | yes* | Perk/drop/mission id (*required when refType is perk). |
| reasonCode | string | no | One of EMIT_VERIFIED_REDEEM, EMIT_DROP_REDEEM, EMIT_QUEST_COMPLETE, EMIT_VERIFIED_CHECKIN. Default EMIT_VERIFIED_REDEEM. |
| partnerId | string | no | Partner id for the action. |
| perkId | string | no | Defaults to refId. |
| clientNonce | string | no | Optional client idempotency hint (server key is uid+refType+refId+reasonCode). |

**Response (success):**

- `success: true`
- `actionId`: string
- `pointsAwarded`: number
- `balance`: number (new balance)
- `idempotent`: boolean (true if duplicate request)

**Response (error):**

- `success: false`, `message`: string (e.g. "Rate limit exceeded.", "refId (or perkId) is required.")

**Idempotency:** One earn per (uid, refType, refId, reasonCode). Duplicate returns same actionId/balance, no double credit.

**Rate limit:** 30 requests per uid per hour (fixed window).

---

### submitArenaVote

**Request (data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| contestId | string | yes | Contest id. |
| category | string | yes | Arena category (e.g. BEST_DROP_WIN). |
| entryId | string | yes | Entry being voted for. |
| clientNonce | string | no | Optional. |

**Response (success):**

- `success: true`
- `voteId`: string
- `status`: 'COUNTED' | 'QUARANTINED'
- `weightApplied`: number (1 or &lt;1 for low trust)
- `idempotent`: boolean

**Response (error):**

- `success: false`, `message`: e.g. "At least one verified action required to vote.", "Trust score too low to vote.", "Rate limit exceeded."

**Idempotency:** One vote per (contestId, category, voterUid). Second request returns same voteId, no double count.

**Rate limit:** 50 votes per uid per hour; 100 per IP per hour.

**Trust gate:** Requires ≥1 verified action and trust score ≥ 20. Score &lt; 50 → weightApplied &lt; 1.

**Quarantine:** New account (&lt;24h) or burst (≥10 votes in 5 min) → status QUARANTINED; event recorded.

---

### spendWallet

**Request (data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| productKey | string | yes | e.g. drop_reserve_fee, quest_reroll. |
| amountExpected | number | yes | Must match server burn rule cost. |
| clientNonce | string | yes | Required for idempotent spend. |
| refType | string | no | Optional ref for ledger. |
| refId | string | no | Optional ref for ledger. |

**Response (success):**

- `success: true`
- `balance`: number (new balance)
- `idempotent`: boolean

**Response (error):**

- `success: false`, `message`: e.g. "clientNonce is required for idempotent spend.", "Insufficient balance.", "Rate limit exceeded.", "Max N per day for this product."

**Idempotency:** One successful spend per (uid, clientNonce). Duplicate returns same balance.

**Rate limit:** 40 spends per uid per hour.

**Policy:** Burn rules (cost, maxPerDay, cooldownDays) enforced server-side.

---

### getContestIntegrity

**Request (data):**

| Field | Type | Required |
|-------|------|----------|
| contestId | string | yes |

**Response (success):**

- `success: true`
- `totalVotes`: number (COUNTED only)
- `quarantinedCount`: number
- `lowTrustCount`: number
- `cleanVotesPercent`: number (0–100)

## Trust score (server)

Computed from: account age (users.createdAt), verified action count, partner diversity. Cached in `trustScores/{uid}` (10 min TTL). Used to gate/weight votes.

## Integrity events (server)

Recorded into `integrityEvents` for: VOTE_BLOCKED_LOW_VERIFIED, VOTE_BLOCKED_LOW_TRUST, VOTE_QUARANTINED_NEW_ACCOUNT, VOTE_QUARANTINED_BURST.

---

## Minimal manual test plan (server)

1. **Double-submit vote:** Call `submitArenaVote` twice with same `contestId`, `category`, `entryId` and same auth uid. Expect first `idempotent: false`, second `idempotent: true`; Firestore `arenaVotes` and `contestIntegrity` show only one vote.
2. **Double-redeem:** Call `awardVerifiedAction` twice with same `refType`, `refId`, `reasonCode` and same uid. Expect first `idempotent: false`, second `idempotent: true`; balance and `verifiedActions` count unchanged on second call.
3. **Rate limits:** Exceed 30 redeem/hour, 50 vote/uid/hour, or 40 spend/uid/hour; next call returns `success: false`, `message` containing rate limit.
4. **Low-trust vote blocked:** Call `submitArenaVote` with a uid that has 0 documents in `verifiedActions`; expect `success: false`, `message: 'At least one verified action required to vote.'` and an `integrityEvents` document with type `VOTE_BLOCKED_LOW_VERIFIED`.
5. **Low-trust weight:** User with trust score in [20, 50) gets vote accepted with `weightApplied` < 1; vote stored with status COUNTED.

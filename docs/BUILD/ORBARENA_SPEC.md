# OrbArena™ — Competition Hub (Product Spec)

Proof-backed entries, verified human voting, trust-weighted integrity. No pay-to-play; sponsor-funded prizes; OrbProof anchors entries.

## Blueprint alignment

- **Paths**: `app/`, `app/arena/`, `app/arena/contest/`, `app/arena/entry/`, `components/`, `constants/`, `hooks/`, `docs/BUILD/`.
- **Routing**: `/arena` (hub), `/arena/contest/[id]`, `/arena/entry/[id]`, `/arena/entry/create` (query: `verifiedActionId`, `partner`).
- **Design**: Nightglass; existing layout wrappers; safe-area from blueprint.
- **Flags**: `isOrbArenaEnabled`, `isOrbArenaSubmitEnabled`, `isOrbArenaVoteEnabled`, `isOrbArenaVoteWeightingEnabled`, `isOrbArenaIntegrityPanelEnabled`, `isOrbArenaPulseSurfacingEnabled` (default OFF).

## Generation rules (contest cadence)

- **Weekly OrbProof Challenge**: Entry Mon–Fri, voting Sat–Sun; 1–3 categories per week (rotating).
- **Monthly Finals**: Weekly winners/shortlisted finalists; bigger sponsor prize.
- **Annual Champions**: Monthly winners; public integrity report; City Champion status.

MVP: one mock weekly contest via `getMockWeeklyContest()` (AsyncStorage); backend will drive real cadence.

## Action routing

| Source              | Route / Action |
|---------------------|----------------|
| Proof card          | "Enter OrbArena" → `/arena/entry/create?verifiedActionId=…&partner=…` |
| OrbPulse (flag on)  | "OrbArena Highlights" card → `/arena` |
| Master Directory    | OrbArena tile (when `isOrbArenaEnabled`) → `/arena` |
| Arena hub           | Submit entry → create; Vote now → category/entry list → vote |

## Data model

- **Contest**: `id`, `cityId`, `cadence`, `startAt`, `endAt`, `votingStartAt`, `votingEndAt`, `categories`, `sponsor?`, `status`, `rules?`. Stored server-side; MVP mock in memory.
- **ArenaEntry**: `id`, `contestId`, `uid`, `category`, `verifiedActionId` (required), `partnerId`, `caption`, `mediaRefs`, `createdAt`, `status`, `stats?`. Stored in AsyncStorage key `ORBTAP_ARENA_ENTRIES_V1` (MVP).
- **ArenaVote**: `id`, `contestId`, `entryId`, `voterUid`, `voterTrustScoreSnapshot`, `weightApplied`, `createdAt`, `status`, `clientNonce`. Stored in AsyncStorage key `ORBTAP_ARENA_VOTES_V1` (MVP).
- **TrustProfile**: server-authoritative; MVP placeholder: trustScore = 100 if ≥1 verified action else 0.
- **IntegrityStats**: `totalVotes`, `quarantinedCount`, `lowTrustCount`, `cleanVotesPercent`; derived from votes for display.

## UI placement

- **Proof screen** (`app/proof/[id].tsx`): "Enter OrbArena" button when `isOrbArenaSubmitEnabled` and valid `proofId`; links to create with prefilled `verifiedActionId` and `partner`.
- **OrbPulse Live** (`app/pulse.tsx`): "OrbArena Highlights" module when `isOrbArenaPulseSurfacingEnabled` and contest is LIVE or VOTING; links to `/arena`.
- **Master Directory**: OrbArena tile when `isOrbArenaEnabled`; route `/arena`.
- **Arena hub** (`app/arena/index.tsx`): Contest card, categories, submit/vote CTAs, integrity snippet (when flag), entry list.
- **Entry create** (`app/arena/entry/create.tsx`): Category picker, caption, submit; prefilled from query params.
- **Entry detail** (`app/arena/entry/[id].tsx`): Proof snippet, vote button, share; integrity note.

## Share card & deep links

- Entry share: message + deep link to `ORBTAP_APP_LINK/arena/entry/{id}`; app opens entry and prompts eligible users to vote.
- Winner share cards (Weekly Champion, Monthly Finalist, City Champion): server-generated or client capture when winner flow exists.

## Trust weighting and quarantine (logic)

- **Eligibility**: Vote requires verified account + ≥1 verified action; submit same + valid `verifiedActionId` in user’s verified actions.
- **Trust Score**: MVP client placeholder (0 or 100). Server will compute from account age, verified actions count/diversity, clean voting history, device integrity, fraud flags.
- **Vote weight**: If `isOrbArenaVoteWeightingEnabled`, applied weight = `trustScore / 100`; else 1. Low trust counts less; high trust counts full.
- **Quarantine**: MVP no quarantine (quarantinedCount = 0). Server will quarantine suspicious votes (ring/brigade bursts, reciprocal clusters); quarantined votes not counted in leaderboard; integrity panel shows % quarantined and clean votes confidence.

## Acceptance tests

1. **Submit flow**: From valid OrbProof receipt → Enter OrbArena → create entry → appears in feed; invalid/absent `verifiedActionId` rejected.
2. **Voting**: Non-eligible user cannot vote; UI explains requirement. Eligible user can vote once; idempotency (clientNonce) prevents double vote.
3. **Anti-bot**: Rate limits and quarantine are server-side; MVP has client idempotency and eligibility gates.
4. **Integrity panel**: When flag on, shows total votes and clean % (MVP: no quarantine).
5. **Winner computation**: Server job when contest closes; MVP stores entries/votes locally only.
6. **Sharing**: Share entry card works; deep link opens entry (and voting when eligible).
7. **No drift**: No navigation rewrite, no token system rewrite; app compiles and runs.

## Admin / dev

- **Admin Hub**: All six OrbArena flags listed in Feature Flags section; toggle for testing.
- **Create contest (dev)**: MVP uses `getMockWeeklyContest()`; real contests created via backend/admin endpoints when available.

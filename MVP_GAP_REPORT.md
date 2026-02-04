# OrbTap MVP — Gap Analysis Report

**Source:** OrbTap_Master_Blueprint.md + Master Checklist  
**Rule:** No code was deleted, reverted, or modified. Features not in the Blueprint are marked as **Approved Extras**.

---

## 1) ROUTES CHECK

**Blueprint MVP Route Map (required):**

| Category | Route | Status | Notes |
|----------|--------|--------|--------|
| **Tabs** | `/(tabs)/map` (default) | ✅ Present | `(tabs)/index.tsx` serves map as default tab |
| | `/(tabs)/scan` | ✅ Present | `(tabs)/scan.tsx` |
| | `/(tabs)/orb` | ✅ Present | `(tabs)/orb.tsx` |
| | `/(tabs)/wallet` | ✅ Present | `(tabs)/wallet.tsx` |
| | `/(tabs)/profile` | ✅ Present | `(tabs)/profile.tsx` |
| **Non-tab** | `/partner/[id]` | ✅ Present | `app/partner/[id].tsx` |
| | `/perk/[id]` | ✅ Present | `app/perk/[id].tsx` |
| | `/proof/[id]` | ✅ Present | `app/proof/[id].tsx` |
| | `/spheres` | ✅ Present | `app/spheres/index.tsx` |
| | `/spheres/[id]` | ✅ Present | `app/spheres/[id].tsx` |
| | `/invite/[code]` | ✅ Present | `app/invite/[code].tsx` |
| | `/orbsignal` | ✅ Present | `app/orbsignal/index.tsx` |
| | `/orbsignal/[marketId]` | ✅ Present | `app/orbsignal/[id].tsx` |
| | `/admin` | ✅ Present | `app/admin/index.tsx` |
| | `/settings` | ✅ Present | `app/settings.tsx` |
| | `/legal` | ⚠️ Partial | No `app/legal/index.tsx`; only `legal/[id].tsx`, guidelines, privacy, terms |
| | `/legal/privacy` | ✅ Present | `app/legal/privacy.tsx` |
| | `/legal/terms` | ✅ Present | `app/legal/terms.tsx` |
| | `/legal/guidelines` | ✅ Present | `app/legal/guidelines.tsx` |
| | `/legal/acceptable-use` | ❌ **MISSING** | No `app/legal/acceptable-use.tsx` |
| | `/support` | ✅ Present | `app/support/index.tsx` |
| | `/report` | ✅ Present | `app/report.tsx` |
| | `/data/delete` | ❌ **MISSING** | No `app/data/` folder or `app/data/delete.tsx` |
| | `/auth` | ⚠️ Partial | No `app/auth/index.tsx`; `/auth` may 404. `/auth/login`, `/auth/signup`, `/auth/onboarding` exist |

**Summary — Missing or weak routes:**

- **Missing:** `/legal/acceptable-use`, `/data/delete`
- **Weak:** `/legal` (no index/landing), `/auth` (no landing; direct links use `/auth/login` etc.)

**Approved Extras (do not remove):**  
`/leaderboard`, `/vote`, `/upgrades`, `/inventory`, `/orbsignal` (Prediction Market UI) — present in app; not in Blueprint route list but kept as approved extras.

---

## 2) DATA MODEL CHECK

**Blueprint:** Verified Redemption (create `verifiedAction` + ledger entry + balance update) and Ledger (`ledgers/{uid}`, entries with `type: "earn" | "spend" | "adjust"`, `reason`, `ref: { actionId?, perkId?, partnerId? }`).

**Findings:**

| Item | Location | Status |
|------|----------|--------|
| **GameContext** | `context/GameContext.tsx` | **Different purpose.** Holds: `points`, `tapPower`, `level`, `ownedSkins`, `equippedSkin`, `lifetimeTaps`, upgrades/skins/reset. This is **in-app game/tap economy**, not Blueprint’s “Verified Redemption” or “Ledger.” |
| **WalletContext** | `context/WalletContext.tsx` | **Partial Ledger.** Has: `balance`, `history` (list of transactions), `addTransaction(amount, description)`. Transaction type: `'earn' \| 'spend'` only — **no `'adjust'`**. **No** `reason`, **no** `ref: { actionId?, perkId?, partnerId? }`. Persisted to AsyncStorage. |
| **Verified Redemption logic** | — | **Not in context.** No `verifiedAction` type or creation in `context/`. QR → verified win → ledger + proof would live in scan flow + wallet; **WalletContext does not support refs to actionId/perkId/partnerId** as in Blueprint. |

**Summary:**

- **Ledger:** Partially implemented (balance + earn/spend history). Missing: `adjust`, `reason`, `ref` for actions/perks/partners.
- **Verified Redemption:** No dedicated Verified Action model or “create verifiedAction + ledger entry with ref” in context; scan flow would need to call wallet and pass through refs once WalletContext supports them.

---

## 3) TIERS CHECK

**Blueprint:** Only four tiers: **Common, Rare, Apex, Legendary** (no Mythic/Elite).

**Findings:**

| Item | Location | Status |
|------|----------|--------|
| **Tier type** | `constants/MockData.ts` | ✅ `Tier = 'common' \| 'rare' \| 'legendary' \| 'apex'` — all four present. |
| **Tier colors** | `constants/MockData.ts` (`TIER_COLORS`) | ✅ common, rare, legendary, apex defined. (Blueprint names: Common = slate grey, Rare = electric blue, Apex = ruby red, Legendary = gold — current colors are accent variants; tier set is correct.) |
| **Usage** | Partners/Perks mock data | ✅ Partners and perks use these four tiers only. |

**Summary:** The four locked tiers (Common, Rare, Apex, Legendary) are defined and used; no Mythic or Elite found in constants or MockData.

---

## 4) ADMIN CHECK

**Blueprint:** Admin Hub at `/admin`, Feature Flag system with persistence (e.g. AsyncStorage), kill switches (OrbSignal, Redemption, Share, Map live), “Reset flags to default,” versions display, audit log of flag changes.

**Findings:**

| Item | Location | Status |
|------|----------|--------|
| **Route `/admin`** | `app/admin/index.tsx` | ✅ Present. Back button, “Admin Hub” title, Feature Flags section, “Reset Defaults” button. |
| **Flag definitions** | `constants/Flags.ts` | ✅ Blueprint flag set present: `isMapboxEnabled`, `isFirestoreLiveEnabled`, `isRedemptionEnabled`, `isShareEnabled`, `isFollowEnabled`, `isCirclesEnabled`, `isOrbSignalEnabled`, `isOrbTapStreakEnabled`, `isPremiumUserEnabled`, `isPartnerProEnabled`, `isDebugMenuEnabled`. |
| **FlagContext** | `components/FlagContext.tsx` | ❌ **Mismatch.** Only exposes `isMapboxEnabled`, `mapProvider`, `useMockLocation`. Does **not** expose the full flag set from `constants/Flags.ts`, nor `setFlag(key, val)` / `resetFlags`. Admin uses `useFlags()` with `setFlag`, `resetFlags` (cast as `any`) — **runtime may be broken or incomplete** because FlagContext does not implement the full API. |
| **Persistence** | FlagContext | ✅ Uses AsyncStorage (`ORBTAP_FLAGS`) for the 3 flags it has. |
| **Kill switches** | FlagContext | ⚠️ Only map-related (e.g. `mapProvider: 'none'`). No explicit OrbSignal, Redemption, Share toggles in the live context. |
| **Versions display** | `app/admin/index.tsx` | ❌ Not present (Blueprint: “Versions display (expo, rn, router, app version)”). |
| **Audit log** | `app/admin/index.tsx` | ❌ Not present (Blueprint: “Audit log of flag changes”). |

**Summary:**

- **Admin route:** Exists and is reachable.
- **Feature Flag system:** **Partial.** Full flag set is in constants; FlagContext only implements a subset (map + mock location). Admin expects full set + `setFlag`/`resetFlags`; alignment and audit log/versions are missing.

---

## 5) APPROVED EXTRAS (DO NOT REMOVE)

The following exist in the codebase but are not called out in the Blueprint route list or MVP scope. They are **approved extras**; do not delete or revert.

- **Tap / Game economy:** GameContext (points, tapPower, level, upgrades, skins, lifetimeTaps, reset).
- **TapParticles:** Particle effects on orb tap (`components/TapParticles.tsx`).
- **Master Directory:** App menu overlay with navigation to map, orb, wallet, upgrades, leaderboard, OrbSignal, stats, settings.
- **Upgrades screen:** `/upgrades` (purchase tap power with points).
- **Inventory / Skins:** `/inventory` (orb skins, equip, unlock with points).
- **OrbSignal Prediction Market:** Full Nightglass UI with markets, sentiment bar, vote cost, CONFIRMED overlay (in addition to any Blueprint “OrbSignal MVP” wording).
- **Stats in Settings:** Player Stats (Lifetime Taps, Current Multiplier), Danger Zone (Hard Reset).
- **Leaderboard:** `/leaderboard`.
- **Vote:** `/vote` (e.g. OrbVote).
- **Profile/Settings:** Existing settings screens and links (e.g. legal, support, report) as implemented.

---

## 6) DOCUMENTATION GAPS

**Blueprint requires (e.g. docs/BUILD/):**

- `ROUTES_MAP.md` — ❌ Not found in `docs/BUILD/`
- `FLAGS_MAP.md` — ✅ Present
- `ADMINHUB_SCHEMA.md` — ✅ Present
- `NO_DEAD_BUTTONS.md` — ❌ Not found in `docs/BUILD/`
- `PHASE_STATUS.md` — ❌ Not found in `docs/BUILD/`

---

# TO-DO LIST (3–5 Critical Items for Launch Readiness)

1. **Implement missing routes**  
   Add **`/legal/acceptable-use`** and **`/data/delete`** (Data Deletion Request). Ensure **`/legal`** and **`/auth`** have a defined behavior (e.g. index redirect or landing) so they do not 404.

2. **Align Feature Flags with Blueprint**  
   Extend **FlagContext** (or replace with a single source of truth) so it exposes the full flag set from `constants/Flags.ts`, with `setFlag(key, val)` and `resetFlags()`, persisted (e.g. AsyncStorage). Wire Admin Hub to this so all kill switches (OrbSignal, Redemption, Share, Map) work without casting to `any`.

3. **Extend Wallet/Ledger for Verified Redemption**  
   Add **ledger entry fields**: `type: 'adjust'`, `reason`, and `ref: { actionId?, perkId?, partnerId? }`. When implementing QR/verified redemption, create a **verifiedAction** (type or record) and a corresponding ledger entry that references it, so the Blueprint data model is satisfied.

4. **Admin Hub completeness**  
   Add **versions display** (expo, React Native, router, app version) and an **audit log** of flag changes (persist last N changes with timestamp and flag name) to `app/admin/index.tsx`.

5. **Documentation**  
   Add **`docs/BUILD/ROUTES_MAP.md`**, **`docs/BUILD/NO_DEAD_BUTTONS.md`**, and **`docs/BUILD/PHASE_STATUS.md`** and keep them updated per Blueprint.

---

*End of Gap Report. No existing code was modified or removed.*

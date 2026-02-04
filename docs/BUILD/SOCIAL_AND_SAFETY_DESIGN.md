# OrbTap — Social, Safety & Anti-Fraud Design

**Purpose:** Single source of truth for user discovery, friends, messaging, encryption, spheres visibility, remote business verification, and anti-fraud so OrbTap beats competitors and stays scam-proof while feeling rewarding.

**Firebase (from Master Blueprint):**
- Project: `orbtap`
- Hosting: `https://orbtap.web.app`
- API base: `https://orbtap.web.app/api`
- Functions export: `api`
- Use `EXPO_PUBLIC_*` for non-secret config only.

---

## 1) User discovery & lookup — recommendations

| Question | Recommendation | Rationale |
|----------|----------------|-----------|
| Who can be found? | **Opt-in discoverable.** Default: "Discoverable: Off". User can turn "On" so they appear in search / by username. | Privacy-first; avoids spam; aligns with "no global user directory" in MVP while allowing growth. |
| Unique username? | **Yes.** `@handle` (e.g. `@jordan`) — unique, searchable, set once or change with cooldown. Stored in `users/{uid}.username`. | Standard expectation; enables "Add me on OrbTap" and shareable profile links. |
| Discovery channels v1 | **Search (by username/display name when discoverable) + Sphere members + Leaderboard.** Add QR / profile link in a later phase. | Keeps MVP focused; Sphere + Leaderboard are OrbTap-unique and drive engagement. |

**OrbTap-unique:** Profile card when looking someone up shows level, XP, "In your sphere X", "Mutual friends", verified visit count (if we show it). Makes discovery feel gameified and trustworthy.

---

## 2) Friends & requests — recommendations

| Question | Recommendation | Rationale |
|----------|----------------|-----------|
| Follow vs friends? | **Mutual friends only.** No one-way follow for v1. Send request → Accept/Decline → both are "friends". | Simpler, clearer privacy, less spam; matches "invite-only circles" philosophy. |
| Max friends? | **Cap at 500** (configurable in Admin). Prevents abuse and keeps lists manageable. | Industry norm; can raise later. |
| Where do requests live? | **Dedicated "People" or "Friends" screen** (tab or from Profile). Inbox-style "Requests" with Accept/Decline. Badge on Profile/People when pending. | High visibility; every CTA works; no dead buttons. |

**Firestore (to add):**
- `users/{uid}/friendRequestsSent/{targetUid}` — createdAt
- `users/{uid}/friendRequestsReceived/{fromUid}` — createdAt
- `users/{uid}/friends/{friendUid}` — createdAt (mutual write on accept)

**OrbTap-unique:** "Add friend" from Proof Card share recipient, from Leaderboard row, from Sphere member list. Makes growth viral and contextual.

---

## 3) Messaging (1:1 and group) — recommendations

| Question | Recommendation | Rationale |
|----------|----------------|-----------|
| Who can message? | **Friends only** by default. Setting: "Who can message you" → Friends | Friends + sphere members | No one (DMs off). | Reduces spam; sphere members option drives Sphere usage. |
| Backend | **Firebase (Firestore + Cloud Functions).** Blueprint: Auth + Firestore + Functions. Use Firestore for metadata (threads, participants); **encrypted payloads** in a subcollection or in Storage with strict rules. | Single backend; no new infra; fits orbtap.web.app/api. |
| Group chats | **Separate friend groups + Sphere chat.** (1) User-created groups: "Create group" → add friends, name, optional photo. (2) **Sphere chat** = one group chat per Sphere (auto; members only). | OrbTap-unique: Sphere chat ties social to Spheres; friend groups cover normal use. |
| Encryption | **Signal Protocol (or compatible) E2E.** Use a well-audited library (e.g. Signal's or a React Native–friendly wrapper). Keys: device key bundle in Firestore (public part only); private key in secure storage on device. Server never has plaintext. | Best free, industry-standard E2E; "safe chats" is a real differentiator. |
| Media v1 | **Text + images.** Files/voice later. Images encrypted same as text (or as encrypted blobs in Storage). | Enough for viral sharing without scope creep. |
| History | **Synced across devices (encrypted).** Store ciphertext in Firestore or Storage; keys on device. Optional "disappearing messages" later. | Users expect history; E2E keeps it safe. |

**OrbTap-unique:** In-chat "Share perk" / "Share proof" that drops a rich card into the thread (link + preview). Drives foot traffic and redemption.

---

## 4) Spheres visibility (public vs private)

| Requirement | Recommendation |
|-------------|-----------------|
| Hide spheres from profile | **Per-sphere `isPublic`.** Each Circle has `isPublic: boolean`. If `false`, that sphere is hidden from profile and from "Spheres" count on profile (or show count but not list). |
| Default | **`isPublic: true`** for new spheres so existing behavior stays. User can toggle "Show on profile" in Sphere settings. |
| Where toggled | **Sphere detail → settings/gear** or **Edit sphere** sheet: "Visible on my profile" toggle. |

**Firestore:** `circles/{circleId}.isPublic` (boolean). Client and rules enforce read visibility for profile.

---

## 5) Remote businesses — charge users & verify without fraud

**Problem:** Remote businesses (e.g. online orders, delivery) need to (1) charge users and (2) verify check-ins without partners gaming the system (e.g. partner-owned account buying from self to earn OT).

**Recommendations:**

| Mechanism | How it works | Anti-gaming |
|-----------|--------------|-------------|
| **Partner-linked redemption** | Remote perk uses **time-limited, one-time code** generated by OrbTap (Cloud Function) when partner confirms order. User gets code in-app or email; enters in OrbTap to "verify" and receive OT. Partner never sees a reusable code. | Partner can't self-issue codes; each code tied to one order/transaction. |
| **Partner device confirm** | For high-trust partners (Pro): Partner app or dashboard shows pending "Confirm visit" (order ID, user anonymized). Partner taps Confirm → Cloud Function creates verifiedAction and awards OT. | Same device/account cannot be both "partner" and "user" for that partner (enforced in rules + backend). |
| **Strict binding rules** | **One account cannot be both partner and redeemer for the same partner.** Firestore/Cloud Function: before creating verifiedAction, check that `uid !== partners/{partnerId}.ownerUid` (and no linked "family" UIDs in same biz). | Prevents self-redemption. |
| **Device / account signals** | Optional: store first device ID or account fingerprint per user; flag if same device redeems repeatedly for same partner (investigate). Not MVP-required but future-proof. | Detects multi-account abuse. |
| **Caps and cooldowns** | Per-perk: `maxPerUserPerDay`, `cooldownHours`. Per-partner: daily cap on total OT issued (admin-configurable). Server-side enforcement in Cloud Function. | Limits damage from any single abuse vector. |
| **Audit trail** | Every verifiedAction and ledger entry is server-written (or client with strict rules). Log partnerId, uid, perkId, method, timestamp. Review for anomalies (same IP, same device, burst activity). | Fraud detection and evidence. |

**Remote flow (recommended):**
1. User "orders" or pays via partner's existing flow (outside OrbTap, or future OrbTap Pay).
2. Partner backend calls OrbTap API (Cloud Function): "Create redemption token for order X, user Y, perk Z."
3. Function validates partner, creates one-time token (short TTL), stores pending verification.
4. User gets link/code in app; taps "Verify visit" → enters code or deep link → Function validates token, creates verifiedAction, updates ledger, issues proof.
5. No OT is awarded unless this server-side verification succeeds; partner cannot award to self.

**OrbTap-unique:** "Verified remote" badge on proof so users and partners see it as legitimate and secure.

---

## 6) Anti-fraud & scam-proof (system-wide)

| Principle | Implementation |
|-----------|----------------|
| **Server-authoritative ledger** | All balance changes go through Cloud Function or Firestore rules that validate caps, cooldowns, and "no self-redemption." Client displays only; never trust client for final balance. |
| **Cooldowns & daily caps** | Enforced in Cloud Function when creating verifiedAction and ledger entry. Reject if over cap or before cooldown. |
| **No self-redemption** | Function checks `uid !== partnerOwnerUid` (and no linked accounts) before awarding OT for that partner. |
| **Transparent limits** | Show users "2 redemptions left today" / "Available in 6h" so they feel they're "gaming" the system fairly, not that the system is arbitrary. |
| **Report & block** | Every user/partner/perk has Report; block hides them and blocks DMs/requests. Abuse reports go to admin queue. |
| **Bug bounty mindset** | Document expected behavior; critical paths (redeem, ledger, friend accept) have tests and clear rules. |

---

## 7) OrbTap-unique differentiators (summary)

- **Discovery:** Opt-in discoverable + @username; search + Sphere members + Leaderboard.
- **Friends:** Mutual only; Requests + Friends in dedicated People screen; Add from Proof, Leaderboard, Sphere.
- **Messaging:** Friends (and optional sphere members) only; E2E encryption; Sphere chat per sphere; in-chat Share perk/Share proof.
- **Spheres:** Public/private per sphere; Sphere XP and leaderboard; pool for perks/missions/shop.
- **Remote:** Time-limited codes + partner confirm; no self-redemption; server-side verification only.
- **Feel:** Users see limits and countdowns so redemptions feel like "beating the system" without actually gaming it.

---

## 8) Implementation order (suggested)

1. **Spheres public/private** — Add `isPublic` to Circle; profile only shows public spheres; toggle in sphere detail.
2. **Firebase wiring** — Ensure Auth, Firestore, and Functions are wired for ledger/verifiedAction (server-side or locked rules).
3. **Username + discoverable** — `users/{uid}.username`, `users/{uid}.discoverable`; set in profile/settings.
4. **Friends** — Firestore collections above; People screen; send/accept/decline; Add from Leaderboard/Sphere.
5. **Messaging** — Threads in Firestore; E2E layer (Signal-compatible); 1:1 then Sphere chat then friend groups.
6. **Remote verification** — Cloud Function: create one-time token; verify endpoint; no self-redemption checks.

---

## 9) Firebase collections to add (reference)

- `users/{uid}.username`, `.discoverable`
- `users/{uid}/friends/{friendUid}`
- `users/{uid}/friendRequestsSent/{targetUid}`, `friendRequestsReceived/{fromUid}`
- `circles/{circleId}.isPublic`
- (Later) `chats/{chatId}`, `chats/{chatId}/messages/{msgId}` — or encrypted payloads in Storage with chat metadata in Firestore.
- Cloud Functions: `createVerifiedAction`, `redeemRemoteToken`, `acceptFriendRequest`, etc.

All writes to ledger and verifiedActions should go through Cloud Functions or strict Firestore rules so OrbTap stays bug-proof and scam-proof.

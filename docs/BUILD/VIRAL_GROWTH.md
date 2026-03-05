# Viral Growth — Launch & Long-Term

## User referral (invite friends)

- **Flow:** User A shares link → User B opens `/invite?invite=A_UID` → lands on invite screen → "Create account" → signup with param → after signup, `recordReferredBy(newUid, A_UID)` writes to Firestore.
- **Bonus:** Cloud Function `onUserReferralWritten` fires when `users/{uid}` has `referredBy` set; awards **50 OT** to both referrer and referee; sets `userReferralBonusAwarded: true`.
- **Share entry points:** Profile "Invite friends" card (Share sheet with `userInviteUrl(uid)` and `USER_INVITE_MESSAGE`).
- **Onboarding:** "Invite friends — you both get 50 OT when they join. Find it in Profile."
- **Deep link:** `https://orbtap.com/invite?invite={uid}` (configure in app.json / linking for store builds).

## Partner referral

- **Flow:** Partner shares referral link after applying; referee applies with code; when referee is approved, both get 100 OT (see PARTNER_REFERRAL.md).

## Share hooks (existing)

- **Proof:** Share message + link to `/proof/{id}`. Copy from `constants/ViralCopy.ts` (proofShareMessage) — "Just scored X OT at [Partner] — verified on OrbTap. You can earn too."
- **Feed/OrbSignal:** Share on posts and markets. Feed uses `FEED_SHARE_HOOK`; partner page uses `PARTNER_SHARE_HOOK(name)`.
- **Drops:** Reserve/redeem flow drives to proof share.
- **OrbSwipe Tonight Recap:** After Fuse, share uses `TONIGHT_RECAP_SHARE_HOOK` and "Share your night" CTA; deep link to `/orbswipe`.

**Single source of truth:** All viral and habit-forming copy lives in `constants/ViralCopy.ts`. Invite/default share re-exported via `AppLinks` for backward compatibility.

## Making OrbTap inevitable

1. **Viral loops:** User referral + partner referral reward both sides; low cost (OT Points), high shareability.
2. **Proof as social proof:** Verified receipts are shareable; "I did this" builds FOMO and trust.
3. **Scarcity:** Drops, limited slots, "X left" copy (see partner apply, feed).
4. **Retention:** Streaks, quests, wallet balance, following feed — give reasons to return.
5. **Local moat:** Map + partners + proof = defensible local discovery; gets better with more users and partners.

## Next (optional)

- Referral leaderboard (top inviters get bonus).
- Share image cards (OG image for proof/drop links).
- Universal links / AASA for `orbtap.com/invite?invite=`.

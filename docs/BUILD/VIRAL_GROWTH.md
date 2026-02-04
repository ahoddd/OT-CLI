# OrbTap Viral Growth Levers

Built-in hooks to maximize sharing and referrals so OrbTap can scale and attract top investors.

## 1. Shareable content (Knowledge)

- **Fun facts & quotes** — Every share includes the app link (`ORBTAP_KNOWLEDGE_SHARE_SUFFIX` in `constants/AppLinks.ts`). Set `EXPO_PUBLIC_APP_LINK` to your store or landing URL.
- **Like / Dislike / Share / Save** — Users engage with content; sharing is one tap. Saved items create reason to return.
- **New on every app open** — Fresh fact or quote when the app comes to foreground drives re-opens and shares.

## 2. Invite & referral

- **Invite flow** — `app/invite/[code].tsx` handles sphere invites. Use the same pattern for app referral: share link with `?ref=USER_ID` or `/invite/CODE`, reward both sides (e.g. bonus points).
- **Invite message** — `ORBTAP_INVITE_MESSAGE` in `constants/AppLinks.ts` is ready for "Invite friends" share sheet. Wire from Profile or Directory to `Share.share({ message: ORBTAP_INVITE_MESSAGE })` and optionally use `expo-linking` to build a referral URL.

## 3. Premium transparency (retention)

- **Premium members always see benefits** — Premium and Compare plans screens show full "What you get" and "Compare Free vs Premium" so members (and friends/family you gift) see value and don’t cancel.
- **Stats** — Premium users see "View membership benefits" → Compare plans, so they can revisit what they have.

## 4. Next steps to go viral

- Add **referral codes** in Profile: "Invite friends" → share link with code, grant points when invitee signs up.
- Add **deep link** for invite: `orbtap://invite/CODE` or `https://orbtap.com/invite/CODE` so shared links open the app.
- **Leaderboards & social proof** — Already present; highlight "Join 12k+ Explorers" and friend activity.
- **OrbPulse / Drops** — FOMO and "live" content drive opens; keep pushing timely, exclusive content.
- **Premium as status** — Badge and benefits are visible; encourage sharing "I’m on OrbTap Premium" with a share card or story template.

Setting `EXPO_PUBLIC_APP_LINK` (and optional referral params) ties all share surfaces to your real URL for maximum conversion.

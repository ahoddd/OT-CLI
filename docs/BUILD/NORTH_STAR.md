# North Star — Verified Win Loop

Reference: OrbTap_Master_Blueprint.md, BUSINESS_FLOW.md. This doc is the single source of truth for the core product loop. Use it as the acceptance criterion for any change that touches discovery or redemption.

## North Star Action: VERIFIED WIN

A user:

1. **Discovers** a real local perk/partner (Map or list)
2. **Opens** OrbSheet (tap orb on map)
3. **Chooses** an action: View Perk / Redeem / Follow / Get Directions
4. **Completes verification** (QR scan at venue in MVP)
5. **Receives** OT Points + ledger update + Proof Card
6. **Optionally** follows the partner, shares Proof to a Circle or social

Success = this loop can be done start-to-finish without crashes, dead buttons, blank states, or confusing steps.

## Screens and API calls (exact flow)

| Step | Screen / component | API / action |
|------|--------------------|--------------|
| Discover | `/(tabs)/index` (Map) or grid; OrbSheet from `OrbTapMap` + `OrbSheet` | `usePartners().getPartner`, `getPerksForPartner`; map loads partners from Firestore |
| View Perk | `OrbSheet` → "View Perk" → `/perk/[id]` | `recordPartnerView(partnerId)` (partnerAnalytics) |
| Redeem entry | `/perk/[id]` or OrbSheet → "Redeem" → `/(tabs)/scan` | — |
| Scan | `/(tabs)/scan` — QR scanner | Parse QR → `createVerifiedAction(partnerId, perkId, points)` (WalletContext) → backend `apiAwardVerifiedAction` or equivalent |
| Success | `/scan/success` (params: points, partner, proofId, tier) | — |
| Proof | `/proof/[id]` — shareable card | Share sheet; deep link to proof |
| Follow | Partner page or OrbSheet → Follow | `followPartner(userId, partnerId)` (followPartners) |

## Partner-side completion

Partners must see value from the loop:

- **Identity:** "My business" = partner linked via `users/{uid}.partnerId` (set when admin uses **Approve & add to map** from a partner application). Resolved in app by `useMyPartner()`.
- **Visibility:** Partner appears on the map (document in `partners` with optional `ownerUid`). Perks in `perks` collection.
- **Analytics:** Partner dashboard shows profile views, follows, missions (from `partnerAnalytics` Firestore). Label: "Profile views, follows, and missions from OrbTap users."

## Anti-fraud and integrity

- Cooldowns and daily caps per perk (enforced in backend).
- Self-redemption blocked when `partners.ownerUid === userId`.
- Verified actions and ledger entries written server-side or via callables; no client-only balance changes for redemption.

## Pre-auth experience

Landing, login, and signup share one design system (PreAuthTheme: dark base, glass surfaces, single primary accent). CTAs unchanged: landing → signup/login/features/learn/proof modal/partner-apply; login → sign in, sign up link; signup → create account, then onboarding. Do not break these routes or auth behavior when updating pre-auth visuals.

## Do not break

- Map must load (or show fallback list); OrbSheet must open on orb tap.
- Scan must create verified action and ledger entry; wallet balance must update.
- Proof Card must render and share; every OT display must be tappable to Wallet where applicable.
- Partner dashboard must resolve "my" partner (or show empty state with Apply CTA when no business linked).

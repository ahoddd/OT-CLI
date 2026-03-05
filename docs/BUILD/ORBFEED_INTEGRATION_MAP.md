# OrbPulse Commerce Feed (OrbFeed) — Integration Map

Source: OrbTap_Master_Blueprint.md, ROUTES_MAP.md, FLAGS_MAP.md, PHASE_STATUS.md.  
No refactor of architecture, routing, or shared UI.

## Existing pieces reused

| Area | Path / hook | Reuse |
|------|-------------|--------|
| OrbPulse feed screen | `app/pulse.tsx` | Filter tabs, tile list, refresh; OrbFeed is separate route `/feed` to avoid breaking Pulse. |
| Pulse data | `hooks/usePulse.ts` | verifiedActions, useDrops; OrbFeed uses own `useOrbFeed` + OrbPost model. |
| Drops | `constants/Drops.ts`, `hooks/useDrops.ts` | Drop type, reserve/redeem; OrbPost type DROP can reference dropId and reuse reserve/redeem flows. |
| Proof receipts | `app/proof/[id].tsx`, WalletContext.createVerifiedAction | Claim/reserve/purchase that complete → mint proof via existing createVerifiedAction / awardVerifiedAction. |
| Share | `app/proof/[id].tsx` Share.share, AppLinks | Same share pattern for post cards and proof. |
| Partner profile | `app/partner/[id].tsx` | Navigate to partner from post; verified badge from partner. |
| Partner dashboard | `app/partner/dashboard.tsx` | Add "Create post" entry → `/partner/posts/create` (composer). |
| Wallet / Orbinomics | `context/WalletContext.tsx`, `constants/OrbinomicsPolicy.ts` | Ledger reasons, spend (reserve fee); claims/purchases record server-side where applicable. |
| Feature flags | `constants/Flags.ts`, `components/FlagContext.tsx` | Add isOrbFeedEnabled, etc.; hide feed when off. |
| Admin | `app/admin/index.tsx` | No change for v1; moderation/boosts can hook later. |
| Bottom sheet | `components/OrbSheet.tsx` | Post detail can use sheet or full-screen route; using route `/feed/[id]` for deep link. |
| Design tokens | `constants/Colors.ts`, `hooks/useTheme.ts` | Nightglass, colors.text, colors.surface, etc. |

## New paths (allowed)

- `constants/OrbFeed.ts` — OrbPost types, CTA/scarcity/trust, mock posts.
- `hooks/useOrbFeed.ts` — Filter posts by mode (nearby, tonight, drops, new, services, following, deals).
- `app/feed.tsx` — OrbPulse Commerce Feed screen (tabs + cards).
- `app/feed/[id].tsx` — Post detail (full content, CTA, why-seeing-this, integrity note).
- `app/partner/posts/create.tsx` — Partner composer (template-based create post).
- `docs/BUILD/ORBFEED_TEST_CHECKLIST.md` — Manual test checklist.

## Route

- `/feed` — Commerce Feed (entry: Master Directory tile when isOrbFeedEnabled).
- `/feed/[id]` — Post detail.

## Backend (stub then real)

- Follow `functions/src/index.ts` and `services/verifyApi.ts` style.
- Endpoints: GET feed, GET post, POST action, POST claim (idempotent); partner POST create/publish; admin moderate.

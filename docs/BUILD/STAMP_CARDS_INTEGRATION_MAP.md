# Stamp Cards — Phase 0 Integration Map

**Blueprint read:** OrbTap_Master_Blueprint.md, docs/BUILD/ROUTES_MAP.md, FLAGS_MAP.md, PHASE_STATUS.md.  
**Constraints:** Additive only. Allowed paths: `app/`, `app/(tabs)/`, `app/admin/`, `components/`, `constants/`, `assets/`, `docs/BUILD/`. Design tokens: `constants/DesignTokens.ts` (SPACE, RADIUS, MOTION). Safe area: ScreenWrapper / SafeAreaView. Role-based UX: user vs partner; admin hub patterns from `app/admin/index.tsx`.

---

## A) QR scan / check-in flows (camera scanning)

| Item | File(s) | Notes |
|------|--------|--------|
| Scan screen | `app/(tabs)/scan.tsx` | CameraView (expo-camera), `handleBarCodeScanned` → `processScan`, `parseRedeemUrl` for orbtap://redeem. Add parser for `orbtap://stamp?partnerId=…&programId=…&token=…` and call stamp-earn API. |
| Scanner HUD | `components/ScannerHUD.tsx` | Reticle + "Align QR in frame". No change required. |
| Success route | `app/scan/success.tsx` | After redeem: points, partner, proofId → Wallet or Proof. After stamp: show "Stamp earned!" and optionally "Reward earned!" + route to Reward Locker; reuse or extend success params (e.g. `stampProgramId`, `rewardEarned`). |

---

## B) VerifiedAction + createVerifiedAction + /proof/[id] + share

| Item | File(s) | Notes |
|------|--------|--------|
| Create verified action | `context/WalletContext.tsx` | `createVerifiedAction(partnerId, perkId, points, { ledgerReason, actionType })`. Add actionTypes: `STAMP_EARNED`, `STAMP_REWARD_REDEEMED` (or use refType/refId for stamp program). |
| API | `services/verifyApi.ts` | `awardVerifiedAction({ refType, refId, reasonCode, partnerId, perkId })`. Backend must accept refType `stamp` and reasonCode for stamp. |
| Backend | `functions/src/index.ts` | `awardVerifiedAction`: idempotency per (uid, refType, refId, reasonCode). Add EMIT_STAMP_EARNED, EMIT_STAMP_REWARD_REDEEMED to EMISSION_RATES; write verifiedActions with actionType. |
| Proof screen | `app/proof/[id].tsx` | Receives id, partner, points, tier, createdAt; supports summaryLine for job proof. Add optional `source: 'stamp'` or badge "Stamp Card" when reason/refType indicates stamp. |
| Share | `utils/shareToSocial.ts` | `proofSharePayload(partner, points, proofId, link)`. No change; proof receipt URL from `constants/AppLinks.ts` `proofDeepLink(proofId)`. |
| Deep link | `constants/AppLinks.ts` | `proofDeepLink(proofId)` → `/proof/[id]`. |

---

## C) Wallet / Orbinomics ledger reasons and safe award

| Item | File(s) | Notes |
|------|--------|--------|
| Ledger reasons | `constants/OrbinomicsPolicy.ts` | Add `EMIT_STAMP_CARD_COMPLETE_BONUS`, `EMIT_STAMP_CARD_OT_BONUS`. |
| Backend rates | `functions/src/index.ts` | EMISSION_RATES: add above; caps enforced in stamp Cloud Function (daily cap, idempotent). |
| Award flow | Server-only for stamp completion/OT bonus: call from stamp earn/redeem Cloud Function, not from client. |

---

## D) Partner profile and dashboard routes

| Item | File(s) | Notes |
|------|--------|--------|
| Partner profile | `app/partner/[id].tsx` | Add Stamp Card module when partner has active program (fetch via useStampCards or partner program lookup). Show progress X/N, next eligible time, "Scan to stamp" CTA. |
| Partner dashboard | `app/partner/dashboard.tsx` | Entry for "Stamp Cards" → Create/Manage. Link to Stamp Studio (new route or section). |
| Stamp Studio | New: `app/partner/stamp-studio.tsx` or under `app/partner/` | Wizard: template → config → design → preview → publish. |
| Partner redeem | New: `app/partner/stamp-redeem.tsx` or inline in dashboard | Redeem Stamp Reward: scan user reward QR or enter PIN. |

---

## E) Partner verification badge and tiers

| Item | File(s) | Notes |
|------|--------|--------|
| Tiers | `constants/PartnerTiers.ts` | PartnerTier = 'silver' \| 'gold' \| 'platinum'. `isPremiumPartnerTier`, `isProPartnerTier`. Use for Stamp Studio tier gates (max programs, cooldown presets, reward types). |
| Badge on profile | `app/partner/[id].tsx` | `VerifiedBadge`, `PartnerProBadge`; partner.verifiedBadge, partner.tier from data. |
| Stamp tier config | New: `constants/StampCardsTierConfig.ts` or in Admin config | Per-tier limits: max active programs, stampsRequired presets, cooldown presets, allowed reward types, design level, analytics. |

---

## F) Admin hub and config storage

| Item | File(s) | Notes |
|------|--------|--------|
| Admin Hub | `app/admin/index.tsx` | Add section "Stamp Cards" (e.g. FLAG_CATEGORIES or new section). Toggles: enableStampCards; global OT caps; allowed reward types; default cooldown/stampsRequired; anti-fraud thresholds; requirePartnerVerified. |
| Config storage | Firestore `config/stampCards` or `config/stampCardsAdmin` | Same pattern as daily ritual / missions: admin reads/writes config doc; client reads via getStampCardsConfig(). |
| Audit | Admin section "Audit Log" / ORBTAP_FLAGS_AUDIT | Log admin changes to stamp config and program pause. |

---

## G) Existing loyalty, badges, receipts, vault

| Item | File(s) | Notes |
|------|--------|--------|
| Badges | `hooks/useBadges.ts`, `constants/Badges.ts` | No stamp-specific badge required for V1. Optional: badge on first stamp card complete. |
| Proof receipts | `app/(tabs)/wallet.tsx` | "Proof receipts" collapsible lists verifiedActions; links to `/proof/[id]`. Stamp receipts will appear here when we mint VerifiedAction for STAMP_EARNED / REWARD_REDEEMED. |
| Reward Locker | New in Wallet | New section "Reward Locker": earned (unredeemed) stamp rewards; persist in Firestore (StampCardState.activeReward). No existing "vault" — this is the new vault for stamp rewards. |

---

## H) Map / Pulse / OrbSwipe integration

| Item | File(s) | Notes |
|------|--------|--------|
| Map | `app/(tabs)/index.tsx`, `components/OrbSheet.tsx` | Optional: when partner is tapped, bottom sheet can show a "Stamp progress" chip (e.g. 2/10) if user has stamp card for that partner. |
| Pulse | `app/pulse.tsx` | No mandatory change for V1. Stamp actions can be fed to Pulse if we add actionType to verifiedActions and Pulse filters by it. |
| OrbSwipe / Tonight | `app/orbswipe.tsx` | V1.1: "Double Stamp Live" card when boost windows enabled. Surfaces when stamp boost is active for a partner. |

---

## New files (allowed paths)

- `constants/StampCards.ts` — types, presets (stampsRequired, cooldown, reward types, templates).
- `constants/StampCardsTierConfig.ts` — tier limits for Stamp Cards.
- `services/stampCardsApi.ts` — client calls: getProgram, getUserStampState, earnStamp, redeemReward, createProgram, etc.
- `hooks/useStampCards.ts` — user stamp state, reward locker, programs.
- `components/StampCardStack.tsx` — Apple Wallet–style stacked cards (Wallet section).
- `components/StampCardModal.tsx` — almost full-screen modal with carousel of stamp cards, QR, redeem CTA.
- `components/StampCardCarouselCard.tsx` — reference-style card (horizontal stamp row, reward text) for the modal carousel.
- `components/RewardLockerSection.tsx` — Wallet Reward Locker list.
- `app/partner/stamp-studio.tsx` — partner Stamp Studio wizard.
- `app/partner/stamp-redeem.tsx` — partner redeem reward (scan/PIN).
- `app/partner/stamp-analytics.tsx` — partner Stamp Analytics (optional or tab in studio).
- `docs/BUILD/STAMP_CARDS_CONFIG.md`, `STAMP_CARDS_STUDIO.md`, `STAMP_CARDS_TEST_CHECKLIST.md`.

Firestore (backend): `stampPrograms`, `stampCardState` (subcollection or top-level), `stampEvents`, `stampReports`; config in `config/stampCards` and `config/stampCardsTier`.

---

*End of Integration Map. Implementation is additive-only and does not refactor navigation or unrelated modules.*

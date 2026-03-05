# Stamp Cards — Stamp Studio (Partner)

Partner DIY flow to create and manage stamp programs in under 2 minutes.

## Entry

- Partner Dashboard → **Stamp Cards** → Create / Manage → `/partner/stamp-studio`.

## Wizard steps (simplified)

1. **Choose template** — Coffee, Restaurant, Retail, Service, Event (affects default design).
2. **Configure** — Stamps required (preset), cooldown (preset), reward type + label, optional expiry (off by default).
3. **Design** — Color theme (restricted palette), stamp style (Orb, Star, Shield, Check), optional logo (tier-gated).
4. **Preview** — Customer view + wallet view (optional screen).
5. **Publish** — Set status to ACTIVE (or save as DRAFT).

## Guardrails

- If partner not verified and `requirePartnerVerified` is true: show “Get verified to launch Stamp Cards” and keep in DRAFT.
- Tier limits (see StampCardsTierConfig): max programs, allowed presets, reward types, design level — enforced in Studio UI and on server.

## QR generation

- Partner gets a printable QR payload: `orbtap://stamp?partnerId=<partnerId>&programId=<programId>` (optional `&token=<shortToken>` for idempotency).
- Shown in Studio after publish; download/print as feasible in app.

## Redeem flow

- Partner Dashboard → **Redeem Stamp Reward** → `/partner/stamp-redeem`.
- Partner enters code (from customer’s Reward Locker QR) or scans customer QR → confirm → redeem. Server logs `REWARD_REDEEMED` and mints proof.

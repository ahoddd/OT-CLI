# Feature Flags Map
See `constants/Flags.ts`.

## Core
- `isMapboxEnabled`: Toggles map.
- `isFirestoreLiveEnabled`: Use Firestore vs mock.
- `isRedemptionEnabled`: QR redemption.
- `isShareEnabled`: Share proof cards.
- `isFollowEnabled`: Follow partners.
- `isCirclesEnabled`: Invite-only circles.
- `isOrbSignalEnabled`: OrbSignal prediction.
- `isOrbTapStreakEnabled`: Daily streak.
- `isPremiumUserEnabled` / `isPartnerProEnabled`: Premium hooks.
- `isDebugMenuEnabled`: Debug overlays.
- `mapProvider`: 'mapbox' | 'native' | 'none'.

## Module flags (demand engine, default OFF)
- `isOrbProofEnabled`: OrbProof receipt + ledger alignment.
- `isOrbDropsEnabled`: OrbDrop list/reserve/redeem.
- `isOrbQuestEnabled`: OrbQuest missions.
- `isOrbPassEnabled`: OrbPass status unlocks.
- `isOrbPulseEnabled`: OrbPulse Live feed + Pulse Map.
- `isOrbCircleEnabled`: OrbCircle group.
- `isOrbKeyEnabled`: OrbKey QR (NFC behind flag).

## OrbWallet + Orbinomics (default OFF)
- `isOrbWalletEnabled`: Earn next + spend catalog on wallet tab.
- `isOrbinomicsEnabled`: Orbinomics policy + spend power-ups.
- `walletSpendQuestReroll`, `walletSpendQuestBooster`, `walletSpendDropReserveFee`, `walletSpendDropEarlyAccess`, `walletSpendStreakShield`, `walletSpendMultiplier24h`, `walletSpendReceiptCosmetics`, `walletSpendCircleBonusPool`, `walletSpendPulseAlertsFilters`: Individual sink toggles.

## OrbScope™ — Daily Vibe (default OFF)
- `isOrbScopeEnabled`: Show OrbScope card on Home when user has opted in (Settings).
- `isOrbScopeShareCardEnabled`: Allow share-card image capture and share.
- `isOrbScopeStreakEnabled`: Track and show "You checked your vibe N days in a row".
- `isOrbScopeNotificationsEnabled`: Optional daily reminder (when notifications infra exists).

## OrbArena™ — Competition hub (default OFF)
- `isOrbArenaEnabled`: Show OrbArena hub (Directory tile, /arena route).
- `isOrbArenaSubmitEnabled`: Allow submitting entries (Proof → Enter OrbArena).
- `isOrbArenaVoteEnabled`: Allow verified-human voting.
- `isOrbArenaVoteWeightingEnabled`: Weight votes by Trust Score (server-authoritative in prod).
- `isOrbArenaIntegrityPanelEnabled`: Show integrity stats (verified votes, clean %).
- `isOrbArenaPulseSurfacingEnabled`: Show OrbArena Highlights module on OrbPulse Live.

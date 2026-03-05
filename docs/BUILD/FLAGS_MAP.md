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

## Module flags (ON by default — can disable per blueprint)
- `isOrbProofEnabled`: OrbProof receipt + ledger alignment.
- `isOrbDropsEnabled`: OrbDrop list/reserve/redeem.
- `isOrbQuestEnabled`: OrbQuest missions.
- `isOrbPassEnabled`: OrbPass status unlocks.
- `isOrbPulseEnabled`: OrbPulse Live feed + Pulse Map.
- `isOrbCircleEnabled`: OrbCircle group.
- `isOrbKeyEnabled`: OrbKey QR (NFC behind flag).

Sphere plans:

- `moduleSpheresPlans`: Enable Sphere OrbPlans + Passport features globally.
- `spheresPlansCouple`: Enable OrbPlans for Couple Spheres.
- `spheresPlansFamily`: Enable OrbPlans for Family Spheres.
- `spheresPlansSolo`: Enable OrbPlans for Solo Spheres.
- `spheresPlansPal`: Enable OrbPlans for Pal Spheres.
- `spheresPlansPassportShare`: Enable Sphere Passport share cards.
- `spheresPlansRewards`: Enable OrbPlan rewards (uses Orbinomics caps and SpherePlansConfig).

## OrbWallet + Orbinomics (ON by default)
- `isOrbWalletEnabled`: Earn next + spend catalog on wallet tab.
- `isOrbinomicsEnabled`: Orbinomics policy + spend power-ups.
- `walletSpendQuestReroll`, `walletSpendQuestBooster`, `walletSpendDropReserveFee`, `walletSpendDropEarlyAccess`, `walletSpendStreakShield`, `walletSpendMultiplier24h`, `walletSpendReceiptCosmetics`, `walletSpendCircleBonusPool`, `walletSpendPulseAlertsFilters`: Individual sink toggles (all ON by default).

## OrbScope™ — Daily Vibe (opt-in, default OFF)
- `isOrbScopeEnabled`: Show OrbScope card on Home when user has opted in (Settings).
- `isOrbScopeShareCardEnabled`: Allow share-card image capture and share.
- `isOrbScopeStreakEnabled`: Track and show "You checked your vibe N days in a row".
- `isOrbScopeNotificationsEnabled`: Optional daily reminder (when notifications infra exists).

## OrbArena™ — Competition hub (ON by default when implemented)
- `isOrbArenaEnabled`: Show OrbArena hub (Directory tile, /arena route).
- `isOrbArenaSubmitEnabled`: Allow submitting entries (Proof → Enter OrbArena).
- `isOrbArenaVoteEnabled`: Allow verified-human voting.
- `isOrbArenaVoteWeightingEnabled`: Weight votes by Trust Score (server-authoritative in prod).
- `isOrbArenaIntegrityPanelEnabled`: Show integrity stats (verified votes, clean %).
- `isOrbArenaPulseSurfacingEnabled`: Show OrbArena Highlights module on OrbPulse Live.

## OrbOps™ — Work Orders, Proof Pack, Job Proof Receipt, Proof Portfolio (ON by default)
- `isOrbOpsEnabled`: Enable OrbOps module (Directory tile, partner Proof Portfolio + Request Work).
- `isOrbOpsWorkOrdersEnabled`: Work order list, create, detail, accept/schedule/milestones/completion/approve/dispute.
- `isOrbOpsProofPackEnabled`: Proof Pack (private job evidence) and completion flow.
- `isOrbOpsJobProofReceiptEnabled`: Job Proof Receipt (OrbProof-style shareable receipt) on approval.
- `isOrbOpsProofPortfolioEnabled`: Partner Proof Portfolio (verified jobs 30d/90d, categories) on partner page.
- `isOrbOpsTrustedPathScoreEnabled`: Trusted Path™ score (internal signal; future sort/surface).

## Stamp Cards™ (V1 ON, V1.1 OFF)
- `moduleStampCards`: Enable Stamp Cards module (Wallet, Scan, Partner Studio).
- `stampCardsUserWallet`: Show Reward Locker and Stamp Cards in Wallet.
- `stampCardsPartnerStudio`: Partner Dashboard → Stamp Studio (create/manage programs).
- `stampCardsQrStamping`: Scan tab accepts orbtap://stamp QR to earn stamp.
- `stampCardsRewardClaim`: Partner can redeem stamp rewards (code/QR).
- `stampCardsVerifiedActionReceipts`: Mint VerifiedAction for stamp earn/redeem; proof receipt.
- `stampCardsPartnerAnalytics`: Partner Stamp Analytics (when implemented).
- `stampCardsAdminControls`: Admin Hub Stamp Cards section.
- `stampCardsBoostWindows` (V1.1, OFF): Double-stamp windows.
- `stampCardsRewardLockerReminders` (V1.1, OFF): Reminders for expiring rewards.
- `stampCardsMultiLocation` (V1.1, OFF): Per-location overrides.
- `stampCardsStaffRoles` (V1.1, OFF): Cashier/manager/owner roles.
- `stampCardsQuarantineAndReversal` (V1.1, OFF): Quarantine and stamp reversal.
- `stampCardsCityPassport` (V1.1, OFF): Cross-partner challenge layer.

## Meal Proposals — OrbSwipe meal discovery (ON by default)
- `orbswipe.mealProposals`: Global toggle for meal proposal cards in OrbSwipe.
- `partner.mealProposalComposer`: Partner Meal Studio (create/edit proposals).
- `orbswipe.mealTrayFuse`: Tray + Fuse My Meal flow.
- `orbswipe.mealAnalytics`: Analytics funnel tracking.
- `orbswipe.mealTierGates`: Enforce partner tier limits (Silver/Gold/Platinum).
- `orbswipe.mealScheduling`: Scheduling (Premium/Pro only).
- `orbswipe.mealTargeting`: Radius/category targeting (Premium/Pro only).
- `orbswipe.mealABTest` (OFF): A/B title variants (Pro only).
- `orbswipe.mealSphereVote`: In-sphere tray voting for group meal selection.
- `orbswipe.mealVerifiedReview`: Verified review CTA after meal check-in.

## OrbFeed — Commerce Feed (ON by default except purchases)
- `isOrbFeedEnabled`: Show Commerce Feed in Directory and /feed route.
- `isOrbFeedPartnerComposerEnabled`: Partner Dashboard → Create post → /partner/posts/create.
- `isOrbFeedClaimsEnabled`: Enable Claim CTA and claim flow (default ON).
- `isOrbFeedPurchasesEnabled`: Enable Buy/Reserve paid flows (default OFF until payment wired).
- `isOrbFeedBoostsEnabled`: Sponsored/boosted posts and partner boost controls.
- `isOrbFeedPartnerAnalyticsEnabled`: Partner analytics for posts (impressions, clicks).
- `isOrbFeedModerationEnabled`: Admin moderation queue for OrbFeed posts.

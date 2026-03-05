export type MapProvider = 'mapbox' | 'native' | 'none';

export const DEFAULT_FLAGS = {
  isMapboxEnabled: true,
  isFirestoreLiveEnabled: true,
  isRedemptionEnabled: true,
  isShareEnabled: true,
  isFollowEnabled: true,
  isCirclesEnabled: true,
  isOrbSignalEnabled: true,
  isOrbTapStreakEnabled: true,
  isPremiumUserEnabled: true,
  isPartnerProEnabled: true,
  isDebugMenuEnabled: false,
  mapProvider: 'mapbox' as MapProvider,
  // Module flags (demand engine) — ON so new features are visible
  isOrbProofEnabled: true,
  isOrbDropsEnabled: true,
  isOrbQuestEnabled: true,
  isOrbPassEnabled: true,
  isOrbBankEnabled: false,
  isOrbPulseEnabled: true,
  isOrbCircleEnabled: true,
  isOrbKeyEnabled: true,
  // Sphere Plans — OrbPlans™ + Sphere Passport™ (per-sphere plan generator)
  moduleSpheresPlans: true,
  spheresPlansCouple: true,
  spheresPlansFamily: true,
  spheresPlansSolo: true,
  spheresPlansPal: true,
  spheresPlansPassportShare: true,
  spheresPlansRewards: true,
  // OrbWallet + Orbinomics — ON so wallet shows Earn next + Spend catalog
  isOrbWalletEnabled: true,
  isOrbinomicsEnabled: true,
  // Wallet spend sinks — ON by default (can disable per blueprint)
  walletSpendQuestReroll: true,
  walletSpendQuestBooster: true,
  walletSpendDropReserveFee: true,
  walletSpendDropEarlyAccess: true,
  walletSpendStreakShield: true,
  walletSpendMultiplier24h: true,
  walletSpendReceiptCosmetics: true,
  walletSpendCircleBonusPool: true,
  walletSpendPulseAlertsFilters: true,
  // OrbScope™ — Daily Vibe (opt-in, default ON)
  isOrbScopeEnabled: true,
  isOrbScopeShareCardEnabled: true,
  isOrbScopeStreakEnabled: true,
  isOrbScopeNotificationsEnabled: true,
  // OrbOps™ — Work Orders, Proof Pack, Job Proof Receipt, Proof Portfolio (ON by default)
  isOrbOpsEnabled: true,
  isOrbOpsWorkOrdersEnabled: true,
  isOrbOpsProofPackEnabled: true,
  isOrbOpsJobProofReceiptEnabled: true,
  isOrbOpsProofPortfolioEnabled: true,
  isOrbOpsTrustedPathScoreEnabled: true,
  // OrbMap — demo orbs, geocode cache, weather, controls, filters (ON by default)
  isMapDemoOrbsEnabled: true,
  isMapGeocodeCacheEnabled: true,
  isMapWeatherModeEnabled: true,
  isMapControlsEnabled: true,
  isMapFiltersEnabled: true,
  isMapHappeningNowEnabled: true,
  // OrbFeed (OrbPulse Commerce Feed) — partner posts, CTAs, proof-backed (ON by default)
  isOrbFeedEnabled: true,
  isOrbFeedPartnerComposerEnabled: true,
  isOrbFeedClaimsEnabled: true,
  isOrbFeedPurchasesEnabled: true,
  isOrbFeedBoostsEnabled: true,
  isOrbFeedPartnerAnalyticsEnabled: true,
  isOrbFeedModerationEnabled: true,
  /** Optional Cloud Vision / content moderation for partner uploads (stub; set true when backend wired). */
  imageContentModerationEnabled: false,
  // OrbOpportunities™ — Partner hiring + verified work receipts
  isOrbOpportunitiesEnabled: true,
  // Partner Menus — OCR → structured menu → publish, verified badge, reporting, Tonight Picks
  partnerMenusEnabled: true,
  partnerMenusOcrOnDevice: true,
  partnerMenusOcrCloudFallback: false,
  partnerMenusReporting: true,
  partnerMenusTonightPicks: true,
  partnerMenusDropSuggestions: true,
  // Daily Orb Ritual — tap 3×, points + optional badge, admin-tunable
  ritualDailyOrbEnabled: true,
  ritualPointsEnabled: true,
  ritualBadgesEnabled: true,
  ritualAdminConfigEnabled: true,
  // Page visibility — when OFF, page is hidden from tabs, directory, search, quick actions
  isLeaderboardEnabled: true,
  isOrbVoteEnabled: true,
  isBookmarksEnabled: true,
  isKnowledgeEnabled: true,
  isStatsEnabled: true,
  // OrbBounty™ — Deal Bounty (post intent, partners bid, accept, verify, win card)
  isOrbBountyEnabled: true,
  // OrbIntent™ — Intent protocol + auto-deal agent (intents, offers, rules, Deal Done Card)
  isOrbIntentEnabled: true,
  /** When true, app shows maintenance screen and blocks most actions (admin-only flag). */
  isMaintenanceModeEnabled: false,
  // OrbSwipe™ — Swipe deck, tray, Fuse My Night (ON by default)
  isOrbSwipeEnabled: true,
  // OrbSwipe v1.1 — User controls, recap share, low-supply fallback, partner Swipe Studio
  isOrbSwipeV11ControlsEnabled: true,
  isOrbSwipeRecapShareEnabled: true,
  isOrbSwipeLowSupplyFallbackEnabled: true,
  isOrbSwipePartnerSwipeStudioEnabled: true,
  // OrbSwipe Fortifications — Fuse, CardDetail, SavedIntents, FriendPasses, GrowthSuggestions
  isOrbSwipeFuseNeverFailsEnabled: true,
  isOrbSwipeCardDetailSheetEnabled: true,
  isOrbSwipeSavedIntentsEnabled: true,
  isOrbSwipeFriendPassesEnabled: true,
  isOrbSwipePartnerGrowthSuggestionsEnabled: true,
  // Meal Proposals — OrbSwipe meal discovery + partner composer + tray→fuse
  'orbswipe.mealProposals': true,
  'partner.mealProposalComposer': true,
  'orbswipe.mealTrayFuse': true,
  'orbswipe.mealAnalytics': true,
  'orbswipe.mealTierGates': true,
  'orbswipe.mealScheduling': true,
  'orbswipe.mealTargeting': true,
  'orbswipe.mealABTest': false,
  'orbswipe.mealSphereVote': true,
  'orbswipe.mealVerifiedReview': true,
  // Stamp Cards™ — digital stamp cards, Reward Locker, Stamp Studio (V1 ON, V1.1 OFF)
  moduleStampCards: true,
  stampCardsUserWallet: true,
  stampCardsPartnerStudio: true,
  stampCardsQrStamping: true,
  stampCardsRewardClaim: true,
  stampCardsVerifiedActionReceipts: true,
  stampCardsPartnerAnalytics: true,
  stampCardsAdminControls: true,
  stampCardsBoostWindows: true,
  stampCardsRewardLockerReminders: true,
  stampCardsMultiLocation: true,
  stampCardsStaffRoles: true,
  stampCardsQuarantineAndReversal: true,
  stampCardsCityPassport: true,
  // OrbPilot™ — Outcome-First Verified-Visit Autopilot
  isOrbPilotEnabled: true,
  isOrbPilotUserEnabled: true,
  isOrbPilotPartnerEnabled: true,
  isOrbPilotAdminEnabled: true,
  /** Walk-in mode (no pre-claim step) — disabled by default per spec §0 */
  isOrbPilotWalkInEnabled: false,
  // OrbPilot sub-flags (Appendix 1 — No-Drift Build Protocol)
  /** Fine-grained: user offer feed enabled */
  isOrbPilotUserOffersEnabled: true,
  /** Fine-grained: partner console (cockpit/setup/verify) enabled */
  isOrbPilotPartnerConsoleEnabled: true,
  /** Fine-grained: engine tick callable enabled */
  isOrbPilotEngineTickEnabled: true,
  /** Fine-grained: rescue reward tier enabled (high-cost boost mode) */
  isOrbPilotRescueTierEnabled: true,
  /** Fine-grained: force PIN verification for all partners in high-risk mode */
  isOrbPilotPartnerForcePinEnabled: false,
  // OrbPilot Appendix 2 — Unit Economics + Profit Guardrails
  /** Enable profit floor stop-loss ladder (P1→P4) */
  isOrbPilotProfitGuardrailsEnabled: true,
  /** Enable tier gating for user claim limits (Free/Premium/Pro) */
  isOrbPilotUserTierGatingEnabled: true,
  /** Enable tier gating for partner engine access (Free/Premium/Pro) */
  isOrbPilotPartnerTierGatingEnabled: true,
  // OrbPilot Appendix 3 — Ops/Compliance/Disputes/Billing
  /** Require consent gate before user can claim first slot */
  isOrbPilotConsentGatesEnabled: true,
  /** Enable dispute submission and review flow */
  isOrbPilotDisputesEnabled: true,
  /** Enable entitlements module enforcement */
  isOrbPilotEntitlementsEnabled: true,
  /** Enable partner spend ledger tracking */
  isOrbPilotSpendLedgerEnabled: true,
};
export type FeatureFlags = typeof DEFAULT_FLAGS;
export type FlagKey = keyof FeatureFlags;
export type FlagValue = FeatureFlags[FlagKey];

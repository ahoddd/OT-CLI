export type MapProvider = 'mapbox' | 'native' | 'none';

export const DEFAULT_FLAGS = {
  isMapboxEnabled: true,
  isFirestoreLiveEnabled: false,
  isRedemptionEnabled: true,
  isShareEnabled: true,
  isFollowEnabled: true,
  isCirclesEnabled: true,
  isOrbSignalEnabled: true,
  isOrbTapStreakEnabled: true,
  isPremiumUserEnabled: false,
  isPartnerProEnabled: false,
  isDebugMenuEnabled: false,
  mapProvider: 'mapbox' as MapProvider,
  // Module flags (demand engine) — ON so new features are visible
  isOrbProofEnabled: true,
  isOrbDropsEnabled: true,
  isOrbQuestEnabled: true,
  isOrbPassEnabled: false,
  isOrbPulseEnabled: true,
  isOrbCircleEnabled: true,
  isOrbKeyEnabled: true,
  // OrbWallet + Orbinomics — ON so wallet shows Earn next + Spend catalog
  isOrbWalletEnabled: true,
  isOrbinomicsEnabled: true,
  // Wallet spend sinks (default OFF; turn on as needed)
  walletSpendQuestReroll: false,
  walletSpendQuestBooster: false,
  walletSpendDropReserveFee: false,
  walletSpendDropEarlyAccess: false,
  walletSpendStreakShield: false,
  walletSpendMultiplier24h: false,
  walletSpendReceiptCosmetics: false,
  walletSpendCircleBonusPool: false,
  walletSpendPulseAlertsFilters: false,
  // OrbScope™ — Daily Vibe (opt-in, default OFF)
  isOrbScopeEnabled: false,
  isOrbScopeShareCardEnabled: false,
  isOrbScopeStreakEnabled: false,
  isOrbScopeNotificationsEnabled: false,
  // OrbArena™ — Competition hub (default OFF)
  isOrbArenaEnabled: false,
  isOrbArenaSubmitEnabled: false,
  isOrbArenaVoteEnabled: false,
  isOrbArenaVoteWeightingEnabled: false,
  isOrbArenaIntegrityPanelEnabled: false,
  isOrbArenaPulseSurfacingEnabled: false,
};
export type FeatureFlags = typeof DEFAULT_FLAGS;
export type FlagKey = keyof FeatureFlags;
export type FlagValue = FeatureFlags[FlagKey];

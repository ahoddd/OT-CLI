export const DEFAULT_FLAGS = {
  isMapboxEnabled: false,
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
};
export type FeatureFlags = typeof DEFAULT_FLAGS;
export type FlagKey = keyof FeatureFlags;

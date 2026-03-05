/**
 * Admin Hub — categories, labels, and layout config.
 * Used for categorized feature flags, navbar tabs, and master directory order.
 */

import type { FlagKey } from './Flags';

export const FLAG_LABELS: Record<FlagKey, string> = {
  isMapboxEnabled: 'Mapbox maps',
  isFirestoreLiveEnabled: 'Firestore live',
  isRedemptionEnabled: 'Redemption',
  isShareEnabled: 'Share',
  isFollowEnabled: 'Follow',
  isCirclesEnabled: 'Circles',
  isOrbSignalEnabled: 'Orb Signal',
  isOrbTapStreakEnabled: 'Tap streak',
  isPremiumUserEnabled: 'Premium user',
  isPartnerProEnabled: 'Partner Pro',
  isDebugMenuEnabled: 'Debug menu',
  mapProvider: 'Map provider',
  isOrbProofEnabled: 'OrbProof',
  isOrbDropsEnabled: 'OrbDrops',
  isOrbQuestEnabled: 'Missions',
  isOrbPassEnabled: 'OrbPass',
  isOrbPulseEnabled: 'OrbPulse',
  isOrbCircleEnabled: 'OrbCircle',
  isOrbKeyEnabled: 'OrbKey',
  moduleSpheresPlans: 'Sphere Plans (OrbPlans)',
  spheresPlansCouple: 'Sphere Plans: Couple',
  spheresPlansFamily: 'Sphere Plans: Family',
  spheresPlansSolo: 'Sphere Plans: Solo',
  spheresPlansPal: 'Sphere Plans: Pal',
  spheresPlansPassportShare: 'Sphere Passport share',
  spheresPlansRewards: 'Sphere Plans rewards',
  isOrbWalletEnabled: 'OrbWallet',
  isOrbinomicsEnabled: 'Orbinomics',
  walletSpendQuestReroll: 'Spend: Quest Reroll',
  walletSpendQuestBooster: 'Spend: Quest Booster',
  walletSpendDropReserveFee: 'Spend: Drop Reserve',
  walletSpendDropEarlyAccess: 'Spend: Early Access',
  walletSpendStreakShield: 'Spend: Streak Shield',
  walletSpendMultiplier24h: 'Spend: 24h Multiplier',
  walletSpendReceiptCosmetics: 'Spend: Receipt Cosmetics',
  walletSpendCircleBonusPool: 'Spend: Circle Pool',
  walletSpendPulseAlertsFilters: 'Spend: Pulse Alerts',
  isOrbScopeEnabled: 'OrbScope',
  isOrbScopeShareCardEnabled: 'OrbScope share card',
  isOrbScopeStreakEnabled: 'OrbScope streak',
  isOrbScopeNotificationsEnabled: 'OrbScope notifications',
  isOrbOpsEnabled: 'OrbOps',
  isOrbOpsWorkOrdersEnabled: 'Work orders',
  isOrbOpsProofPackEnabled: 'Proof pack',
  isOrbOpsJobProofReceiptEnabled: 'Job proof receipt',
  isOrbOpsProofPortfolioEnabled: 'Proof portfolio',
  isOrbOpsTrustedPathScoreEnabled: 'Trusted path score',
  isMapDemoOrbsEnabled: 'Map demo orbs',
  isMapGeocodeCacheEnabled: 'Map geocode cache',
  isMapWeatherModeEnabled: 'Map weather mode',
  isMapControlsEnabled: 'Map controls',
  isMapFiltersEnabled: 'Map filters',
  isMapHappeningNowEnabled: 'Map happening now',
  isOrbFeedEnabled: 'OrbFeed commerce feed',
  isOrbFeedPartnerComposerEnabled: 'Partner create post',
  isOrbFeedClaimsEnabled: 'OrbFeed claims',
  isOrbFeedPurchasesEnabled: 'OrbFeed purchases',
  isOrbFeedBoostsEnabled: 'OrbFeed boosts',
  isOrbFeedPartnerAnalyticsEnabled: 'Partner analytics',
  isOrbFeedModerationEnabled: 'Content moderation (OFF = no moderation)',
  imageContentModerationEnabled: 'Image content moderation',
  isOrbOpportunitiesEnabled: 'OrbOpportunities',
  partnerMenusEnabled: 'Partner menus',
  partnerMenusOcrOnDevice: 'Partner menus: on-device OCR',
  partnerMenusOcrCloudFallback: 'Partner menus: cloud OCR fallback',
  partnerMenusReporting: 'Partner menus: user reporting',
  partnerMenusTonightPicks: 'Partner menus: Tonight Picks',
  partnerMenusDropSuggestions: 'Partner menus: Drop suggestions',
  ritualDailyOrbEnabled: 'Daily Orb Ritual',
  ritualPointsEnabled: 'Ritual: points',
  ritualBadgesEnabled: 'Ritual: badges',
  ritualAdminConfigEnabled: 'Ritual: admin config',
  isLeaderboardEnabled: 'Leaderboard',
  isOrbVoteEnabled: 'OrbVote (polls)',
  isBookmarksEnabled: 'Bookmarks',
  isKnowledgeEnabled: 'Knowledge',
  isStatsEnabled: 'Stats',
  isOrbBountyEnabled: 'OrbBounty (Deal Bounty)',
  isOrbIntentEnabled: 'Deal Match',
  isOrbPilotEnabled: 'OrbPilot (Verified-Visit Autopilot)',
  isOrbPilotUserEnabled: 'OrbPilot: User offers',
  isOrbPilotPartnerEnabled: 'OrbPilot: Partner console',
  isOrbPilotAdminEnabled: 'OrbPilot: Admin hub',
  isOrbPilotWalkInEnabled: 'OrbPilot: Walk-in mode (no pre-claim)',
  isMaintenanceModeEnabled: 'Maintenance mode (app-wide)',
  isOrbSwipeEnabled: 'OrbSwipe',
  isOrbSwipeV11ControlsEnabled: 'OrbSwipe v1.1: User controls (Tune)',
  isOrbSwipeRecapShareEnabled: 'OrbSwipe v1.1: Tonight Recap share card',
  isOrbSwipeLowSupplyFallbackEnabled: 'OrbSwipe v1.1: Low supply fallback',
  isOrbSwipePartnerSwipeStudioEnabled: 'OrbSwipe v1.1: Partner Swipe Studio (Pro)',
  isOrbSwipeFuseNeverFailsEnabled: 'OrbSwipe: Fuse Never Fails (fallback engine)',
  isOrbSwipeCardDetailSheetEnabled: 'OrbSwipe: Card Detail Bottom Sheet',
  isOrbSwipeSavedIntentsEnabled: 'OrbSwipe: Saved Intents (right-swipe pipeline)',
  isOrbSwipeFriendPassesEnabled: 'OrbSwipe: Friend Passes (viral referral)',
  isOrbSwipePartnerGrowthSuggestionsEnabled: 'OrbSwipe: Partner Growth Suggestions (Pro)',
  'orbswipe.mealProposals': 'Meal Proposals: Global toggle',
  'partner.mealProposalComposer': 'Meal Proposals: Partner Composer',
  'orbswipe.mealTrayFuse': 'Meal Proposals: Tray + Fuse My Meal',
  'orbswipe.mealAnalytics': 'Meal Proposals: Analytics funnel',
  'orbswipe.mealTierGates': 'Meal Proposals: Tier enforcement',
  'orbswipe.mealScheduling': 'Meal Proposals: Scheduling (Premium/Pro)',
  'orbswipe.mealTargeting': 'Meal Proposals: Targeting (Premium/Pro)',
  'orbswipe.mealABTest': 'Meal Proposals: A/B testing (Pro only)',
  'orbswipe.mealSphereVote': 'Meal Proposals: Sphere voting',
  'orbswipe.mealVerifiedReview': 'Meal Proposals: Verified review after check-in',
  moduleStampCards: 'Stamp Cards',
  stampCardsUserWallet: 'Stamp Cards: User wallet',
  stampCardsPartnerStudio: 'Stamp Cards: Partner studio',
  stampCardsQrStamping: 'Stamp Cards: QR stamping',
  stampCardsRewardClaim: 'Stamp Cards: Reward claim',
  stampCardsVerifiedActionReceipts: 'Stamp Cards: Verified action receipts',
  stampCardsPartnerAnalytics: 'Stamp Cards: Partner analytics',
  stampCardsAdminControls: 'Stamp Cards: Admin controls',
  stampCardsBoostWindows: 'Stamp Cards: Boost windows (V1.1)',
  stampCardsRewardLockerReminders: 'Stamp Cards: Reward reminders (V1.1)',
  stampCardsMultiLocation: 'Stamp Cards: Multi-location (V1.1)',
  stampCardsStaffRoles: 'Stamp Cards: Staff roles (V1.1)',
  stampCardsQuarantineAndReversal: 'Stamp Cards: Quarantine/reversal (V1.1)',
  stampCardsCityPassport: 'Stamp Cards: City passport (V1.1)',
};

export interface FlagCategory {
  id: string;
  title: string;
  subtitle?: string;
  keys: FlagKey[];
}

/** Page/feature-area categories for Admin Hub. mapProvider is handled separately. */
export const FLAG_CATEGORIES: FlagCategory[] = [
  {
    id: 'core',
    title: 'Core',
    subtitle: 'Map, social, redemption, debug',
    keys: [
      'isMapboxEnabled',
      'isFirestoreLiveEnabled',
      'isRedemptionEnabled',
      'isShareEnabled',
      'isFollowEnabled',
      'isCirclesEnabled',
      'isOrbSignalEnabled',
      'isOrbTapStreakEnabled',
      'isPremiumUserEnabled',
      'isPartnerProEnabled',
      'isDebugMenuEnabled',
    ],
  },
  {
    id: 'demand',
    title: 'Demand engine',
    subtitle: 'OrbProof, Drops, Quest, Pulse, Circle, Key',
    keys: [
      'isOrbProofEnabled',
      'isOrbDropsEnabled',
      'isOrbQuestEnabled',
      'isOrbPassEnabled',
      'isOrbPulseEnabled',
      'isOrbCircleEnabled',
      'isOrbKeyEnabled',
    ],
  },
  {
    id: 'spheresPlans',
    title: 'Spheres & Plans',
    subtitle: 'OrbPlans + Sphere Passport',
    keys: [
      'moduleSpheresPlans',
      'spheresPlansCouple',
      'spheresPlansFamily',
      'spheresPlansSolo',
      'spheresPlansPal',
      'spheresPlansPassportShare',
      'spheresPlansRewards',
    ],
  },
  {
    id: 'wallet',
    title: 'Wallet & Orbinomics',
    subtitle: 'OrbWallet, Orbinomics, spend power-ups',
    keys: [
      'isOrbWalletEnabled',
      'isOrbinomicsEnabled',
      'walletSpendQuestReroll',
      'walletSpendQuestBooster',
      'walletSpendDropReserveFee',
      'walletSpendDropEarlyAccess',
      'walletSpendStreakShield',
      'walletSpendMultiplier24h',
      'walletSpendReceiptCosmetics',
      'walletSpendCircleBonusPool',
      'walletSpendPulseAlertsFilters',
    ],
  },
  {
    id: 'orbscope',
    title: 'OrbScope',
    subtitle: 'Daily vibe, share card, streak, notifications',
    keys: [
      'isOrbScopeEnabled',
      'isOrbScopeShareCardEnabled',
      'isOrbScopeStreakEnabled',
      'isOrbScopeNotificationsEnabled',
    ],
  },
  {
    id: 'orbops',
    title: 'OrbOps',
    subtitle: 'Work orders, proof pack, portfolio',
    keys: [
      'isOrbOpsEnabled',
      'isOrbOpsWorkOrdersEnabled',
      'isOrbOpsProofPackEnabled',
      'isOrbOpsJobProofReceiptEnabled',
      'isOrbOpsProofPortfolioEnabled',
      'isOrbOpsTrustedPathScoreEnabled',
    ],
  },
  {
    id: 'orbopportunities',
    title: 'OrbOpportunities',
    subtitle: 'Partner hiring, applications, verified work receipts',
    keys: ['isOrbOpportunitiesEnabled'],
  },
  {
    id: 'partnerMenus',
    title: 'Partner menus',
    subtitle: 'OCR → structured menu → publish, verified badge, reporting, Tonight Picks',
    keys: [
      'partnerMenusEnabled',
      'partnerMenusOcrOnDevice',
      'partnerMenusOcrCloudFallback',
      'partnerMenusReporting',
      'partnerMenusTonightPicks',
      'partnerMenusDropSuggestions',
    ],
  },
  {
    id: 'ritual',
    title: 'Daily Orb Ritual',
    subtitle: 'Tap 3× reward, points + badges, admin-tunable',
    keys: [
      'ritualDailyOrbEnabled',
      'ritualPointsEnabled',
      'ritualBadgesEnabled',
      'ritualAdminConfigEnabled',
    ],
  },
  {
    id: 'orbFeed',
    title: 'OrbFeed',
    subtitle: 'Commerce feed, partner posts, moderation',
    keys: [
      'isOrbFeedEnabled',
      'isOrbFeedPartnerComposerEnabled',
      'isOrbFeedClaimsEnabled',
      'isOrbFeedPurchasesEnabled',
      'isOrbFeedBoostsEnabled',
      'isOrbFeedPartnerAnalyticsEnabled',
      'isOrbFeedModerationEnabled',
      'imageContentModerationEnabled',
    ],
  },
  {
    id: 'map',
    title: 'OrbMap',
    subtitle: 'Demo orbs, geocode, weather, controls',
    keys: [
      'isMapDemoOrbsEnabled',
      'isMapGeocodeCacheEnabled',
      'isMapWeatherModeEnabled',
      'isMapControlsEnabled',
      'isMapFiltersEnabled',
      'isMapHappeningNowEnabled',
    ],
  },
  {
    id: 'pages',
    title: 'Page visibility',
    subtitle: 'When OFF, page disappears from app (tabs, directory, search)',
    keys: [
      'isLeaderboardEnabled',
      'isOrbVoteEnabled',
      'isBookmarksEnabled',
      'isKnowledgeEnabled',
      'isStatsEnabled',
    ],
  },
  {
    id: 'appControl',
    title: 'App control',
    subtitle: 'Maintenance mode and app-wide overrides',
    keys: ['isMaintenanceModeEnabled'],
  },
  {
    id: 'orbswipe',
    title: 'OrbSwipe',
    subtitle: 'Swipe deck, tray, Fuse My Night + v1.1',
    keys: [
      'isOrbSwipeEnabled',
      'isOrbSwipeV11ControlsEnabled',
      'isOrbSwipeRecapShareEnabled',
      'isOrbSwipeLowSupplyFallbackEnabled',
      'isOrbSwipePartnerSwipeStudioEnabled',
      'isOrbSwipeFuseNeverFailsEnabled',
      'isOrbSwipeCardDetailSheetEnabled',
      'isOrbSwipeSavedIntentsEnabled',
      'isOrbSwipeFriendPassesEnabled',
      'isOrbSwipePartnerGrowthSuggestionsEnabled',
    ],
  },
  {
    id: 'mealProposals',
    title: 'Meal Proposals',
    subtitle: 'OrbSwipe meal discovery, partner composer, tray fuse, analytics',
    keys: [
      'orbswipe.mealProposals',
      'partner.mealProposalComposer',
      'orbswipe.mealTrayFuse',
      'orbswipe.mealAnalytics',
      'orbswipe.mealTierGates',
      'orbswipe.mealScheduling',
      'orbswipe.mealTargeting',
      'orbswipe.mealABTest',
      'orbswipe.mealSphereVote',
      'orbswipe.mealVerifiedReview',
    ],
  },
];

/** When a flag is OFF, this page/route is hidden everywhere. No entry = always visible. */
export const PAGE_ID_TO_FLAG: Record<string, FlagKey> = {
  'work-orders': 'isOrbOpsEnabled',
  orbops: 'isOrbOpsEnabled',
  pulse: 'isOrbPulseEnabled',
  feed: 'isOrbFeedEnabled',
  opportunities: 'isOrbOpportunitiesEnabled',
  orbsignal: 'isOrbSignalEnabled',
  missions: 'isOrbQuestEnabled',
  spheres: 'isCirclesEnabled',
  wallet: 'isOrbWalletEnabled',
  upgrades: 'isOrbWalletEnabled',
  leaderboard: 'isLeaderboardEnabled',
  vote: 'isOrbVoteEnabled',
  bookmarks: 'isBookmarksEnabled',
  knowledge: 'isKnowledgeEnabled',
  stats: 'isStatsEnabled',
  intent: 'isOrbIntentEnabled',
  orbpass: 'isOrbPassEnabled',
  orbswipe: 'isOrbSwipeEnabled',
  'meal-mode': 'orbswipe.mealProposals' as FlagKey,
};

export function isPageVisible(pageId: string, flags: import('./Flags').FeatureFlags): boolean {
  const flagKey = PAGE_ID_TO_FLAG[pageId];
  if (!flagKey) return true;
  return Boolean(flags[flagKey]);
}

/** Tab bar: all possible screen names (match (tabs) file names). Default order for new users. */
export const TAB_IDS = [
  'index',
  'scan',
  'orb',
  'wallet',
  'profile',
  'pulse',
  'missions',
  'bookmarks',
  'upgrades',
  'leaderboard',
  'orbsignal',
  'spheres',
  'stats',
  'knowledge',
  'premium',
  'compare-accounts',
  'settings',
  'work-orders',
  'bounty',
  'intent',
  'orbpass',
  'admin',
  // Partner-only tabs (shown only when isPartner)
  'partner-dashboard',
  'partner-perks',
  'partner-orb',
  'partner-polls',
  'partner-feed',
  'partner-settings',
] as const;
export type TabId = (typeof TAB_IDS)[number];

/** Partner tab bar: 5 tabs — Dashboard, Stats, Orb (middle), Perks, Settings. */
export const PARTNER_TAB_IDS = [
  'partner-dashboard',
  'stats',
  'partner-orb',
  'partner-perks',
  'partner-settings',
] as const;
export type PartnerTabId = (typeof PARTNER_TAB_IDS)[number];
/** Orb at index 2 (middle); default first screen for partners remains partner-orb. */
export const DEFAULT_PARTNER_TAB_ORDER: PartnerTabId[] = [...PARTNER_TAB_IDS];

export const TAB_LABELS: Record<TabId, string> = {
  index: 'Map',
  scan: 'Scan',
  orb: 'Orb',
  wallet: 'Wallet',
  profile: 'Profile',
  pulse: 'Pulse',
  missions: 'Missions',
  bookmarks: 'Bookmarks',
  upgrades: 'Upgrades',
  leaderboard: 'Leaderboard',
  orbsignal: 'Orb Signal',
  spheres: 'Spheres',
  stats: 'Stats',
  knowledge: 'Knowledge',
  premium: 'Premium',
  'compare-accounts': 'Compare',
  settings: 'Settings',
  'work-orders': 'Work Orders',
  bounty: 'OrbBounty',
  intent: 'Deal Match',
  orbpass: 'OrbPass',
  admin: 'Admin',
  'partner-dashboard': 'Dashboard',
  'partner-perks': 'Perks',
  'partner-orb': 'Orb',
  'partner-polls': 'Polls',
  'partner-feed': 'Feed',
  'partner-settings': 'Settings',
};

/** Ionicons name per tab (for navbar). */
export const TAB_ICONS: Record<TabId, string> = {
  index: 'map',
  scan: 'qr-code',
  orb: 'planet',
  wallet: 'wallet',
  profile: 'person',
  pulse: 'pulse',
  missions: 'flag',
  bookmarks: 'bookmark',
  upgrades: 'flash',
  leaderboard: 'trophy',
  orbsignal: 'radio',
  spheres: 'people',
  stats: 'stats-chart',
  knowledge: 'bulb',
  premium: 'diamond',
  'compare-accounts': 'git-compare',
  settings: 'settings-sharp',
  'work-orders': 'document-text',
  bounty: 'gift',
  intent: 'flash',
  orbpass: 'card',
  admin: 'construct',
  'partner-dashboard': 'grid',
  'partner-perks': 'pricetag',
  'partner-orb': 'planet',
  'partner-polls': 'stats-chart',
  'partner-feed': 'newspaper',
  'partner-settings': 'settings-sharp',
};

export const DEFAULT_TAB_ORDER: TabId[] = ['index', 'scan', 'orb', 'wallet', 'profile'];
export const MAX_NAVBAR_TABS = 5;

/** Quick Actions (Orb page): keys that map to route + label + icon.
 * Admin picks which show and in what order.
 *
 * Includes all main pages from the Master Directory so Quick Actions can deep-link anywhere.
 */
export const QUICK_ACTION_KEYS = [
  // Core / map + hub
  'map',
  'orb',
  // High-signal actions
  'missions',
  'vote',
  'leaderboard',
  'scan',
  'wallet',
  'spheres',
  'pulse',
  'orbswipe',
  // Discovery & commerce
  'feed',
  'bookmarks',
  'orbsignal',
  'upgrades',
  'opportunities',
  'work-orders',
  'bounty',
  'intent',
  'orbpass',
  // Learn & account
  'stats',
  'knowledge',
  'premium',
  'compare-accounts',
  'settings',
  'admin',
] as const;
export type QuickActionId = (typeof QUICK_ACTION_KEYS)[number];

export interface QuickActionConfig {
  route: string;
  label: string;
  subLabel: string;
  icon: string;
  iconColor: string;
}

export const QUICK_ACTION_CONFIG: Record<QuickActionId, QuickActionConfig> = {
  map: { route: '/(tabs)', label: 'Map', subLabel: 'Nearby orbs', icon: 'map', iconColor: '#22C55E' },
  orb: { route: '/(tabs)/orb', label: 'Orb Hub', subLabel: 'Daily ritual', icon: 'planet', iconColor: '#60A5FA' },
  missions: { route: '/missions', label: 'Missions', subLabel: 'Earn OT Points', icon: 'flag', iconColor: '#fbbf24' },
  vote: { route: '/vote', label: 'OrbVote', subLabel: '5 OT per vote', icon: 'stats-chart', iconColor: '#60a5fa' },
  leaderboard: { route: '/leaderboard', label: 'Legends', subLabel: 'Rankings', icon: 'trophy', iconColor: '#fbbf24' },
  scan: { route: '/(tabs)/scan', label: 'Scan', subLabel: 'Redeem', icon: 'qr-code', iconColor: '#4ade80' },
  wallet: { route: '/(tabs)/wallet', label: 'Vault', subLabel: 'Assets', icon: 'wallet', iconColor: '#ef4444' },
  spheres: { route: '/spheres', label: 'Spheres', subLabel: 'Groups & pool', icon: 'people', iconColor: '#8B5CF6' },
  pulse: { route: '/(tabs)/pulse', label: 'Pulse', subLabel: 'Live', icon: 'pulse', iconColor: '#60a5fa' },
  orbswipe: { route: '/orbswipe', label: 'OrbSwipe', subLabel: 'Swipe tonight', icon: 'swap-horizontal', iconColor: '#a78bfa' },
  feed: { route: '/feed', label: 'Feed', subLabel: 'Commerce', icon: 'newspaper', iconColor: '#4ADE80' },
  bookmarks: { route: '/bookmarks', label: 'Bookmarks', subLabel: 'Saved', icon: 'bookmark', iconColor: '#fbbf24' },
  orbsignal: { route: '/orbsignal', label: 'Orb Signal', subLabel: 'Signals', icon: 'radio', iconColor: '#60a5fa' },
  upgrades: { route: '/(tabs)/upgrades', label: 'Upgrades', subLabel: 'Power-ups', icon: 'flash', iconColor: '#fbbf24' },
  opportunities: { route: '/opportunities', label: 'Opportunities', subLabel: 'Gigs & shifts', icon: 'briefcase', iconColor: '#22C55E' },
  knowledge: { route: '/knowledge', label: 'Knowledge', subLabel: 'Learn', icon: 'bulb', iconColor: '#fbbf24' },
  stats: { route: '/stats', label: 'Stats', subLabel: 'Your impact', icon: 'stats-chart', iconColor: '#22C55E' },
  'work-orders': { route: '/work-orders', label: 'Work Orders', subLabel: 'OrbOps', icon: 'document-text', iconColor: '#8B5CF6' },
  bounty: { route: '/bounty', label: 'OrbBounty', subLabel: 'Deal Bounty', icon: 'gift', iconColor: '#F59E0B' },
  intent: { route: '/intent', label: 'Deal Match', subLabel: 'Post intent, get offers', icon: 'flash', iconColor: '#8B5CF6' },
  orbpass: { route: '/orbpass', label: 'OrbPass', subLabel: 'Member perks', icon: 'card', iconColor: '#22C55E' },
  premium: { route: '/(tabs)/premium', label: 'Premium', subLabel: 'Unlock', icon: 'diamond', iconColor: '#8B5CF6' },
  'compare-accounts': { route: '/compare-accounts', label: 'Compare', subLabel: 'Free vs Premium', icon: 'git-compare', iconColor: '#A78BFA' },
  settings: { route: '/settings', label: 'Settings', subLabel: 'System config', icon: 'settings-sharp', iconColor: '#9CA3AF' },
  admin: { route: '/admin', label: 'Admin Hub', subLabel: 'Control center', icon: 'construct', iconColor: '#FBBF24' },
};

/** Default labels for Master Directory (admin can override via Display Names). */
export const DIRECTORY_LABELS_DEFAULT: Record<string, string> = {
  map: 'Map',
  partners: 'Partners',
  people: 'People',
  profile: 'Profile',
  scan: 'Scan',
  pulse: 'OrbPulse Live',
  feed: 'Commerce Feed',
  orb: 'The Orb',
  missions: 'Missions',
  vote: 'OrbVote',
  wallet: 'Wallet',
  bookmarks: 'Bookmarks',
  upgrades: 'Upgrades',
  leaderboard: 'Leaderboard',
  orbsignal: 'Orb Signal',
  spheres: 'Spheres',
  stats: 'Stats',
  knowledge: 'Knowledge',
  premium: 'Premium',
  'compare-accounts': 'Compare plans',
  settings: 'Settings',
  orbops: 'OrbWork Orders',
  bounty: 'OrbBounty',
  intent: 'Deal Match',
  orbpass: 'OrbPass',
  opportunities: 'Opportunities',
  orbswipe: 'OrbSwipe',
  admin: 'Admin Hub',
};

/** Display name key + default value for Admin Hub "Names" section. */
export interface DisplayNameEntry {
  key: string;
  default: string;
  category: 'directory' | 'tab' | 'quick_action' | 'screen';
  label: string;
}

/** Master directory: all item ids (display order is alphabetical via DEFAULT_DIRECTORY_ORDER). */
const DIRECTORY_IDS = [
  'map', 'partners', 'people', 'profile', 'scan', 'pulse', 'feed', 'orb', 'orbswipe', 'missions', 'wallet', 'bookmarks', 'upgrades',
  'leaderboard', 'vote', 'orbsignal', 'spheres', 'stats', 'knowledge', 'premium', 'compare-accounts',
  'settings', 'orbops', 'bounty', 'intent', 'orbpass', 'opportunities', 'admin',
] as const;

export type DirectoryId = (typeof DIRECTORY_IDS)[number];

/** Master directory: default order of item ids, alphabetically by display label. */
export const DEFAULT_DIRECTORY_ORDER: readonly DirectoryId[] = [...DIRECTORY_IDS].sort((a, b) =>
  (DIRECTORY_LABELS_DEFAULT[a] ?? a).localeCompare(DIRECTORY_LABELS_DEFAULT[b] ?? b, undefined, { sensitivity: 'base' })
);

export const DISPLAY_NAME_ENTRIES: DisplayNameEntry[] = [
  ...DEFAULT_DIRECTORY_ORDER.map((id) => ({
    key: `dir_${id}`,
    default: DIRECTORY_LABELS_DEFAULT[id] ?? id,
    category: 'directory' as const,
    label: `Directory: ${DIRECTORY_LABELS_DEFAULT[id] ?? id}`,
  })),
  ...TAB_IDS.map((id) => ({
    key: `tab_${id}`,
    default: TAB_LABELS[id],
    category: 'tab' as const,
    label: `Tab: ${TAB_LABELS[id]}`,
  })),
  ...QUICK_ACTION_KEYS.map((k) => ({
    key: `qa_${k}`,
    default: QUICK_ACTION_CONFIG[k].label,
    category: 'quick_action' as const,
    label: `Quick: ${QUICK_ACTION_CONFIG[k].label}`,
  })),
  { key: 'screen_leaderboard_header', default: 'Legends', category: 'screen', label: 'Screen: Leaderboard header' },
  { key: 'screen_leaderboard_hero', default: 'LOCAL LEGENDS', category: 'screen', label: 'Screen: Leaderboard hero title' },
  { key: 'screen_leaderboard_tagline', default: 'Where the best in your city rise', category: 'screen', label: 'Screen: Leaderboard tagline' },
  { key: 'screen_wallet_title', default: 'Vault', category: 'screen', label: 'Screen: Wallet / Vault title' },
  { key: 'screen_premium_title', default: 'Premium', category: 'screen', label: 'Screen: Premium title' },
  { key: 'screen_orb_hub_title', default: 'Your Hub', category: 'screen', label: 'Screen: Orb Hub card title' },
  { key: 'screen_admin_hub_title', default: 'Admin Hub', category: 'screen', label: 'Screen: Admin Hub title' },
  { key: 'screen_all_pages_title', default: 'All pages', category: 'screen', label: 'Modal: All pages title' },
  { key: 'screen_orbswipe_title', default: 'OrbSwipe', category: 'screen', label: 'Screen: OrbSwipe page title' },
];

export function getDefaultDisplayName(key: string): string {
  const entry = DISPLAY_NAME_ENTRIES.find((e) => e.key === key);
  return entry?.default ?? key;
}

/** Default quick actions on Orb page (admin can change in Admin Hub). */
export const DEFAULT_QUICK_ACTIONS: QuickActionId[] = ['missions', 'leaderboard', 'scan', 'wallet', 'spheres', 'map', 'pulse', 'feed'];
export const MAX_QUICK_ACTIONS = 8;

const ADMIN_LAYOUT_STORAGE = 'ORBTAP_ADMIN_LAYOUT_V1';

/** Admin-only: when set, app UI behaves as this account type (for testing tier gating). */
export type TestAccountType =
  | 'off'
  | 'free'
  | 'premium'
  | 'pro'
  | 'partner_silver'
  | 'partner_gold'
  | 'partner_platinum';

export interface AdminLayoutState {
  tabOrder: TabId[];
  tabHidden: TabId[];
  directoryOrder: string[];
  quickActionIds: QuickActionId[];
  displayNames?: Record<string, string>;
  /** Admin testing: view app as this user tier. 'off' = use real account. */
  testAccountType?: TestAccountType;
}

const defaultLayout: AdminLayoutState = {
  tabOrder: [...DEFAULT_TAB_ORDER],
  tabHidden: [],
  directoryOrder: [...DEFAULT_DIRECTORY_ORDER],
  quickActionIds: [...DEFAULT_QUICK_ACTIONS],
  displayNames: {},
  testAccountType: 'off',
};

export async function loadAdminLayout(): Promise<AdminLayoutState> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const raw = await AsyncStorage.getItem(ADMIN_LAYOUT_STORAGE);
    if (!raw) return defaultLayout;
    const parsed = JSON.parse(raw) as Partial<AdminLayoutState>;
    const rawOrder = Array.isArray(parsed.tabOrder) ? parsed.tabOrder.filter((t) => TAB_IDS.includes(t as TabId)) : defaultLayout.tabOrder;
    const tabOrder = rawOrder.length > 0 ? rawOrder.slice(0, MAX_NAVBAR_TABS) : defaultLayout.tabOrder;
    const tabHidden = Array.isArray(parsed.tabHidden) ? parsed.tabHidden.filter((t) => TAB_IDS.includes(t as TabId)) : defaultLayout.tabHidden;
    const rawQuick = Array.isArray(parsed.quickActionIds) ? parsed.quickActionIds.filter((k) => QUICK_ACTION_KEYS.includes(k as QuickActionId)) : defaultLayout.quickActionIds;
    const quickActionIds = rawQuick.length > 0 ? rawQuick.slice(0, MAX_QUICK_ACTIONS) : defaultLayout.quickActionIds;
    const displayNames =
      parsed.displayNames && typeof parsed.displayNames === 'object' ? (parsed.displayNames as Record<string, string>) : {};
    const valid: TestAccountType[] = ['free', 'premium', 'pro', 'partner_silver', 'partner_gold', 'partner_platinum'];
    const testAccountType = valid.includes(parsed.testAccountType as TestAccountType) ? (parsed.testAccountType as TestAccountType) : 'off';
    return {
      tabOrder: tabOrder.length >= MAX_NAVBAR_TABS ? tabOrder : [...tabOrder, ...DEFAULT_TAB_ORDER.filter((t) => !tabOrder.includes(t))].slice(0, MAX_NAVBAR_TABS),
      tabHidden,
      directoryOrder: Array.isArray(parsed.directoryOrder) ? parsed.directoryOrder : defaultLayout.directoryOrder,
      quickActionIds,
      displayNames,
      testAccountType,
    };
  } catch {
    return defaultLayout;
  }
}

export async function saveAdminLayout(state: AdminLayoutState): Promise<void> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem(ADMIN_LAYOUT_STORAGE, JSON.stringify(state));
}

export { defaultLayout };

/**
 * Tab bar long-press sub-menus: quick actions per tab.
 * Only tabs that appear in the navbar get sub-menus (index, scan, wallet, profile, plus any in visible order).
 * Orb tab uses Master Directory instead; it uses ORB_LONG_PRESS_MS.
 */

import type { TabId } from './AdminConfig';
import type { FlagKey } from './Flags';

export interface TabSubmenuAction {
  label: string;
  route: string;
  icon: string;
  flagKey?: FlagKey;
  /** Show only when user has partner (Pro) tier — e.g. from useEffectiveTier().isPartner */
  partnerOnly?: boolean;
}

/** Quick actions shown when user long-presses a tab. flagKey: only show when this flag is on. */
export const TAB_SUBMENU_ACTIONS: Partial<Record<TabId, TabSubmenuAction[]>> = {
  index: [
    { label: 'Partners', route: '/partners', icon: 'business' },
    { label: 'OrbPulse', route: '/pulse', icon: 'pulse', flagKey: 'isOrbPulseEnabled' },
    { label: 'Leaderboard', route: '/leaderboard', icon: 'trophy', flagKey: 'isLeaderboardEnabled' },
    { label: 'Bookmarks', route: '/bookmarks', icon: 'bookmark', flagKey: 'isBookmarksEnabled' },
    { label: 'Spheres', route: '/spheres', icon: 'people' },
    { label: 'Stats', route: '/stats', icon: 'stats-chart', flagKey: 'isStatsEnabled' },
    { label: 'Directory', route: '/(tabs)/orb', icon: 'menu' },
  ],
  scan: [
    { label: 'Wallet', route: '/(tabs)/wallet', icon: 'wallet', flagKey: 'isOrbWalletEnabled' },
    { label: 'Missions', route: '/missions', icon: 'flag', flagKey: 'isOrbQuestEnabled' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Map', route: '/(tabs)', icon: 'map' },
    { label: 'Partners', route: '/partners', icon: 'business' },
  ],
  wallet: [
    { label: 'Scan', route: '/(tabs)/scan', icon: 'qr-code' },
    { label: 'Missions', route: '/missions', icon: 'flag', flagKey: 'isOrbQuestEnabled' },
    { label: 'OrbVote', route: '/vote', icon: 'stats-chart', flagKey: 'isOrbVoteEnabled' },
    { label: 'Stats', route: '/stats', icon: 'stats-chart', flagKey: 'isStatsEnabled' },
    { label: 'Leaderboard', route: '/leaderboard', icon: 'trophy', flagKey: 'isLeaderboardEnabled' },
    { label: 'Premium', route: '/premium', icon: 'diamond' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
  ],
  profile: [
    { label: 'Settings', route: '/settings', icon: 'settings-sharp' },
    { label: 'Partner dashboard', route: '/partner/dashboard', icon: 'storefront', partnerOnly: true },
    { label: 'Stats', route: '/stats', icon: 'stats-chart', flagKey: 'isStatsEnabled' },
    { label: 'Leaderboard', route: '/leaderboard', icon: 'trophy', flagKey: 'isLeaderboardEnabled' },
    { label: 'Missions', route: '/missions', icon: 'flag', flagKey: 'isOrbQuestEnabled' },
    { label: 'People', route: '/people', icon: 'people' },
    { label: 'Spheres', route: '/spheres', icon: 'people' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Admin Hub', route: '/admin', icon: 'construct' },
  ],
  pulse: [
    { label: 'Map', route: '/(tabs)', icon: 'map' },
    { label: 'Missions', route: '/missions', icon: 'flag', flagKey: 'isOrbQuestEnabled' },
    { label: 'OrbVote', route: '/vote', icon: 'stats-chart', flagKey: 'isOrbVoteEnabled' },
    { label: 'Partners', route: '/partners', icon: 'business' },
    { label: 'Leaderboard', route: '/leaderboard', icon: 'trophy', flagKey: 'isLeaderboardEnabled' },
    { label: 'Stats', route: '/stats', icon: 'stats-chart', flagKey: 'isStatsEnabled' },
  ],
  missions: [
    { label: 'Map', route: '/(tabs)', icon: 'map' },
    { label: 'Scan', route: '/(tabs)/scan', icon: 'qr-code' },
    { label: 'Wallet', route: '/(tabs)/wallet', icon: 'wallet', flagKey: 'isOrbWalletEnabled' },
    { label: 'OrbPulse', route: '/pulse', icon: 'pulse', flagKey: 'isOrbPulseEnabled' },
    { label: 'Spheres', route: '/spheres', icon: 'people' },
  ],
  bookmarks: [
    { label: 'Partners', route: '/partners', icon: 'business' },
    { label: 'Map', route: '/(tabs)', icon: 'map' },
    { label: 'Knowledge', route: '/knowledge', icon: 'bulb', flagKey: 'isKnowledgeEnabled' },
  ],
  leaderboard: [
    { label: 'Stats', route: '/stats', icon: 'stats-chart', flagKey: 'isStatsEnabled' },
    { label: 'Missions', route: '/missions', icon: 'flag', flagKey: 'isOrbQuestEnabled' },
    { label: 'OrbVote', route: '/vote', icon: 'stats-chart', flagKey: 'isOrbVoteEnabled' },
    { label: 'Spheres', route: '/spheres', icon: 'people' },
  ],
  spheres: [
    { label: 'Missions', route: '/missions', icon: 'flag', flagKey: 'isOrbQuestEnabled' },
    { label: 'Map', route: '/(tabs)', icon: 'map' },
    { label: 'Partners', route: '/partners', icon: 'business' },
    { label: 'Wallet', route: '/(tabs)/wallet', icon: 'wallet', flagKey: 'isOrbWalletEnabled' },
  ],
  stats: [
    { label: 'Leaderboard', route: '/leaderboard', icon: 'trophy', flagKey: 'isLeaderboardEnabled' },
    { label: 'Missions', route: '/missions', icon: 'flag', flagKey: 'isOrbQuestEnabled' },
    { label: 'Wallet', route: '/(tabs)/wallet', icon: 'wallet', flagKey: 'isOrbWalletEnabled' },
    { label: 'Premium', route: '/premium', icon: 'diamond' },
  ],
  knowledge: [
    { label: 'Stats', route: '/stats', icon: 'stats-chart', flagKey: 'isStatsEnabled' },
    { label: 'Premium', route: '/premium', icon: 'diamond' },
    { label: 'Compare plans', route: '/compare-accounts', icon: 'git-compare' },
  ],
  premium: [
    { label: 'Compare plans', route: '/compare-accounts', icon: 'git-compare' },
    { label: 'Partners', route: '/partners', icon: 'business' },
    { label: 'Wallet', route: '/(tabs)/wallet', icon: 'wallet', flagKey: 'isOrbWalletEnabled' },
  ],
  settings: [
    { label: 'Notifications', route: '/notification-settings', icon: 'notifications-outline' },
    { label: 'Profile', route: '/(tabs)/profile', icon: 'person' },
    { label: 'Legal', route: '/legal', icon: 'document-text' },
    { label: 'Help', route: '/legal/help', icon: 'help-buoy' },
  ],
};

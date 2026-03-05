import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persists the last authenticated UID so we can detect cold-start account switches.
 * NOT included in USER_SPECIFIC_KEYS so it survives clears.
 */
export const ORBTAP_LAST_UID_KEY = 'ORBTAP_LAST_UID';

export async function getLastUid(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ORBTAP_LAST_UID_KEY);
  } catch {
    return null;
  }
}

export async function setLastUid(uid: string | null): Promise<void> {
  try {
    if (uid === null) {
      await AsyncStorage.removeItem(ORBTAP_LAST_UID_KEY);
    } else {
      await AsyncStorage.setItem(ORBTAP_LAST_UID_KEY, uid);
    }
  } catch {
    // non-fatal
  }
}

/**
 * All AsyncStorage keys that belong to a specific user session.
 * Cleared on logout and when a different account logs in so no
 * data bleeds between user accounts.
 *
 * ORBTAP_LAST_UID is intentionally NOT in this list — it must survive
 * clears so we can detect cold-start account switches.
 */
const USER_SPECIFIC_KEYS: string[] = [
  // Wallet & economy
  'ORBTAP_WALLET_V3',
  'ORBTAP_VERIFIED_ACTIONS',
  'ORBTAP_ORBINOMICS_V1',
  // Streak
  'ORBTAP_STREAK_V1',
  'ORBTAP_ORBSCOPE_DAILY_V1',
  'ORBTAP_ORBSCOPE_STREAK_V1',
  // Preferences (includes onboardingComplete, partnerMode, premiumMember, hasEnteredGrid, etc.)
  'ORBTAP_PREFS_V2',
  // Badges
  'ORBTAP_BADGES_V1',
  'ORBTAP_RITUAL_BADGES_V1',
  'ORBTAP_FOUNDING_STATS',
  'ORBTAP_LEVEL_UP_ACK',
  // Missions
  'ORBTAP_DAILY_MISSIONS_V2',
  'ORBTAP_DAILY_MISSIONS_DATE',
  'ORBTAP_MISSIONS_TOTAL_COMPLETED_V1',
  'ORBTAP_MISSIONS_SELECTED_MOOD',
  'ORBTAP_MISSIONS_BONUS_DATE',
  'ORBTAP_MISSIONS_CONFIG_V1',
  'ORBTAP_MISSIONS_CONFIG_V2',
  // Social & connections
  'ORBTAP_SOCIAL_V2',
  'ORBTAP_FRIEND_PASSES_V1',
  'ORBTAP_SPHERE_INVITES_V1',
  'ORBTAP_INVITE_SPHERE_PRESETS',
  // Bookmarks & saved content
  'ORBTAP_BOOKMARKS_V1',
  'ORBTAP_KNOWLEDGE_SAVED_V1',
  'ORBTAP_SAVED_INTENTS_V1',
  // Reviews
  'ORBTAP_REVIEWS_V1',
  // Sphere plans
  'ORBTAP_SPHERE_PLANS_V1',
  // Meal features
  'ORBTAP_MEAL_ANALYTICS_V1',
  'ORBTAP_MEAL_PROPOSALS_V1',
  'ORBTAP_MEAL_PLANS_V1',
  'ORBTAP_MEAL_SPHERE_VOTES_V1',
  // OrbSwipe
  'ORBTAP_ORBSWIPE_EVENTS_QUEUE',
  'ORBTAP_ORBSWIPE_PENDING_WIN',
  'ORBTAP_ORBSWIPE_PREFS_V1',
  // Map history & camera
  'ORBTAP_MAP_HISTORY_V1',
  'ORBTAP_MAP_CAMERA_V1',
  // Drops & reservations
  'ORBTAP_DROPS_V1',
  'ORBTAP_RESERVATIONS_V1',
  // Integrity & attribution
  'ORBTAP_INTEGRITY_EVENTS_V1',
  'ORBTAP_PARTNER_ATTRIBUTION_V1',
  // Partner UI state
  'ORBTAP_PARTNER_PAGE_OVERLAY',
  'ORBTAP_STAMP_CARDS_EXPANDED',
  // Admin layout (per-user so different admin accounts get fresh layout)
  'ORBTAP_ADMIN_LAYOUT_V1',
  // Tier benefits cache (per-user)
  'ORBTAP_TIER_BENEFITS_V1',
  // Menu cache (partner menus, reports, drafts — user-specific)
  'ORBTAP_PARTNER_MENUS_V1',
  'ORBTAP_PARTNER_MENUS_V1_versions',
  'ORBTAP_MENU_REPORTS_V1',
  'ORBTAP_DROP_SUGGESTION_DRAFTS_V1',
  // Announcements dismissed by this user
  'ORBTAP_GLOBAL_ANNOUNCEMENT_DISMISSED_IDS',
  // Tutorial completion (user-specific; new users should see tutorials fresh)
  'ORBTAP_TUTORIAL_STATE',
  '@orbtap_tutorial_skip_all',
  '@orbtap_tutorial_completed',
  '@orbtap_admin_tutorial_disabled',
  // OrbTapUniverse-specific
  'ORBTAP_FIRST_GRID_ENTRY_SHOWN',
  'ORBTAP_SHOW_FIRST_ORB_PROMPT',
  // ORBTAP_LANGUAGE_V1 intentionally NOT cleared — device keeps preferred language across logout/account switch
  'ORBTAP_DAILY_RITUAL_CONFIG_V1',
  'ORBTAP_ORBVOTE_QUOTAS_V1',
  'ORBTAP_DEMO_DATA_ENABLED_V1',
  // Auth-related (per-device but clear on switch so new user gets fresh)
  'ORBTAP_REMEMBER_EMAIL',
  'ORBTAP_BIOMETRIC_CREDS',
  'ORBTAP_BIOMETRIC_ENABLED',
  // OrbOps / work orders
  'ORBTAP_WORK_ORDERS_V1',
  'ORBTAP_PROOF_PACKS_V1',
  'ORBTAP_JOB_PROOF_RECEIPTS_V1',
  'ORBTAP_PARTNER_PROOF_PORTFOLIOS_V1',
];

/**
 * Clears all user-specific local data from AsyncStorage.
 * Call this on logout or when a different user account logs in.
 * App-wide remote config caches (flags, UI config, orbinomics policy, etc.) are preserved.
 * ORBTAP_LAST_UID is also preserved (handled by UserDataGate separately).
 */
export async function clearUserLocalData(): Promise<void> {
  try {
    // Deduplicate keys before removing (avoids double-remove errors on some platforms)
    const unique = [...new Set(USER_SPECIFIC_KEYS)];
    await AsyncStorage.multiRemove(unique);
  } catch (e) {
    if (__DEV__) console.warn('clearUserLocalData failed:', e);
  }
}

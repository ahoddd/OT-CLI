/**
 * OrbSwipe v1.1 — config constants for controls, low supply, and categories.
 * Admin-configurable values (e.g. radius presets, tray threshold) can be moved to Firestore later.
 */

/** Radius presets in miles for deck composition. */
export const ORBSWIPE_RADIUS_PRESETS_MI = [1, 5, 10, 15] as const;
export const ORBSWIPE_RADIUS_DEFAULT_MI = 10;

/** Categories users can hide in "Hide categories" (persisted 7 days). */
export const ORBSWIPE_HIDE_CATEGORY_OPTIONS: { id: string; label: string }[] = [
  { id: 'food', label: 'Food' },
  { id: 'dessert_coffee', label: 'Dessert/Coffee' },
  { id: 'activity', label: 'Activity' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'services', label: 'Services' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'family', label: 'Family' },
];

/** Below this count, show "Low supply" fallback banner. */
export const ORBSWIPE_LOW_SUPPLY_THRESHOLD = 8;

/** Tray size at which "Fuse My Night" CTA appears (admin-configurable default). */
export const ORBSWIPE_TRAY_FUSE_THRESHOLD = 2;

/** Max cards in tray (Fuse builds from these). */
export const ORBSWIPE_TRAY_MAX = 5;

/** Deep link path for OrbSwipe / Fuse (share back into app). */
export const ORBSWIPE_DEEP_PATH = '/orbswipe';

/* ====================================================================
   Fortification admin-tunable config
   ==================================================================== */

/** Fuse engine: radius presets for expand-radius fallback (miles). */
export const FUSE_RADIUS_PRESETS_MI = [1, 5, 10, 15, 25] as const;
/** Fuse engine: minimum supply count before triggering fallback UI. */
export const FUSE_MIN_SUPPLY_THRESHOLD = 1;
/** Fuse engine: max results the Fuse can return per invocation. */
export const FUSE_MAX_RESULTS = 3;

/** SavedIntent: default expiry in days (0 = never). */
export const SAVED_INTENT_EXPIRY_DAYS = 7;
/** SavedIntent: max active intents per user. */
export const SAVED_INTENT_MAX_ACTIVE = 20;

/** FriendPass: default expiry in hours. */
export const FRIEND_PASS_EXPIRY_HOURS = 48;
/** FriendPass: max passes a creator can issue per week. */
export const FRIEND_PASS_MAX_PER_WEEK = 5;
/** FriendPass: max claims per pass. */
export const FRIEND_PASS_MAX_CLAIMS = 1;
/** FriendPass: bonus OT points for the friend upon verified win. */
export const FRIEND_PASS_FRIEND_BONUS_POINTS = 25;
/** FriendPass: bonus OT points for the creator (tiny, optional). */
export const FRIEND_PASS_CREATOR_BONUS_POINTS = 10;

/** Partner Growth Suggestions: enable per tier ('silver' | 'gold' | 'platinum'). */
export const GROWTH_SUGGESTIONS_TIERS: Record<string, 'full' | 'tip' | 'none'> = {
  silver: 'none',
  gold: 'tip',
  platinum: 'full',
};

/**
 * App config — store URLs, contact, etc.
 * Override via EXPO_PUBLIC_APP_STORE_ID when building for production.
 */

const env: Record<string, string | undefined> = typeof process !== 'undefined' && process.env ? process.env as Record<string, string | undefined> : {};

/** iOS App Store app ID (numeric). Replace before release. */
export const APP_STORE_ID = env.EXPO_PUBLIC_APP_STORE_ID || '';

/** iOS App Store URL. Uses search fallback if APP_STORE_ID not set. */
export const APP_STORE_URL = APP_STORE_ID
  ? `https://apps.apple.com/app/orbtap/id${APP_STORE_ID}`
  : 'https://apps.apple.com/search?term=orbtap';

/** Google Play package. */
export const PLAY_STORE_PACKAGE = 'com.orbtap.app';

/** Google Play URL. */
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;

/** Minimum age to create an account (COPPA / App Store compliance). */
export const MINIMUM_AGE = 13;

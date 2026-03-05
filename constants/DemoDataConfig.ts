/**
 * Demo/mock data toggle — when off, app shows only real Firestore data (empty state at launch).
 * Admin can turn on/off in Admin Hub. Stored in AsyncStorage so it persists.
 */

export const DEMO_DATA_STORAGE_KEY = 'ORBTAP_DEMO_DATA_ENABLED_V1';

/** Default false = live-data-only mode for production. Admin can re-enable via Admin Hub. */
export const DEFAULT_DEMO_DATA_ENABLED = false;

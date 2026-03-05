/**
 * Map defaults and storage keys — Poconos/Tannersville as default region.
 */

/** Default map center: Tannersville / Crossings area (lng, lat) */
export const POCONOS_DEFAULT_CENTER: [number, number] = [-75.309, 41.044];

/** Default zoom to show core Poconos region (not too zoomed out) */
export const POCONOS_DEFAULT_ZOOM = 14;

/** Max distance (miles) from default center for "Poconos region" validation (~60 mi) */
export const POCONOS_BOUND_RADIUS_MI = 60;

export const MAP_CAMERA_STORAGE_KEY = 'ORBTAP_MAP_CAMERA_V1';

/** Height of the nearby-partners tray above tab bar; map controls sit above this. */
export const MAP_TRAY_HEIGHT = 78;

/** Left-edge drawer: collapsed width (handle only). */
export const MAP_TRAY_COLLAPSED_WIDTH = 44;

/** Left-edge drawer: max expanded width (partner list). */
export const MAP_TRAY_EXPANDED_MAX_WIDTH = 280;

/** Height of the nearby-partners drawer strip (one row of pills). */
export const MAP_TRAY_STRIP_HEIGHT = 56;

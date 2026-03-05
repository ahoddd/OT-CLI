/**
 * OrbTap iconography rules: consistent sizing and stroke weights.
 * Use these when rendering icons so the app feels cohesive.
 */

export const ORB_ICON_SIZES = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
} as const;

/** Prefer medium (24) for nav and list; small (20) for inline; large for hero CTAs. */
export const ORB_ICON_DEFAULT = ORB_ICON_SIZES.md;

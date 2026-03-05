/**
 * OrbTap design tokens — single source of truth for spacing, radius, motion, and elevation.
 * Use everywhere for a consistent, premium, and scalable UI.
 */

/** Base spacing unit (4px). Use multiples: 1 = 4, 2 = 8, 3 = 12, 4 = 16, 5 = 20, 6 = 24, 8 = 32, 10 = 40. */
export const SPACE = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

/** Border radius — cards, buttons, modals. */
export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  full: 9999,
} as const;

/** Animation durations (ms). Use for enter/exit and micro-interactions. */
export const MOTION = {
  instant: 100,
  fast: 200,
  normal: 300,
  smooth: 400,
  slow: 500,
  enter: 400,
  exit: 300,
} as const;

/** Hero sequence: stagger delay (ms) between elements (e.g. logo → headline → stats → CTAs). See ORBTAP_VISUAL_DIRECTION.md. */
export const HERO_STAGGER_MS = 100;

/** Elevation / shadow — use for cards and floating elements. */
export const ELEVATION = {
  none: 0,
  low: 2,
  mid: 4,
  high: 8,
  modal: 12,
} as const;

/** Minimum tap target size (accessibility). */
export const TAP_TARGET_MIN = 44;

/** Standard card padding. */
export const CARD_PADDING = SPACE.base;

/** Standard screen horizontal padding. */
export const SCREEN_PADDING_H = SPACE.base;

/** Section title letter-spacing and size. */
export const SECTION_TITLE = {
  fontSize: 11,
  fontWeight: '800' as const,
  letterSpacing: 1.2,
};

/** Standard ScrollView contentContainerStyle — use for full-screen scroll screens. */
export const SCROLL_CONTENT = {
  flexGrow: 1,
  paddingHorizontal: SPACE.base,
  paddingBottom: SPACE.xl,
} as const;

/** Recommended FlatList props for performance (use when list is long or items are heavy). */
export const LIST_OPTIMIZATION = {
  removeClippedSubviews: true,
  maxToRenderPerBatch: 12,
  windowSize: 8,
  initialNumToRender: 12,
} as const;

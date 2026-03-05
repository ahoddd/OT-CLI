/**
 * OrbTap — single theme module (one token system, Classic skin only).
 * Accepts colorMode (dark/light); returns tokens and derived helpers.
 */

import { COLORS } from './Colors';
import { SPACE, RADIUS, MOTION, ELEVATION } from './DesignTokens';
import type { UIVersion } from './UIConfig';

export type ColorMode = 'dark' | 'light';

/** Color token shape: backward-compatible with existing useTheme().colors + semantic extras for Kit v1. */
export interface ColorTokens {
  background: string;
  surface: string;
  surfaceHighlight: string;
  text: string;
  textSecondary: string;
  textMuted?: string;
  border: string;
  cardBorder: string;
  gloss: string;
  shadow: string;
  tabBar: string;
  navIcon: string;
  navIconActive: string;
  primary: string;
  // Semantic (optional)
  surface1?: string;
  surface2?: string;
  surface3?: string;
  accentPrimary?: string;
  accentSecondary?: string;
  success?: string;
  warn?: string;
  error?: string;
  info?: string;
  scrim?: string;
  overlay?: string;
  /** 3-tier user (silver/gold/platinum); used for badges, nav active state. */
  tier1?: string;
  tier2?: string;
  tier3?: string;
  primaryGradient?: [string, string];
  invertedSurface?: string;
  invertedText?: string;
  primaryLight?: string;
  gold?: string;
  /** Optional: gradient for hero strips [top, bottom]. */
  heroGradient?: [string, string];
  /** Optional: soft glow for key cards. */
  cardGlow?: string;
}

/** Typography scale. Minimum body 15px, caption 12px; use label/small for secondary labels (13–14px). */
export interface TypographyTokens {
  title: { fontSize: number; fontWeight: '700'; lineHeight: number };
  heading: { fontSize: number; fontWeight: '600'; lineHeight: number };
  subheading: { fontSize: number; fontWeight: '600'; lineHeight: number };
  body: { fontSize: number; fontWeight: '400'; lineHeight: number };
  caption: { fontSize: number; fontWeight: '400'; lineHeight: number };
  /** Secondary labels (e.g. form labels, metadata); min legible size. */
  label: { fontSize: number; fontWeight: '500'; lineHeight: number };
}

/** Motion tokens. */
export interface MotionTokens {
  fast: number;
  med: number;
  slow: number;
  easing: string;
}

/** Full token set returned by theme. */
export interface ThemeTokens {
  colors: ColorTokens;
  spacing: typeof SPACE;
  radius: typeof RADIUS;
  motion: MotionTokens;
  elevation: typeof ELEVATION;
  typography: TypographyTokens;
}

/** Membership tier colors (badges only; separate from rarity). Silver / Gold / Platinum. */
const MEMBERSHIP_TIER_COLORS = {
  silver: { main: '#94a3b8', light: '#cbd5e1', dark: '#64748b' },
  gold: { main: '#eab308', light: '#fde047', dark: '#ca8a04' },
  platinum: { main: '#a78bfa', light: '#c4b5fd', dark: '#7c3aed' },
} as const;

/** Classic skin: current palette mapped into token shape (no behavior change). */
function getClassicColors(colorMode: ColorMode): ColorTokens {
  const raw = colorMode === 'dark' ? COLORS.dark : COLORS.light;
  return {
    ...raw,
    textMuted: raw.textSecondary,
    surface1: raw.surface,
    surface2: raw.surfaceHighlight,
    surface3: raw.background,
    accentPrimary: raw.primary,
    accentSecondary: COLORS.gold[0],
    success: COLORS.success,
    warn: COLORS.gold[0],
    error: COLORS.danger,
    info: raw.primary,
    scrim: colorMode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
    overlay: colorMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    gold: COLORS.gold[0],
    cardGlow: colorMode === 'dark' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)',
  };
}

function getColors(colorMode: ColorMode, _uiVersion: UIVersion): ColorTokens {
  return getClassicColors(colorMode);
}

/** Set these when custom fonts are loaded in root layout (e.g. via expo-font). */
export const FONT_DISPLAY: string | undefined = undefined;
export const FONT_BODY: string | undefined = undefined;

/** Shared typography scale (same for both skins). Uses FONT_DISPLAY / FONT_BODY when set. */
const TYPOGRAPHY: TypographyTokens = {
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28, ...(FONT_DISPLAY && { fontFamily: FONT_DISPLAY }) },
  heading: { fontSize: 18, fontWeight: '600', lineHeight: 24, ...(FONT_DISPLAY && { fontFamily: FONT_DISPLAY }) },
  subheading: { fontSize: 16, fontWeight: '600', lineHeight: 22, ...(FONT_DISPLAY && { fontFamily: FONT_DISPLAY }) },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22, ...(FONT_BODY && { fontFamily: FONT_BODY }) },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16, ...(FONT_BODY && { fontFamily: FONT_BODY }) },
  label: { fontSize: 14, fontWeight: '500', lineHeight: 20, ...(FONT_BODY && { fontFamily: FONT_BODY }) },
};

/** Shared motion (from DesignTokens). */
const MOTION_TOKENS: MotionTokens = {
  fast: MOTION.fast,
  med: MOTION.normal,
  slow: MOTION.slow,
  easing: 'ease-in-out',
};

/** Kit v1 radius scale: 12, 16, 20, 24 (no random values). */
export const RADIUS_SCALE = [12, 16, 20, 24] as const;

/** Kit v1 spacing scale: 4, 8, 12, 16, 20, 24, 32, 40. */
export const SPACING_SCALE = [4, 8, 12, 16, 20, 24, 32, 40] as const;

/** Re-export for consumers that import MEMBERSHIP_TIER_COLORS from Theme. */
export { MEMBERSHIP_TIER_COLORS };

/**
 * Single source of truth: get theme tokens for a given colorMode and uiVersion.
 * Used by useTheme(); no duplicate theme systems.
 */
export function getThemeTokens(colorMode: ColorMode, uiVersion: UIVersion): ThemeTokens {
  const colors = getColors(colorMode, uiVersion);
  return {
    colors,
    spacing: SPACE,
    radius: RADIUS,
    motion: MOTION_TOKENS,
    elevation: ELEVATION,
    typography: TYPOGRAPHY,
  };
}

/** Build all theme-derived values with colors computed once (optimization for useTheme). */
export interface ThemeBundle {
  tokens: ThemeTokens;
  surfaces: ReturnType<typeof getSurfaceStyles>;
  textStyles: ReturnType<typeof getTextStyles>;
  borders: ReturnType<typeof getBorderStyles>;
  materials: ReturnType<typeof getMaterialStyles>;
}

export function getThemeBundle(colorMode: ColorMode, uiVersion: UIVersion): ThemeBundle {
  const colors = getColors(colorMode, uiVersion);
  const tokens: ThemeTokens = {
    colors,
    spacing: SPACE,
    radius: RADIUS,
    motion: MOTION_TOKENS,
    elevation: ELEVATION,
    typography: TYPOGRAPHY,
  };
  const radius = RADIUS.base;
  const surfaces = {
    card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius },
    cardElevated: { backgroundColor: colors.surfaceHighlight, borderWidth: 1, borderColor: colors.border, borderRadius: radius },
    screen: { backgroundColor: colors.background },
  };
  const mutedColor = colors.textMuted ?? colors.textSecondary;
  const textStyles = {
    title: { ...TYPOGRAPHY.title, color: colors.text },
    heading: { ...TYPOGRAPHY.heading, color: colors.text },
    body: { ...TYPOGRAPHY.body, color: colors.text },
    caption: { ...TYPOGRAPHY.caption, color: colors.textSecondary },
    muted: { ...TYPOGRAPHY.caption, color: mutedColor },
  };
  const borders = {
    subtle: { borderWidth: 1, borderColor: colors.cardBorder },
    strong: { borderWidth: 1, borderColor: colors.border },
  };
  const materials = getMaterialStyles(colorMode, uiVersion);
  return { tokens, surfaces, textStyles, borders, materials };
}

/** Derived surface style helpers (for cards, sheets). */
export function getSurfaceStyles(
  colorMode: ColorMode,
  uiVersion: UIVersion
): {
  card: { backgroundColor: string; borderWidth: number; borderColor: string; borderRadius: number };
  cardElevated: { backgroundColor: string; borderWidth: number; borderColor: string; borderRadius: number };
  screen: { backgroundColor: string };
} {
  const colors = getColors(colorMode, uiVersion);
  const radius = RADIUS.base;
  return {
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius,
    },
    cardElevated: {
      backgroundColor: colors.surfaceHighlight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius,
    },
    screen: {
      backgroundColor: colors.background,
    },
  };
}

/** Derived text style helpers (for consistent type scale). */
export function getTextStyles(
  colorMode: ColorMode,
  uiVersion: UIVersion
): {
  title: { fontSize: number; fontWeight: '700'; lineHeight: number; color: string };
  heading: { fontSize: number; fontWeight: '600'; lineHeight: number; color: string };
  body: { fontSize: number; fontWeight: '400'; lineHeight: number; color: string };
  caption: { fontSize: number; fontWeight: '400'; lineHeight: number; color: string };
  muted: { fontSize: number; fontWeight: '400'; lineHeight: number; color: string };
} {
  const colors = getColors(colorMode, uiVersion);
  const t = TYPOGRAPHY;
  const mutedColor = colors.textMuted ?? colors.textSecondary;
  return {
    title: { ...t.title, color: colors.text },
    heading: { ...t.heading, color: colors.text },
    body: { ...t.body, color: colors.text },
    caption: { ...t.caption, color: colors.textSecondary },
    muted: { ...t.caption, color: mutedColor },
  };
}

/** Derived border helpers. */
export function getBorderStyles(
  colorMode: ColorMode,
  uiVersion: UIVersion
): {
  subtle: { borderWidth: number; borderColor: string };
  strong: { borderWidth: number; borderColor: string };
} {
  const colors = getColors(colorMode, uiVersion);
  return {
    subtle: { borderWidth: 1, borderColor: colors.cardBorder },
    strong: { borderWidth: 1, borderColor: colors.border },
  };
}

/** Material styles: Nightglass (dark readable glass), Lightglass (light readable glass), Solid. */
export function getMaterialStyles(
  colorMode: ColorMode,
  uiVersion: UIVersion
): {
  nightglass: { backgroundColor: string; borderWidth: number; borderColor: string; borderRadius: number };
  lightglass: { backgroundColor: string; borderWidth: number; borderColor: string; borderRadius: number };
  solid: { backgroundColor: string; borderWidth: number; borderColor: string; borderRadius: number };
} {
  const colors = getColors(colorMode, uiVersion);
  const r = RADIUS.base;
  if (colorMode === 'dark') {
    return {
      nightglass: {
        backgroundColor: 'rgba(28,28,30,0.72)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: r,
      },
      lightglass: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: r,
      },
      solid: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: r,
      },
    };
  }
  return {
    nightglass: {
      backgroundColor: 'rgba(0,0,0,0.04)',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.06)',
      borderRadius: r,
    },
    lightglass: {
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.06)',
      borderRadius: r,
    },
    solid: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: r,
    },
  };
}

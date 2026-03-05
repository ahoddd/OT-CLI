/**
 * Pre-auth design tokens — landing, login, signup.
 * Single visual language: dark base, glass surfaces, one primary accent (electric blue).
 */

import { RADIUS, SPACE, TAP_TARGET_MIN } from './DesignTokens';

export const PREAUTH = {
  background: '#0a0a0f',
  surface: 'rgba(255,255,255,0.06)',
  surfaceBorder: 'rgba(255,255,255,0.08)',
  primary: '#38bdf8',
  primaryDark: '#0ea5e9',
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.75)',
  textMuted: 'rgba(255,255,255,0.5)',
  radius: RADIUS.lg,
  radiusButton: RADIUS.base,
  paddingCard: SPACE.lg,
  minButtonHeight: Math.max(TAP_TARGET_MIN, 52),
  inputBackground: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.1)',
} as const;

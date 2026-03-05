import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS } from '../constants/Colors';
import { getThemeBundle, type ColorMode } from '../constants/Theme';
import type { UIVersion } from '../constants/UIConfig';
import { usePreferences } from './usePreferences';
import { useUIConfig } from '../context/UIConfigContext';

/**
 * Single theme hook: colorMode from user preference (light/dark/system), uiVersion from Admin UIConfig.
 * Returns tokens (colors, spacing, radius, motion, typography) and derived helpers.
 * RTL/accessibility: no layout direction or contrast changes; existing behavior preserved.
 */
export const useTheme = () => {
  const systemScheme = useColorScheme();
  const { prefs } = usePreferences();
  const { uiVersion } = useUIConfig();
  const themePreference = prefs.themePreference ?? 'system';

  const effectiveDark =
    themePreference === 'system'
      ? systemScheme === 'dark'
      : themePreference === 'dark';
  const isDark = effectiveDark;
  const colorMode: ColorMode = isDark ? 'dark' : 'light';

  const bundle = useMemo(
    () => getThemeBundle(colorMode, uiVersion),
    [colorMode, uiVersion]
  );

  return {
    isDark,
    /** Backward-compatible: same shape as before (background, surface, text, etc.). */
    colors: bundle.tokens.colors,
    rawColors: COLORS,
    themePreference,
    uiVersion,
    tokens: bundle.tokens,
    typography: bundle.tokens.typography,
    surfaces: bundle.surfaces,
    textStyles: bundle.textStyles,
    borders: bundle.borders,
    materials: bundle.materials,
  };
};

export type { UIVersion };

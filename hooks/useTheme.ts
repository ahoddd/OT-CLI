import { useColorScheme } from 'react-native';
import { COLORS } from '../constants/Colors';
import { usePreferences } from './usePreferences';

export const useTheme = () => {
  const systemScheme = useColorScheme();
  const { prefs } = usePreferences();
  const themePreference = prefs.themePreference ?? 'system';

  const effectiveDark =
    themePreference === 'system'
      ? systemScheme === 'dark'
      : themePreference === 'dark';
  const isDark = effectiveDark;
  const colors = isDark ? COLORS.dark : COLORS.light;

  return {
    isDark,
    colors,
    rawColors: COLORS,
    themePreference,
  };
};

import { useColorScheme } from 'react-native';
import { COLORS } from '../constants/Colors';

export const useTheme = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  
  // Return the active palette based on system preference
  const colors = isDark ? COLORS.dark : COLORS.light;
  
  return {
    isDark,
    colors,
    rawColors: COLORS
  };
};

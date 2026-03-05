import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * OrbTap signature: soft glow for primary CTA or active selection.
 * Dark: soft outer glow; Light: subtle inner highlight + crisp border.
 */
interface OrbGlowFocusProps {
  children: React.ReactNode;
  focused?: boolean;
  style?: ViewStyle;
}

export function OrbGlowFocus({ children, focused = true, style }: OrbGlowFocusProps) {
  const { colors, isDark } = useTheme();
  if (!focused) return <>{children}</>;
  const glowColor = colors.primary;
  return (
    <View
      style={[
        styles.wrap,
        isDark
          ? {
              shadowColor: glowColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 8,
            }
          : {
              borderWidth: 2,
              borderColor: glowColor + '99',
            },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
  },
});

import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * Standardized press feedback (opacity) using motion tokens.
 * Use for buttons/cards that need consistent touch response.
 */
interface OrbMotionProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function OrbMotion({ children, onPress, style }: OrbMotionProps) {
  const { tokens } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        { opacity: pressed ? 0.82 : 1 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {},
});

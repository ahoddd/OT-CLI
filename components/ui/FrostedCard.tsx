/**
 * Reusable frosted glass card (iOS 26–style). BlurView + overlay + border.
 * Use for consistent glass morphism across OrbTap. Web: semi-transparent fallback.
 */

import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';

export interface FrostedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Border/accent color (e.g. tier color). Default: theme border. */
  borderColor?: string;
  /** Blur intensity. Default 50–65 by theme. */
  intensity?: number;
  /** Optional border radius override. */
  borderRadius?: number;
}

export function FrostedCard({
  children,
  style,
  borderColor,
  intensity,
  borderRadius = 16,
}: FrostedCardProps) {
  const { colors, isDark } = useTheme();
  const tint = isDark ? 'dark' : 'light';
  const blurIntensity = intensity ?? (isDark ? 55 : 62);
  const border = borderColor ?? colors.border;
  const overlay = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)';

  return (
    <View style={[styles.outer, { borderColor: border + '99', borderWidth: 1.5, borderRadius }, style]}>
      {Platform.OS !== 'web' ? (
        <BlurView intensity={blurIntensity} tint={tint} style={StyleSheet.absoluteFill} />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(40,40,45,0.88)' : 'rgba(255,255,255,0.85)',
              borderRadius,
            },
          ]}
        />
      )}
      <View style={[styles.overlay, { backgroundColor: overlay, borderRadius }]} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    minHeight: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    minHeight: 1,
  },
});

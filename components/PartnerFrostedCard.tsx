/**
 * Frosted glass tile/card for partner screens. Uses BlurView + overlay for a futuristic look.
 * Web fallback: semi-transparent background when BlurView is not available.
 */
import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../hooks/useTheme';

export interface PartnerFrostedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Border/accent color (e.g. tier color). */
  borderColor?: string;
  /** Slightly stronger glass on dark mode. */
  intensity?: number;
}

export function PartnerFrostedCard({
  children,
  style,
  borderColor,
  intensity,
}: PartnerFrostedCardProps) {
  const { colors, isDark } = useTheme();
  const tint = isDark ? 'dark' : 'light';
  const blurIntensity = intensity ?? (isDark ? 50 : 45);
  const border = borderColor ?? colors.border;
  const overlay = isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.35)';

  return (
    <View style={[styles.outer, { borderColor: border + '99', borderWidth: 1 }, style]}>
      {Platform.OS !== 'web' ? (
        <BlurView
          intensity={blurIntensity}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(40,40,45,0.85)' : 'rgba(255,255,255,0.82)',
              borderRadius: 16,
            },
          ]}
        />
      )}
      <View style={[styles.overlay, { backgroundColor: overlay }]} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  content: {
    minHeight: 1,
  },
});

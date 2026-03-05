import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface KitSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export function KitSkeleton({ width = '100%', height = 20, borderRadius = 8 }: KitSkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: typeof width === 'number' ? width : undefined,
          height,
          borderRadius,
          backgroundColor: colors.surfaceHighlight ?? colors.border,
        },
        width === '100%' && styles.fullWidth,
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {},
  fullWidth: { alignSelf: 'stretch' },
});

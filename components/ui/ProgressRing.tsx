/**
 * Progress ring / circular gauge — for stats and stamp progress.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS } from '../../constants/DesignTokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}

export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  color,
  backgroundColor,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.primary ?? '#60a5fa';
  const bg = backgroundColor ?? colors.border ?? 'rgba(128,128,128,0.3)';
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedProgress]);

  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={bg}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={r}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

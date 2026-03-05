/**
 * Signup "Create account" CTA — electric blue/magenta slowly shifting gradient
 * with subtle pulse and glow. Kept slow and subtle.
 */

import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const BLUE = '#38bdf8';
const BLUE_DARK = '#0ea5e9';
const MAGENTA = '#c084fc';
const MAGENTA_DARK = '#a855f7';

// Cycle through gradient stops over ~6s for a slow shift
const GRADIENT_SETS: [string, string, string][] = [
  [BLUE, BLUE_DARK, BLUE],
  [BLUE, MAGENTA_DARK, BLUE_DARK],
  [MAGENTA_DARK, MAGENTA, BLUE],
  [MAGENTA, MAGENTA_DARK, BLUE_DARK],
  [BLUE_DARK, BLUE, MAGENTA_DARK],
  [BLUE, BLUE_DARK, BLUE],
];

const CYCLE_MS = 6000;

interface SignupCTAButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
}

export function SignupCTAButton({
  onPress,
  label,
  disabled = false,
  loading = false,
}: SignupCTAButtonProps) {
  const [gradientIndex, setGradientIndex] = useState(0);
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.35);

  useEffect(() => {
    const t = setInterval(() => {
      setGradientIndex((i) => (i + 1) % GRADIENT_SETS.length);
    }, CYCLE_MS / GRADIENT_SETS.length);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.02, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    glow.value = withRepeat(
      withTiming(0.6, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedWrap = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    shadowOpacity: 0.25 + glow.value * 0.35,
  }));

  const colors = GRADIENT_SETS[gradientIndex] as [string, string, ...string[]];

  return (
    <Animated.View style={[styles.wrap, animatedWrap]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
        style={[styles.btn, disabled && styles.btnDisabled]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={styles.label}>{loading ? '…' : label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    shadowColor: MAGENTA,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    elevation: 8,
  },
  btn: {
    borderRadius: 14,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const, userSelect: 'none' as const } : {}),
  },
  btnDisabled: { opacity: 0.6 },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  label: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

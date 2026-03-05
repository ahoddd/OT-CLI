/**
 * Premium CTA button — electric blue gradient with shifting glow animation.
 * Use on landing, sign in, and get started pages.
 */

import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const ELECTRIC_BLUE = ['#38bdf8', '#0ea5e9', '#0284c7', '#0ea5e9'];
const GLOW_COLOR = '#38bdf8';

interface PremiumCTAButtonProps {
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'none';
}

export function PremiumCTAButton({
  onPress,
  label,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityRole = 'button',
}: PremiumCTAButtonProps) {
  const glowOpacity = useSharedValue(0.4);
  const shift = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(0.85, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    shift.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.35 + glowOpacity.value * 0.35,
  }));

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        style={[styles.secondaryBtn, style]}
      >
        <Text style={[styles.secondaryBtnText, textStyle]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[styles.primaryWrap, glowStyle]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
        style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled, style]}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole={accessibilityRole}
      >
        <LinearGradient
          colors={ELECTRIC_BLUE as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <Text style={[styles.primaryBtnText, textStyle]}>…</Text>
          ) : (
            <>
              {icon ? <Ionicons name={icon} size={20} color="#000" style={styles.iconLeft} /> : null}
              <Text style={[styles.primaryBtnText, textStyle]}>{label}</Text>
              {iconRight ? <Ionicons name={iconRight} size={18} color="#000" /> : null}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  primaryWrap: {
    borderRadius: 14,
    shadowColor: GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const, userSelect: 'none' as const } : {}),
  },
  primaryBtnDisabled: { opacity: 0.6 },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  iconLeft: { marginRight: 4 },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const, userSelect: 'none' as const } : {}),
  },
  secondaryBtnText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
});

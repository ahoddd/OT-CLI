/**
 * TierGlow — shared animated glow wrapper for tier-differentiated UI.
 *
 * - free / silver: no glow (clean, professional)
 * - premium / gold: subtle warm glow, 2s breathing cycle
 * - pro / platinum: vibrant glow, faster 1.4s pulse, higher intensity
 */
import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { getTierAccent, type AnyTier } from '../constants/TierAccent';

interface TierGlowProps {
  tier: AnyTier;
  children: React.ReactNode;
  style?: ViewStyle;
  /** Skip the glow even for paid tiers (e.g. when rendering a list of many items). */
  disabled?: boolean;
}

const GLOW_CONFIG: Record<string, { opacity: number; radius: number; duration: number } | null> = {
  free: null,
  silver: null,
  premium: { opacity: 0.25, radius: 12, duration: 2000 },
  gold: { opacity: 0.25, radius: 12, duration: 2000 },
  pro: { opacity: 0.4, radius: 18, duration: 1400 },
  platinum: { opacity: 0.4, radius: 18, duration: 1400 },
};

export function TierGlow({ tier, children, style, disabled }: TierGlowProps) {
  const config = disabled ? null : (GLOW_CONFIG[tier] ?? null);

  if (!config) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={style}>
      <GlowLayer color={getTierAccent(tier)} config={config} />
      {children}
    </View>
  );
}

function GlowLayer({ color, config }: { color: string; config: { opacity: number; radius: number; duration: number } }) {
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [config.duration]);

  const animStyle = useAnimatedStyle(() => {
    const o = config.opacity * 0.5 + config.opacity * 0.5 * pulse.value;
    const r = config.radius * 0.7 + config.radius * 0.3 * pulse.value;
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: o,
      shadowRadius: r,
      elevation: Math.round(r),
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 16 }, animStyle]} pointerEvents="none" />
  );
}

export default TierGlow;

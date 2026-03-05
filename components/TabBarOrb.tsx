import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, LinearGradient, Stop, Ellipse } from 'react-native-svg';

/** Hold duration to open Scan on Orb tab. Other tabs use SUBMENU_LONG_PRESS_MS = this minus 500ms. */
export const ORB_LONG_PRESS_MS = 1000;
export const SUBMENU_LONG_PRESS_MS = ORB_LONG_PRESS_MS - 500;

const LONG_PRESS_MS = ORB_LONG_PRESS_MS;

const ORB_SIZE = 64;
const ORB_R = ORB_SIZE / 2;

// Mystical pulse: blue → magenta → gold → blue (barely noticeable, 7s cycle)
const PULSE_COLORS = [
  COLORS.neonBlue[0],
  '#a855f7', // magenta/purple
  COLORS.gold[0],
  COLORS.neonBlue[0],
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const TabBarOrb = () => {
  const router = useRouter();
  const { isPartner } = useEffectiveTier();
  const orbRoute = isPartner ? '/(tabs)/partner-orb' : '/(tabs)/orb';
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scale = useSharedValue(1);
  const colorPhase = useSharedValue(0);
  const breathScale = useSharedValue(1);
  const breathOpacity = useSharedValue(0.35);
  const tapPulseScale = useSharedValue(0);
  const tapPulseOpacity = useSharedValue(0);

  useEffect(() => {
    colorPhase.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.linear }),
      -1,
      false
    );
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.28, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    breathOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1600 }),
        withTiming(0.18, { duration: 1600 })
      ),
      -1,
      true
    );
  }, []);

  const runTapPulse = () => {
    tapPulseScale.value = 0;
    tapPulseOpacity.value = 0.7;
    tapPulseScale.value = withTiming(2.2, { duration: 2000, easing: Easing.out(Easing.ease) });
    tapPulseOpacity.value = withTiming(0, { duration: 2000 });
  };

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      colorPhase.value,
      [0, 0.33, 0.66, 1],
      PULSE_COLORS
    );
    return {
      shadowColor: color,
      shadowOpacity: 0.5 + breathOpacity.value * 0.4,
      shadowRadius: 12 + breathScale.value * 3,
      shadowOffset: { width: 0, height: 2 },
    };
  });

  const animatedBreathStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      colorPhase.value,
      [0, 0.33, 0.66, 1],
      PULSE_COLORS
    );
    return {
      transform: [{ scale: breathScale.value }],
      opacity: breathOpacity.value,
      borderColor: color,
    };
  });

  const animatedTapPulseStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      colorPhase.value,
      [0, 0.33, 0.66, 1],
      PULSE_COLORS
    );
    return {
      transform: [{ scale: tapPulseScale.value }],
      opacity: tapPulseOpacity.value,
      borderColor: color,
      backgroundColor: color + '30',
    };
  });

  const animatedCoreProps = useAnimatedProps(() => {
    const fill = interpolateColor(
      colorPhase.value,
      [0, 0.33, 0.66, 1],
      PULSE_COLORS
    );
    return { fill };
  });

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePressIn = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.88, { damping: 15 });
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/(tabs)/scan' as any);
    }, LONG_PRESS_MS);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    clearLongPress();
  };

  useEffect(() => () => clearLongPress(), []);

  const handlePress = () => {
    clearLongPress();
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    runTapPulse();
    router.push(orbRoute as any);
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Home, hold for Scan"
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Animated.View style={[styles.tapPulseRing, animatedTapPulseStyle]} />
        <Animated.View style={[styles.breathRing, animatedBreathStyle]} />
        <Animated.View style={[styles.glow, animatedGlowStyle, animatedOrbStyle]}>
          <View style={styles.sphereWrap}>
            <Svg width={ORB_SIZE} height={ORB_SIZE} viewBox={`0 0 ${ORB_SIZE} ${ORB_SIZE}`}>
              <Defs>
                <RadialGradient
                  id="orbSphere"
                  cx="32%"
                  cy="32%"
                  r="68%"
                  fx="28%"
                  fy="28%"
                >
                  <Stop offset="0%" stopColor="rgba(255,255,255,0.42)" stopOpacity={1} />
                  <Stop offset="38%" stopColor="#243b55" stopOpacity={1} />
                  <Stop offset="75%" stopColor="#0f172a" stopOpacity={1} />
                  <Stop offset="100%" stopColor="#020617" stopOpacity={1} />
                </RadialGradient>
                <LinearGradient
                  id="orbHighlight"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <Stop offset="0%" stopColor="rgba(255,255,255,0.35)" stopOpacity={1} />
                  <Stop offset="50%" stopColor="rgba(255,255,255,0.08)" stopOpacity={1} />
                  <Stop offset="100%" stopColor="rgba(255,255,255,0)" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Circle
                cx={ORB_R}
                cy={ORB_R}
                r={ORB_R - 1}
                fill="url(#orbSphere)"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={1}
              />
              <Ellipse
                cx={ORB_R * 0.42}
                cy={ORB_R * 0.4}
                rx={ORB_R * 0.5}
                ry={ORB_R * 0.32}
                fill="url(#orbHighlight)"
              />
              <AnimatedCircle
                cx={ORB_R}
                cy={ORB_R}
                r={10}
                animatedProps={animatedCoreProps}
                opacity={0.95}
              />
            </Svg>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    top: -24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  pressable: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapPulseRing: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_R,
    borderWidth: 2,
  },
  breathRing: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_R,
    borderWidth: 1.5,
  },
  glow: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_R,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
    backgroundColor: '#0a0a12',
    overflow: 'hidden',
  },
  sphereWrap: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_R,
    overflow: 'hidden',
  },
});

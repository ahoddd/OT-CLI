/**
 * In-app brand moment after native splash hides.
 * Uses the OrbTap shield/gold logo (logo-orbtap.png). Designed for dopamine + priming:
 * - Logo scale-in (anticipation), then tagline (identity + action).
 * - Copy primes users to explore, visit places, and earn — driving foot traffic and engagement.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';

const LOGO_SOURCE = require('../assets/images/logo-orbtap.png');
const BRAND_BG = '#020617';
const DURATION_LOGO = 500;
const DURATION_TAGLINE = 400;
const DELAY_TAGLINE = 350;
const TOTAL_VISIBLE_MS = 1600;

export function BrandSplashScreen({ onDone }: { onDone: () => void }) {
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 280 });
    logoScale.value = withSequence(
      withTiming(1.08, { duration: DURATION_LOGO }),
      withTiming(1, { duration: 180 })
    );
    taglineOpacity.value = withDelay(
      DELAY_TAGLINE,
      withTiming(1, { duration: DURATION_TAGLINE })
    );
    const t = setTimeout(() => onDone(), TOTAL_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image source={LOGO_SOURCE} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <Animated.Text style={[styles.tagline, taglineStyle]} numberOfLines={1}>
        Your next win is nearby.
      </Animated.Text>
      <Text style={styles.sub}>Real visits · Real rewards</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    marginBottom: 28,
  },
  logo: {
    width: 120,
    height: 103,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
});

/**
 * Looping city strip for landing — feels like walking fast through a city.
 * Strategic OrbTap branding: Perks Marketplace, OrbTap Verified storefront, slogan.
 * Loops seamlessly every 10s (same street resets without the user noticing).
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';

const { width, height } = Dimensions.get('window');

const LOOP_DURATION_MS = 10000; // ~10s per loop, then seamless reset
const NEON = COLORS.neonBlue[0];
const VERIFIED = '#4ade80';

/** Single segment of the street — duplicated for seamless loop */
function CitySegment({ themeGold }: { themeGold: string }) {
  return (
    <View style={[segmentStyles.segment, { height }]}>
      {/* Sky — top 18% */}
      <LinearGradient
        colors={['#0f0f1a', '#1a1a2e', '#0d0d14']}
        style={segmentStyles.sky}
      />

      {/* Back row: distant building tops (depth) */}
      <View style={segmentStyles.backRow}>
        <View style={[segmentStyles.backBldg, { width: '18%', height: 42 }]} />
        <View style={[segmentStyles.backBldg, { width: '22%', height: 56 }]} />
        <View style={[segmentStyles.backBldg, { width: '15%', height: 38 }]} />
        <View style={[segmentStyles.backBldg, { width: '20%', height: 48 }]} />
        <View style={[segmentStyles.backBldg, { width: '16%', height: 44 }]} />
      </View>

      {/* Buildings row — middle ~60% */}
      <View style={segmentStyles.buildingsRow}>
        {/* Left: Perks Marketplace */}
        <View style={[segmentStyles.building, segmentStyles.buildingWide, { backgroundColor: '#15152a' }]}>
          <View style={segmentStyles.windows}>
            <View style={[segmentStyles.window, { backgroundColor: 'rgba(251, 191, 36, 0.25)' }]} />
            <View style={[segmentStyles.window, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]} />
            <View style={[segmentStyles.window, { backgroundColor: 'rgba(251, 191, 36, 0.2)' }]} />
          </View>
          <View style={segmentStyles.sign}>
            <Text style={[segmentStyles.signMain, { color: themeGold }]}>PERKS</Text>
            <Text style={segmentStyles.signSub}>MARKETPLACE</Text>
          </View>
        </View>

        {/* OrbTap Verified storefront */}
        <View style={[segmentStyles.building, { backgroundColor: '#0d1117', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)' }]}>
          <View style={segmentStyles.windows}>
            <View style={[segmentStyles.window, { backgroundColor: 'rgba(96, 165, 250, 0.2)' }]} />
            <View style={[segmentStyles.verifiedBadge, { backgroundColor: VERIFIED + '22', borderColor: VERIFIED }]}>
              <View style={segmentStyles.orbDot} />
              <Text style={segmentStyles.verifiedText}>OrbTap</Text>
              <Text style={segmentStyles.verifiedSub}>Verified</Text>
            </View>
            <View style={[segmentStyles.window, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]} />
          </View>
        </View>

        {/* Generic building with warm lights */}
        <View style={[segmentStyles.building, segmentStyles.buildingNarrow, { backgroundColor: '#12121f' }]}>
          <View style={segmentStyles.windows}>
            <View style={[segmentStyles.window, { backgroundColor: 'rgba(251, 191, 36, 0.18)' }]} />
            <View style={[segmentStyles.window, { backgroundColor: 'rgba(251, 191, 36, 0.12)' }]} />
          </View>
        </View>

        {/* Slogan marquee building */}
        <View style={[segmentStyles.building, segmentStyles.buildingWide, { backgroundColor: '#0a0a12' }]}>
          <View style={segmentStyles.marquee}>
            <Text style={segmentStyles.marqueeText}>Tap in. Earn real.</Text>
          </View>
          <View style={segmentStyles.windows}>
            <View style={[segmentStyles.window, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]} />
            <View style={[segmentStyles.window, { backgroundColor: 'rgba(96, 165, 250, 0.1)' }]} />
          </View>
        </View>
      </View>

      {/* Street / pavement — bottom 20% */}
      <LinearGradient
        colors={['#0a0a0f', '#111118', '#0d0d12']}
        style={segmentStyles.street}
      >
        <View style={segmentStyles.streetLine} />
      </LinearGradient>
    </View>
  );
}

const segmentStyles = StyleSheet.create({
  segment: { width },
  sky: { height: height * 0.18, width: '100%' },
  backRow: {
    position: 'absolute',
    top: height * 0.14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    height: 60,
  },
  backBldg: {
    backgroundColor: 'rgba(10, 10, 20, 0.9)',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  buildingsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: height * 0.62,
    gap: 6,
  },
  building: {
    flex: 1,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingTop: 8,
    paddingHorizontal: 4,
    minHeight: 120,
    justifyContent: 'flex-end',
  },
  buildingWide: { flex: 1.4 },
  buildingNarrow: { flex: 0.7 },
  windows: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
    justifyContent: 'center',
  },
  window: {
    width: 10,
    height: 12,
    borderRadius: 2,
  },
  sign: {
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 191, 36, 0.4)',
  },
  signMain: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  signSub: {
    color: 'rgba(251, 191, 36, 0.85)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  verifiedBadge: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 4,
  },
  orbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: VERIFIED,
    marginBottom: 2,
  },
  verifiedText: {
    color: VERIFIED,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verifiedSub: {
    color: 'rgba(74, 222, 128, 0.9)',
    fontSize: 6,
    fontWeight: '700',
  },
  marquee: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(96, 165, 250, 0.3)',
  },
  marqueeText: {
    color: NEON,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  street: {
    height: height * 0.2,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streetLine: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1,
  },
});

export function LandingCityStrip() {
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-height, { duration: LOOP_DURATION_MS, easing: Easing.linear }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.strip, animatedStyle]}>
        <CitySegment themeGold={themeGold} />
        <CitySegment themeGold={themeGold} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  strip: {
    width,
    flexDirection: 'column',
  },
});

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import type { PartnerTier } from '../constants/PartnerTiers';

const GOLD = '#FFB347';

export const OrbPin = ({
  tier,
  selected,
  isHotSpot = false,
}: {
  tier: PartnerTier;
  selected: boolean;
  isHotSpot?: boolean;
}) => {
  const color = PARTNER_TIER_COLORS[tier];
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isHotSpot) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isHotSpot, pulseAnim]);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 0.3, 0] });

  return (
    <View style={styles.wrapper}>
      {isHotSpot && (
        <Animated.View
          style={[
            styles.hotRing,
            {
              borderColor: GOLD,
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
      )}
      {isHotSpot && (
        <View style={[styles.hotRingStatic, { borderColor: GOLD }]} />
      )}
      <View style={[styles.outer, selected && styles.selectedOuter, { borderColor: isHotSpot ? GOLD : color }]}>
        <View style={[styles.inner, { backgroundColor: isHotSpot ? GOLD : color, shadowColor: isHotSpot ? GOLD : color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
  },
  inner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  hotRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
  },
  hotRingStatic: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    opacity: 0.6,
  },
});

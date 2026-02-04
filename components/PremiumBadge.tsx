/**
 * Premium verified badge — status symbol next to username/partner name.
 * Small, appealing, professional; signals Premium membership.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/Colors';

const GOLD = [COLORS.gold[0], COLORS.gold[1]] as const;

export interface PremiumBadgeProps {
  /** Compact: icon only. Standard: icon + "Premium" */
  variant?: 'compact' | 'standard';
  size?: number;
}

export function PremiumBadge({ variant = 'compact', size = 16 }: PremiumBadgeProps) {
  const iconSize = Math.max(12, size - 2);
  return (
    <View style={[styles.wrap, { height: size }]}>
      <LinearGradient
        colors={[GOLD[0], GOLD[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <View style={styles.inner}>
          <Ionicons name="diamond" size={iconSize} color="#fff" />
        </View>
      </LinearGradient>
      {variant === 'standard' && (
        <Text style={[styles.label, { fontSize: size * 0.7 }]}>Premium</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: COLORS.gold[0],
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

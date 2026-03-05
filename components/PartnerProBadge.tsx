/**
 * Pro badge for Platinum (pro) partners — standout pill with gradient and optional icon.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PLATINUM_GRADIENT } from '../constants/PartnerTiers';

interface PartnerProBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const SIZES = {
  small: { height: 22, paddingH: 8, fontSize: 10, icon: 10 },
  medium: { height: 26, paddingH: 10, fontSize: 12, icon: 12 },
  large: { height: 30, paddingH: 12, fontSize: 14, icon: 14 },
};

export function PartnerProBadge({ size = 'medium', showIcon = true }: PartnerProBadgeProps) {
  const s = SIZES[size];
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[PLATINUM_GRADIENT.outer, PLATINUM_GRADIENT.inner]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.pill,
          {
            height: s.height,
            paddingHorizontal: s.paddingH,
            borderRadius: s.height / 2,
          },
        ]}
      >
        {showIcon && (
          <Ionicons name="diamond" size={s.icon} color="#fff" style={styles.icon} />
        )}
        <Text style={[styles.text, { fontSize: s.fontSize }]}>PRO</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { marginRight: 4 },
  text: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});

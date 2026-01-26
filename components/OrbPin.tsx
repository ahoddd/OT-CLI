import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tier, TIER_COLORS } from '../constants/MockData';

export const OrbPin = ({ tier, selected }: { tier: Tier; selected: boolean }) => {
  const color = TIER_COLORS[tier];
  return (
    <View style={[styles.outer, selected && styles.selectedOuter, { borderColor: color }]}>
      <View style={[styles.inner, { backgroundColor: color, shadowColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
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
});

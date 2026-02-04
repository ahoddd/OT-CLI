import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { TIER_COLORS, Tier } from '../constants/MockData';
import { useTheme } from '../hooks/useTheme';

const TIER_LABELS: Record<Tier, string> = {
  common: 'Common',
  rare: 'Rare',
  apex: 'Apex',
  legendary: 'Legendary',
};

export function TierLegend() {
  const [expanded, setExpanded] = useState(false);
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
        <TouchableOpacity
          style={styles.trigger}
          onPress={() => setExpanded((e) => !e)}
          activeOpacity={0.8}
        >
          <View style={styles.dotsRow}>
            {(Object.keys(TIER_COLORS) as Tier[]).map((tier) => (
              <View
                key={tier}
                style={[styles.dot, { backgroundColor: TIER_COLORS[tier] }]}
              />
            ))}
          </View>
          <Text style={[styles.triggerLabel, { color: colors.textSecondary }]}>
            Tiers
          </Text>
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-up'}
            size={14}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {expanded && (
          <View style={[styles.list, { borderTopColor: colors.border }]}>
            {(Object.keys(TIER_COLORS) as Tier[]).map((tier) => (
              <View key={tier} style={styles.row}>
                <View style={[styles.legendDot, { backgroundColor: TIER_COLORS[tier] }]} />
                <Text style={[styles.legendLabel, { color: colors.text }]}>
                  {TIER_LABELS[tier]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 10,
  },
  blur: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  triggerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  list: {
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});

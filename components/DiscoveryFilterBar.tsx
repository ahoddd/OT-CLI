/**
 * DiscoveryFilterBar — horizontal scrollable filter chips for the Discovery Hub.
 * Filters: All · Open Now · 🔥 Deals · Gold+ · Following · Near Me
 * Shared across Map and Grid views. Drives filtered partner list.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { safeHaptics } from '../utils/safeHaptics';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import { COLORS } from '../constants/Colors';

export type FilterId = 'all' | 'open_now' | 'deals' | 'gold_plus' | 'following' | 'near_me';

interface FilterChip {
  id: FilterId;
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  emoji?: string;
}

const FILTERS: FilterChip[] = [
  { id: 'all',       label: 'All',       icon: 'apps-outline' },
  { id: 'open_now',  label: 'Open Now',  icon: 'time-outline' },
  { id: 'deals',     label: 'Deals',     emoji: '🔥' },
  { id: 'gold_plus', label: 'Gold+',     icon: 'star-outline' },
  { id: 'following', label: 'Following', icon: 'heart-outline' },
  { id: 'near_me',   label: 'Near Me',   icon: 'navigate-outline' },
];

interface DiscoveryFilterBarProps {
  activeFilters: FilterId[];
  onToggle: (id: FilterId) => void;
  partnerCount: number;
}

export function DiscoveryFilterBar({
  activeFilters,
  onToggle,
  partnerCount,
}: DiscoveryFilterBarProps) {
  const { colors, isDark } = useTheme();

  const isActive = (id: FilterId) =>
    id === 'all' ? activeFilters.length === 0 : activeFilters.includes(id);

  const handlePress = (id: FilterId) => {
    safeHaptics.selectionAsync();
    onToggle(id);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingHorizontal: SPACE.base }]}
        style={styles.scroll}
      >
        {FILTERS.map((chip) => {
          const active = isActive(chip.id);
          return (
            <TouchableOpacity
              key={chip.id}
              onPress={() => handlePress(chip.id)}
              activeOpacity={0.75}
              style={[
                styles.chip,
                {
                  backgroundColor: active
                    ? COLORS.neonBlue[0]
                    : isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.05)',
                  borderColor: active
                    ? COLORS.neonBlue[0]
                    : isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.1)',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={chip.label}
              accessibilityState={{ selected: active }}
            >
              {chip.emoji ? (
                <Text style={styles.chipEmoji}>{chip.emoji}</Text>
              ) : chip.icon ? (
                <Ionicons
                  name={chip.icon}
                  size={13}
                  color={active ? '#fff' : colors.textSecondary}
                />
              ) : null}
              <Text
                style={[
                  styles.chipLabel,
                  {
                    color: active ? '#fff' : colors.textSecondary,
                    fontWeight: active ? '700' : '500',
                  },
                ]}
              >
                {chip.id === 'all'
                  ? `All${partnerCount > 0 ? ` (${partnerCount})` : ''}`
                  : chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // No margin — parent (index.tsx) controls spacing
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    flexDirection: 'row',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipEmoji: {
    fontSize: 13,
    lineHeight: 16,
  },
  chipLabel: {
    fontSize: 13,
    lineHeight: 16,
  },
});

export default DiscoveryFilterBar;

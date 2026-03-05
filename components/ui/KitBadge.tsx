import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { MEMBERSHIP_TIER_COLORS } from '../../constants/Theme';

type BadgeKind = 'verified' | 'sponsored' | 'silver' | 'gold' | 'platinum';

interface KitBadgeProps {
  kind: BadgeKind;
  label?: string;
}

export const KitBadge = memo(function KitBadge({ kind, label }: KitBadgeProps) {
  const { colors, tokens, isDark } = useTheme();
  const resolvedLabel =
    label ??
    (kind === 'verified' ? 'Verified' : kind === 'sponsored' ? 'Sponsored' : kind === 'silver' ? 'Silver' : kind === 'gold' ? 'Gold' : 'Platinum');

  const tierColors = kind === 'silver' ? MEMBERSHIP_TIER_COLORS.silver : kind === 'gold' ? MEMBERSHIP_TIER_COLORS.gold : kind === 'platinum' ? MEMBERSHIP_TIER_COLORS.platinum : null;
  const bg = tierColors ? (isDark ? tierColors.dark + '40' : tierColors.light + '60') : kind === 'verified' ? (colors.success ?? colors.primary) + '25' : (colors.primary + '25');
  const textColor = tierColors ? (isDark ? tierColors.light : tierColors.dark) : kind === 'verified' ? (colors.success ?? colors.primary) : colors.primary;

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.xxs, borderRadius: tokens.radius.xs }]}>
      <Text style={[styles.text, { color: textColor }]}>{resolvedLabel}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700' },
});

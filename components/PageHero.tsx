/**
 * Hero section for feature pages (Opportunities, Work Orders).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SPACE, RADIUS } from '../constants/DesignTokens';

export interface PageHeroProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  trustLine?: string;
}

export function PageHero({ icon, iconColor, title, description, trustLine }: PageHeroProps) {
  const { colors, typography } = useTheme();
  return (
    <View style={[styles.wrap, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={32} color={iconColor} />
      </View>
      <Text style={[typography.subheading, { color: colors.text, fontWeight: '800', marginBottom: SPACE.sm }]}>{title}</Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: SPACE.sm }]}>{description}</Text>
      {trustLine && (
        <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>{trustLine}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: SPACE.xl,
    paddingHorizontal: SPACE.xs,
    marginBottom: SPACE.lg,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.md,
  },
});

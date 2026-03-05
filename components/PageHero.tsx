/**
 * Hero section for feature pages (Opportunities, Work Orders).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export interface PageHeroProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  trustLine?: string;
}

export function PageHero({ icon, iconColor, title, description, trustLine }: PageHeroProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={32} color={iconColor} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      {trustLine && (
        <Text style={[styles.trustLine, { color: colors.textSecondary }]}>{trustLine}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 24,
    paddingHorizontal: 4,
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  trustLine: {
    fontSize: 12,
    fontWeight: '600',
  },
});

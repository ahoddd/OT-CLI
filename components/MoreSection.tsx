/**
 * Uniform "More" section used across the app — related pages/CTAs for the current screen.
 * Same look everywhere: label + list of rows (icon, label, chevron) or horizontal pills.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export interface MoreLink {
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface MoreSectionProps {
  /** Section title (e.g. "More") */
  title?: string;
  /** Links to show — most related to the current page first */
  links: MoreLink[];
  /** 'rows' = full-width rows with chevron; 'pills' = horizontal wrap of pills */
  variant?: 'rows' | 'pills';
}

export function MoreSection({ title = 'More', links, variant = 'rows' }: MoreSectionProps) {
  const { colors } = useTheme();
  const router = useRouter();

  if (links.length === 0) return null;

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{title}</Text>
      {variant === 'pills' ? (
        <View style={styles.pillsRow}>
          {links.map((link) => (
            <TouchableOpacity
              key={link.route}
              style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(link.route as any)}
              activeOpacity={0.8}
            >
              <Ionicons name={link.icon} size={18} color={colors.text} />
              <Text style={[styles.pillText, { color: colors.text }]} numberOfLines={1}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.rowsWrap}>
          {links.map((link) => (
            <TouchableOpacity
              key={link.route}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(link.route as any)}
              activeOpacity={0.8}
            >
              <Ionicons name={link.icon} size={20} color={colors.text} />
              <Text style={[styles.rowText, { color: colors.text }]} numberOfLines={1}>{link.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  rowsWrap: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  rowText: { flex: 1, fontSize: 16, fontWeight: '600' },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  pillText: { fontSize: 14, fontWeight: '600', maxWidth: 120 },
});

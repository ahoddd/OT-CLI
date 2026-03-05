import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface KitStatPillProps {
  value: string | number;
  label: string;
}

export function KitStatPill({ value, label }: KitStatPillProps) {
  const { colors, tokens } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: colors.surfaceHighlight, paddingVertical: tokens.spacing.sm, paddingHorizontal: tokens.spacing.base, borderRadius: tokens.radius.md }]}>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignItems: 'center', minWidth: 64 },
  value: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 12, marginTop: 2 },
});

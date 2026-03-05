import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface KitTopBarProps {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export function KitTopBar({ title, left, right }: KitTopBarProps) {
  const { colors, tokens } = useTheme();
  return (
    <View style={[styles.bar, { borderBottomColor: colors.border, paddingHorizontal: tokens.spacing.base }]}>
      {left ?? <View style={styles.slot} />}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      {right ?? <View style={styles.slot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    borderBottomWidth: 1,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  slot: { width: 40 },
});

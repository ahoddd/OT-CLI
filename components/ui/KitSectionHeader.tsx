import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface KitSectionHeaderProps {
  label: string;
  /** Optional right-side content (e.g. "See all →" link). */
  right?: React.ReactNode;
  /** Override label color (defaults to colors.textSecondary). */
  color?: string;
  /** Horizontal padding applied to wrapper. Defaults to 0 (rely on parent). */
  paddingHorizontal?: number;
  /** Top margin. Defaults to tokens.spacing.md. */
  marginTop?: number;
}

export const KitSectionHeader = memo(function KitSectionHeader({
  label,
  right,
  color,
  paddingHorizontal = 0,
  marginTop,
}: KitSectionHeaderProps) {
  const { colors, tokens } = useTheme();
  const labelColor = color ?? colors.textSecondary;
  const mt = marginTop ?? tokens.spacing.md;

  if (right != null) {
    return (
      <View
        style={[
          styles.row,
          {
            paddingHorizontal,
            marginBottom: tokens.spacing.sm,
            marginTop: mt,
          },
        ]}
      >
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {right}
      </View>
    );
  }

  return (
    <Text
      style={[
        styles.label,
        {
          color: labelColor,
          paddingHorizontal,
          marginBottom: tokens.spacing.sm,
          marginTop: mt,
        },
      ]}
    >
      {label}
    </Text>
  );
});

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

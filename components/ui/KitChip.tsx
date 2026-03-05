import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface KitChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export const KitChip = memo(function KitChip({ label, selected = false, onPress }: KitChipProps) {
  const { colors, tokens } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? (colors.primary + '25') : colors.surfaceHighlight,
          borderColor: selected ? colors.primary : colors.border,
          paddingVertical: tokens.spacing.xs,
          paddingHorizontal: tokens.spacing.md,
          borderRadius: tokens.radius.full,
        },
      ]}
    >
      <Text style={[styles.label, { color: selected ? colors.primary : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});

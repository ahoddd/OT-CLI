import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface KitSearchBarProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}

export function KitSearchBar({ value, onChangeText, placeholder }: KitSearchBarProps) {
  const { colors, tokens } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceHighlight, borderRadius: tokens.radius.base, paddingHorizontal: tokens.spacing.md, borderWidth: 1, borderColor: colors.border }]}>
      <Ionicons name="search" size={20} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Search'}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
});

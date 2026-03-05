import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { TAP_TARGET_MIN } from '../../constants/DesignTokens';

interface KitListRowProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
}

export const KitListRow = memo(function KitListRow({ title, subtitle, left, right, onPress }: KitListRowProps) {
  const { colors, tokens } = useTheme();
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.row,
        {
          paddingVertical: tokens.spacing.md,
          paddingHorizontal: tokens.spacing.base,
          borderBottomColor: colors.border,
          minHeight: TAP_TARGET_MIN,
        },
      ]}
    >
      {left != null && <View style={styles.left}>{left}</View>}
      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        {subtitle != null && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
        )}
      </View>
      {right != null && <View style={styles.right}>{right}</View>}
    </Wrapper>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 12,
  },
  left: {},
  center: { flex: 1 },
  right: {},
  title: { fontSize: 16, fontWeight: '500' },
  subtitle: { fontSize: 14, marginTop: 2 },
});

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/** Premium divider for lists/sections (token-based). */
export const OrbDivider = memo(function OrbDivider() {
  const { colors, tokens } = useTheme();
  return (
    <View
      style={[
        styles.divider,
        {
          height: 1,
          backgroundColor: colors.cardBorder ?? colors.border,
          marginVertical: tokens.spacing.sm,
        },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});

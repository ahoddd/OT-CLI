import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type CardVariant = 'nightglass' | 'lightglass' | 'solid';

interface KitCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
}

export const KitCard = memo(function KitCard({ children, variant = 'solid', style }: KitCardProps) {
  const { materials, tokens } = useTheme();
  const material = variant === 'nightglass' ? materials.nightglass : variant === 'lightglass' ? materials.lightglass : materials.solid;
  return (
    <View style={[styles.card, material, { padding: tokens.spacing.base }, style]}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});

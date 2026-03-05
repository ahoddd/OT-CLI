import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type BannerVariant = 'info' | 'success' | 'warn' | 'error';

interface KitBannerProps {
  message: string;
  variant?: BannerVariant;
}

export function KitBanner({ message, variant = 'info' }: KitBannerProps) {
  const { colors, tokens } = useTheme();
  const bg =
    variant === 'error' ? (colors.error ?? colors.primary) + '20' :
    variant === 'warn' ? (colors.warn ?? colors.primary) + '20' :
    variant === 'success' ? (colors.success ?? colors.primary) + '20' :
    (colors.info ?? colors.primary) + '15';
  const textColor = variant === 'error' ? (colors.error ?? colors.text) : variant === 'warn' ? (colors.warn ?? colors.text) : colors.text;
  return (
    <View style={[styles.banner, { backgroundColor: bg, padding: tokens.spacing.md, borderRadius: tokens.radius.md }]}>
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {},
  text: { fontSize: 14, fontWeight: '500' },
});

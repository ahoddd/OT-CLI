import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { TAP_TARGET_MIN } from '../../constants/DesignTokens';

interface KitEmptyStateProps {
  title: string;
  subtitle?: string;
  /** Ionicons icon name shown above title. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Primary CTA button below subtitle. */
  cta?: { label: string; onPress: () => void };
  /** Secondary text link below CTA. */
  secondaryLink?: { label: string; onPress: () => void };
  /** 'sm' for compact inline empty state, 'md' (default) for full-section. */
  size?: 'sm' | 'md';
}

export function KitEmptyState({ title, subtitle, icon, cta, secondaryLink, size = 'md' }: KitEmptyStateProps) {
  const { colors, tokens } = useTheme();
  const isCompact = size === 'sm';
  return (
    <View
      style={[
        styles.wrap,
        {
          paddingVertical: isCompact ? tokens.spacing.xl : tokens.spacing.xxxl,
          paddingHorizontal: tokens.spacing.base,
        },
      ]}
    >
      {icon != null && (
        <Ionicons
          name={icon}
          size={isCompact ? 32 : 44}
          color={colors.textMuted ?? colors.textSecondary}
          style={{ marginBottom: tokens.spacing.md }}
        />
      )}
      <Text
        style={[
          styles.title,
          {
            color: colors.textSecondary,
            fontSize: isCompact ? 14 : 16,
            marginBottom: subtitle != null ? tokens.spacing.xs : 0,
          },
        ]}
      >
        {title}
      </Text>
      {subtitle != null && (
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textMuted ?? colors.textSecondary,
              marginTop: tokens.spacing.xs,
              fontSize: isCompact ? 12 : 14,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
      {cta != null && (
        <TouchableOpacity
          onPress={cta.onPress}
          activeOpacity={0.8}
          style={[
            styles.cta,
            {
              backgroundColor: colors.primary,
              borderRadius: tokens.radius.base,
              minHeight: TAP_TARGET_MIN,
              marginTop: tokens.spacing.lg,
              paddingHorizontal: tokens.spacing.xl,
            },
          ]}
        >
          <Text style={[styles.ctaText, { color: '#fff' }]}>{cta.label}</Text>
        </TouchableOpacity>
      )}
      {secondaryLink != null && (
        <TouchableOpacity onPress={secondaryLink.onPress} style={{ marginTop: tokens.spacing.md }} hitSlop={12}>
          <Text style={[styles.link, { color: colors.primary }]}>{secondaryLink.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '600', textAlign: 'center' },
  subtitle: { textAlign: 'center', lineHeight: 20 },
  cta: { alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15, fontWeight: '700' },
  link: { fontSize: 14, fontWeight: '500' },
});

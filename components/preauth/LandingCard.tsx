/**
 * Pre-auth landing card — glass surface, single accent (blue). Used for feature rows on landing.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PREAUTH } from '../../constants/PreAuthTheme';

interface LandingCardProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
}

export function LandingCard({ title, subtitle, icon, onPress, style }: LandingCardProps) {
  const content = (
    <View style={styles.inner}>
      {icon != null && (
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={22} color={PREAUTH.primary} />
        </View>
      )}
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle != null && (
          <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={PREAUTH.textMuted} />
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.card, style]}
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PREAUTH.surface,
    borderRadius: PREAUTH.radius,
    borderWidth: 1,
    borderColor: PREAUTH.surfaceBorder,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: PREAUTH.paddingCard,
    minHeight: 72,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: PREAUTH.radiusButton,
    backgroundColor: PREAUTH.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '700', color: PREAUTH.text, marginBottom: 2 },
  subtitle: { fontSize: 13, fontWeight: '500', color: PREAUTH.textSecondary },
});

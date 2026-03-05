import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export type KitFeatureCardGradient = 'primary' | 'secondary';

const GRADIENT_PRIMARY = ['#A7FF83', '#FFE038'] as const;
const GRADIENT_SECONDARY = ['#FF7B9C', '#FFD166'] as const;

interface KitFeatureCardProps {
  title: string;
  subtitle?: string;
  gradient?: KitFeatureCardGradient;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
}

export const KitFeatureCard = memo(function KitFeatureCard({
  title,
  subtitle,
  gradient = 'primary',
  icon,
  onPress,
  style,
}: KitFeatureCardProps) {
  const { tokens } = useTheme();
  const gradientColors = gradient === 'primary' ? GRADIENT_PRIMARY : GRADIENT_SECONDARY;
  const content = (
    <LinearGradient
      colors={gradientColors as unknown as [string, string]}
      style={[styles.gradient, { borderRadius: tokens.radius.base }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.inner}>
        {icon != null && (
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={28} color="rgba(0,0,0,0.7)" />
          </View>
        )}
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle != null && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <Ionicons name="arrow-up" size={18} color="rgba(0,0,0,0.5)" style={styles.chevron} />
      </View>
    </LinearGradient>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={style}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={style}>{content}</View>;
});

const styles = StyleSheet.create({
  gradient: {
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 88,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 2, color: 'rgba(0,0,0,0.85)' },
  subtitle: { fontSize: 13, fontWeight: '500', color: 'rgba(0,0,0,0.65)' },
  chevron: { marginLeft: 8 },
});

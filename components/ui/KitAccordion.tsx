/**
 * Reusable accordion — animated expand/collapse for sections.
 * Use in wallet, settings, partner-settings for a neater, scannable layout.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { SPACE, RADIUS } from '../../constants/DesignTokens';

const BODY_MAX_HEIGHT = 2000;

export interface KitAccordionProps {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  /** Optional id for persistence (e.g. AsyncStorage key). */
  accordionId?: string;
}

export function KitAccordion({
  title,
  subtitle,
  expanded,
  onToggle,
  children,
  rightAction,
  style,
}: KitAccordionProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, { duration: 250 });
  }, [expanded, progress]);

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    maxHeight: progress.value * BODY_MAX_HEIGHT,
    overflow: 'hidden' as const,
  }));

  return (
    <View style={[styles.wrap, style, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.header, { borderBottomColor: expanded ? colors.border : 'transparent' }]}
        onPress={onToggle}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          {rightAction}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
      <Animated.View style={bodyStyle}>
        <View style={styles.body}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.base,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE.lg,
    paddingHorizontal: SPACE.base,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    marginLeft: SPACE.sm,
  },
  body: {
    paddingHorizontal: SPACE.base,
    paddingTop: 4,
    paddingBottom: SPACE.base,
  },
});

/**
 * DiscoveryToggle — animated 3-way pill selector for the Discovery Hub.
 * Views: Map | Grid | Swipe
 * Sliding neon-blue indicator animates between segments on selection.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../context/I18nContext';
import { safeHaptics } from '../utils/safeHaptics';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import { COLORS } from '../constants/Colors';

export type DiscoveryView = 'map' | 'grid' | 'swipe';

const SEGMENT_KEYS: { id: DiscoveryView; labelKey: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'map',   labelKey: 'home.map',   icon: 'map-outline' },
  { id: 'grid',  labelKey: 'home.grid',  icon: 'grid-outline' },
  { id: 'swipe', labelKey: 'home.swipe', icon: 'swap-horizontal-outline' },
];

const VIEW_INDEX: Record<DiscoveryView, number> = { map: 0, grid: 1, swipe: 2 };
const TOGGLE_H = 44;
const INDICATOR_INSET = 3;

interface DiscoveryToggleProps {
  activeView: DiscoveryView;
  onChange: (view: DiscoveryView) => void;
}

export function DiscoveryToggle({ activeView, onChange }: DiscoveryToggleProps) {
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const segments = useMemo(
    () => SEGMENT_KEYS.map((s) => ({ ...s, label: t(s.labelKey) })),
    [t],
  );

  // Container spans full screen minus horizontal padding
  const containerWidth = screenWidth - SPACE.base * 2;
  const segmentWidth = containerWidth / segments.length;
  const indicatorWidth = segmentWidth - INDICATOR_INSET * 2;

  const indicatorAnim = useRef(new Animated.Value(VIEW_INDEX[activeView])).current;

  useEffect(() => {
    const idx = VIEW_INDEX[activeView];
    Animated.spring(indicatorAnim, {
      toValue: idx,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    }).start();
  }, [activeView]);

  const translateX = indicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      INDICATOR_INSET,
      segmentWidth + INDICATOR_INSET,
      segmentWidth * 2 + INDICATOR_INSET,
    ],
  });

  const bgColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={[styles.container, { marginHorizontal: SPACE.base }]}>
      <View
        style={[
          styles.track,
          {
            height: TOGGLE_H,
            backgroundColor: bgColor,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          },
        ]}
      >
        {/* Sliding indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: indicatorWidth,
              height: TOGGLE_H - INDICATOR_INSET * 2,
              transform: [{ translateX }],
            },
          ]}
        />

        {/* Segments */}
        {segments.map((seg) => {
          const isActive = activeView === seg.id;
          return (
            <TouchableOpacity
              key={seg.id}
              style={[styles.segment, { width: segmentWidth }]}
              onPress={() => {
                if (seg.id === activeView) return;
                safeHaptics.selectionAsync();
                onChange(seg.id);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${seg.label} view`}
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={seg.icon}
                size={16}
                color={isActive ? '#fff' : colors.textSecondary}
                style={styles.segIcon}
              />
              <Text
                style={[
                  styles.segLabel,
                  {
                    color: isActive ? '#fff' : colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {seg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginHorizontal set inline
  },
  track: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: INDICATOR_INSET,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.neonBlue[0],
    shadowColor: COLORS.neonBlue[0],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
    // Slight gradient effect via opacity
    opacity: 0.92,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: TOGGLE_H,
    gap: SPACE.xs,
    zIndex: 1,
  },
  segIcon: {
    // gap handles spacing
  },
  segLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
});

export default DiscoveryToggle;

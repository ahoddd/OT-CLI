/**
 * LiveActivityPill — shows real-time deal/proof activity.
 * Two modes:
 *   inline={false} (default): floating BlurView pill above the map tray (legacy/floating)
 *   inline={true}: full-width horizontal bar rendered above the map content area (no overlap)
 * Auto-hides when there's nothing live to show.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { safeHaptics } from '../utils/safeHaptics';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import type { Drop } from '../constants/Drops';

/** Must match MapNearbyTray's bottom offset. */
const TAB_BAR_SAFE = 56;
const TRAY_HEIGHT = 78;

interface LiveActivityPillProps {
  drops: Drop[];
  pulseCount?: number;
  /** When true, renders as a full-width inline bar (no absolute positioning, no map overlap). */
  inline?: boolean;
}

export function LiveActivityPill({ drops, pulseCount = 0, inline = false }: LiveActivityPillProps) {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const now = Date.now();
  const liveDrops = drops.filter((d) => d.qtyRemaining > 0 && d.endAt > now);
  const liveCount = liveDrops.length;

  // Pulse animation for the green dot
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Build label
  let label = '';
  let dotColor = '#4ade80';

  if (liveCount > 0) {
    label = `${liveCount} live deal${liveCount !== 1 ? 's' : ''}`;
    dotColor = '#4ade80';
  } else if (pulseCount > 0) {
    label = `${pulseCount} proof${pulseCount !== 1 ? 's' : ''} today`;
    dotColor = '#60a5fa';
  }

  if (!label) return null;

  const handlePress = () => {
    safeHaptics.selectionAsync();
    router.push('/pulse');
  };

  // ─── Inline bar mode ───────────────────────────────────────────────────────
  if (inline) {
    return (
      <TouchableOpacity
        style={[styles.inlineBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Animated.View style={[styles.dot, { backgroundColor: dotColor, opacity: pulseAnim }]} />
        <Text style={[styles.inlineLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.inlineArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    );
  }

  // ─── Floating pill mode (default) ─────────────────────────────────────────
  const pillBottom = TAB_BAR_SAFE + TRAY_HEIGHT + Math.max(insets.bottom, 0) + SPACE.sm;

  const pillContent = (
    <TouchableOpacity
      style={styles.pill}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: dotColor, opacity: pulseAnim },
        ]}
      />
      <Text style={[styles.label, { color: isDark ? '#fff' : '#0f172a' }]}>{label}</Text>
      <Text style={[styles.arrow, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.5)' }]}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { bottom: pillBottom, left: 12 }]} pointerEvents="box-none">
      {Platform.OS !== 'web' ? (
        <BlurView
          intensity={isDark ? 70 : 75}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blur}
        >
          {pillContent}
        </BlurView>
      ) : (
        <View
          style={[
            styles.blur,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)' },
          ]}
        >
          {pillContent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Floating pill (default) ────────────────────────────────────────────────
  container: {
    position: 'absolute',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  blur: {
    borderRadius: RADIUS.full,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    paddingVertical: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  arrow: {
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Inline bar ─────────────────────────────────────────────────────────────
  inlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    height: 36,
    borderBottomWidth: 1,
    paddingHorizontal: SPACE.base,
  },
  inlineLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
    flex: 1,
    textAlign: 'center',
  },
  inlineArrow: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LiveActivityPill;

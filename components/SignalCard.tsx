import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import type { OrbSignalMarket } from '../constants/OrbSignal';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';

const YES_COLOR = '#22c55e';  // green
const NO_COLOR = '#f87171';   // red

interface SignalCardProps {
  market: OrbSignalMarket;
  onPress: () => void;
}

export const SignalCard = ({ market, onPress }: SignalCardProps) => {
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];

  // Animate probability bars
  const yesWidth = useSharedValue(0);
  const noWidth = useSharedValue(0);

  // Pulsing live dot
  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    yesWidth.value = withTiming(market.percentages[0], { duration: 800, easing: Easing.out(Easing.cubic) });
    noWidth.value = withTiming(market.percentages[1], { duration: 800, easing: Easing.out(Easing.cubic) });
    dotOpacity.value = withRepeat(withTiming(0.2, { duration: 600 }), -1, true);
  }, [market.percentages]);

  const yesStyle = useAnimatedStyle(() => ({
    width: `${yesWidth.value}%` as any,
    height: '100%',
    backgroundColor: YES_COLOR,
  }));

  const noStyle = useAnimatedStyle(() => ({
    width: `${noWidth.value}%` as any,
    height: '100%',
    backgroundColor: NO_COLOR,
  }));

  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  const poolReward = Math.round(market.pool * 0.7 / Math.max(1, 10)); // Estimated reward per correct predictor

  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const glassOverlay = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, { borderColor, shadowColor: isDark ? '#000' : '#aaa' }]}
    >
      {/* Glassmorphism background */}
      {Platform.OS !== 'web' ? (
        <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.85)', borderRadius: 16 }]} />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: glassOverlay, borderRadius: 16 }]} pointerEvents="none" />

      {/* Pool reward badge — top right */}
      <View style={styles.poolBadge}>
        <Text style={[styles.poolText, { color: themeGold }]}>+{poolReward} OT if correct</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.categoryRow}>
          <Animated.View style={[styles.liveDot, dotStyle]} />
          <Text style={[styles.category, { color: colors.textSecondary }]}>{market.category.toUpperCase()}</Text>
        </View>
        <Text style={[styles.pool, { color: themeGold }]}>{market.pool.toLocaleString()} PT POOL</Text>
      </View>

      {/* Question */}
      <Text style={[styles.question, { color: colors.text }]}>{market.question}</Text>

      {/* Animated probability bars */}
      <View style={styles.barContainer}>
        <Animated.View style={yesStyle} />
        <Animated.View style={noStyle} />
      </View>

      {/* Labels */}
      <View style={styles.labels}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: YES_COLOR }]} />
          <Text style={[styles.outcome, { color: colors.text }]}>{market.outcomes[0]}</Text>
          <Text style={[styles.pct, { color: YES_COLOR }]}>{market.percentages[0]}%</Text>
        </View>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: NO_COLOR }]} />
          <Text style={[styles.outcome, { color: colors.text }]}>{market.outcomes[1]}</Text>
          <Text style={[styles.pct, { color: NO_COLOR }]}>{market.percentages[1]}%</Text>
        </View>
      </View>

      {/* Footer: countdown */}
      <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
        <Text style={[styles.timer, { color: colors.textSecondary }]}>Closes: {market.endsAt}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Ionicons inline import workaround
import { Ionicons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  poolBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  poolText: { fontSize: 11, fontWeight: '700' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingRight: 110 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: YES_COLOR,
  },
  category: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  pool: { fontSize: 11, fontWeight: '700' },
  question: { fontSize: 17, fontWeight: '800', marginBottom: 16, lineHeight: 22 },
  barContainer: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  outcome: { fontSize: 12, fontWeight: '600' },
  pct: { fontSize: 12, fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  timer: { fontSize: 11, fontStyle: 'italic' },
});

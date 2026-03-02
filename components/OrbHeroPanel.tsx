/**
 * OrbHeroPanel — Full-bleed hero for the Orb hub screen.
 * Replaces CommandCenterHeader with a premium dark-gradient panel.
 * Features: tier glow bar, animated OT balance, shimmer, streak + level badges, search/dir icons.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

const SCREEN_W = Dimensions.get('window').width;
// The parent ScrollView has paddingHorizontal: 16, so we offset to bleed full-width
const SCROLL_PAD = 16;

const TIER_GRADIENTS: Record<string, [string, string, string]> = {
  free: ['#000000', '#0a0a1a', '#050510'],
  premium: ['#0f0800', '#1c1200', '#0a0700'],
  pro: ['#08001a', '#110028', '#060012'],
};

const TIER_COLORS: Record<string, string> = {
  free: '#60A5FA',
  premium: '#FBBF24',
  pro: '#A78BFA',
};

export interface OrbHeroPanelProps {
  balance: number;
  displayName: string;
  level: number;
  levelTitle: string;
  streak: number;
  tier: 'free' | 'premium' | 'pro';
  isPartner: boolean;
  ritualDone: boolean;
  ritualPoints: number | null;
  onOpenSearch?: () => void;
  onOpenDir: () => void;
  themeGold: string;
  colors: any;
  isDark: boolean;
}

export function OrbHeroPanel({
  balance,
  displayName,
  level,
  levelTitle,
  streak,
  tier,
  isPartner,
  ritualDone,
  ritualPoints,
  onOpenSearch,
  onOpenDir,
  themeGold,
  colors,
}: OrbHeroPanelProps) {
  const tierColor = isPartner ? themeGold : (TIER_COLORS[tier] ?? TIER_COLORS.free);
  const gradients = (TIER_GRADIENTS[tier] ?? TIER_GRADIENTS.free) as [string, string, string];

  // Shimmer: left→right white sheen every 3s
  const shimmerX = useSharedValue(-SCREEN_W);
  useEffect(() => {
    shimmerX.value = withRepeat(withTiming(SCREEN_W + 100, { duration: 3200 }), -1, false);
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }] }));

  // Balance: subtle breathing opacity
  const balancePulse = useSharedValue(1);
  useEffect(() => {
    balancePulse.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true,
    );
  }, []);
  const balancePulseStyle = useAnimatedStyle(() => ({ opacity: balancePulse.value }));

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <View style={[styles.container, { width: SCREEN_W, marginLeft: -SCROLL_PAD }]}>
      <LinearGradient
        colors={gradients}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
      />

      {/* Top tier glow bar */}
      <View style={[styles.tierBar, { backgroundColor: tierColor }]} />

      {/* Shimmer overlay */}
      <Animated.View style={[styles.shimmerWrap, shimmerStyle]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.045)', 'transparent']}
          style={styles.shimmerGrad}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>

      <View style={styles.inner}>
        {/* Row 1: greeting + tier badge */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + '22', borderColor: tierColor + '55' }]}>
            <Ionicons
              name={tier === 'pro' ? 'diamond' : tier === 'premium' ? 'star' : 'person'}
              size={11}
              color={tierColor}
            />
            <Text style={[styles.tierBadgeText, { color: tierColor }]}>
              {isPartner ? 'PARTNER' : tier.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Row 2: Balance (the "score") */}
        <View style={styles.balanceCenter}>
          <Animated.Text style={[styles.balanceAmount, { color: themeGold }, balancePulseStyle]}>
            {balance.toLocaleString()}
          </Animated.Text>
          <Text style={styles.balanceLabel}>OT POINTS</Text>
          {ritualDone && (
            <View style={[styles.ritualChip, { backgroundColor: themeGold + '1a', borderColor: themeGold + '44' }]}>
              <Ionicons name="checkmark-circle" size={12} color={themeGold} />
              <Text style={[styles.ritualChipText, { color: themeGold }]}>
                {'Ritual claimed'}
                {ritualPoints != null && ritualPoints > 0 ? ` · +${ritualPoints} OT` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Row 3: streak | level | icons */}
        <View style={styles.bottomRow}>
          <View style={styles.streakBlock}>
            <Ionicons name="flame" size={17} color={streak > 0 ? '#F97316' : 'rgba(255,255,255,0.3)'} />
            <Text style={[styles.streakNum, { color: streak > 0 ? '#F97316' : 'rgba(255,255,255,0.32)' }]}>
              {streak}d
            </Text>
            <Text style={styles.streakLbl}>streak</Text>
          </View>

          <View style={[styles.levelPill, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '44' }]}>
            <Text style={[styles.levelText, { color: colors.primary }]}>
              Lv.{level} — {levelTitle}
            </Text>
          </View>

          <View style={styles.iconRow}>
            {onOpenSearch && (
              <TouchableOpacity onPress={onOpenSearch} style={styles.iconBtn} hitSlop={8}>
                <Ionicons name="search" size={19} color="rgba(255,255,255,0.65)" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onOpenDir} style={styles.iconBtn} hitSlop={8}>
              <Ionicons name="grid" size={19} color="rgba(255,255,255,0.65)" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 200,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  tierBar: { height: 4, width: '100%' },
  shimmerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 180,
  },
  shimmerGrad: { width: 180, height: '100%' },
  inner: { paddingHorizontal: SCROLL_PAD, paddingTop: 14, paddingBottom: 18 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greeting: { color: 'rgba(255,255,255,0.48)', fontSize: 12, fontWeight: '600' },
  displayName: { color: '#ffffff', fontSize: 18, fontWeight: '800', maxWidth: 220 },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    marginTop: 4,
  },
  tierBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  balanceCenter: { alignItems: 'center', marginBottom: 18 },
  balanceAmount: { fontSize: 48, fontWeight: '900', letterSpacing: -1.5 },
  balanceLabel: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginTop: 2,
  },
  ritualChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    marginTop: 8,
  },
  ritualChipText: { fontSize: 11, fontWeight: '700' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakNum: { fontSize: 14, fontWeight: '800' },
  streakLbl: { color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: '600', marginLeft: 1 },
  levelPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  levelText: { fontSize: 12, fontWeight: '700' },
  iconRow: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

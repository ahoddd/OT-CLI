import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { OrbTapLogoMark } from './OrbTapLogoMark';
import { OTPointsBadge } from './OTPointsBadge';
import { AnimatedNumberCounter } from './ui/AnimatedNumberCounter';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import type { NextPerkGoal } from '../hooks/useNextPerkGoal';

interface PremiumCardProps {
  balance: number;
  rank: { level: number; title: string; xp?: number; nextLevelXp?: number; progress?: number; isMaxLevel?: boolean };
  /** User profile photo URL — shown in top-left when set (replaces Lv. placeholder) */
  photoURL?: string | null;
  /** Display name for IDENTITY line; when missing shows "EXPLORER ONE" */
  displayName?: string | null;
  /** Next reward: earn X more or you can redeem — shown below balance */
  nextPerkGoal?: NextPerkGoal | null;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 220;

export const PremiumCard = ({ balance, rank, photoURL, displayName, nextPerkGoal }: PremiumCardProps) => {
  const { isDark, colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const shimmer = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.1, 0.4]),
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-20, 20]) }]
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  // Theme-Specific Gradients
  const bgColors = isDark 
    ? ['#1c1c1e', '#000'] // Obsidian
    : ['#ffffff', '#f0f0f5']; // Ceramic

  const glowColors = isDark
    ? [COLORS.neonBlue[0], 'transparent', 'transparent', themeGold] // Neon Glow
    : ['#3b82f6', 'transparent', 'transparent', '#fbbf24']; // Subtle Royal/Gold

  const shadowColor = isDark ? COLORS.neonBlue[0] : '#000';
  const shadowOpacity = isDark ? 0.4 : 0.15;

  return (
    <TouchableOpacity 
      activeOpacity={1} 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut}
    >
      <Animated.View style={[
        styles.container, 
        animatedStyle, 
        { 
          borderColor: colors.cardBorder, 
          shadowColor: shadowColor,
          shadowOpacity: shadowOpacity,
          backgroundColor: isDark ? '#000' : '#fff'
        }
      ]}>
        
        {/* Base Layer */}
        <LinearGradient
          colors={bgColors as any}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Dynamic Glow Layer */}
        <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
           <LinearGradient
            colors={glowColors as any}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.3, 0.7, 1]}
          />
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={[styles.chipWrapper, { 
                backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
            }]}>
              {photoURL ? (
                <>
                  <Image source={{ uri: photoURL }} style={styles.avatar} />
                  <View style={[styles.levelPill, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.95)' }]}>
                    <Text style={[styles.levelPillText, { color: isDark ? COLORS.neonBlue?.[0] : '#3b82f6' }]}>Lv.{rank.level}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={[styles.avatarPlaceholderText, { color: colors.textSecondary }]}>Lv.{rank.level}</Text>
                </View>
              )}
            </View>
            <View style={{ opacity: isDark ? 0.9 : 1 }}>
              <OrbTapLogoMark variant="hero" width={72} height={62} />
            </View>
          </View>

          <View style={styles.middleRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>AVAILABLE ASSETS</Text>
            <View style={styles.balanceRow}>
              <AnimatedNumberCounter value={balance} formatter={(n) => `${n.toLocaleString()} pts`} style={[styles.balanceText, { color: colors.text }]} />
            </View>
            {nextPerkGoal && (
              <View style={styles.nextPerkRow}>
                {nextPerkGoal.type === 'earn' ? (
                  <>
                    <View style={[styles.nextPerkTrack, { backgroundColor: isDark ? '#333' : '#e5e5ea' }]}>
                      <View
                        style={[
                          styles.nextPerkFill,
                          {
                            width: `${Math.min(100, (balance / (balance + nextPerkGoal.gap)) * 100)}%` as import('react-native').DimensionValue,
                            backgroundColor: themeGold,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.nextPerkText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {nextPerkGoal.gap} pts to {nextPerkGoal.perk.title}
                    </Text>
                  </>
                ) : (
                  <View style={styles.nextPerkRedeemRow}>
                    <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                    <Text style={[styles.nextPerkText, { color: colors.textSecondary }]} numberOfLines={1}>
                      You can redeem: {nextPerkGoal.perk.title}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.bottomRow}>
            <View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>IDENTITY</Text>
              <Text style={[styles.value, { color: isDark ? '#ccc' : '#333' }]} numberOfLines={1}>
                {displayName?.trim() || 'EXPLORER ONE'}
              </Text>
            </View>
            <View>
              <View style={[styles.rankBadge, { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
              }]}>
                <Text style={[styles.rankText, { color: isDark ? COLORS.neonBlue[0] : '#3b82f6' }]}>
                  Level {rank.level} · {rank.title.toUpperCase()}
                </Text>
              </View>
              {rank.xp != null && rank.nextLevelXp != null && !rank.isMaxLevel && (
                <View style={styles.xpMiniRow}>
                  <View style={[styles.xpMiniTrack, { backgroundColor: isDark ? '#333' : '#e5e5ea' }]}>
                    <View style={[styles.xpMiniFill, { width: `${((rank.progress ?? 0) * 100).toFixed(0)}%` as unknown as import('react-native').DimensionValue, backgroundColor: COLORS.neonBlue[0] }]} />
                  </View>
                  <Text style={[styles.xpMiniText, { color: colors.textSecondary }]}>XP</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Gloss Overlay */}
        <LinearGradient
            colors={[isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)', 'transparent']}
            style={styles.gloss}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    zIndex: 1,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipWrapper: { 
    width: 50, 
    height: 50, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  avatar: { width: 50, height: 50, borderRadius: 12 },
  levelPill: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  levelPillText: { fontSize: 9, fontWeight: '800' },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  avatarPlaceholderText: { fontSize: 12, fontWeight: '800' },
  middleRow: { marginTop: 10 },
  label: { fontSize: 9, fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balance: { fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  balanceText: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  value: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1.5 },
  rankBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  rankText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  xpMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  xpMiniTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  xpMiniFill: { height: '100%', borderRadius: 2 },
  xpMiniText: { fontSize: 8, fontWeight: '800' },
  nextPerkRow: { marginTop: 8 },
  nextPerkTrack: { height: 3, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  nextPerkFill: { height: '100%', borderRadius: 2 },
  nextPerkText: { fontSize: 10, fontWeight: '600' },
  nextPerkRedeemRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

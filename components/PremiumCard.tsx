import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate
} from 'react-native-reanimated';
import { OrbTapLogoImage } from './AppLogos';
import { UserBadge } from './GamificationUI';
import { OTPointsBadge } from './OTPointsBadge';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';

interface PremiumCardProps {
  balance: number;
  rank: { level: number; title: string; xp?: number; nextLevelXp?: number; progress?: number; isMaxLevel?: boolean };
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 220;

export const PremiumCard = ({ balance, rank }: PremiumCardProps) => {
  const { isDark, colors } = useTheme();
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  // Theme-Specific Gradients
  const bgColors = isDark 
    ? ['#1c1c1e', '#000'] // Obsidian
    : ['#ffffff', '#f0f0f5']; // Ceramic

  const glowColors = isDark
    ? [COLORS.neonBlue[0], 'transparent', 'transparent', COLORS.gold[0]] // Neon Glow
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
               <UserBadge level={rank.level} size={42} />
            </View>
            <View style={{ opacity: isDark ? 0.9 : 1 }}>
              <OrbTapLogoImage width={72} height={48} />
            </View>
          </View>

          <View style={styles.middleRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>AVAILABLE ASSETS</Text>
            <View style={styles.balanceRow}>
              <OTPointsBadge amount={balance} size={32} label="pts" compact textColor={colors.text} />
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>IDENTITY</Text>
              <Text style={[styles.value, { color: isDark ? '#ccc' : '#333' }]}>EXPLORER ONE</Text>
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
                    <View style={[styles.xpMiniFill, { width: `${((rank.progress ?? 0) * 100).toFixed(0)}%`, backgroundColor: COLORS.neonBlue[0] }]} />
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
  },
  middleRow: { marginTop: 10 },
  label: { fontSize: 9, fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balance: { fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  value: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1.5 },
  rankBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  rankText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  xpMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  xpMiniTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  xpMiniFill: { height: '100%', borderRadius: 2 },
  xpMiniText: { fontSize: 8, fontWeight: '800' }
});

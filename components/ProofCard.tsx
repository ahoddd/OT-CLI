/**
 * ProofCard — tamper-evident receipt of a verified OrbTap visit.
 * Glassmorphism treatment + holographic shimmer. Designed as a shareable card.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { PARTNER_TIER_COLORS, PARTNER_TIER_LABELS } from '../constants/PartnerTiers';
import type { PartnerTier } from '../constants/PartnerTiers';
import { VerifiedBadge } from './VerifiedBadge';
import { useTheme } from '../hooks/useTheme';

interface ProofCardProps {
  partnerName: string;
  perkTitle: string;
  tier: PartnerTier;
  date: string;
  amount: number;
  /** When true, renders in 9:16 share format with watermark */
  shareMode?: boolean;
}

export const ProofCard = React.forwardRef<View, ProofCardProps>(
  ({ partnerName, perkTitle, tier, date, amount, shareMode = false }, ref) => {
    const color = PARTNER_TIER_COLORS[tier];
    const { isDark } = useTheme();

    // Holographic shimmer animation
    const shimmerX = useSharedValue(-1);

    useEffect(() => {
      shimmerX.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
          withTiming(-1, { duration: 0 })
        ),
        -1,
        false
      );
    }, []);

    const shimmerStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: interpolate(shimmerX.value, [-1, 1.5], [-320, 480]) },
      ],
    }));

    // Tier-specific blur intensity
    const blurIntensity = tier === 'platinum' ? 65 : tier === 'gold' ? 55 : 42;
    const tierBorderGlow =
      tier === 'platinum'
        ? 'rgba(167,139,250,0.5)'
        : tier === 'gold'
        ? 'rgba(212,175,55,0.4)'
        : 'rgba(148,163,184,0.35)';

    const cardH = shareMode ? 560 : 450;
    const cardW = shareMode ? 315 : 300;

    return (
      <View
        ref={ref}
        style={[
          styles.card,
          {
            borderColor: tierBorderGlow,
            width: cardW,
            height: cardH,
            shadowColor: color,
          },
        ]}
      >
        {/* Glassmorphism base */}
        {Platform.OS !== 'web' ? (
          <BlurView
            intensity={blurIntensity}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18,18,24,0.88)', borderRadius: 24 }]} />
        )}

        {/* Tier gradient overlay */}
        <LinearGradient
          colors={[color + '28', 'transparent', color + '12']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Top corner glow */}
        <View style={[styles.glowBase, { backgroundColor: color }]} />

        {/* Holographic shimmer strip */}
        <Animated.View style={[styles.shimmerWrap, shimmerStyle]} pointerEvents="none">
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appBrand}>ORBTAP // PROOF</Text>
          <View style={[styles.tierBadge, { borderColor: color + '60', backgroundColor: color + '20' }]}>
            <Text style={[styles.tierText, { color }]}>{PARTNER_TIER_LABELS[tier].toUpperCase()}</Text>
          </View>
        </View>

        {/* OT Points — big center display */}
        <View style={styles.center}>
          <View style={styles.coinRow}>
            <Ionicons name="ellipse" size={20} color={color} style={styles.coinIcon} />
            <Text style={[styles.amount, { textShadowColor: color + '80' }]}>+{amount}</Text>
          </View>
          <Text style={styles.pointsLabel}>OT POINTS EARNED</Text>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: 'rgba(255,255,255,0.1)' }]}>
          <Text style={styles.partner}>{partnerName}</Text>
          <View style={styles.verifiedRow}>
            <Text style={styles.perk}>{perkTitle}</Text>
            <VerifiedBadge size={14} tier={tier} />
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>

        {/* Share mode watermark */}
        {shareMode && (
          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>orbtap.com · Join free</Text>
          </View>
        )}

        {/* Scan line accent at bottom */}
        <View style={[styles.scanLine, { backgroundColor: color + '40' }]} />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 20,
  },
  glowBase: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.18,
  },
  shimmerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    opacity: 0.9,
    pointerEvents: 'none',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appBrand: {
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 9,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  tierText: {
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinIcon: { opacity: 0.8 },
  amount: {
    color: '#fff',
    fontSize: 72,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 3,
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  partner: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  perk: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
  },
  date: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
  },
  watermark: {
    alignItems: 'center',
    paddingTop: 10,
  },
  watermarkText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scanLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { Perk } from '../constants/MockData';
import {
  PARTNER_TIER_COLORS,
  PARTNER_TIER_LABELS,
  getPartnerTierBorderWidth,
  getPartnerTierShineOpacity,
  getPartnerTierBarHeight,
  isPremiumPartnerTier,
  getPartnerTierShadow,
  getPartnerTierShadowAll,
  getPartnerTierPremiumIntensity,
} from '../constants/PartnerTiers';
import { SHINE_COLORS } from '../constants/PremiumStyles';
import { OTPointsBadge } from './OTPointsBadge';
import { safeHaptics, Haptics } from '../utils/safeHaptics';

export type PremiumPerkCardVariant = 'row' | 'compact' | 'hero';

interface PremiumPerkCardProps {
  perk: Perk;
  partnerName?: string;
  variant?: PremiumPerkCardVariant;
  onPress?: () => void;
}

/**
 * Premium perk card — all 4 tiers look premium; tier-scaled shadow, bar, glow.
 * Psychology: tier badge, benefit (title), value (pts), scarcity (cooldown), one clear CTA.
 */
export function PremiumPerkCard({ perk, partnerName, variant = 'row', onPress }: PremiumPerkCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  if (!perk) return null;
  const tier = perk.tier;
  const tierColor = PARTNER_TIER_COLORS[tier];
  const holoPadding = getPartnerTierBorderWidth(tier);
  const tierBarH = getPartnerTierBarHeight(tier);
  const premium = isPremiumPartnerTier(tier);
  const tierShadowAll = getPartnerTierShadowAll(tier);
  const tierShadow = getPartnerTierShadow(tier);
  const intensity = getPartnerTierPremiumIntensity(tier);
  const showPulse = premium && !reduceMotion && (variant === 'row' || variant === 'hero');

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.2);
  useEffect(() => {
    if (!showPulse) return;
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1400 }),
        withTiming(0.2, { duration: 1400 })
      ),
      -1,
      true
    );
  }, [showPulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handlePress = () => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) onPress();
    else router.push(`/perk/${perk.id}` as any);
  };

  const borderGradientColors = [tierColor, tierColor + 'dd', tierColor + '99', tierColor];

  const content = (
    <>
      <LinearGradient
        colors={[tierColor, tierColor + 'cc']}
        style={[styles.tierBar, { height: tierBarH }]}
      />
      <LinearGradient
        colors={[...SHINE_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: getPartnerTierShineOpacity(tier) }]}
        pointerEvents="none"
      />
      {/* No inner fill for L/A — glow only via pulse ring + shadow */}
      <View style={[styles.topGlow, { backgroundColor: tierColor, opacity: 0.1 + intensity * 0.1 }]} />
      <View style={variant === 'hero' ? styles.heroBody : variant === 'compact' ? styles.compactBody : styles.body}>
        {variant === 'compact' ? (
          <>
            <Text style={[styles.compactTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{perk.title}</Text>
            <OTPointsBadge amount={perk.cost} size={14} label="pts" compact textColor={tierColor} />
          </>
        ) : (
          <>
            <View style={[styles.tierPill, { backgroundColor: tierColor + '22', borderColor: tierColor }]}>
              <Text style={[styles.tierLabel, { color: tierColor }]}>{PARTNER_TIER_LABELS[tier]}</Text>
            </View>
            <Text style={[variant === 'hero' ? styles.heroTitle : styles.title, { color: colors.text }]} numberOfLines={variant === 'hero' ? 2 : 2}>
              {perk.title}
            </Text>
            {partnerName && (
              <Text style={[styles.partnerLine, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">at {partnerName}</Text>
            )}
            <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={variant === 'hero' ? 3 : 2} ellipsizeMode="tail">{perk.description}</Text>
            <View style={[styles.metaRow, { borderColor: tierColor + '44', backgroundColor: tierColor + '12' }]}>
              <OTPointsBadge amount={perk.cost} size={variant === 'hero' ? 18 : 14} label="pts" compact textColor={tierColor} />
              <Text style={[styles.cooldown, { color: colors.textSecondary }]}>{perk.cooldown}</Text>
            </View>
            {(variant === 'row' || variant === 'hero') && (
              <View style={styles.ctaRow}>
                <Text style={[styles.ctaText, { color: tierColor }]}>Redeem with points</Text>
                <Ionicons name="chevron-forward" size={16} color={tierColor} />
              </View>
            )}
          </>
        )}
      </View>
    </>
  );

  const borderRadius = variant === 'hero' ? 20 : 16;
  return (
    <View style={[styles.wrapper, (premium && tierShadow) ? styles.shadowWrap : undefined]}>
      {showPulse && (
        <View style={[StyleSheet.absoluteFill, styles.pulseRingWrap, { borderRadius }]} pointerEvents="none">
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.pulseRing,
              { borderColor: tierColor, borderRadius },
              pulseStyle,
            ]}
          />
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.outer,
          variant === 'hero' && styles.outerHero,
          tierShadowAll,
        ]}
        onPress={handlePress}
        activeOpacity={0.92}
      >
        <LinearGradient
          colors={borderGradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.borderGradient, variant === 'hero' && styles.borderGradientHero, { padding: holoPadding }]}
        >
          <View style={[styles.cardInner, { backgroundColor: colors.surface }, variant === 'hero' && styles.cardInnerHero]}>
            {content}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, position: 'relative', minHeight: 0 },
  shadowWrap: { overflow: 'visible' },
  pulseRingWrap: { position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, zIndex: 0 },
  pulseRing: { borderWidth: 2 },
  outer: { flex: 1, borderRadius: 16, minHeight: 0 },
  outerHero: { borderRadius: 20 },
  borderGradient: { borderRadius: 16 },
  borderGradientHero: { borderRadius: 20 },
  cardInner: {
    borderRadius: 13,
    overflow: 'hidden',
    minHeight: 100,
  },
  cardInnerHero: { borderRadius: 18, minHeight: 180 },
  tierBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  body: { padding: 16, paddingTop: 14 },
  heroBody: { padding: 24, paddingTop: 20 },
  compactBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  compactTitle: { fontSize: 15, fontWeight: '800', flex: 1, marginRight: 10 },
  tierPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  tierLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 17, fontWeight: '800', marginBottom: 4, letterSpacing: 0.2 },
  heroTitle: { fontSize: 22, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  partnerLine: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  desc: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  cooldown: { fontSize: 11, fontWeight: '600' },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  ctaText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
});

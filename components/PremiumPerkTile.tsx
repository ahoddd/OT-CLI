import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { Partner, Perk } from '../constants/MockData';
import type { Drop } from '../constants/Drops';
import {
  PARTNER_TIER_COLORS,
  PARTNER_TIER_BADGE_LABELS,
  getPartnerTierBorderWidth,
  getPartnerTierShineOpacity,
  getPartnerTierBarHeight,
  isPremiumPartnerTier,
  getPartnerTierShadow,
  getPartnerTierShadowAll,
  getPartnerTierPremiumIntensity,
} from '../constants/PartnerTiers';
import { PartnerProBadge } from './PartnerProBadge';
import { SHINE_COLORS } from '../constants/PremiumStyles';

export type PerkSlotType = 'featured' | 'sponsored' | null;

interface PremiumPerkTileProps {
  partner: Partner;
  primaryPerk: Perk | null;
  onPress: () => void;
  slotType?: PerkSlotType;
  /** When this partner has a live drop, show scarcity (N left, Ends in Xh). */
  drop?: Drop | null;
  /** Distance from user, e.g. "0.3 mi". When set, shown next to category. */
  distanceLabel?: string;
}

/**
 * Premium perk tile — all tiers look premium; L/A get holographic shimmer + pulse.
 * Slot badge in its own top strip so it never overlaps tier. No text cut-off.
 */
export function PremiumPerkTile({ partner, primaryPerk, onPress, slotType = null, drop = null, distanceLabel }: PremiumPerkTileProps) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const tierColor = PARTNER_TIER_COLORS[partner.tier];
  const borderWidth = getPartnerTierBorderWidth(partner.tier);
  const shineOpacity = getPartnerTierShineOpacity(partner.tier);
  const tierBarH = getPartnerTierBarHeight(partner.tier);
  const premium = isPremiumPartnerTier(partner.tier);
  const tierShadowAll = getPartnerTierShadowAll(partner.tier);
  const tierShadow = getPartnerTierShadow(partner.tier);
  const intensity = getPartnerTierPremiumIntensity(partner.tier);

  const now = Date.now();
  const liveDrop = drop && drop.qtyRemaining > 0 && now >= drop.startAt && now <= drop.endAt;
  const hoursLeft = liveDrop && drop.endAt > now ? Math.max(0, Math.ceil((drop.endAt - now) / (60 * 60 * 1000))) : 0;

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.2);
  useEffect(() => {
    if (!premium || reduceMotion) return;
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 1300 }),
        withTiming(0.2, { duration: 1300 })
      ),
      -1,
      true
    );
  }, [premium, reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const borderGradientColors = premium
    ? [tierColor, tierColor + 'ee', tierColor + '99', tierColor]
    : [tierColor + 'dd', tierColor + '99', tierColor + '99', tierColor + 'cc'];

  return (
    <View style={[styles.outer, styles.shadowWrap]}>
      {premium && !reduceMotion && tierShadow && (
        <View style={[StyleSheet.absoluteFill, styles.pulseRingWrap, { borderRadius: 18 }]} pointerEvents="none">
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.pulseRing,
              { borderColor: tierColor, borderRadius: 18 },
              pulseStyle,
            ]}
          />
        </View>
      )}
      <TouchableOpacity
        style={[styles.touchTarget, tierShadowAll]}
        onPress={onPress}
        activeOpacity={0.92}
      >
        <LinearGradient
          colors={borderGradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.borderGradient, { padding: borderWidth }]}
        >
          <View style={[styles.cardInner, { backgroundColor: colors.surface }]}>
            {/* Dedicated top strip for FEATURED/SPONSORED — no overlap with tier */}
            {slotType !== null && (
              <View style={[styles.slotStrip, slotType === 'featured' ? styles.slotFeatured : styles.slotSponsored]}>
                <Ionicons name={slotType === 'featured' ? 'star' : 'megaphone'} size={10} color={slotType === 'featured' ? '#fff' : '#000'} />
                <Text style={[styles.slotStripText, { color: slotType === 'featured' ? '#fff' : '#000' }]}>
                  {slotType === 'featured' ? 'FEATURED' : 'SPONSORED'}
                </Text>
              </View>
            )}
            <LinearGradient
              colors={[tierColor, tierColor + 'cc']}
              style={[styles.tierBar, { height: tierBarH, top: slotType !== null ? 26 : 0 }]}
            />
            <LinearGradient
              colors={[...SHINE_COLORS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { opacity: shineOpacity }]}
              pointerEvents="none"
            />
            {/* No inner fill for L/A — glow only around tile via pulse ring + shadow */}
            <View style={[styles.topGlow, { backgroundColor: tierColor, opacity: 0.08 + intensity * 0.06, top: (slotType !== null ? 26 : 0) + tierBarH - 1 }]} />

            <View style={[styles.content, slotType !== null && { paddingTop: 30 }]}>
              <View style={styles.dotRow}>
                <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
                <Text style={[styles.tierLabel, { color: tierColor }]} numberOfLines={1} ellipsizeMode="tail">
                  {PARTNER_TIER_BADGE_LABELS[partner.tier]}
                </Text>
                {partner.tier === 'platinum' && (
                  <View style={styles.proBadgeInTile}>
                    <PartnerProBadge size="small" />
                  </View>
                )}
              </View>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{partner.name}</Text>
              <View style={styles.catRow}>
                <Text style={[styles.cat, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{partner.category}</Text>
                {distanceLabel ? <Text style={[styles.distance, { color: colors.textSecondary }]}>{distanceLabel}</Text> : null}
              </View>
              {primaryPerk ? (
                <View style={[styles.perkChip, { borderColor: tierColor + '99', backgroundColor: tierColor + '14' }]}>
                  <Text style={[styles.perkTitle, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">{primaryPerk.title}</Text>
                  <View style={styles.perkChipRight}>
                    {typeof primaryPerk.stock?.remaining === 'number' && (
                      <Text style={[styles.qtyRemaining, { color: tierColor }]}>{primaryPerk.stock.remaining} left</Text>
                    )}
                    <View style={[styles.ptsBadge, { backgroundColor: tierColor + '99', borderColor: tierColor + 'cc', borderWidth: 1 }]}>
                      <Text style={[styles.ptsText, { color: colors.text }]}>{primaryPerk.cost} pts</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={[styles.perkChip, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.perkTitle, { color: colors.textSecondary }]} numberOfLines={1}>View perks</Text>
                </View>
              )}
              {liveDrop && (
                <View style={[styles.scarcityRow, { backgroundColor: tierColor + '18' }]}>
                  <Text style={[styles.scarcityText, { color: tierColor }]}>
                    {drop.qtyRemaining} left
                    {hoursLeft > 0 ? ` · Ends in ${hoursLeft}h` : ''}
                  </Text>
                </View>
              )}
              <View style={styles.ctaRow}>
                <Text style={[styles.ctaText, { color: tierColor }]}>View details</Text>
                <Ionicons name="chevron-forward" size={16} color={tierColor} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  outer: { flex: 1, borderRadius: 20, position: 'relative', minHeight: 220 },
  shadowWrap: { overflow: 'visible' },
  touchTarget: { flex: 1, borderRadius: 20 },
  pulseRingWrap: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    zIndex: 0,
  },
  pulseRing: { borderWidth: 2, top: 0, left: 0, right: 0, bottom: 0 },
  borderGradient: { borderRadius: 20 },
  slotStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    zIndex: 2,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  slotFeatured: { backgroundColor: '#7c3aed' },
  slotSponsored: { backgroundColor: '#d97706' },
  slotStripText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  cardInner: {
    borderRadius: 17,
    overflow: 'hidden',
    minHeight: 212,
  },
  tierBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  topGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
  },
  content: { padding: 16, paddingTop: 14, paddingBottom: 16 },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, minHeight: 22 },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  tierLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, flex: 1 },
  proBadgeInTile: { marginLeft: 4 },
  name: { fontSize: 16, fontWeight: '800', marginBottom: 3, letterSpacing: 0.2 },
  cat: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize', opacity: 0.9 },
  catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 10 },
  distance: { fontSize: 11, fontWeight: '600', opacity: 0.9 },
  perkChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  perkChipRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  qtyRemaining: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  perkTitle: { fontSize: 13, fontWeight: '700', marginBottom: 6, lineHeight: 18 },
  ptsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ptsText: { fontSize: 13, fontWeight: '800' },
  scarcityRow: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginBottom: 10, alignSelf: 'flex-start' },
  scarcityText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 24 },
  ctaText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
});

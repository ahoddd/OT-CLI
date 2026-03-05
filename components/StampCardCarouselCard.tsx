/**
 * Stamp Cards™ — Dark frosted glass carousel card with tier tint, OrbTap logo top-right,
 * category-matched high-contrast stamps. Premium glassmorphism; no overlapping.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SPACE, RADIUS } from '../constants/DesignTokens';
import type { StampCardWithProgram } from '../hooks/useStampCards';
import type { StampActiveReward } from '../constants/StampCards';
import { getStampIconsForTemplate } from '../constants/StampCardCategoryIcons';
import type { PartnerTier } from '../constants/PartnerTiers';
import { OrbTapLogoMark } from './OrbTapLogoMark';

/** Only three tier colors: silver, gold, light purple (platinum). */
const STAMP_TIER_COLORS: Record<PartnerTier, string> = {
  silver: '#94a3b8',
  gold: '#d4af37',
  platinum: '#a78bfa',
};
const DEFAULT_TIER_COLOR = STAMP_TIER_COLORS.platinum;

/** Dark frosted glass base — slate; BlurView shows through. */
const DARK_GLASS_BASE = 'rgba(15,23,42,0.78)';
/** Web fallback when BlurView unavailable. */
const DARK_GLASS_WEB = 'rgba(15,23,42,0.92)';
/** Text on dark: high contrast. */
const TEXT_ON_DARK = '#f1f5f9';
const TEXT_ON_DARK_SECONDARY = '#94a3b8';
/** Logo reserved width so content does not overlap. */
const LOGO_TOP_RIGHT_SIZE = 52;

interface StampCardCarouselCardProps {
  card: StampCardWithProgram;
  /** Partner logo URL for filled stamp slots; when set, filled stamps show logo instead of icon. */
  partnerLogoUrl?: string | null;
  /** Optional partner tier for badge (Silver/Gold/Platinum). */
  partnerTier?: PartnerTier | null;
}

export function StampCardCarouselCard({ card, partnerLogoUrl, partnerTier }: StampCardCarouselCardProps) {
  const { colors } = useTheme();
  const program = card.program;
  const state = card.state;
  const stampsRequired = program?.stampsRequired ?? 10;
  const tier: PartnerTier = partnerTier ?? (program?.partnerTier as PartnerTier) ?? 'platinum';
  const primaryColor = STAMP_TIER_COLORS[tier] ?? DEFAULT_TIER_COLOR;
  const reward = state.activeReward as StampActiveReward | null;
  const hasEarnedReward = reward?.status === 'EARNED';
  const stampSlots = Array.from({ length: stampsRequired }, (_, i) => i < state.stampCount);
  const stampIcons = getStampIconsForTemplate(program?.design?.template);
  const tierLabel = partnerTier ? String(partnerTier).charAt(0).toUpperCase() + String(partnerTier).slice(1) : null;

  /** OrbTap emblem: same logo as wallet top-left (OrbTapLogoMark). */

  /** Dark glass: tier tint overlay (8–12% opacity) so silver/gold/platinum each have a subtle tint. */
  const tierTintOverlay = primaryColor + '18';
  const glassBorder = primaryColor + '50';
  const remaining = stampsRequired - state.stampCount;
  const isNextStampSlot = (i: number) => !stampSlots[i] && (i === 0 || stampSlots[i - 1]);

  return (
    <View style={[styles.outer, { backgroundColor: colors.background }]}>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[
          styles.frame,
          styles.frameGlass,
          Platform.OS === 'web' && styles.frameWebGlass,
        ]}
      >
        {Platform.OS !== 'web' ? (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={[styles.glassOverlay, { backgroundColor: DARK_GLASS_BASE }]} pointerEvents="none" />
        <LinearGradient
          colors={[tierTintOverlay, primaryColor + '0a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.cardInner]} pointerEvents="none"
        />
        <View style={[styles.card, styles.cardGradient, { borderColor: glassBorder }, { borderWidth: 1.5 }]}>
          {Platform.OS === 'web' && <View style={[StyleSheet.absoluteFill, { backgroundColor: DARK_GLASS_WEB }]} pointerEvents="none" />}
          <View style={[styles.cardAccent, { backgroundColor: primaryColor }]} />
          <View style={[styles.glassEdge, { borderColor: primaryColor + '30' }]} pointerEvents="none" />
          <View style={[styles.logoTopRight]} pointerEvents="none">
            <View style={[styles.emblemWrap, { backgroundColor: primaryColor + '25', borderColor: primaryColor + '50' }]}>
              <OrbTapLogoMark variant="small" width={48} height={40} />
            </View>
          </View>
          <View style={[styles.headerBlock, { paddingRight: LOGO_TOP_RIGHT_SIZE + SPACE.sm }]}>
            <View style={styles.topRow}>
              <View style={styles.partnerLogoWrap}>
                {partnerLogoUrl ? (
                  <Image source={{ uri: partnerLogoUrl }} style={styles.partnerLogo} resizeMode="cover" />
                ) : (
                  <View style={[styles.partnerLogoPlaceholder, { backgroundColor: primaryColor + '30' }]}>
                    <Ionicons name="business" size={18} color={primaryColor} />
                  </View>
                )}
              </View>
            </View>
            <Text
              style={[styles.programName, { color: TEXT_ON_DARK }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {program?.name ?? 'Stamp Card'}
            </Text>
            {tierLabel ? (
              <View style={[styles.tierRow]}>
                <View style={[styles.tierBadge, { backgroundColor: primaryColor + '35', borderColor: primaryColor + '60' }]}>
                  <Text style={[styles.tierText, { color: primaryColor }]}>{tierLabel}</Text>
                </View>
              </View>
            ) : null}
          </View>
          <View style={styles.stampRow}>
            {stampSlots.map((filled, i) => {
              const nextSlot = isNextStampSlot(i);
              const emptyMuted = primaryColor + '55';
              const emptyBg = 'rgba(30,41,59,0.6)';
              return (
              <View
                key={i}
                style={[
                  styles.stampCircle,
                  styles.stampCircle3D,
                  nextSlot && styles.stampCircleNext,
                  {
                    borderColor: filled ? primaryColor : nextSlot ? primaryColor + '99' : 'rgba(148,163,184,0.35)',
                    borderWidth: nextSlot ? 3 : 2.5,
                    backgroundColor: filled ? primaryColor + '28' : nextSlot ? primaryColor + '18' : emptyBg,
                    ...(Platform.OS !== 'web'
                      ? {
                          shadowColor: filled ? primaryColor : nextSlot ? primaryColor : 'transparent',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: filled ? 0.4 : nextSlot ? 0.25 : 0,
                          shadowRadius: filled ? 6 : nextSlot ? 4 : 0,
                          elevation: filled ? 8 : nextSlot ? 5 : 2,
                        }
                      : {}),
                  },
                ]}
              >
                {filled ? (
                  partnerLogoUrl ? (
                    <Image source={{ uri: partnerLogoUrl }} style={styles.stampLogo} resizeMode="cover" />
                  ) : (
                    <Ionicons name={stampIcons.filled as any} size={28} color={primaryColor} />
                  )
                ) : (
                  <Ionicons name={stampIcons.empty as any} size={24} color={nextSlot ? primaryColor + 'cc' : emptyMuted} />
                )}
              </View>
              );
            })}
          </View>
          <View style={[styles.stampDivider, { backgroundColor: primaryColor + '30' }]} />
          <Text style={[styles.progressText, { color: TEXT_ON_DARK_SECONDARY }]} numberOfLines={1}>
            {state.stampCount} / {stampsRequired} stamps
            {state.completedCount > 0 ? ` · ${state.completedCount} completed` : ''}
          </Text>
          {!hasEarnedReward && remaining > 0 && (
            <Text style={[styles.engagementText, { color: primaryColor }]}>
              {remaining === 1 ? '1 more stamp to reward' : `${remaining} more stamps to reward`} · Scan to earn
            </Text>
          )}
          {program?.reward?.label ? (
            <Text style={[styles.rewardText, { color: TEXT_ON_DARK }]} numberOfLines={2} ellipsizeMode="tail">
              {program.reward.label}
            </Text>
          ) : null}
          {hasEarnedReward && (
            <View style={[styles.earnedBadge, { backgroundColor: primaryColor + '28', borderColor: primaryColor + '55' }]}>
              <Ionicons name="gift" size={18} color={primaryColor} />
              <Text style={[styles.earnedText, { color: primaryColor }]}>Reward ready</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    paddingHorizontal: SPACE.sm,
    justifyContent: 'center',
  },
  frame: {
    borderRadius: RADIUS.xxl,
    padding: 8,
    overflow: 'hidden',
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: '#1e3a5f',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 12,
        }
      : {}),
  },
  frameGlass: {
    position: 'relative',
  },
  frameWebGlass: {
    backgroundColor: DARK_GLASS_WEB,
  },
  cardInner: { borderRadius: RADIUS.lg },
  logoTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  glassEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    pointerEvents: 'none',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.xxl,
  },
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardGradient: {
    padding: SPACE.base,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  headerBlock: {
    marginBottom: SPACE.base,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  partnerLogoWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  partnerLogo: {
    width: '100%',
    height: '100%',
  },
  partnerLogoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: 8,
    alignSelf: 'stretch',
  },
  emblemWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  tierRow: {
    marginTop: 6,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stampDivider: {
    height: 1,
    borderRadius: 1,
    marginBottom: SPACE.sm,
  },
  stampRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACE.sm,
    gap: 8,
  },
  stampCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stampCircle3D: {
    borderStyle: 'solid',
  },
  stampCircleNext: {
    transform: [{ scale: 1.02 }],
  },
  stampLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  progressText: {
    fontSize: 14,
    marginBottom: SPACE.xxs,
    fontWeight: '600',
  },
  engagementText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: SPACE.xs,
    letterSpacing: 0.2,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACE.sm,
    lineHeight: 22,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
  },
  earnedText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

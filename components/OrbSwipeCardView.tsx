/**
 * OrbSwipe — premium business card: hero image, tier, value, always-visible text overlay.
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { PARTNER_TIER_COLORS, PARTNER_TIER_BADGE_LABELS } from '../constants/PartnerTiers';
import type { OrbSwipeCard } from '../constants/OrbSwipeDeck';
import { RADIUS } from '../constants/DesignTokens';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80';

export interface OrbSwipeCardViewProps {
  card: OrbSwipeCard;
  /** When true, card fills container (e.g. in swipe stack). */
  fullHeight?: boolean;
}

export function OrbSwipeCardView({ card, fullHeight }: OrbSwipeCardViewProps) {
  const { colors } = useTheme();
  const tierColor = PARTNER_TIER_COLORS[card.tier] ?? '#9ca3af';
  const imageUrl = card.imageUrl ?? PLACEHOLDER_IMAGE;

  return (
    <View style={[styles.card, fullHeight && styles.cardFull]}>
      {/* Hero image — fills card, cover */}
      <Image
        source={{ uri: imageUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {/* Top tier bar */}
      <View style={[styles.tierBar, { backgroundColor: tierColor }]} />
      {/* Top row: tier badge + verified */}
      <View style={styles.topRow}>
        <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
          <Text style={styles.tierBadgeText}>{PARTNER_TIER_BADGE_LABELS[card.tier] ?? card.tier}</Text>
        </View>
        {card.verified && (
          <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
          </View>
        )}
      </View>
      {/* Bottom-only legibility bar — short gradient so hero image stays clear */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.scrim}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
      {/* Offer badge: reserve cost (drops) or earn potential (missions/partners) */}
      <View style={[styles.earnBadge, { borderColor: tierColor + '60', backgroundColor: tierColor + '20' }]}>
        <Ionicons name="ellipse" size={10} color={tierColor} />
        <Text style={[styles.earnBadgeText, { color: '#fff' }]} numberOfLines={1}>
          {card.reserveCostOt !== undefined && card.reserveCostOt > 0
            ? `${card.reserveCostOt} OT to reserve`
            : card.reserveCostOt === 0
              ? 'Free reserve'
              : card.earnOtLabel ?? 'Visit to earn OT'}
        </Text>
      </View>

      {/* Solid info strip at bottom — no blur, premium clean look */}
      <View style={styles.glassBottom}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.72)' }]} />
        {/* Left accent border (tier-colored) */}
        <View style={[styles.tierAccentBorder, { backgroundColor: tierColor }]} />
        <View style={styles.glassContent}>
          <Text style={styles.partnerName} numberOfLines={1}>{card.partnerName}</Text>
          <Text style={styles.valueSummary} numberOfLines={2}>{card.valueSummary}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{card.whyLabel}</Text>
            <Text style={styles.meta}>{card.distanceLabel}</Text>
          </View>
          {'scarcity' in card && card.scarcity && (
            <Text style={styles.scarcity}>{card.scarcity}</Text>
          )}
          <View style={[styles.ctaPill, { backgroundColor: tierColor }]}>
            <Text style={styles.ctaText}>{card.ctaHint}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    minHeight: 280,
    backgroundColor: '#1a1a1a',
  },
  cardFull: { flex: 1, minHeight: 0 },
  tierBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 2,
  },
  topRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  tierBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tierBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    padding: 4,
    borderRadius: 20,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 130,
  },
  earnBadge: {
    position: 'absolute',
    top: 52,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 3,
  },
  earnBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  glassBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingLeft: 6,
    zIndex: 2,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  tierAccentBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    zIndex: 1,
  },
  glassContent: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  partnerName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  valueSummary: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 19,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 19,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  meta: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  scarcity: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  ctaPill: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  ctaText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
});

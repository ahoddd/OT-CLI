/**
 * MealProposalCard — premium OrbSwipe card for meal proposals.
 * Big photo, partner + verified badge, meal type, price, menu highlights, why label.
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ICONS,
  getMealPriceLabel,
  getPartySizeLabel,
  getMenuHighlights,
  type MealProposal,
} from '../constants/MealProposals';
import { PARTNER_TIER_COLORS, getPartnerTierShadowAll } from '../constants/PartnerTiers';
import { SPACE, RADIUS } from '../constants/DesignTokens';

interface MealProposalCardProps {
  proposal: MealProposal;
  whyLabel: string;
  fullHeight?: boolean;
  endsAt?: number;
  proofMomentum?: number;
}

export function MealProposalCard({ proposal, whyLabel, fullHeight, endsAt, proofMomentum }: MealProposalCardProps) {
  const { colors } = useTheme();
  const tierColor = PARTNER_TIER_COLORS[proposal.partnerTier ?? 'silver'];
  const shadow = getPartnerTierShadowAll(proposal.partnerTier ?? 'silver');
  const priceLabel = getMealPriceLabel(proposal);
  const partySizeLabel = getPartySizeLabel(proposal);
  const menuHighlights = getMenuHighlights(proposal.menuItems, 3);

  const countdown = endsAt ? Math.max(0, Math.floor((endsAt - Date.now()) / (60 * 1000))) : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: tierColor + '66' }, shadow, fullHeight && styles.cardFull]}>
      {/* Hero area */}
      <View style={[styles.hero, { backgroundColor: tierColor + '14' }]}>
        {proposal.photos[0] ? (
          <Image source={{ uri: proposal.photos[0] }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name={MEAL_TYPE_ICONS[proposal.mealType] as any} size={56} color={tierColor + '44'} />
          </View>
        )}

        {/* Top badges */}
        <View style={styles.topBadges}>
          <View style={[styles.mealBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name={MEAL_TYPE_ICONS[proposal.mealType] as any} size={14} color="#000" />
            <Text style={styles.mealBadgeText}>{MEAL_TYPE_LABELS[proposal.mealType]}</Text>
          </View>
          {whyLabel && (
            <View style={[styles.whyBadge, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
              <Text style={styles.whyBadgeText}>{whyLabel}</Text>
            </View>
          )}
        </View>

        {/* Countdown */}
        {countdown != null && countdown < 180 && (
          <View style={[styles.countdownBadge, { backgroundColor: '#ef4444' }]}>
            <Ionicons name="time" size={12} color="#fff" />
            <Text style={styles.countdownText}>{countdown < 60 ? `${countdown}m left` : `${Math.floor(countdown / 60)}h left`}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Partner row */}
        <View style={styles.partnerRow}>
          <Text style={[styles.partnerName, { color: colors.textSecondary }]} numberOfLines={1}>
            {proposal.partnerName ?? 'Partner'}
          </Text>
          {proposal.partnerVerified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          )}
          <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{proposal.title}</Text>

        {/* Price + party size */}
        <View style={styles.metaRow}>
          <Text style={[styles.priceLabel, { color: colors.primary }]}>{priceLabel}</Text>
          <Text style={[styles.partySizeLabel, { color: colors.textSecondary }]}>{partySizeLabel}</Text>
        </View>

        {/* Menu highlights */}
        {menuHighlights.length > 0 && (
          <View style={styles.menuSection}>
            {menuHighlights.map((item, i) => (
              <View key={i} style={styles.menuRow}>
                <View style={[styles.menuDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.menuText, { color: colors.textSecondary }]} numberOfLines={1}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Proof momentum */}
        {proofMomentum != null && proofMomentum > 0 && (
          <View style={styles.momentumRow}>
            <Ionicons name="checkmark-done-circle" size={14} color="#22c55e" />
            <Text style={[styles.momentumText, { color: colors.textSecondary }]}>{proofMomentum} verified check-ins this week</Text>
          </View>
        )}

        {/* CTA hint */}
        <Text style={[styles.ctaHint, { color: colors.primary }]}>Swipe right to add to tray</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, borderWidth: 2, overflow: 'hidden' },
  cardFull: { flex: 1 },
  hero: { height: 200, justifyContent: 'flex-end' },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBadges: { position: 'absolute', top: SPACE.sm, left: SPACE.sm, flexDirection: 'row', gap: SPACE.xs },
  mealBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: SPACE.sm, borderRadius: RADIUS.xs },
  mealBadgeText: { color: '#000', fontSize: 11, fontWeight: '800' },
  whyBadge: { paddingVertical: 3, paddingHorizontal: SPACE.sm, borderRadius: RADIUS.xs },
  whyBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  countdownBadge: { position: 'absolute', top: SPACE.sm, right: SPACE.sm, flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 3, paddingHorizontal: SPACE.sm, borderRadius: RADIUS.xs },
  countdownText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  content: { padding: SPACE.base },
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  partnerName: { fontSize: 12, fontWeight: '600', flex: 1 },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: SPACE.xs, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  priceLabel: { fontSize: 15, fontWeight: '800' },
  partySizeLabel: { fontSize: 13, fontWeight: '600' },
  menuSection: { marginBottom: SPACE.sm },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  menuDot: { width: 5, height: 5, borderRadius: 2.5 },
  menuText: { fontSize: 13, fontWeight: '500' },
  momentumRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACE.sm },
  momentumText: { fontSize: 11, fontWeight: '600' },
  ctaHint: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: SPACE.xs },
});

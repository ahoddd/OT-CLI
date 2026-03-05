/**
 * OrbSwipe Card Detail — premium bottom sheet with one obvious primary CTA.
 * Secondary actions: Save, Add to Tray, Show on Map, Share (after verified win only).
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import type { OrbSwipeCard } from '../constants/OrbSwipeDeck';
import { PARTNER_TIER_COLORS, PARTNER_TIER_BADGE_LABELS } from '../constants/PartnerTiers';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import {
  CARD_DETAIL_WHY_PREFIX,
  CARD_DETAIL_SAVE_LABEL,
  CARD_DETAIL_ADD_TRAY_LABEL,
  CARD_DETAIL_MAP_LABEL,
} from '../constants/ViralCopy';

export interface OrbSwipeCardDetailSheetProps {
  card: OrbSwipeCard | null;
  visible: boolean;
  onClose: () => void;
  onAddToTray: (card: OrbSwipeCard) => void;
  onSave: (card: OrbSwipeCard) => void;
  onReserve?: (card: OrbSwipeCard) => void;
}

export function OrbSwipeCardDetailSheet({
  card,
  visible,
  onClose,
  onAddToTray,
  onSave,
  onReserve,
}: OrbSwipeCardDetailSheetProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePrimaryCta = useCallback(() => {
    if (!card) return;
    onReserve?.(card);
    onClose();
    if (card.type === 'DROP_CARD' && 'dropId' in card) {
      router.push(`/drop/${card.dropId}?from=orbswipe` as any);
    } else if (card.type === 'MISSION_CARD') {
      router.push('/missions' as any);
    } else {
      router.push(`/partner/${card.partnerId}?from=orbswipe` as any);
    }
  }, [card, onClose, router]);

  const handleShowOnMap = useCallback(() => {
    if (!card) return;
    onClose();
    router.push('/(tabs)' as any);
  }, [card, onClose, router]);

  const handleAddTray = useCallback(() => {
    if (!card) return;
    onAddToTray(card);
    onClose();
  }, [card, onAddToTray, onClose]);

  const handleSave = useCallback(() => {
    if (!card) return;
    onSave(card);
    onClose();
  }, [card, onSave, onClose]);

  if (!card) return null;

  const tierColor = PARTNER_TIER_COLORS[card.tier] ?? '#9ca3af';
  const primaryCtaLabel =
    card.type === 'DROP_CARD' ? 'Reserve' :
    card.type === 'MISSION_CARD' ? 'Start' :
    card.type === 'PARTNER_CARD' ? 'Visit' : 'Navigate';
  const primaryCtaIcon: keyof typeof Ionicons.glyphMap =
    card.type === 'DROP_CARD' ? 'flash' :
    card.type === 'MISSION_CARD' ? 'flag' :
    card.type === 'PARTNER_CARD' ? 'storefront' : 'navigate';

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Drag handle */}
          <View style={[styles.dragHandle, { backgroundColor: colors.textSecondary + '44' }]} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Hero row */}
            <View style={styles.heroRow}>
              <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
              <View style={styles.heroText}>
                <View style={styles.nameRow}>
                  <Text style={[styles.partnerName, { color: colors.text }]} numberOfLines={1}>
                    {card.partnerName}
                  </Text>
                  {card.verified && (
                    <Ionicons name="checkmark-circle" size={18} color={tierColor} style={styles.verifiedIcon} />
                  )}
                </View>
                <Text style={[styles.tierLabel, { color: tierColor }]}>
                  {PARTNER_TIER_BADGE_LABELS[card.tier] ?? card.tier}
                </Text>
              </View>
            </View>

            {/* Info row: distance + scarcity */}
            <View style={styles.infoRow}>
              <View style={styles.infoChip}>
                <Ionicons name="location" size={14} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>{card.distanceLabel}</Text>
              </View>
              {'scarcity' in card && card.scarcity && (
                <View style={[styles.infoChip, { backgroundColor: '#ef444418' }]}>
                  <Ionicons name="time" size={14} color="#ef4444" />
                  <Text style={[styles.infoText, { color: '#ef4444' }]}>{card.scarcity}</Text>
                </View>
              )}
            </View>

            {/* Offer value line: reserve cost + earn potential */}
            {(card.reserveCostOt !== undefined || card.earnOtLabel) && (
              <View style={[styles.valueLineWrap, { backgroundColor: tierColor + '18', borderColor: tierColor + '40' }]}>
                <Ionicons name="flash" size={14} color={tierColor} />
                <Text style={[styles.valueLineText, { color: colors.text }]}>
                  {card.reserveCostOt !== undefined && card.reserveCostOt > 0
                    ? `${card.reserveCostOt} OT to reserve`
                    : card.reserveCostOt === 0
                      ? 'Free reserve'
                      : ''}
                  {card.reserveCostOt !== undefined && card.earnOtLabel ? ' · ' : ''}
                  {card.earnOtLabel ?? ''}
                </Text>
              </View>
            )}

            {/* Value summary */}
            <Text style={[styles.valueSummary, { color: colors.text }]}>{card.valueSummary}</Text>
            {card.description && (
              <Text style={[styles.description, { color: colors.textSecondary }]}>{card.description}</Text>
            )}

            {/* Why label */}
            <Text style={[styles.whyLabel, { color: colors.textSecondary }]}>
              {CARD_DETAIL_WHY_PREFIX}{card.whyLabel}
            </Text>

            {/* Primary CTA */}
            <TouchableOpacity
              style={[styles.primaryCta, { backgroundColor: tierColor }]}
              onPress={handlePrimaryCta}
              activeOpacity={0.85}
            >
              <Ionicons name={primaryCtaIcon} size={22} color="#000" />
              <Text style={styles.primaryCtaText}>{primaryCtaLabel}</Text>
            </TouchableOpacity>

            {/* Secondary actions */}
            <View style={styles.secondaryRow}>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={handleSave}>
                <Ionicons name="bookmark-outline" size={18} color={colors.text} />
                <Text style={[styles.secondaryLabel, { color: colors.text }]}>{CARD_DETAIL_SAVE_LABEL}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={handleAddTray}>
                <Ionicons name="add-circle-outline" size={18} color={colors.text} />
                <Text style={[styles.secondaryLabel, { color: colors.text }]}>{CARD_DETAIL_ADD_TRAY_LABEL}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={handleShowOnMap}>
                <Ionicons name="map-outline" size={18} color={colors.text} />
                <Text style={[styles.secondaryLabel, { color: colors.text }]}>{CARD_DETAIL_MAP_LABEL}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: SPACE.xl,
    paddingBottom: SPACE.xxxl,
    maxHeight: '75%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACE.sm,
    marginBottom: SPACE.base,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginBottom: SPACE.base,
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  heroText: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  partnerName: { fontSize: 20, fontWeight: '800' },
  verifiedIcon: { marginTop: 1 },
  tierLabel: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  infoRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    marginBottom: SPACE.base,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADIUS.sm,
  },
  infoText: { fontSize: 12, fontWeight: '600' },
  valueLineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginBottom: SPACE.md,
  },
  valueLineText: { fontSize: 14, fontWeight: '700', flex: 1 },
  valueSummary: { fontSize: 17, fontWeight: '700', marginBottom: SPACE.xs },
  description: { fontSize: 14, lineHeight: 20, marginBottom: SPACE.sm },
  whyLabel: { fontSize: 11, fontWeight: '600', marginBottom: SPACE.lg },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACE.base,
  },
  primaryCtaText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  secondaryLabel: { fontSize: 12, fontWeight: '600' },
});

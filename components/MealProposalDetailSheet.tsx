/**
 * MealProposalDetailSheet — full detail bottom sheet for meal proposals.
 * Full menu, party size picker, price estimate, CTAs.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ICONS,
  formatCents,
  estimateTotalCents,
  PARTY_SIZE_PRESETS,
  type MealProposal,
} from '../constants/MealProposals';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import { SPACE, RADIUS } from '../constants/DesignTokens';

interface MealProposalDetailSheetProps {
  proposal: MealProposal | null;
  visible: boolean;
  onClose: () => void;
  onAddToTray: (proposal: MealProposal) => void;
  onCreatePlan: (proposal: MealProposal, partySize: number, scope: 'SOLO' | 'SPHERE') => void;
  sphereContext?: { id: string; name: string; type: string } | null;
}

export function MealProposalDetailSheet({
  proposal,
  visible,
  onClose,
  onAddToTray,
  onCreatePlan,
  sphereContext,
}: MealProposalDetailSheetProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [partySize, setPartySize] = useState(2);

  if (!proposal) return null;

  const tierColor = PARTNER_TIER_COLORS[proposal.partnerTier ?? 'silver'];
  const totalEstimate = estimateTotalCents(proposal, partySize);
  const partySizeOptions = PARTY_SIZE_PRESETS.filter(
    (s) => s >= proposal.partySize.minPeople && s <= proposal.partySize.maxPeople,
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <View style={styles.headerRow}>
              <View style={[styles.mealBadge, { backgroundColor: colors.primary + '22' }]}>
                <Ionicons name={MEAL_TYPE_ICONS[proposal.mealType] as any} size={16} color={colors.primary} />
                <Text style={[styles.mealBadgeText, { color: colors.primary }]}>{MEAL_TYPE_LABELS[proposal.mealType]}</Text>
              </View>
              <View style={styles.partnerBadge}>
                <Text style={[styles.partnerName, { color: colors.textSecondary }]}>{proposal.partnerName ?? 'Partner'}</Text>
                {proposal.partnerVerified && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
              </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>{proposal.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{proposal.description}</Text>

            {/* Menu items */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Menu</Text>
            {proposal.menuItems.map((item, i) => (
              <View key={i} style={[styles.menuItemRow, { borderBottomColor: colors.border }]}>
                <View style={styles.menuItemLeft}>
                  <Text style={[styles.menuItemName, { color: colors.text }]}>{item.name}</Text>
                  {item.description && <Text style={[styles.menuItemDesc, { color: colors.textSecondary }]}>{item.description}</Text>}
                </View>
                {item.priceCents != null && item.priceCents > 0 && (
                  <Text style={[styles.menuItemPrice, { color: colors.text }]}>{formatCents(item.priceCents)}</Text>
                )}
              </View>
            ))}

            {/* Party size picker */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Party size</Text>
            <View style={styles.partySizeRow}>
              {partySizeOptions.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.sizeChip,
                    {
                      backgroundColor: partySize === s ? colors.primary + '22' : colors.background,
                      borderColor: partySize === s ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setPartySize(s)}
                >
                  <Text style={[styles.sizeText, { color: partySize === s ? colors.primary : colors.text }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price estimate */}
            <View style={[styles.priceEstimate, { backgroundColor: colors.primary + '0c', borderColor: colors.primary + '33' }]}>
              <Text style={[styles.priceEstimateLabel, { color: colors.textSecondary }]}>Estimated total</Text>
              <Text style={[styles.priceEstimateValue, { color: colors.primary }]}>{formatCents(totalEstimate)}</Text>
              {proposal.pricing.includesTaxTipNote && (
                <Text style={[styles.pricingNote, { color: colors.textSecondary }]}>{proposal.pricing.includesTaxTipNote}</Text>
              )}
            </View>

            {/* CTAs */}
            <View style={styles.ctaSection}>
              <TouchableOpacity
                style={[styles.primaryCta, { backgroundColor: colors.primary }]}
                onPress={() => {
                  onCreatePlan(proposal, partySize, sphereContext ? 'SPHERE' : 'SOLO');
                  onClose();
                }}
              >
                <Ionicons name="flash" size={20} color="#000" />
                <Text style={styles.primaryCtaText}>
                  {sphereContext ? `Create Plan for ${sphereContext.name}` : 'Create Solo Plan'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryCta, { borderColor: colors.primary }]}
                onPress={() => { onAddToTray(proposal); onClose(); }}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.secondaryCtaText, { color: colors.primary }]}>Add to Tray</Text>
              </TouchableOpacity>

              <View style={styles.ctaRow}>
                <TouchableOpacity
                  style={[styles.smallCta, { borderColor: colors.border }]}
                  onPress={() => { onClose(); router.push(`/partner/${proposal.partnerId}` as any); }}
                >
                  <Ionicons name="storefront-outline" size={18} color={colors.text} />
                  <Text style={[styles.smallCtaText, { color: colors.text }]}>View Partner</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallCta, { borderColor: colors.border }]}
                  onPress={() => { onClose(); router.push('/(tabs)' as any); }}
                >
                  <Ionicons name="map-outline" size={18} color={colors.text} />
                  <Text style={[styles.smallCtaText, { color: colors.text }]}>Show on Map</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Report */}
            <TouchableOpacity
              style={styles.reportBtn}
              onPress={() => { onClose(); router.push('/report' as any); }}
            >
              <Text style={[styles.reportText, { color: colors.textSecondary }]}>Report this proposal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, borderWidth: 1, borderBottomWidth: 0, maxHeight: '90%' },
  sheetContent: { padding: SPACE.xl, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: SPACE.base },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.sm },
  mealBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: SPACE.sm, borderRadius: RADIUS.xs },
  mealBadgeText: { fontSize: 12, fontWeight: '800' },
  partnerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  partnerName: { fontSize: 13, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: SPACE.xs },
  description: { fontSize: 14, lineHeight: 20, marginBottom: SPACE.lg },
  sectionLabel: { fontSize: 14, fontWeight: '800', marginBottom: SPACE.sm, marginTop: SPACE.md },
  menuItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACE.sm, borderBottomWidth: 1 },
  menuItemLeft: { flex: 1, marginRight: SPACE.base },
  menuItemName: { fontSize: 14, fontWeight: '600' },
  menuItemDesc: { fontSize: 12, marginTop: 2 },
  menuItemPrice: { fontSize: 14, fontWeight: '700' },
  partySizeRow: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.base },
  sizeChip: { paddingVertical: SPACE.sm, paddingHorizontal: SPACE.base, borderRadius: RADIUS.sm, borderWidth: 1 },
  sizeText: { fontSize: 14, fontWeight: '700' },
  priceEstimate: { borderRadius: RADIUS.md, borderWidth: 1, padding: SPACE.base, alignItems: 'center', marginBottom: SPACE.lg },
  priceEstimateLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  priceEstimateValue: { fontSize: 24, fontWeight: '800' },
  pricingNote: { fontSize: 11, marginTop: 4 },
  ctaSection: { gap: SPACE.sm },
  primaryCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.md, borderRadius: RADIUS.md },
  primaryCtaText: { color: '#000', fontSize: 15, fontWeight: '800' },
  secondaryCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.md, borderRadius: RADIUS.md, borderWidth: 1.5 },
  secondaryCtaText: { fontSize: 15, fontWeight: '700' },
  ctaRow: { flexDirection: 'row', gap: SPACE.sm },
  smallCta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACE.sm, borderRadius: RADIUS.sm, borderWidth: 1 },
  smallCtaText: { fontSize: 13, fontWeight: '600' },
  reportBtn: { alignItems: 'center', paddingVertical: SPACE.lg },
  reportText: { fontSize: 12, fontWeight: '600' },
});

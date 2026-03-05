/**
 * MealCompareSheet — side-by-side comparison of 2–3 tray proposals.
 */

import React from 'react';
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
import { useTheme } from '../hooks/useTheme';
import {
  MEAL_TYPE_LABELS,
  getMealPriceLabel,
  getMenuHighlights,
  getPartySizeLabel,
  type MealProposal,
} from '../constants/MealProposals';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import { SPACE, RADIUS } from '../constants/DesignTokens';

interface MealCompareSheetProps {
  proposals: MealProposal[];
  visible: boolean;
  onClose: () => void;
  onSelect: (proposal: MealProposal) => void;
}

export function MealCompareSheet({ proposals, visible, onClose, onSelect }: MealCompareSheetProps) {
  const { colors } = useTheme();
  const items = proposals.slice(0, 3);

  if (items.length < 2) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text }]}>Compare Picks</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>Tap one to set as primary</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {items.map((p) => {
              const tierColor = PARTNER_TIER_COLORS[p.partnerTier ?? 'silver'];
              const highlights = getMenuHighlights(p.menuItems, 3);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.card, { backgroundColor: colors.background, borderColor: tierColor + '66' }]}
                  onPress={() => { onSelect(p); onClose(); }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.mealBadge, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[styles.mealBadgeText, { color: colors.primary }]}>{MEAL_TYPE_LABELS[p.mealType]}</Text>
                  </View>
                  <Text style={[styles.partnerName, { color: colors.textSecondary }]} numberOfLines={1}>{p.partnerName}</Text>
                  <Text style={[styles.proposalTitle, { color: colors.text }]} numberOfLines={2}>{p.title}</Text>
                  <View style={styles.stat}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Price</Text>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{getMealPriceLabel(p)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Party</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{getPartySizeLabel(p)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Menu</Text>
                    {highlights.map((h, i) => (
                      <Text key={i} style={[styles.menuItem, { color: colors.textSecondary }]} numberOfLines={1}>• {h}</Text>
                    ))}
                  </View>
                  {p.targeting.tags && p.targeting.tags.length > 0 && (
                    <View style={styles.vibeRow}>
                      {p.targeting.tags.slice(0, 2).map((t) => (
                        <View key={t} style={[styles.vibeChip, { backgroundColor: colors.primary + '14' }]}>
                          <Text style={[{ color: colors.primary, fontSize: 10, fontWeight: '600' }]}>{t.replace('_', ' ')}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={[styles.selectCta, { backgroundColor: colors.primary }]}>
                    <Text style={styles.selectCtaText}>Select</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={[styles.closeBtn, { borderColor: colors.border }]} onPress={onClose}>
            <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, borderWidth: 1, borderBottomWidth: 0, padding: SPACE.xl, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: SPACE.base },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  sub: { fontSize: 13, marginBottom: SPACE.base },
  row: { gap: SPACE.sm, paddingBottom: SPACE.base },
  card: { width: 200, borderRadius: RADIUS.md, borderWidth: 1.5, padding: SPACE.base },
  mealBadge: { paddingVertical: 2, paddingHorizontal: SPACE.sm, borderRadius: RADIUS.xs, alignSelf: 'flex-start', marginBottom: SPACE.xs },
  mealBadgeText: { fontSize: 10, fontWeight: '800' },
  partnerName: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  proposalTitle: { fontSize: 14, fontWeight: '700', marginBottom: SPACE.sm, lineHeight: 18 },
  stat: { marginBottom: SPACE.xs },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 13, fontWeight: '700' },
  menuItem: { fontSize: 11, marginTop: 1 },
  vibeRow: { flexDirection: 'row', gap: 4, marginTop: SPACE.sm },
  vibeChip: { paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3 },
  selectCta: { marginTop: SPACE.sm, paddingVertical: SPACE.sm, borderRadius: RADIUS.sm, alignItems: 'center' },
  selectCtaText: { color: '#000', fontSize: 13, fontWeight: '800' },
  closeBtn: { marginTop: SPACE.sm, paddingVertical: SPACE.md, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '600' },
});

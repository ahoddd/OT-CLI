/**
 * MealRecapShareCard — post check-in share card for verified meal completion.
 * Deep links back to OrbSwipe Meal Mode.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ShareToSocialSheet } from './ShareToSocialSheet';
import { MEAL_TYPE_LABELS, type MealProposal } from '../constants/MealProposals';
import { COLORS } from '../constants/Colors';
import { SPACE, RADIUS } from '../constants/DesignTokens';

interface MealRecapShareCardProps {
  visible: boolean;
  onClose: () => void;
  proposal: MealProposal;
  partySizeChosen: number;
  pointsEarned: number;
  topMenuItem?: string;
}

export function MealRecapShareCard({
  visible,
  onClose,
  proposal,
  partySizeChosen,
  pointsEarned,
  topMenuItem,
}: MealRecapShareCardProps) {
  const { colors } = useTheme();
  const [shareVisible, setShareVisible] = useState(false);

  const handleShare = useCallback(() => {
    setShareVisible(true);
  }, []);

  if (!visible) return null;

  const mealLabel = MEAL_TYPE_LABELS[proposal.mealType];
  const message = `${mealLabel} at ${proposal.partnerName ?? 'a great spot'} · party of ${partySizeChosen}${topMenuItem ? ` · Top pick: ${topMenuItem}` : ''}${pointsEarned > 0 ? ` · ${pointsEarned} OT earned` : ''} — Verified on OrbTap`;

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.glow, { backgroundColor: (COLORS.neonBlue?.[0] ?? '#60a5fa') + '18' }]} />

        <View style={styles.verifiedStamp}>
          <Ionicons name="checkmark-done-circle" size={24} color="#22c55e" />
          <Text style={[styles.verifiedText, { color: '#22c55e' }]}>Verified</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Meal Check-in</Text>
        <Text style={[styles.partnerName, { color: colors.textSecondary }]}>
          {proposal.partnerName} · {mealLabel}
        </Text>
        <Text style={[styles.partyInfo, { color: colors.textSecondary }]}>Party of {partySizeChosen}</Text>

        {topMenuItem && (
          <View style={[styles.topPick, { backgroundColor: colors.primary + '14' }]}>
            <Text style={[styles.topPickLabel, { color: colors.primary }]}>Top pick: {topMenuItem}</Text>
          </View>
        )}

        {pointsEarned > 0 && (
          <Text style={[styles.points, { color: colors.text }]}>{pointsEarned} OT Points earned</Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.primary }]} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#000" />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.doneBtn, { borderColor: colors.border }]} onPress={onClose}>
            <Text style={[styles.doneBtnText, { color: colors.text }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ShareToSocialSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        payload={{ message, title: 'Meal Check-in', url: 'https://orbtap.web.app/meal-mode' }}
        label="Share meal recap"
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACE.xl, overflow: 'hidden' },
  glow: { position: 'absolute', top: -40, left: -40, right: -40, height: 120, borderRadius: 60 },
  verifiedStamp: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, marginBottom: SPACE.sm },
  verifiedText: { fontSize: 13, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  partnerName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  partyInfo: { fontSize: 12, marginBottom: SPACE.sm },
  topPick: { paddingVertical: SPACE.xs, paddingHorizontal: SPACE.sm, borderRadius: RADIUS.xs, alignSelf: 'flex-start', marginBottom: SPACE.sm },
  topPickLabel: { fontSize: 12, fontWeight: '700' },
  points: { fontSize: 15, fontWeight: '800', marginBottom: SPACE.base },
  actions: { flexDirection: 'row', gap: SPACE.sm },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.md, borderRadius: RADIUS.md },
  shareBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  doneBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACE.md, borderRadius: RADIUS.md, borderWidth: 1 },
  doneBtnText: { fontSize: 15, fontWeight: '700' },
});

/**
 * OrbSwipe v1.1 — "Tonight Recap" share card after Fuse completion (verified step done).
 * Reuses ShareToSocialSheet; deep link back to OrbSwipe.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ShareToSocialSheet } from './ShareToSocialSheet';
import { orbswipeDeepLink } from '../constants/AppLinks';
import { COLORS } from '../constants/Colors';
import {
  TONIGHT_RECAP_TITLE,
  TONIGHT_RECAP_SHARE_HOOK,
  TONIGHT_RECAP_SHARE_BUTTON,
} from '../constants/ViralCopy';

export interface TonightRecapShareCardProps {
  visible: boolean;
  onClose: () => void;
  /** 1–2 completed stop names (partner names). */
  stopNames: string[];
  /** OT Points potential (or earned) — plan says "OT Potential" not "OT Earned" in recap. */
  pointsEarned: number;
  /** When true, label as "OT Potential" instead of "OT earned". */
  isPotential?: boolean;
  /** Optional savings line (e.g. "Saved $5 tonight"). */
  savingsLine?: string;
  /** Called when the user taps "Plan another night" — navigate back to OrbSwipe. */
  onPlanAnother?: () => void;
  /** Called when the user taps "View map" — navigate to the map tab. */
  onViewMap?: () => void;
}

export function TonightRecapShareCard({
  visible,
  onClose,
  stopNames,
  pointsEarned,
  isPotential = true,
  savingsLine,
  onPlanAnother,
  onViewMap,
}: TonightRecapShareCardProps) {
  const { colors } = useTheme();
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; title: string; url: string } | null>(null);

  const handleShare = useCallback(() => {
    const stops = stopNames.slice(0, 2).join(' → ');
    const otLine = pointsEarned > 0 ? (isPotential ? `${pointsEarned} OT potential. ` : `${pointsEarned} OT earned. `) : '';
    const message = stops
      ? `${stops}. ${otLine}${savingsLine ? savingsLine + ' ' : ''}${TONIGHT_RECAP_SHARE_HOOK}`
      : TONIGHT_RECAP_SHARE_HOOK;
    setSharePayload({ message, title: TONIGHT_RECAP_TITLE, url: orbswipeDeepLink() });
    setShareSheetVisible(true);
  }, [stopNames, pointsEarned, isPotential, savingsLine]);

  if (!visible) return null;

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.glow, { backgroundColor: (COLORS.neonBlue?.[0] ?? '#60a5fa') + '18' }]} />
        <Text style={[styles.title, { color: colors.text }]}>{TONIGHT_RECAP_TITLE}</Text>
        {stopNames.length > 0 && (
          <Text style={[styles.stops, { color: colors.textSecondary }]} numberOfLines={2}>
            {stopNames.slice(0, 2).join(' · ')}
          </Text>
        )}
        <View style={styles.verifiedRow}>
          <Ionicons name="checkmark-done-circle" size={18} color={COLORS.success ?? '#22c55e'} />
          <Text style={[styles.verifiedText, { color: colors.textSecondary }]}>Verified</Text>
        </View>
        {pointsEarned > 0 && (
          <Text style={[styles.points, { color: colors.text }]}>{pointsEarned} OT {isPotential ? 'Potential' : 'earned'}</Text>
        )}
        {savingsLine && (
          <Text style={[styles.savings, { color: colors.textSecondary }]}>{savingsLine}</Text>
        )}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text style={styles.shareBtnText}>{TONIGHT_RECAP_SHARE_BUTTON}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.doneBtn, { borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnText, { color: colors.text }]}>Done</Text>
          </TouchableOpacity>
        </View>
        {(onPlanAnother ?? onViewMap) && (
          <View style={styles.nextRow}>
            {onPlanAnother && (
              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: (COLORS.neonBlue?.[0] ?? '#60a5fa') + '18', borderColor: (COLORS.neonBlue?.[0] ?? '#60a5fa') + '44' }]}
                onPress={onPlanAnother}
                activeOpacity={0.85}
                accessibilityLabel="Plan another night with OrbSwipe"
                accessibilityRole="button"
              >
                <Ionicons name="swap-horizontal" size={16} color={COLORS.neonBlue?.[0] ?? '#60a5fa'} />
                <Text style={[styles.nextBtnText, { color: COLORS.neonBlue?.[0] ?? '#60a5fa' }]} numberOfLines={1}>Plan another night</Text>
              </TouchableOpacity>
            )}
            {onViewMap && (
              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: colors.surfaceHighlight ?? colors.surface, borderColor: colors.border }]}
                onPress={onViewMap}
                activeOpacity={0.85}
                accessibilityLabel="View map"
                accessibilityRole="button"
              >
                <Ionicons name="map" size={16} color={colors.text} />
                <Text style={[styles.nextBtnText, { color: colors.text }]} numberOfLines={1}>View map</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label={TONIGHT_RECAP_SHARE_BUTTON}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    height: 120,
    borderRadius: 60,
  },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  stops: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  verifiedText: { fontSize: 12, fontWeight: '700' },
  points: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  savings: { fontSize: 12, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  doneBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  doneBtnText: { fontSize: 15, fontWeight: '700' },
  nextRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  nextBtnText: { fontSize: 13, fontWeight: '700' },
});

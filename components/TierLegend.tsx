import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { PartnerTier } from '../constants/PartnerTiers';
import { PARTNER_TIER_COLORS, PARTNER_TIER_DESCRIPTIONS, PARTNER_TIER_LABELS } from '../constants/PartnerTiers';
import { useTheme } from '../hooks/useTheme';
import { safeHaptics } from '../utils/safeHaptics';

const PARTNER_TIERS: PartnerTier[] = ['silver', 'gold', 'platinum'];

const TAB_BAR_SAFE = 56;

const TOP_INSET = 12;

interface TierLegendProps {
  /** When true, show "Gold = Mission stop" in the legend */
  hasMissionOrbs?: boolean;
  /** When 'top', pin to top-right of map (avoids overlapping bottom tray). Default 'bottom'. */
  position?: 'top' | 'bottom';
}

export function TierLegend({ hasMissionOrbs, position = 'bottom' }: TierLegendProps = {}) {
  const [expanded, setExpanded] = useState(false);
  const [showWhatTiersMean, setShowWhatTiersMean] = useState(false);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 8) + TAB_BAR_SAFE;

  const openWhatTiersMean = () => {
    safeHaptics.selectionAsync();
    setShowWhatTiersMean(true);
  };

  const wrapperPosition =
    position === 'top'
      ? { top: TOP_INSET, right: 12 }
      : { bottom: bottomOffset, right: 12 };

  return (
    <>
      <View style={[styles.wrapper, wrapperPosition]}>
        <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
          <TouchableOpacity
            style={styles.trigger}
            onPress={() => { safeHaptics.selectionAsync(); setExpanded((e) => !e); }}
            activeOpacity={0.8}
          >
            <View style={styles.triggerContent}>
              <View style={styles.dotsRow}>
                {PARTNER_TIERS.map((tier) => (
                  <View
                    key={tier}
                    style={[styles.dot, { backgroundColor: PARTNER_TIER_COLORS[tier] }]}
                  />
                ))}
              </View>
              <Text style={[styles.triggerLabel, { color: colors.textSecondary }]}>Partner tiers</Text>
              <Text style={[styles.triggerHint, { color: colors.textSecondary }]} numberOfLines={1}>Silver · Gold · Platinum</Text>
            </View>
            <Ionicons
              name={expanded ? 'chevron-down' : 'chevron-up'}
              size={12}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {expanded && (
            <View style={[styles.list, { borderTopColor: colors.border }]}>
              {PARTNER_TIERS.map((tier) => (
                <View key={tier} style={styles.row}>
                  <View style={[styles.legendDot, { backgroundColor: PARTNER_TIER_COLORS[tier] }]} />
                  <Text style={[styles.legendLabel, { color: colors.text }]}>{PARTNER_TIER_LABELS[tier]}</Text>
                </View>
              ))}
              {hasMissionOrbs && (
                <View style={styles.row}>
                  <View style={[styles.legendDot, { backgroundColor: '#fbbf24' }]} />
                  <Text style={[styles.legendLabel, { color: colors.text }]}>Mission stop</Text>
                </View>
              )}
              <Text style={[styles.verifiedTagline, { color: colors.textSecondary }]}>Verified spots · Tap orbs for rewards</Text>
              <TouchableOpacity
                style={[styles.whatTiersBtn, { backgroundColor: colors.border + '40', borderColor: colors.border }]}
                onPress={openWhatTiersMean}
                activeOpacity={0.8}
              >
                <Ionicons name="information-circle-outline" size={16} color={colors.text} />
                <Text style={[styles.whatTiersText, { color: colors.text }]}>What tiers mean</Text>
              </TouchableOpacity>
            </View>
          )}
        </BlurView>
      </View>

      <Modal visible={showWhatTiersMean} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowWhatTiersMean(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Partner tier differences</Text>
              <TouchableOpacity onPress={() => setShowWhatTiersMean(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {PARTNER_TIERS.map((tier) => (
              <View key={tier} style={[styles.modalRow, { borderTopColor: colors.border }]}>
                <View style={[styles.modalDot, { backgroundColor: PARTNER_TIER_COLORS[tier] }]} />
                <View style={styles.modalTextWrap}>
                  <Text style={[styles.modalTierName, { color: colors.text }]}>{PARTNER_TIER_LABELS[tier]}</Text>
                  <Text style={[styles.modalTierDesc, { color: colors.textSecondary }]}>{PARTNER_TIER_DESCRIPTIONS[tier]}</Text>
                </View>
              </View>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    maxWidth: 160,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 10,
  },
  blur: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  triggerContent: { alignItems: 'center', gap: 0 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  triggerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  triggerHint: { fontSize: 8, fontWeight: '600', marginTop: 1, opacity: 0.9 },
  list: {
    borderTopWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, fontWeight: '600' },
  verifiedTagline: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3, marginTop: 4, marginBottom: 2 },
  whatTiersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  whatTiersText: { fontSize: 11, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  modalDot: { width: 12, height: 12, borderRadius: 6, marginTop: 2 },
  modalTextWrap: { flex: 1, minWidth: 0 },
  modalTierName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  modalTierDesc: { fontSize: 13, lineHeight: 18 },
});

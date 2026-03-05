/**
 * Stamp Cards™ — Reward Locker: earned (unredeemed) rewards with Redeem CTA.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SPACE, RADIUS } from '../constants/DesignTokens';
import type { RewardLockerItem } from '../hooks/useStampCards';

interface RewardLockerSectionProps {
  items: RewardLockerItem[];
  onRedeemPress?: (item: RewardLockerItem) => void;
  compact?: boolean;
}

export function RewardLockerSection({ items, onRedeemPress, compact }: RewardLockerSectionProps) {
  const { colors } = useTheme();
  const [showQR, setShowQR] = useState<RewardLockerItem | null>(null);
  const { width } = useWindowDimensions();
  const qrSize = Math.min(width * 0.45, 200);

  if (items.length === 0) return null;

  const handleRedeem = (item: RewardLockerItem) => {
    if (onRedeemPress) {
      onRedeemPress(item);
      return;
    }
    setShowQR(item);
  };

  return (
    <>
      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>REWARD LOCKER</Text>
        {items.map((item) => {
          const partnerName = item.program?.name ? `${item.program.name} · ${item.partnerId}` : item.partnerId;
          const expiresAt = item.reward.expiresAt;
          const expiresLabel = expiresAt ? `Expires ${new Date(expiresAt).toLocaleDateString()}` : null;
          return (
            <View key={item.stateId} style={[styles.row, styles.ticketRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.ticketNotch, styles.ticketNotchLeft, { backgroundColor: colors.background }]} />
              <View style={[styles.ticketNotch, styles.ticketNotchRight, { backgroundColor: colors.background }]} />
              <View style={styles.rowContent}>
                <Text style={[styles.rewardLabel, { color: colors.text }]} numberOfLines={1}>{item.reward.rewardLabel}</Text>
                <Text style={[styles.partner, { color: colors.textSecondary }]} numberOfLines={1}>{partnerName}</Text>
                {expiresLabel ? <Text style={[styles.expires, { color: colors.textSecondary }]}>{expiresLabel}</Text> : null}
              </View>
              <TouchableOpacity
                style={[styles.redeemBtn, { backgroundColor: (colors as { primary?: string }).primary ?? '#3b82f6' }]}
                onPress={() => handleRedeem(item)}
                accessibilityLabel="Redeem now"
                accessibilityRole="button"
              >
                <Text style={styles.redeemBtnText}>Redeem now</Text>
                <Ionicons name="qr-code" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <Modal visible={showQR != null} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowQR(null)}>
          <View style={[styles.modalBox, { backgroundColor: colors.background }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Show to staff</Text>
              <TouchableOpacity onPress={() => setShowQR(null)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {showQR && (
                <>
                  <Text style={[styles.modalReward, { color: colors.text }]}>{showQR.reward.rewardLabel}</Text>
                  <View style={[styles.qrWrap, { backgroundColor: '#fff' }]}>
                    <QRCode value={showQR.stateId} size={qrSize} backgroundColor="#fff" color="#0a0a0d" />
                  </View>
                  <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
                    Staff scans this QR in Partner Dashboard → Redeem Stamp Reward to complete redemption.
                  </Text>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: SPACE.base },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: SPACE.sm, paddingHorizontal: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACE.sm,
  },
  ticketRow: {
    position: 'relative',
    borderStyle: 'dashed',
    marginHorizontal: SPACE.sm,
  },
  ticketNotch: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    top: '50%',
    marginTop: -8,
  },
  ticketNotchLeft: { left: -8 },
  ticketNotchRight: { right: -8 },
  rowContent: { flex: 1, marginRight: SPACE.md },
  rewardLabel: { fontSize: 16, fontWeight: '700' },
  partner: { fontSize: 13, marginTop: 2 },
  expires: { fontSize: 12, marginTop: 2 },
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.base,
    borderRadius: RADIUS.sm,
  },
  redeemBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { width: '100%', maxWidth: 340, borderRadius: RADIUS.lg, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACE.base, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { padding: SPACE.xl, alignItems: 'center' },
  modalReward: { fontSize: 16, fontWeight: '600', marginBottom: SPACE.base },
  qrWrap: { padding: SPACE.base, borderRadius: RADIUS.md, marginBottom: SPACE.base },
  modalHint: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});

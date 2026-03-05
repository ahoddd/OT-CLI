import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../hooks/useTheme';
import { redeemDeepLink } from '../constants/AppLinks';
import type { Perk } from '../constants/MockData';
import { Ionicons } from '@expo/vector-icons';

interface PerkQRModalProps {
  visible: boolean;
  onClose: () => void;
  perk: Perk;
  partnerName?: string;
}

/** Points to show in QR (same as scan flow: partnerId, perkId, points). */
function perkPoints(perk: Perk): number {
  const c = perk.cost;
  return typeof c === 'number' && !Number.isNaN(c) ? Math.max(0, Math.floor(c)) : 0;
}

export function PerkQRModal({ visible, onClose, perk, partnerName }: PerkQRModalProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const qrSize = Math.min(width * 0.5, 220);
  const redeemUrl = redeemDeepLink(perk.partnerId, perk.id, perkPoints(perk));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="Close"
        accessibilityRole="button"
      >
        <View style={[styles.box, { backgroundColor: colors.background }]} onStartShouldSetResponder={() => true}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Redeem QR</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            <Text style={[styles.perkTitle, { color: colors.text }]} numberOfLines={2}>{perk.title}</Text>
            {partnerName ? <Text style={[styles.partnerName, { color: colors.textSecondary }]}>{partnerName}</Text> : null}
            <View style={[styles.qrWrap, { backgroundColor: '#fff' }]}>
              <QRCode value={redeemUrl} size={qrSize} backgroundColor="#fff" color="#0a0a0d" />
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Have customers show their redemption QR in the app (Deal → Redeem at venue). Staff scan it in the Scan tab to verify and credit them.
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 4 },
  body: { padding: 20, alignItems: 'center' },
  perkTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  partnerName: { fontSize: 13, marginBottom: 16 },
  qrWrap: { padding: 12, borderRadius: 12, marginBottom: 12 },
  hint: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});

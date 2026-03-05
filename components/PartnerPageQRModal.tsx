/**
 * Partner page QR modal — for in-store display. Customers scan to open partner page.
 */
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../hooks/useTheme';
import { partnerDeepLink } from '../constants/AppLinks';
import { Ionicons } from '@expo/vector-icons';

interface PartnerPageQRModalProps {
  visible: boolean;
  onClose: () => void;
  partnerId: string;
  partnerName?: string;
}

export function PartnerPageQRModal({ visible, onClose, partnerId, partnerName }: PartnerPageQRModalProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const qrSize = Math.min(width * 0.5, 220);
  const url = partnerDeepLink(partnerId);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button">
        <View style={[styles.box, { backgroundColor: colors.background }]} onStartShouldSetResponder={() => true}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Your QR Code</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            {partnerName ? <Text style={[styles.partnerName, { color: colors.text }]}>{partnerName}</Text> : null}
            <View style={[styles.qrWrap, { backgroundColor: '#fff' }]}>
              <QRCode value={url} size={qrSize} backgroundColor="#fff" color="#0a0a0d" />
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Display this QR at your counter. Customers scan to open your OrbTap page and earn OT Points.
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  box: { width: '100%', maxWidth: 340, borderRadius: 20, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  closeBtn: { padding: 8 },
  body: { padding: 20, alignItems: 'center' },
  partnerName: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  qrWrap: { padding: 16, borderRadius: 12, marginBottom: 16 },
  hint: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});

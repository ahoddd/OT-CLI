/**
 * Stamp Cards™ — Partner: redeem a customer's stamp reward (enter code or scan customer's QR).
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { useFlags } from '../../components/FlagContext';
import { redeemStampReward } from '../../services/stampCardsApi';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { COLORS } from '../../constants/Colors';
import { showErrorAlert, alert as showAlert } from '../../utils/alert';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { useI18n } from '../../context/I18nContext';

export default function PartnerStampRedeemScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const { partners } = usePartners();
  const { myPartner } = useMyPartner();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanScanned, setScanScanned] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  const enabled = Boolean(flags.moduleStampCards && flags.stampCardsRewardClaim);
  if (!enabled) return <Redirect href="/partner/dashboard" />;
  if (!(myPartner ?? partners[0])) return <Redirect href="/(tabs)" />;

  useEffect(() => {
    if (!showScanner) return;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (!cancelled) setCameraPermission(status === 'granted');
      } catch {
        if (!cancelled) setCameraPermission(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showScanner]);

  const handleRedeem = async (token: string) => {
    const t = token.trim();
    if (!t) {
      showErrorAlert('Code required', 'Ask the customer to show their Reward Locker and display the redeem QR. Enter the code below or tap Scan QR.');
      return;
    }
    setLoading(true);
    const result = await redeemStampReward({ rewardToken: t });
    setLoading(false);
    if (result.success) {
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Redeemed', result.idempotent ? 'This reward was already redeemed.' : 'Reward redeemed. The customer has used their stamp card reward.', () => {
        setCode('');
        setShowScanner(false);
      });
    } else {
      showErrorAlert('Could not redeem', result.message ?? 'Invalid or already-redeemed code. Ask the customer to show the QR again.');
    }
  };

  const onConfirmRedeem = () => handleRedeem(code);

  const onBarCodeScanned = ({ data }: { data: string }) => {
    if (scanScanned) return;
    setScanScanned(true);
    handleRedeem(data);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Redeem Stamp Reward</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          The customer shows their Reward Locker in the app and displays a QR or code. Scan the QR or enter the code below.
        </Text>
        <TouchableOpacity
          style={[styles.scanBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => { setShowScanner(true); setScanScanned(false); }}
        >
          <Ionicons name="qr-code" size={24} color={colors.primary} />
          <Text style={[styles.scanBtnText, { color: colors.text }]}>Scan customer QR</Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          placeholder="Or paste code from customer"
          placeholderTextColor={colors.textSecondary}
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: COLORS.success ?? '#22c55e' }]}
          onPress={onConfirmRedeem}
          disabled={loading || !code.trim()}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Confirm redeem</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={showScanner} animationType="slide" onRequestClose={() => setShowScanner(false)}>
        <View style={[styles.modalWrap, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowScanner(false)} style={styles.backBtn}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Scan customer's reward QR</Text>
            <View style={styles.backBtn} />
          </View>
          {Platform.OS === 'web' ? (
            <View style={styles.cameraPlaceholder}>
              <Text style={[styles.cameraPlaceholderText, { color: colors.textSecondary }]}>Camera not available on web. Enter the code manually.</Text>
            </View>
          ) : cameraPermission === false ? (
            <View style={styles.cameraPlaceholder}>
              <Text style={[styles.cameraPlaceholderText, { color: colors.text }]}>Camera access is required to scan. Enter the code manually or enable camera in settings.</Text>
            </View>
          ) : cameraPermission === true ? (
            <View style={styles.cameraWrap}>
              <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanScanned ? undefined : onBarCodeScanned} />
              <View style={styles.scanOverlay} pointerEvents="none">
                <Text style={[styles.scanOverlayText, { color: '#fff' }]}>Align the customer's reward QR in the frame</Text>
              </View>
            </View>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.cameraPlaceholderText, { color: colors.textSecondary }]}>Requesting camera…</Text>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.sm, paddingVertical: SPACE.base, borderBottomWidth: 1 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  body: { padding: SPACE.base },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: SPACE.base },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: SPACE.base, borderRadius: RADIUS.sm, borderWidth: 1, marginBottom: SPACE.base },
  scanBtnText: { fontSize: 16, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACE.base, fontSize: 16, marginBottom: SPACE.base },
  btn: { paddingVertical: SPACE.base, borderRadius: RADIUS.sm, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalWrap: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.sm, paddingVertical: SPACE.base, borderBottomWidth: 1 },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  cameraWrap: { flex: 1, position: 'relative' },
  scanOverlay: { position: 'absolute', bottom: 40, left: 20, right: 20, alignItems: 'center' },
  scanOverlayText: { fontSize: 14, fontWeight: '600' },
  cameraPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACE.xl },
  cameraPlaceholderText: { fontSize: 16, textAlign: 'center', marginTop: SPACE.base },
});

/**
 * OrbPilot™ — Scan QR: camera view to scan partner QR and initiate verification.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { useTheme } from '../../hooks/useTheme';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { pilotVerifyInitiate } from '../../services/orbPilot';
import { useI18n } from '../../context/I18nContext';

const PILOT_PURPLE = '#7C3AED';

export default function OrbPilotScan() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ slotId: string }>();
  const { slotId } = params;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);

  // Request camera permission on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Camera.getCameraPermissionsAsync();
        if (!cancelled) {
          if (status === 'granted') {
            setHasPermission(true);
          } else {
            const { status: newStatus } = await Camera.requestCameraPermissionsAsync();
            if (!cancelled) setHasPermission(newStatus === 'granted');
          }
        }
      } catch {
        if (!cancelled) setHasPermission(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Reset scanned state on focus
  useFocusEffect(useCallback(() => {
    setScanned(false);
    setProcessing(false);
  }, []));

  const requestPermission = async () => {
    setRequestingPermission(true);
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } finally {
      setRequestingPermission(false);
    }
  };

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      // Get current location for geo-verify
      let lat = 0;
      let lng = 0;
      let accuracyM = 999;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          accuracyM = loc.coords.accuracy ?? 999;
        }
      } catch {
        // Location optional — server will enforce geo if required
      }

      // Extract partnerId from QR payload (orbtap://pilot?partner=X&slot=Y or raw JSON)
      let partnerId = '';
      try {
        const url = new URL(data);
        partnerId = url.searchParams.get('partner') ?? url.searchParams.get('partnerId') ?? '';
      } catch {
        try {
          const parsed = JSON.parse(data) as Record<string, string>;
          partnerId = parsed.partnerId ?? parsed.partner ?? '';
        } catch {
          partnerId = '';
        }
      }

      const res = await pilotVerifyInitiate({
        partnerId,
        slotId,
        qrPayload: data,
        lat,
        lng,
        accuracyM,
      });

      if (res.success) {
        if (res.requiresPin) {
          router.replace({
            pathname: '/orbpilot/pin',
            params: {
              attemptId: res.attemptId,
              nonce: res.nonce,
              slotId,
              expiresISO: res.expiresISO,
              pinLength: String(res.pinLength),
            },
          });
        } else {
          router.replace({
            pathname: '/orbpilot/result',
            params: {
              outcome: 'verified',
              visitId: '',
              rewardPoints: '0',
              rejectionReason: '',
            },
          });
        }
      } else {
        Alert.alert(
          t('orbpilot.scanFailed'),
          res.message ?? t('orbpilot.scanFailedMessage'),
          [{ text: t('orbpilot.tryAgain'), onPress: () => { setScanned(false); setProcessing(false); } }],
        );
      }
    } catch {
      Alert.alert(
        t('orbpilot.error'),
        t('orbpilot.errorMessage'),
        [{ text: t('orbpilot.retry'), onPress: () => { setScanned(false); setProcessing(false); } }],
      );
    }
  }, [scanned, processing, slotId, router]);

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('orbpilot.scanTitle')}</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centerWrap}>
          <Ionicons name="phone-portrait-outline" size={56} color={colors.textSecondary} />
          <Text style={[styles.webMsg, { color: colors.text }]}>Camera scan works in the app</Text>
          <Text style={[styles.webSub, { color: colors.textSecondary }]}>Use the OrbTap mobile app to scan partner QR codes.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={PILOT_PURPLE} style={{ marginTop: 60 }} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('orbpilot.scanTitle')}</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centerWrap}>
          <Ionicons name="camera-outline" size={56} color={colors.textSecondary} />
          <Text style={[styles.webMsg, { color: colors.text }]}>Camera access required</Text>
          <Text style={[styles.webSub, { color: colors.textSecondary }]}>OrbPilot needs camera access to scan partner QR codes.</Text>
          <TouchableOpacity
            style={[styles.permBtn, { backgroundColor: PILOT_PURPLE }]}
            onPress={requestPermission}
            disabled={requestingPermission}
          >
            {requestingPermission
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.permBtnText}>Enable Camera</Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Top overlay */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backCircle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={PILOT_PURPLE} />
            <Text style={styles.topTitle}>OrbPilot Scan</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* Viewfinder frame */}
      <View style={styles.viewfinderWrap} pointerEvents="none">
        <View style={styles.viewfinder}>
          {/* Corner marks */}
          <View style={[styles.corner, styles.cornerTL, { borderColor: PILOT_PURPLE }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: PILOT_PURPLE }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: PILOT_PURPLE }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: PILOT_PURPLE }]} />
        </View>
      </View>

      {/* Bottom instruction */}
      <View style={styles.bottomOverlay} pointerEvents="none">
        <View style={[styles.instructionPill, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
          {processing ? (
            <>
              <ActivityIndicator size="small" color={PILOT_PURPLE} />
              <Text style={styles.instructionText}>Verifying...</Text>
            </>
          ) : (
            <>
              <Ionicons name="qr-code-outline" size={18} color="#fff" />
              <Text style={styles.instructionText}>Point at partner's QR code</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.md,
    paddingVertical: 12,
  },
  title: { fontSize: 17, fontWeight: '700' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  webMsg: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  webSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  loadingText: { textAlign: 'center', marginTop: 16, fontSize: 14 },
  permBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: RADIUS.md, marginTop: 8 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // Camera overlay styles
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.md,
    paddingVertical: 10,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  topTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  viewfinderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 230,
    height: 230,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderWidth: CORNER_THICKNESS,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  bottomOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
  },
  instructionText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

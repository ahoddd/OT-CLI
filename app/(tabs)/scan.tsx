import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Linking, Switch } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScannerHUD, type GpsLockState } from '../../components/ScannerHUD';
import { OrbTapLogoMark } from '../../components/OrbTapLogoMark';
import { COLORS } from '../../constants/Colors';
import { safeHaptics, Haptics } from '../../utils/safeHaptics';
import { showErrorAlert, alert as showAlert } from '../../utils/alert';
import { useWallet } from '../../hooks/useWallet';
import { useSocial } from '../../hooks/useSocial';
import { usePartners } from '../../context/PartnersContext';
import { OTPointsBalanceLink } from '../../components/OTPointsBalanceLink';
import { useBadges } from '../../hooks/useBadges';
import { useTheme } from '../../hooks/useTheme';
import { logVerifiedWin } from '../../services/analytics';
import { verifyPerkRedeemToken } from '../../services/verifyApi';
import { useFlags } from '../../components/FlagContext';
import { useI18n } from '../../context/I18nContext';
import { earnStamp } from '../../services/stampCardsApi';
import { APP_STORE_URL, PLAY_STORE_URL } from '../../constants/AppLinks';
import { Ionicons } from '@expo/vector-icons';

const SCAN_CAMERA_CONSENT_KEY = 'orbtap_scan_camera_consent';
type ScanCameraConsent = 'granted' | 'denied' | null;

/** Stamp Card QR: orbtap://stamp?partnerId=X&programId=Y&token=Z (optional token for idempotency). */
function parseStampUrl(data: string): { partnerId: string; programId: string; tokenId?: string } | null {
  try {
    const url = new URL(data);
    if (url.protocol !== 'orbtap:' || url.host?.toLowerCase() !== 'stamp') return null;
    const partnerId = url.searchParams.get('partnerId')?.trim() ?? '';
    const programId = url.searchParams.get('programId')?.trim() ?? '';
    if (!partnerId || !programId) return null;
    const tokenId = url.searchParams.get('token')?.trim();
    return { partnerId, programId, tokenId: tokenId && tokenId.length >= 4 ? tokenId : undefined };
  } catch {
    return null;
  }
}

/** Legacy: orbtap://redeem?partner=P1&perk=K1&points=50. Token: orbtap://redeem?t=TOKEN (user-bound one-time; only partner can verify). */
function parseRedeemUrl(data: string):
  | { kind: 'legacy'; partnerId: string; perkId: string; points: number }
  | { kind: 'token'; token: string }
  | null {
  try {
    const url = new URL(data);
    if (url.protocol !== 'orbtap:' || url.host?.toLowerCase() !== 'redeem') return null;
    const token = url.searchParams.get('t')?.trim();
    if (token && token.length >= 8) return { kind: 'token', token };
    const partnerId = url.searchParams.get('partner') ?? '';
    const perkId = url.searchParams.get('perk') ?? '';
    const pointsStr = url.searchParams.get('points') ?? '';
    const points = parseInt(pointsStr, 10);
    if (!partnerId || !perkId || Number.isNaN(points) || points < 0) return null;
    return { kind: 'legacy', partnerId, perkId, points };
  } catch {
    return null;
  }
}

export default function ScanScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { flags } = useFlags();
  const { balance, createVerifiedAction, canRedeem, registerStampAction } = useWallet();
  const { circles, addSphereXp } = useSocial();
  const { getPartner, perks } = usePartners();
  const earningRange = useMemo(() => {
    const costs = perks.map((p) => p.cost).filter((c) => c > 0);
    if (costs.length === 0) return '30–80 OT';
    const min = Math.min(...costs);
    const max = Math.max(...costs);
    return min === max ? `${min} OT` : `${min}–${max} OT`;
  }, [perks]);
  const { earnBadge } = useBadges();
  const [storedConsent, setStoredConsent] = useState<ScanCameraConsent | 'loading'>('loading');
  const [userWantsCamera, setUserWantsCamera] = useState<boolean | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [gpsState, setGpsState] = useState<GpsLockState>('searching');
  const [userGps, setUserGps] = useState<{ lat: number; lng: number } | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const stampScanEnabled = Boolean(flags.moduleStampCards && flags.stampCardsQrStamping);

  // Success flash overlay (one-shot on successful scan; no duplicate frame — ScannerHUD is the single reticle)
  const successFlashOpacity = useSharedValue(0);
  const runSuccessFlash = useCallback(() => {
    successFlashOpacity.value = 0;
    successFlashOpacity.value = withSequence(
      withTiming(0.5, { duration: 80 }),
      withTiming(0, { duration: 320 })
    );
  }, []);
  const successFlashStyle = useAnimatedStyle(() => ({
    opacity: successFlashOpacity.value,
  }));

  // GPS location for anti-cheat proximity check
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setGpsState('unavailable');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) {
          setUserGps({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          setGpsState('locked');
        }
      } catch {
        if (!cancelled) setGpsState('unavailable');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.webPlaceholderWrap}>
          <Text style={[styles.webPlaceholderTitle, { color: colors.text }]}>{t('scan.scanWorksInApp')}</Text>
          <Text style={[styles.webPlaceholderSub, { color: colors.textSecondary }]}>
            {t('scan.scanWorksSub')}
          </Text>
          <View style={styles.storeRow}>
            <TouchableOpacity style={[styles.storeBtn, { backgroundColor: colors.primary }]} onPress={() => Linking.openURL(APP_STORE_URL)} activeOpacity={0.9}>
              <Text style={styles.storeBtnText}>{t('scan.appStore')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.storeBtn, { backgroundColor: colors.primary }]} onPress={() => Linking.openURL(PLAY_STORE_URL)} activeOpacity={0.9}>
              <Text style={styles.storeBtnText}>{t('scan.googlePlay')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SCAN_CAMERA_CONSENT_KEY);
        const consent: ScanCameraConsent = raw === 'granted' || raw === 'denied' ? raw : null;
        if (!cancelled) setStoredConsent(consent);
      } catch {
        if (!cancelled) setStoredConsent(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const shouldUseCamera = storedConsent === 'granted' || userWantsCamera === true;
  useEffect(() => {
    if (!shouldUseCamera) {
      setHasPermission(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Camera.getCameraPermissionsAsync();
        if (!cancelled) setHasPermission(status === 'granted');
      } catch {
        if (!cancelled) setHasPermission(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shouldUseCamera]);

  useFocusEffect(useCallback(() => {
    setScanned(false);
  }, []));

  const saveConsent = async (value: 'granted' | 'denied') => {
    try {
      await AsyncStorage.setItem(SCAN_CAMERA_CONSENT_KEY, value);
      setStoredConsent(value);
    } catch {}
  };

  const onConsentYes = async () => {
    if (rememberChoice) await saveConsent('granted');
    setUserWantsCamera(true);
  };

  const onConsentNo = async () => {
    if (rememberChoice) {
      await saveConsent('denied');
      setStoredConsent('denied');
    }
    setUserWantsCamera(false);
  };

  const openCameraAgain = () => {
    setStoredConsent(null);
    setUserWantsCamera(null);
    setRememberChoice(false);
  };

  const requestPermission = async () => {
    setRequestingPermission(true);
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } finally {
      setRequestingPermission(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    runSuccessFlash();
    processScan(data);
  };

  const processScan = async (data: string) => {
    const stampParsed = stampScanEnabled ? parseStampUrl(data) : null;
    if (stampParsed) {
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
        const result = await earnStamp({
          partnerId: stampParsed.partnerId,
          programId: stampParsed.programId,
          tokenId: stampParsed.tokenId,
        });
        if (result.success) {
          safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (result.actionId) registerStampAction(stampParsed.partnerId, result.actionId).catch(() => {});
          circles.forEach((c) => addSphereXp(c.id, 'verified_visit'));
          const partnerInfo = getPartner(stampParsed.partnerId);
          router.push({
            pathname: '/stamp/success',
            params: {
              partnerId: stampParsed.partnerId,
              partnerName: partnerInfo?.name ?? '',
              rewardEarned: result.rewardEarned ? 'true' : 'false',
              stampCount: String(result.stampCount ?? 0),
              actionId: result.actionId ?? '',
            },
          });
          setScanned(false);
        } else {
          safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showErrorAlert(
            'Could not add stamp',
            result.message ?? (result.nextEligibleAt ? `Next stamp available at ${new Date(result.nextEligibleAt).toLocaleTimeString()}.` : 'Try again later.'),
            () => setScanned(false),
          );
        }
      } catch {
        safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showErrorAlert('Stamp failed', 'Please check your connection and try again.', () => setScanned(false));
      }
      return;
    }

    const parsed = parseRedeemUrl(data);
    if (!parsed) {
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showErrorAlert(
        'Not an OrbTap code',
        'Scan a QR code at a partner venue to redeem a perk and earn OT Points. Ask staff for the OrbTap QR.',
        () => setScanned(false),
      );
      return;
    }

    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (parsed.kind === 'token') {
      try {
        const result = await verifyPerkRedeemToken(parsed.token);
        if (result.success) {
          safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showAlert('Redeemed', `Customer was credited ${result.pointsAwarded} OT Points.`);
        } else {
          safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showErrorAlert(
            'Could not verify',
            result.message ?? 'Only this venue can verify this code. Have the customer show their redemption QR from the app.',
            () => setScanned(false),
          );
        }
      } catch {
        safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showErrorAlert('Verification failed', 'Please check your connection and try again.', () => setScanned(false));
      }
      return;
    }

    const check = canRedeem(parsed.perkId);
    if (!check.allowed) {
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showErrorAlert(
        'Redemption not available',
        check.reason ?? 'This perk can’t be redeemed right now. Check the offer terms or try again later.',
        () => setScanned(false),
      );
      return;
    }
    try {
      const record = await createVerifiedAction(parsed.partnerId, parsed.perkId, parsed.points, {
        clientLat: userGps?.lat,
        clientLng: userGps?.lng,
      });
      if (!record?.id) {
        showErrorAlert(
          'Redemption couldn’t be recorded',
          'We couldn’t save your check-in. Please check your connection and try scanning again.',
          () => setScanned(false),
        );
        return;
      }
      circles.forEach((c) => addSphereXp(c.id, 'verified_visit'));
      earnBadge('first_scan');
      logVerifiedWin({ partner_id: parsed.partnerId, perk_id: parsed.perkId, points: record.pointsAwarded });
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const partnerInfo = getPartner(parsed.partnerId);
      const displayName = partnerInfo?.name ?? parsed.partnerId;
      const tier = partnerInfo?.tier ?? 'gold';
      router.push({
        pathname: '/scan/success',
        params: {
          points: String(record.pointsAwarded),
          partner: displayName,
          proofId: record.id,
          tier,
          createdAt: String(record.createdAt),
        },
      });
    } catch (e) {
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showErrorAlert(
        'Redemption couldn’t be recorded',
        'Something went wrong while saving your check-in. Please check your internet connection and try again.',
        () => setScanned(false),
      );
    }
  };

  const accentColor = colors.gold ?? COLORS.gold[0];

  if (storedConsent === 'loading') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[styles.centeredText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  if (storedConsent === null && userWantsCamera === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.centeredText, { color: colors.text }]}>
          Camera wasn't opened. Tap below to try again when you're ready to scan.
        </Text>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: accentColor }]}
          onPress={() => setUserWantsCamera(null)}
          accessibilityLabel="Ask again to open camera"
          accessibilityRole="button"
        >
          <Text style={[styles.primaryBtnText, { color: isDark ? '#000' : '#1a1a1a' }]}>Open camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (storedConsent === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.consentTitle, { color: colors.text }]}>Open camera to scan?</Text>
        <Text style={[styles.centeredText, { color: colors.textSecondary }]}>
          OrbTap would like to use your camera to scan partner QR codes and redeem perks.
        </Text>
        <View style={styles.consentRow}>
          <Switch
            value={rememberChoice}
            onValueChange={setRememberChoice}
            trackColor={{ false: colors.border, true: accentColor }}
            thumbColor="#fff"
            accessibilityLabel="Remember my choice for future scans"
          />
          <Text style={[styles.rememberLabel, { color: colors.text }]}>Remember my choice</Text>
        </View>
        <View style={styles.consentButtons}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: accentColor, marginRight: 12 }]}
            onPress={onConsentYes}
            accessibilityLabel="Yes, open camera"
            accessibilityRole="button"
          >
            <Text style={[styles.primaryBtnText, { color: isDark ? '#000' : '#1a1a1a' }]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={onConsentNo}
            accessibilityLabel="No, don't open camera"
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>No</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (storedConsent === 'denied') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.centeredText, { color: colors.text }]}>
          You chose not to use the camera. Tap below to open the camera when you're ready to scan.
        </Text>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: accentColor }]}
          onPress={openCameraAgain}
          accessibilityLabel="Open camera to scan"
          accessibilityRole="button"
        >
          <Text style={[styles.primaryBtnText, { color: isDark ? '#000' : '#1a1a1a' }]}>Open camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (shouldUseCamera && hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[styles.centeredText, { color: colors.text }]}>Requesting permission...</Text>
      </View>
    );
  }

  if (shouldUseCamera && hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.centeredText, { color: colors.text }]}>OrbTap needs camera to scan partner QR codes.</Text>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: accentColor }]}
          onPress={requestPermission}
          disabled={requestingPermission}
          accessibilityLabel="Request camera permission to scan QR codes"
          accessibilityRole="button"
        >
          {requestingPermission ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={[styles.primaryBtnText, { color: isDark ? '#000' : '#1a1a1a' }]}>Request Permission</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (!shouldUseCamera || hasPermission !== true) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[styles.centeredText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  const frameColor = accentColor;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        enableTorch={torchOn}
      />

      {/* Success flash overlay (no duplicate reticle — ScannerHUD is the single focus frame) */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: frameColor }, successFlashStyle]} pointerEvents="none" />

      <ScannerHUD gpsState={gpsState} earningRange={earningRange} />
      <View style={styles.scanBalanceWrap} pointerEvents="box-none">
        <OTPointsBalanceLink amount={balance} size={22} label="pts" compact textColor="#fff" />
      </View>

      {/* Torch toggle */}
      <TouchableOpacity
        style={[styles.torchBtn, { backgroundColor: torchOn ? frameColor : 'rgba(0,0,0,0.5)' }]}
        onPress={() => { safeHaptics.selectionAsync(); setTorchOn((v) => !v); }}
        accessibilityLabel={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
        accessibilityRole="button"
      >
        <Ionicons name={torchOn ? 'flash' : 'flash-outline'} size={22} color={torchOn ? '#000' : '#fff'} />
      </TouchableOpacity>

      <View style={styles.logoWatermark} pointerEvents="none">
        <OrbTapLogoMark variant="watermark" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  webPlaceholderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  webPlaceholderTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  webPlaceholderSub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  storeRow: { flexDirection: 'row', gap: 12 },
  storeBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  storeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  centeredText: { fontSize: 16, marginBottom: 24, textAlign: 'center', paddingHorizontal: 24 },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryBtnText: { fontWeight: '700', fontSize: 16 },
  consentTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center', paddingHorizontal: 24 },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  rememberLabel: { fontSize: 15, marginLeft: 10 },
  consentButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  secondaryBtn: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, borderWidth: 2, minWidth: 100, alignItems: 'center' },
  secondaryBtnText: { fontWeight: '700', fontSize: 16 },
  scanBalanceWrap: { position: 'absolute', top: 56, left: 16, zIndex: 10 },
  logoWatermark: { position: 'absolute', bottom: 100, right: 16, zIndex: 10 },
  torchBtn: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
});

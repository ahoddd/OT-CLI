import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ScannerHUD } from '../../components/ScannerHUD';
import { COLORS } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useWallet } from '../../hooks/useWallet';
import { useSocial } from '../../hooks/useSocial';
import { useBadges } from '../../hooks/useBadges';

/** Expected QR format: orbtap://redeem?partner=P1&perk=K1&points=50 */
function parseRedeemUrl(data: string): { partnerId: string; perkId: string; points: number } | null {
  try {
    const url = new URL(data);
    if (url.protocol !== 'orbtap:' || url.host?.toLowerCase() !== 'redeem') return null;
    const partnerId = url.searchParams.get('partner') ?? '';
    const perkId = url.searchParams.get('perk') ?? '';
    const pointsStr = url.searchParams.get('points') ?? '';
    const points = parseInt(pointsStr, 10);
    if (!partnerId || !perkId || Number.isNaN(points) || points < 0) return null;
    return { partnerId, perkId, points };
  } catch {
    return null;
  }
}

/** Partner ID -> display name for success screen (mock) */
const PARTNER_DISPLAY_NAMES: Record<string, string> = {
  JOES_COFFEE: "Joe's Coffee",
  P1: 'Partner 1',
};

/** Partner ID -> tier for proof card (mock) */
const PARTNER_TIERS: Record<string, string> = {
  JOES_COFFEE: 'rare',
  P1: 'common',
};

export default function ScanScreen() {
  const router = useRouter();
  const { createVerifiedAction, canRedeem } = useWallet();
  const { circles, addSphereXp } = useSocial();
  const { earnBadge } = useBadges();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.getCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

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
    processScan(data);
  };

  const processScan = async (data: string) => {
    const parsed = parseRedeemUrl(data);
    if (!parsed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid code', 'This QR code is not a valid OrbTap redeem link.');
      setScanned(false);
      return;
    }
    const check = canRedeem(parsed.perkId);
    if (!check.allowed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Redemption not allowed', check.reason ?? 'You cannot redeem this perk right now.');
      setScanned(false);
      return;
    }
    try {
      const record = await createVerifiedAction(parsed.partnerId, parsed.perkId, parsed.points);
      circles.forEach((c) => addSphereXp(c.id, 'verified_visit'));
      earnBadge('first_scan');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const displayName = PARTNER_DISPLAY_NAMES[parsed.partnerId] ?? parsed.partnerId;
      const tier = PARTNER_TIERS[parsed.partnerId] ?? 'rare';
      router.push({
        pathname: '/scan/success',
        params: {
          points: String(parsed.points),
          partner: displayName,
          proofId: record.id,
          tier,
          createdAt: String(record.createdAt),
        },
      });
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Could not record redemption. Try again.');
      setScanned(false);
    }
  };

  /** DEV: Simulate scanning Joe's Coffee 50 pts */
  const simulateScan = () => {
    const mockData = "orbtap://redeem?partner=JOES_COFFEE&perk=K1&points=50";
    handleBarCodeScanned({ data: mockData });
  };

  // Permission not yet determined
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.gold[0]} />
        <Text style={styles.centeredText}>Requesting permission...</Text>
      </View>
    );
  }

  // No camera access: show Request Permission + DEV simulate (e.g. simulator)
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.centeredText}>Camera access is required to scan QR codes.</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={requestPermission}
          disabled={requestingPermission}
        >
          {requestingPermission ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryBtnText}>Request Permission</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.simBtnCentered} onPress={simulateScan}>
          <Ionicons name="qr-code" size={24} color="#000" />
          <Text style={styles.simText}>DEV: SIMULATE SCAN</Text>
        </TouchableOpacity>
        <Text style={styles.simHint}>Simulates Joe's Coffee (50 pts)</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <ScannerHUD />
      <TouchableOpacity style={styles.simBtn} onPress={simulateScan}>
        <Ionicons name="qr-code" size={24} color="#000" />
        <Text style={styles.simText}>DEV: SIMULATE SCAN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  centeredText: { color: '#FFF', fontSize: 16, marginBottom: 24, textAlign: 'center', paddingHorizontal: 24 },
  primaryBtn: {
    backgroundColor: COLORS.gold[0],
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  simBtnCentered: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.gold[0],
  },
  simHint: { color: '#888', fontSize: 12, marginTop: 12 },
  simBtn: {
    position: 'absolute',
    bottom: 180,
    alignSelf: 'center',
    backgroundColor: COLORS.gold[0],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  simText: { fontWeight: '900', fontSize: 12 },
});

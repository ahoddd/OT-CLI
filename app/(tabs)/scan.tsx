import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ScannerHUD } from '../../components/ScannerHUD';
import { COLORS } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useWallet } from '../../hooks/useWallet';
import { useTheme } from '../../hooks/useTheme';

export default function ScanScreen() {
  const router = useRouter();
  const { addTransaction } = useWallet();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: any) => {
    setScanned(true);
    processScan(data);
  };

  const processScan = async (data: string) => {
    // In production, verify the hash/data with backend
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Simulate API delay
    setTimeout(() => {
      // Award Points
      addTransaction(500, "Verified Visit: CyberCafe");
      
      // Navigate to Proof Card
      router.push({
        pathname: "/proof/[id]",
        params: { 
            id: "proof_123", 
            partner: "CyberCafe 2077",
            points: "500",
            tier: "APEX"
        }
      });
      setScanned(false);
    }, 500);
  };

  // SIMULATION MODE (For Simulator Testing)
  const simulateScan = () => {
    handleBarCodeScanned({ type: 'qr', data: 'orbtap://redeem/p1' });
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* CAMERA LAYER */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      {/* HUD LAYER */}
      <ScannerHUD />

      {/* DEBUG BUTTON (Only visible in dev/sim) */}
      <TouchableOpacity style={styles.simBtn} onPress={simulateScan}>
        <Ionicons name="bug" size={24} color="#000" />
        <Text style={styles.simText}>SIMULATE SCAN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
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
    borderColor: '#fff'
  },
  simText: { fontWeight: '900', fontSize: 12 }
});

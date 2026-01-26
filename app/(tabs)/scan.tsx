import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../../hooks/useWallet';
import { MOCK_PERKS } from '../../constants/MockData';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const { addTransaction } = useWallet();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to scan QR codes.</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    // MOCK VALIDATION: In real app, verify signature.
    // Simulating a win:
    const points = 50;
    addTransaction(points, "Verified Scan Win", "rare", "earn");
    
    alert(`Scanned: ${data}\n+${points} OT Points!`);
    
    // Reset after delay or navigate
    setTimeout(() => {
        setScanned(false);
        router.push('/(tabs)/wallet');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
            barcodeTypes: ["qr"],
        }}
      />
      <SafeAreaView style={styles.overlay}>
        <Text style={styles.title}>Scan to Redeem</Text>
        <View style={styles.reticle} />
        <Text style={styles.hint}>Align QR code within frame</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', textAlign: 'center' },
  overlay: { flex: 1, alignItems: 'center', width: '100%', justifyContent: 'space-between', paddingVertical: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', textShadowColor: '#000', textShadowRadius: 10 },
  reticle: { width: 250, height: 250, borderWidth: 2, borderColor: '#4ade80', borderRadius: 20 },
  hint: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8, overflow: 'hidden' },
});

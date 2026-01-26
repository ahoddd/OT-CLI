import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../../hooks/useWallet';
import { MOCK_PARTNERS } from '../../constants/MockData';

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

    const points = 150;
    const partner = MOCK_PARTNERS[1]; 
    const perkTitle = "Daily Check-in";
    const tier = partner.tier;
    const date = new Date().toLocaleDateString();

    addTransaction(points, perkTitle, tier, "earn");
    
    setTimeout(() => {
        router.push({
            pathname: `/proof/${Date.now()}` as any,
            params: {
                amount: points,
                partner: partner.name,
                perk: perkTitle,
                tier: tier,
                date: date
            }
        });
        setScanned(false);
    }, 500);
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

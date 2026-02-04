import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { OTPointsBadge } from '../../components/OTPointsBadge';

export default function ScanSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    points?: string;
    partner?: string;
    proofId?: string;
    tier?: string;
    createdAt?: string;
  }>();
  const points = params.points ?? '0';
  const partner = params.partner ?? 'Partner';
  const proofId = params.proofId;
  const tier = params.tier ?? 'rare';
  const createdAt = params.createdAt;

  const openProofCard = () => {
    if (!proofId) return;
    router.push({
      pathname: '/proof/[id]',
      params: { id: proofId, partner, points, tier, createdAt: createdAt ?? String(Date.now()) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Image source={require('../../assets/images/icon.png')} style={styles.topBarLogo} resizeMode="contain" />
        <Text style={styles.topBarTitle}>Verified</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
        </View>
        <Text style={styles.title}>Verified!</Text>
        <View style={styles.subtitleRow}>
          <OTPointsBadge amount={points} size={24} label="pts" compact textColor="#22C55E" />
          <Text style={styles.subtitle}> from {partner}</Text>
        </View>
        <Text style={styles.desc}>Your balance has been updated.</Text>
        {proofId ? (
          <TouchableOpacity
            style={styles.btnProof}
            onPress={openProofCard}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>View Proof Card</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace('/(tabs)/wallet')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>View Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnSecondaryText}>Back to Map</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 12,
  },
  backBtn: { padding: 8 },
  topBarLogo: { width: 36, height: 30 },
  topBarTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconWrap: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#22C55E' },
  desc: { fontSize: 14, color: '#888', marginBottom: 32 },
  btnProof: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  btn: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  btnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  btnSecondaryText: { color: '#888', fontSize: 14 },
});

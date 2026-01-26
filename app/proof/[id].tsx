import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ProofCard } from '../../components/ProofCard';
import { Tier } from '../../constants/MockData';
import { Ionicons } from '@expo/vector-icons';

export default function ProofScreen() {
  const { id, amount, partner, perk, tier, date } = useLocalSearchParams();
  const router = useRouter();
  const viewShotRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  // Safe defaults
  const safeAmount = Number(amount) || 0;
  const safePartner = Array.isArray(partner) ? partner[0] : (partner || 'Unknown Partner');
  const safePerk = Array.isArray(perk) ? perk[0] : (perk || 'Verified Action');
  const safeTier = (Array.isArray(tier) ? tier[0] : (tier || 'common')) as Tier;
  const safeDate = Array.isArray(date) ? date[0] : (date || new Date().toLocaleDateString());

  const handleShare = async () => {
    try {
      setSharing(true);
      if (viewShotRef.current && (viewShotRef.current as any).capture) {
         const uri = await (viewShotRef.current as any).capture();
         await Sharing.shareAsync(uri, {
           mimeType: 'image/png',
           dialogTitle: 'Share your OrbTap Proof',
           UTI: 'public.png',
         });
      }
    } catch (e) {
      console.error('Share failed', e);
      alert('Could not share proof.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verified Proof</Text>
      </View>

      <View style={styles.canvas}>
        <ViewShot ref={viewShotRef as any} options={{ format: 'png', quality: 0.9 }}>
          <ProofCard 
            amount={safeAmount}
            partnerName={safePartner}
            perkTitle={safePerk}
            tier={safeTier}
            date={safeDate}
          />
        </ViewShot>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
          {sharing ? <ActivityIndicator color="#000" /> : <Text style={styles.shareText}>Share Proof</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  closeBtn: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 16 },
  canvas: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  actions: { padding: 30 },
  shareBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 12, alignItems: 'center' },
  shareText: { color: '#000', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
});

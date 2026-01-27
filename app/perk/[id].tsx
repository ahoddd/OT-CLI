import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_PERKS, MOCK_PARTNERS, TIER_COLORS } from '../../constants/MockData';
import { Ionicons } from '@expo/vector-icons';

export default function PerkScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const perk = MOCK_PERKS.find(p => p.id === id);
  const partner = perk ? MOCK_PARTNERS.find(p => p.id === perk.partnerId) : null;

  if (!perk || !partner) return <View style={styles.container}><Text style={styles.error}>Perk not found</Text></View>;

  const color = TIER_COLORS[perk.tier];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perk Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { borderColor: color }]}>
          <Text style={[styles.tier, { color: color }]}>{perk.tier.toUpperCase()} TIER</Text>
          <Text style={styles.title}>{perk.title}</Text>
          <Text style={styles.partnerName}>at {partner.name}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.desc}>{perk.description}</Text>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>TERMS & CONDITIONS</Text>
            <Text style={styles.infoText}>{(perk as any).terms || (perk as any).termsShort || 'No terms available'}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>COOLDOWN</Text>
            <Text style={styles.infoText}>{perk.cooldown}</Text>
          </View>
        </View>

        {/* REDEEM CTA */}
        <TouchableOpacity style={[styles.redeemBtn, { backgroundColor: color }]}>
          <Text style={styles.redeemText}>Redeem Now</Text>
          <Text style={styles.redeemSub}>Scan QR at location</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  error: { color: '#f00', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  closeBtn: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 16 },
  content: { padding: 20 },
  card: { backgroundColor: '#111', padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 32 },
  tier: { fontWeight: '900', letterSpacing: 2, marginBottom: 8, fontSize: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  partnerName: { color: '#888', fontSize: 16, marginBottom: 24 },
  divider: { height: 1, backgroundColor: '#222', marginBottom: 24 },
  desc: { color: '#ccc', fontSize: 16, lineHeight: 24, marginBottom: 24 },
  infoBox: { marginBottom: 16 },
  infoLabel: { color: '#666', fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  infoText: { color: '#fff', fontSize: 14 },
  redeemBtn: { padding: 20, borderRadius: 12, alignItems: 'center' },
  redeemText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  redeemSub: { color: 'rgba(0,0,0,0.6)', fontSize: 12, marginTop: 4 },
});

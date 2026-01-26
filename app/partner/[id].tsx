import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_PARTNERS, MOCK_PERKS, TIER_COLORS } from '../../constants/MockData';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { Ionicons } from '@expo/vector-icons';

export default function PartnerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const partner = MOCK_PARTNERS.find(p => p.id === id);
  const perks = MOCK_PERKS.filter(p => p.partnerId === id);

  if (!partner) return <View style={styles.container}><Text style={styles.error}>Partner not found</Text></View>;

  const tierColor = TIER_COLORS[partner.tier];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        {/* Header / Hero */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroInitial}>{partner.name[0]}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{partner.name}</Text>
            {partner.verified && <VerifiedBadge size={20} />}
          </View>
          <Text style={[styles.tierBadge, { color: tierColor }]}>{partner.tier.toUpperCase()}</Text>
          <Text style={styles.meta}>{partner.category} • {partner.address}</Text>
          <Text style={styles.hours}>Open: {partner.hours}</Text>
          
          <Text style={styles.description}>{partner.description}</Text>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: tierColor }]}>
              <Text style={[styles.actionText, { color: tierColor }]}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reportBtn} onPress={() => router.push('/report')}>
              <Text style={styles.reportText}>Report</Text>
            </TouchableOpacity>
          </View>

          {/* Perks List */}
          <Text style={styles.sectionTitle}>Available Perks</Text>
          {perks.map(perk => (
            <TouchableOpacity 
              key={perk.id} 
              style={[styles.perkCard, { borderLeftColor: TIER_COLORS[perk.tier] }]}
              onPress={() => router.push(`/perk/${perk.id}`)}
            >
              <Text style={styles.perkTitle}>{perk.title}</Text>
              <Text style={styles.perkDesc}>{perk.description}</Text>
              <View style={styles.perkFooter}>
                <Text style={styles.cooldown}>Refreshes: {perk.cooldown}</Text>
                <Text style={styles.arrow}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  error: { color: '#f00', padding: 20 },
  header: { height: 150, backgroundColor: '#111', position: 'relative' },
  backBtn: { position: 'absolute', top: 20, left: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  heroPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' },
  heroInitial: { fontSize: 80, color: '#333', fontWeight: 'bold' },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  tierBadge: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  meta: { color: '#888', marginBottom: 4 },
  hours: { color: '#aaa', fontStyle: 'italic', marginBottom: 16 },
  description: { color: '#ccc', lineHeight: 22, marginBottom: 24 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  actionBtn: { flex: 1, padding: 12, borderWidth: 1, borderRadius: 8, alignItems: 'center' },
  actionText: { fontWeight: 'bold' },
  reportBtn: { padding: 12, alignItems: 'center' },
  reportText: { color: '#666' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  perkCard: { backgroundColor: '#111', padding: 16, borderRadius: 8, marginBottom: 12, borderLeftWidth: 4 },
  perkTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  perkDesc: { color: '#888', fontSize: 14, marginBottom: 12 },
  perkFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cooldown: { color: '#555', fontSize: 12 },
  arrow: { color: '#666' },
});

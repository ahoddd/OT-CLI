import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Partner, TIER_COLORS, MOCK_PERKS, MOCK_PARTNERS } from '../constants/MockData';
import { VerifiedBadge } from './VerifiedBadge';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface OrbSheetProps {
  partner: Partner;
  onClose: () => void;
  onSelectPartner: (p: Partner) => void;
}

export const OrbSheet = ({ partner, onClose, onSelectPartner }: OrbSheetProps) => {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['45%', '85%'], []);
  const perks = MOCK_PERKS.filter(p => p.partnerId === partner.id);
  const color = TIER_COLORS[partner.tier];
  
  // Find nearby partners (excluding current)
  // In a real app, use geodistance. Here we just take the next 5.
  const nearby = MOCK_PARTNERS.filter(p => p.id !== partner.id).slice(0, 5);

  useEffect(() => {
    if (!partner) bottomSheetRef.current?.close();
  }, [partner]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      backgroundStyle={{ backgroundColor: '#090909', borderWidth: 1, borderColor: '#222' }}
      handleIndicatorStyle={{ backgroundColor: '#444' }}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* HEADER */}
        <View style={styles.headerRow}>
            <View>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{partner.name}</Text>
                    {partner.verified && <VerifiedBadge size={18} />}
                </View>
                <Text style={[styles.tier, { color: color }]}>{partner.tier.toUpperCase()} • {partner.category}</Text>
            </View>
            <TouchableOpacity 
                style={styles.profileBtn}
                onPress={() => router.push(`/partner/${partner.id}` as any)}
            >
                <Ionicons name="arrow-forward" size={24} color="#000" />
            </TouchableOpacity>
        </View>

        <Text style={styles.address}>{partner.address}</Text>
        
        {/* MISSIONS SECTION */}
        <Text style={styles.sectionTitle}>ACTIVE MISSIONS</Text>
        {perks.length > 0 ? (
           perks.map(perk => (
             <TouchableOpacity 
                key={perk.id} 
                style={[styles.perkRow, { borderLeftColor: color }]}
                onPress={() => router.push(`/perk/${perk.id}` as any)}
            >
                <View>
                    <Text style={styles.perkTitle}>{perk.title}</Text>
                    <Text style={styles.perkDesc}>{perk.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No active missions right now.</Text>
        )}

        <View style={styles.divider} />

        {/* NEARBY CAROUSEL */}
        <Text style={styles.sectionTitle}>NEARBY SIGNALS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScroll}>
          {nearby.map(p => (
            <TouchableOpacity 
              key={p.id} 
              style={styles.nearbyCard}
              onPress={() => onSelectPartner(p)}
            >
              <View style={[styles.dot, { backgroundColor: TIER_COLORS[p.tier] }]} />
              <Text style={styles.nearbyName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.nearbyCat}>{p.category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: { flex: 1, padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  tier: { fontSize: 12, fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },
  profileBtn: { backgroundColor: '#fff', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  address: { color: '#888', marginBottom: 20, fontSize: 14 },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 20 },
  sectionTitle: { color: '#666', fontSize: 11, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
  perkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161616', padding: 16, borderRadius: 12, marginBottom: 10, borderLeftWidth: 4 },
  perkTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  perkDesc: { color: '#888', fontSize: 12 },
  emptyText: { color: '#444', fontStyle: 'italic', marginBottom: 10 },
  
  nearbyScroll: { gap: 10 },
  nearbyCard: { width: 100, padding: 12, backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  nearbyName: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  nearbyCat: { color: '#666', fontSize: 10 }
});

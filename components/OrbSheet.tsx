import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Partner, TIER_COLORS } from '../constants/MockData';

interface OrbSheetProps {
  partner: Partner | null;
  onClose: () => void;
}

export const OrbSheet = ({ partner, onClose }: OrbSheetProps) => {
  const snapPoints = useMemo(() => ['25%', '50%'], []);

  if (!partner) return null;

  return (
    <BottomSheet
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: '#111' }}
      handleIndicatorStyle={{ backgroundColor: '#444' }}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{partner.name}</Text>
          <View style={[styles.badge, { backgroundColor: TIER_COLORS[partner.tier] }]}>
            <Text style={styles.badgeText}>{partner.tier.toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={styles.subtitle}>{partner.category} • {partner.verified ? 'Verified' : 'Unverified'}</Text>
        
        <View style={styles.perkCard}>
          <Text style={styles.perkLabel}>CURRENT PERK</Text>
          <Text style={styles.perkTitle}>{partner.perkTitle}</Text>
          <Text style={styles.cooldown}>Cooldown: {partner.cooldown}</Text>
        </View>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  perkCard: { backgroundColor: '#222', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  perkLabel: { color: '#888', fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  perkTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cooldown: { color: '#666', fontSize: 12, marginTop: 4 },
  button: { backgroundColor: '#fff', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: 'bold' },
});

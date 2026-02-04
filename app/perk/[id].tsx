import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MOCK_PERKS, MOCK_PARTNERS, TIER_COLORS } from '../../constants/MockData';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { PremiumPerkCard } from '../../components/PremiumPerkCard';
import { useTheme } from '../../hooks/useTheme';
import { useBookmarks } from '../../context/BookmarkContext';
import * as Haptics from 'expo-haptics';

function openDirections(lat: number, lng: number) {
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).catch(() => {});
}

export default function PerkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isPerkBookmarked, togglePerk } = useBookmarks();

  const perk = MOCK_PERKS.find((p) => p.id === id);
  const partner = perk ? MOCK_PARTNERS.find((p) => p.id === perk.partnerId) : null;

  if (!perk || !partner) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.text }]}>Perk not found</Text>
      </View>
    );
  }

  const color = TIER_COLORS[perk.tier];
  const address = partner.location?.address ?? '—';
  const isBookmarked = isPerkBookmarked(perk.id);

  const handleDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (partner.location) openDirections(partner.location.lat, partner.location.lng);
  };

  const handleRedeem = () => {
    Haptics.selectionAsync();
    router.replace('/(tabs)/scan');
  };

  const handleViewPartner = () => {
    Haptics.selectionAsync();
    router.push(`/partner/${partner.id}` as any);
  };

  const handleBookmark = () => {
    Haptics.selectionAsync();
    togglePerk(perk.id);
  };

  return (
    <ScreenWrapper
      title="Perk"
      headerLeft={
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      }
      headerRight={
        <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkBtn}>
          <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={24} color="#fff" />
        </TouchableOpacity>
      }
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium hero card */}
        <View style={styles.heroCardWrap}>
          <PremiumPerkCard perk={perk} partnerName={partner.name} variant="hero" onPress={handleViewPartner} />
        </View>
        <View style={[styles.infoBlock, { borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>LOCATION</Text>
            <Text style={[styles.infoText, { color: colors.text }]}>{address}</Text>
          </View>
        </View>

        {/* CTAs */}
        <TouchableOpacity
          style={[styles.redeemBtn, { backgroundColor: color }]}
          onPress={handleRedeem}
          activeOpacity={0.9}
        >
          <Ionicons name="qr-code" size={24} color="#000" />
          <View>
            <Text style={styles.redeemText}>Redeem at venue</Text>
            <Text style={styles.redeemSub}>Scan QR at {partner.name}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.directionsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleDirections}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={22} color={color} />
          <Text style={[styles.directionsText, { color: colors.text }]}>Get Directions</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { padding: 20, fontSize: 16 },
  closeBtn: { padding: 8 },
  bookmarkBtn: { padding: 8, borderRadius: 20 },
  content: { padding: 20 },
  heroCardWrap: { marginBottom: 16 },
  infoBlock: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  infoRow: { marginBottom: 8 },
  infoLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  infoText: { fontSize: 15, fontWeight: '500' },

  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  redeemText: { color: '#000', fontSize: 18, fontWeight: '800' },
  redeemSub: { color: 'rgba(0,0,0,0.65)', fontSize: 13, marginTop: 2 },

  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  directionsText: { fontSize: 16, fontWeight: '700' },
});

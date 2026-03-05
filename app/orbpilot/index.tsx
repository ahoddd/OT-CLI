/**
 * OrbPilot™ — Offers Nearby: discover verified-visit campaigns close to you.
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../hooks/useTheme';
import { useFlags } from '../../components/FlagContext';
import { useOrbPilotOffers } from '../../hooks/useOrbPilotOffers';
import { COLORS } from '../../constants/Colors';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { REWARD_TIER_COLOR, TRUST_TIER_LABEL } from '../../constants/OrbPilot';
import type { OrbPilotOffer } from '../../constants/OrbPilot';
import { useI18n } from '../../context/I18nContext';

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1609).toFixed(1)}mi`;
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m left`;
  return `${Math.floor(min / 60)}h ${min % 60}m left`;
}

function OfferCard({ offer, onPress, colors }: { offer: OrbPilotOffer; onPress: () => void; colors: Record<string, string> }) {
  const tierColor = REWARD_TIER_COLOR[offer.rewardTier] ?? '#22C55E';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: tierColor + '30' }]}
      activeOpacity={0.85}
    >
      <View style={[styles.tierBadge, { backgroundColor: tierColor + '20' }]}>
        <Text style={[styles.tierText, { color: tierColor }]}>{offer.rewardTier.toUpperCase()}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.partnerName, { color: colors.text }]} numberOfLines={1}>{offer.partnerName}</Text>
        <Text style={[styles.category, { color: colors.textSecondary }]}>{offer.partnerCategory}</Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatDistance(offer.distanceM)}</Text>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} style={{ marginLeft: 8 }} />
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatMinutes(offer.windowMinutesLeft)}</Text>
        </View>
      </View>
      <View style={styles.reward}>
        <Text style={[styles.points, { color: tierColor }]}>{offer.rewardPoints}</Text>
        <Text style={[styles.ptLabel, { color: colors.textSecondary }]}>OT</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginTop: 2 }} />
      </View>
    </TouchableOpacity>
  );
}

export default function OrbPilotIndex() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const router = useRouter();
  const { offers, loading, error, loadNearby } = useOrbPilotOffers();
  const [locationGranted, setLocationGranted] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const requestAndLoad = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocError('Location permission required to see nearby offers.');
      return;
    }
    setLocationGranted(true);
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await loadNearby(loc.coords.latitude, loc.coords.longitude);
  }, [loadNearby]);

  useFocusEffect(useCallback(() => { requestAndLoad(); }, [requestAndLoad]));

  if (!flags.isOrbPilotEnabled || !flags.isOrbPilotUserEnabled) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.empty, { color: colors.textSecondary }]}>OrbPilot coming soon</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>OrbPilot</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/orbpilot/history')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-header */}
      <View style={styles.sub}>
        <Ionicons name="shield-checkmark" size={16} color="#7C3AED" />
        <Text style={[styles.subText, { color: colors.textSecondary }]}>  Verified-visit rewards near you</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={requestAndLoad} tintColor={colors.textSecondary} />}
      >
        {locError ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Location Required</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>{locError}</Text>
            <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: '#7C3AED' }]} onPress={requestAndLoad}>
              <Text style={styles.ctaBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : loading && offers.length === 0 ? (
          <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 60 }} />
        ) : error ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="wifi-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Error loading offers</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: '#7C3AED' }]} onPress={requestAndLoad}>
              <Text style={styles.ctaBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : offers.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="shield-checkmark-outline" size={56} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Campaigns Nearby</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>Check back soon — partners release new visit slots throughout the day.</Text>
          </View>
        ) : (
          offers.map((offer) => (
            <OfferCard
              key={offer.slotId}
              offer={offer}
              colors={colors}
              onPress={() => router.push({ pathname: '/orbpilot/[id]', params: { id: offer.slotId, offerId: offer.slotId } })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE.md, paddingVertical: 12 },
  headerRight: { flexDirection: 'row', gap: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  sub: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.md, paddingBottom: 8 },
  subText: { fontSize: 13 },
  list: { paddingHorizontal: SPACE.md, paddingBottom: 32, gap: 12 },
  card: { borderRadius: RADIUS.md, padding: SPACE.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, gap: 12 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  tierText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  cardBody: { flex: 1, gap: 2 },
  partnerName: { fontSize: 15, fontWeight: '700' },
  category: { fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  meta: { fontSize: 12 },
  reward: { alignItems: 'center' },
  points: { fontSize: 22, fontWeight: '800' },
  ptLabel: { fontSize: 10, fontWeight: '700' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  empty: { textAlign: 'center', marginTop: 80, fontSize: 16 },
  ctaBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

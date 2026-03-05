/**
 * OrbPilot™ — Offer detail: view offer info and claim your slot.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useOrbPilotOffers } from '../../hooks/useOrbPilotOffers';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { REWARD_TIER_COLOR, REWARD_TIER_LABEL, TRUST_TIER_LABEL, TRUST_TIER_COLOR, REJECTION_REASON_LABEL } from '../../constants/OrbPilot';
import type { OrbPilotOffer } from '../../constants/OrbPilot';
import { useI18n } from '../../context/I18nContext';

function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export default function OrbPilotDetail() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const slotId = params.id;
  const { offers, claim, claiming } = useOrbPilotOffers();
  const offer = offers.find((o) => o.slotId === slotId);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location Required', 'Please enable location to claim this offer.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const res = await claim(slotId, loc.coords.latitude, loc.coords.longitude);
    if (res.success) {
      setClaimed(true);
      router.replace({ pathname: '/orbpilot/claimed', params: { slotId, claimExpiresISO: res.claimExpiresISO } });
    } else {
      Alert.alert('Could Not Claim', res.message ?? 'Please try again.');
    }
  };

  if (!offer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        </View>
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Offer no longer available</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.btn, { backgroundColor: '#7C3AED' }]}>
            <Text style={styles.btnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tierColor = REWARD_TIER_COLOR[offer.rewardTier] ?? '#22C55E';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Offer Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Animated.View entering={FadeInDown.duration(350)}>
          {/* Hero */}
          <View style={[styles.hero, { backgroundColor: tierColor + '15', borderColor: tierColor + '40' }]}>
            <Ionicons name="shield-checkmark" size={40} color={tierColor} />
            <Text style={[styles.heroPoints, { color: tierColor }]}>{offer.rewardPoints} OT</Text>
            <Text style={[styles.heroBadge, { color: tierColor }]}>{REWARD_TIER_LABEL[offer.rewardTier]} Reward</Text>
          </View>

          {/* Partner */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Partner</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{offer.partnerName}</Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>{offer.partnerCategory}</Text>
          </View>

          {/* Details grid */}
          <View style={[styles.grid, { backgroundColor: colors.card }]}>
            <View style={styles.gridItem}>
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Distance</Text>
              <Text style={[styles.gridValue, { color: colors.text }]}>{offer.distanceM < 1000 ? `${Math.round(offer.distanceM)}m` : `${(offer.distanceM / 1609).toFixed(1)}mi`}</Text>
            </View>
            <View style={styles.gridDivider} />
            <View style={styles.gridItem}>
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Window</Text>
              <Text style={[styles.gridValue, { color: colors.text }]}>{formatMinutes(offer.windowMinutesLeft)} left</Text>
            </View>
            <View style={styles.gridDivider} />
            <View style={styles.gridItem}>
              <Ionicons name="star-outline" size={18} color={TRUST_TIER_COLOR[offer.minTrustTier]} />
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Min Tier</Text>
              <Text style={[styles.gridValue, { color: TRUST_TIER_COLOR[offer.minTrustTier] }]}>{TRUST_TIER_LABEL[offer.minTrustTier]}</Text>
            </View>
            <View style={styles.gridDivider} />
            <View style={styles.gridItem}>
              <Ionicons name="bar-chart-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Reliability</Text>
              <Text style={[styles.gridValue, { color: colors.text }]}>{offer.reliabilityScore}%</Text>
            </View>
          </View>

          {/* How it works */}
          <View style={[styles.howWrap, { backgroundColor: colors.card }]}>
            <Text style={[styles.howTitle, { color: colors.text }]}>How it works</Text>
            {[
              'Claim your slot — you have 30 minutes to get there',
              'Scan the QR code at the venue',
              offer.walkInEnabled ? 'Walk-in scan, no pre-claim needed' : 'Enter PIN if required by staff',
              'Get your OT Points instantly',
            ].map((step, i) => (
              <View key={i} style={styles.howRow}>
                <View style={[styles.stepDot, { backgroundColor: tierColor }]}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                <Text style={[styles.howText, { color: colors.textSecondary }]}>{step}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        {claimed ? (
          <View style={[styles.claimedBanner, { backgroundColor: '#22C55E20' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={{ color: '#22C55E', fontWeight: '700', marginLeft: 8 }}>Slot Claimed!</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.claimBtn, { backgroundColor: tierColor }, claiming && { opacity: 0.7 }]}
            onPress={handleClaim}
            disabled={claiming}
          >
            {claiming ? <ActivityIndicator color="#fff" /> : <Text style={styles.claimText}>Claim Slot</Text>}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE.md, paddingVertical: 12 },
  title: { fontSize: 17, fontWeight: '700' },
  body: { padding: SPACE.md, gap: 12, paddingBottom: 100 },
  hero: { borderRadius: RADIUS.lg, padding: 28, alignItems: 'center', gap: 8, borderWidth: 1, marginBottom: 4 },
  heroPoints: { fontSize: 40, fontWeight: '800' },
  heroBadge: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  section: { borderRadius: RADIUS.md, padding: SPACE.md },
  sectionLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  sectionValue: { fontSize: 18, fontWeight: '700' },
  sectionSub: { fontSize: 13 },
  grid: { borderRadius: RADIUS.md, flexDirection: 'row', flexWrap: 'wrap', padding: 4 },
  gridItem: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 14, gap: 4 },
  gridDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  gridLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  gridValue: { fontSize: 15, fontWeight: '700' },
  howWrap: { borderRadius: RADIUS.md, padding: SPACE.md, gap: 12 },
  howTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNum: { color: '#fff', fontSize: 11, fontWeight: '800' },
  howText: { flex: 1, fontSize: 14, lineHeight: 20 },
  footer: { padding: SPACE.md, paddingBottom: 24 },
  claimBtn: { borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center' },
  claimText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  claimedBanner: { borderRadius: RADIUS.md, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontSize: 16 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  btnText: { color: '#fff', fontWeight: '700' },
});

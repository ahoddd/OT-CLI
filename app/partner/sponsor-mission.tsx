/**
 * Partner Mission Sponsorship — Phase 6 revenue feature.
 * Partners pay OT (or Stripe) to appear in user daily missions.
 * "Mission Boost: Pay 200 OT → your venue appears in 50 user missions today"
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useMyPartner } from '../../hooks/useMyPartner';
import { useWallet } from '../../hooks/useWallet';
import { sponsorMission as apiSponsorMission } from '../../services/verifyApi';
import { COLORS } from '../../constants/Colors';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { safeHaptics } from '../../utils/safeHaptics';
import { alert, showErrorAlert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

const BOOST_OT_COST = 200;
const BOOST_MISSION_COUNT = 50;

export default function SponsorMissionScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { myPartnerId, myPartner, loading: partnerLoading } = useMyPartner();
  const { balance, refreshBalance } = useWallet();
  const [submitting, setSubmitting] = useState(false);

  const tierColor = myPartner ? PARTNER_TIER_COLORS[myPartner.tier as keyof typeof PARTNER_TIER_COLORS] : COLORS.neonBlue?.[0] ?? colors.primary;
  const canAfford = (balance ?? 0) >= BOOST_OT_COST;

  const handleBoost = async () => {
    if (!myPartnerId) {
      showErrorAlert('Link your business', 'Link a business to sponsor missions.');
      return;
    }
    if (!canAfford) {
      showErrorAlert('Not enough OT', `You need ${BOOST_OT_COST} OT to boost. Earn more from redemptions or top up in Wallet.`);
      return;
    }
    safeHaptics.selectionAsync();
    setSubmitting(true);
    try {
      const result = await apiSponsorMission({
        partnerId: myPartnerId,
        targetMissionCount: BOOST_MISSION_COUNT,
      });
      if (!result.success) {
        showErrorAlert('Request failed', result.message ?? 'Please try again.');
        return;
      }
      await refreshBalance();
      alert(
        'Mission Boost active',
        result.message ?? `Your venue will appear in up to ${BOOST_MISSION_COUNT} user missions today. Users completing a mission that includes you earn OT — and you get more foot traffic.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      showErrorAlert('Request failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (partnerLoading || !myPartnerId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Sponsor a mission</Text>
        </View>
        <View style={styles.placeholder}>
          <ActivityIndicator size="small" color={tierColor} />
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: tierColor + '50' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sponsor a mission</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: tierColor + '18', borderColor: tierColor + '44' }]}>
          <View style={[styles.heroIcon, { backgroundColor: tierColor + '30' }]}>
            <Ionicons name="flag" size={32} color={tierColor} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Mission Boost</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Get your venue into users’ Daily Missions. When they complete a step at your location, they earn OT — and you get real visits.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Today’s boost</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Pay {BOOST_OT_COST} OT Points → your venue appears in up to {BOOST_MISSION_COUNT} user missions today. Partner-Sponsored badge shows on those mission cards.
          </Text>
          <View style={[styles.balanceRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Your balance</Text>
            <Text style={[styles.balanceValue, { color: colors.text }]}>{balance ?? 0} OT</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: canAfford ? tierColor : colors.surfaceHighlight }]}
          onPress={handleBoost}
          disabled={submitting || !canAfford}
          activeOpacity={0.88}
        >
          {submitting ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={[styles.ctaText, { color: canAfford ? '#000' : colors.textSecondary }]}>
              {canAfford ? `Boost for ${BOOST_OT_COST} OT` : `Need ${BOOST_OT_COST} OT`}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          OT is deducted when you tap Boost. Mission placement is subject to availability. Refunds not available once missions are served.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  placeholderText: { fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  hero: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  heroIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  heroSub: { fontSize: 14, lineHeight: 22 },
  card: { padding: 18, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cardBody: { fontSize: 14, lineHeight: 21 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  balanceLabel: { fontSize: 13 },
  balanceValue: { fontSize: 16, fontWeight: '800' },
  cta: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  ctaText: { fontSize: 16, fontWeight: '800' },
  disclaimer: { fontSize: 12, lineHeight: 18 },
});

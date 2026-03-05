/**
 * OrbPass™ — Home: eligibility, caps, eligible offers, upgrade CTA.
 * Phase 5: partner photo, distance, X/10 remaining urgency, nearby map CTA, sample offers for non-eligible.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { usePartners } from '../../context/PartnersContext';
import { useUserLocation } from '../../context/UserLocationContext';
import { distanceToPartner, formatDistanceMi } from '../../utils/location';
import { getPartnerHeroImage } from '../../constants/PartnerCategoryPlaceholders';
import { COLORS } from '../../constants/Colors';
import * as api from '../../services/orbPass';
import { useI18n } from '../../context/I18nContext';

const SAMPLE_OFFERS = [
  { offerId: 'sample1', partnerId: 'p1', partnerName: 'Sample Cafe', title: 'Free coffee with any pastry', valueCents: 500 },
  { offerId: 'sample2', partnerId: 'p2', partnerName: 'Sample Bistro', title: '10% off lunch special', valueCents: 300 },
  { offerId: 'sample3', partnerId: 'p3', partnerName: 'Sample Bar', title: 'Buy one get one happy hour', valueCents: 800 },
];

export default function OrbPassHomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const { isPartner } = useEffectiveTier();
  const { getPartner } = usePartners();
  const { userLocation } = useUserLocation();
  const [configResult, setConfigResult] = useState<{ eligible: boolean; userTier: string; caps: any } | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [redemptionsThisMonth, setRedemptionsThisMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.orbPassGetConfig();
      if (res.success) {
        setConfigResult({ eligible: res.eligible, userTier: res.userTier, caps: res.caps });
        if (res.eligible) {
          const [offRes, histRes] = await Promise.all([
            api.orbPassEligibleOffers({ cityId: 'default' }),
            api.orbPassRedemptionHistory(50),
          ]);
          if (offRes.success) setOffers(offRes.offers ?? []);
          if (histRes.success && histRes.redemptions) {
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const count = histRes.redemptions.filter((r: any) => (r.createdAt ?? 0) >= thisMonthStart).length;
            setRedemptionsThisMonth(count);
          }
        }
      } else {
        setError(res.message ?? 'Could not load OrbPass. Try again.');
      }
    } catch (_e) {
      setError('Connection error. Pull to refresh.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!flags.isOrbPassEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('orbpass.title')}</Text>
        </View>
        <View style={styles.offState}>
          <Ionicons name="card-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.offTitle, { color: colors.text }]}>{t('orbpass.offTitle')}</Text>
          <Text style={[styles.offSub, { color: colors.textSecondary }]}>{t('orbpass.offSub')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !configResult && !error) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('orbpass.title')}</Text>
        </View>
        <View style={styles.loadWrap}>
          <ActivityIndicator size="small" color={COLORS.neonBlue?.[0]} />
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>{t('orbpass.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !configResult) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('orbpass.title')}</Text>
        </View>
        <View style={styles.loadWrap}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.loadText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: COLORS.neonBlue?.[0] ?? colors.primary, marginTop: 16 }]} onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }}>
            <Text style={styles.upgradeBtnText}>{t('orbpass.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const eligible = configResult?.eligible ?? false;
  const tier = configResult?.userTier ?? 'free';
  const caps = configResult?.caps;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('orbpass.title')}</Text>
        <TouchableOpacity onPress={() => router.push('/orbpass/history')} style={styles.iconBtn}>
          <Ionicons name="time-outline" size={22} color={colors.text} />
        </TouchableOpacity>
        {isPartner && (
          <TouchableOpacity onPress={() => router.push('/orbpass/partner-inbox')} style={styles.iconBtn}>
            <Ionicons name="list" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}>
        {error ? (
          <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.loadText, { color: colors.textSecondary }]}>{error}</Text>
          </View>
        ) : null}
        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statusTitle, { color: colors.text }]}>{t('orbpass.yourTier', { tier })}</Text>
          {eligible ? (
            <>
              <View style={styles.eligibleRow}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                <Text style={[styles.eligibleText, { color: colors.text }]}>{t('orbpass.orbPassEnabled')}</Text>
              </View>
              {caps && (
                <Text style={[styles.capsText, { color: colors.textSecondary }]}>
                  Up to {caps.redemptionsPerMonth} redemptions/month · ${(caps.maxValuePerMonth / 100).toFixed(0)} value · {caps.cooldownHours}h cooldown
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.notEligibleText, { color: colors.textSecondary }]}>{t('orbpass.notEligible')}</Text>
              <Text style={[styles.sampleTitle, { color: colors.text }]}>{t('orbpass.sampleOffers')}</Text>
              {SAMPLE_OFFERS.map((offer) => (
                <View key={offer.offerId} style={[styles.sampleOfferCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.sampleOfferRow}>
                    <View style={[styles.sampleOfferThumb, { backgroundColor: colors.border }]} />
                    <View style={styles.sampleOfferBody}>
                      <Text style={[styles.sampleOfferTitle, { color: colors.text }]}>{offer.title}</Text>
                      <Text style={[styles.sampleOfferPartner, { color: colors.textSecondary }]}>{offer.partnerName}</Text>
                      <Text style={[styles.sampleOfferValue, { color: COLORS.success }]}>{t('orbpass.value', { value: (offer.valueCents / 100).toFixed(2) })}</Text>
                    </View>
                    <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
                  </View>
                </View>
              ))}
              <View style={[styles.benefitsBlock, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.benefitsTitle, { color: colors.text }]}>{t('orbpass.withOrbPassYouGet')}</Text>
                <Text style={[styles.benefitItem, { color: colors.textSecondary }]}>{'\u2022 '}{t('orbpass.benefit1')}</Text>
                <Text style={[styles.benefitItem, { color: colors.textSecondary }]}>{'\u2022 '}{t('orbpass.benefit2')}</Text>
                <Text style={[styles.benefitItem, { color: colors.textSecondary }]}>{'\u2022 '}{t('orbpass.benefit3')}</Text>
                <Text style={[styles.benefitItem, { color: colors.textSecondary }]}>{'\u2022 '}{t('orbpass.benefit4')}</Text>
                <Text style={[styles.benefitItem, { color: colors.textSecondary }]}>{'\u2022 '}{t('orbpass.benefit5')}</Text>
              </View>
              <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: COLORS.neonBlue?.[0] ?? colors.primary }]} onPress={() => router.push('/premium' as any)}>
                <Text style={styles.upgradeBtnText}>{t('orbpass.seeAllPlans')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => router.push('/premium' as any)}>
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>{t('orbpass.viewOrbTapPlans')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {eligible && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('orbpass.nearbyOffers')}</Text>
              <TouchableOpacity style={[styles.mapCta, { borderColor: colors.border }]} onPress={() => router.push('/(tabs)' as any)}>
                <Ionicons name="map" size={16} color={colors.primary} />
                <Text style={[styles.mapCtaText, { color: colors.primary }]}>{t('orbpass.viewMap')}</Text>
              </TouchableOpacity>
            </View>
            {caps && redemptionsThisMonth != null && (
              <Text style={[styles.remainingUrgency, { color: colors.textSecondary }]}>
                {t('orbpass.redemptionsRemaining', { remaining: Math.max(0, caps.redemptionsPerMonth - redemptionsThisMonth), total: caps.redemptionsPerMonth })}
              </Text>
            )}
            {offers.length === 0 ? (
              <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('orbpass.noOffersInArea')}</Text>
                <TouchableOpacity style={[styles.mapCta, { borderColor: colors.border, marginTop: 12 }]} onPress={() => router.push('/(tabs)' as any)}>
                  <Ionicons name="map" size={16} color={colors.primary} />
                  <Text style={[styles.mapCtaText, { color: colors.primary }]}>{t('orbpass.viewNearbyOnMap')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              offers.map((offer) => {
                const partner = getPartner(offer.partnerId);
                const heroUrl = partner ? getPartnerHeroImage(partner) : null;
                const distMi = userLocation && partner?.location ? distanceToPartner(userLocation.latitude, userLocation.longitude, partner) : null;
                const distLabel = distMi != null ? formatDistanceMi(distMi) + ' away' : null;
                return (
                  <TouchableOpacity
                    key={offer.offerId}
                    style={[styles.offerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => router.push({ pathname: '/orbpass/offer/[id]', params: { id: offer.offerId, partnerId: offer.partnerId, partnerName: offer.partnerName, title: offer.title, valueCents: offer.valueCents } } as any)}
                  >
                    <View style={styles.offerRow}>
                      {heroUrl ? (
                        <Image source={{ uri: heroUrl }} style={styles.offerPhoto} />
                      ) : (
                        <View style={[styles.offerPhotoPlaceholder, { backgroundColor: colors.border }]} />
                      )}
                      <View style={styles.offerBody}>
                        <Text style={[styles.offerTitle, { color: colors.text }]}>{offer.title}</Text>
                        <Text style={[styles.offerPartner, { color: colors.textSecondary }]}>{offer.partnerName}</Text>
                        {distLabel && <Text style={[styles.offerDistance, { color: colors.textSecondary }]}>{distLabel}</Text>}
                        <Text style={[styles.offerValue, { color: COLORS.success }]}>{t('orbpass.value', { value: (offer.valueCents / 100).toFixed(2) })}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  iconBtn: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statusCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  statusTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  eligibleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  eligibleText: { fontSize: 15, fontWeight: '600' },
  capsText: { fontSize: 13 },
  notEligibleText: { fontSize: 14, marginBottom: 12 },
  benefitsBlock: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  benefitsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  benefitItem: { fontSize: 13, lineHeight: 22, marginBottom: 4 },
  upgradeBtn: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginBottom: 10 },
  upgradeBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  secondaryBtnText: { fontSize: 14, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  mapCta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  mapCtaText: { fontSize: 13, fontWeight: '600' },
  remainingUrgency: { fontSize: 12, marginBottom: 10 },
  empty: { padding: 20, borderRadius: 12, borderWidth: 1 },
  emptyText: { fontSize: 13, textAlign: 'center' },
  offerCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  offerPhoto: { width: 56, height: 56, borderRadius: 10 },
  offerPhotoPlaceholder: { width: 56, height: 56, borderRadius: 10 },
  offerBody: { flex: 1, minWidth: 0 },
  offerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  offerPartner: { fontSize: 13, marginBottom: 2 },
  offerDistance: { fontSize: 12, marginBottom: 2 },
  offerValue: { fontSize: 13, fontWeight: '600' },
  sampleTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  sampleOfferCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  sampleOfferRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sampleOfferThumb: { width: 48, height: 48, borderRadius: 8 },
  sampleOfferBody: { flex: 1 },
  sampleOfferTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  sampleOfferPartner: { fontSize: 12, marginBottom: 2 },
  sampleOfferValue: { fontSize: 12, fontWeight: '600' },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { marginTop: 8 },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  offSub: { fontSize: 14, marginTop: 8 },
});

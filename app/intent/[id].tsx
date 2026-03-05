/**
 * OrbIntent™ — Intent detail: offers, accept, share.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { COLORS } from '../../constants/Colors';
import { intentDeepLink } from '../../constants/AppLinks';
import { INTENT_CATEGORY_LABELS } from '../../constants/orbIntent';
import * as api from '../../services/orbIntent';
import type { IntentDoc, OfferDoc } from '../../constants/orbIntent';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

export default function IntentDetailScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold?.[0];
  const { flags } = useFlags();
  const { user } = useAuth();
  const { isPartner } = useEffectiveTier();

  const [intent, setIntent] = useState<IntentDoc | null>(null);
  const [offers, setOffers] = useState<OfferDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    const res = await api.intentGet(id);
    if (res.success) {
      setIntent(res.intent);
      setOffers(res.offers);
    }
  };

  React.useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const isCreator = user?.uid && intent?.createdByUid === user.uid;
  const canAccept = isCreator && intent?.status === 'open' && offers.some((o) => o.status === 'active');

  const handleAccept = (offer: OfferDoc) => {
    if (!intent || !canAccept) return;
    alertDialog(
      'Accept this offer?',
      `${offer.partnerName}: ${offer.terms?.headline ?? 'Offer'}. You’ll get a PIN/QR for the partner to verify.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setAcceptingOfferId(offer.id);
            const res = await api.intentAcceptOffer(intent.id, offer.id);
            setAcceptingOfferId(null);
            if (res.success) router.push({ pathname: '/intent/locked/[id]', params: { id: intent.id } } as any);
            else showErrorAlert(
              'Offer couldn’t be accepted',
              res.message ?? 'We couldn’t accept this offer. Please try again.',
            );
          },
        },
      ]
    );
  };

  if (!flags.isOrbIntentEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Intent</Text>
        </View>
        <View style={styles.offState}>
          <Text style={[styles.offText, { color: colors.text }]}>Deal Match is disabled.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !intent) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Intent</Text>
        </View>
        <View style={styles.loadWrap}>
          <ActivityIndicator size="small" color={COLORS.neonBlue?.[0]} />
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!intent) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Intent</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text }]}>Intent not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const budget = intent.budget as { min: number; max: number } | undefined;
  const offerDeadlineAt = (intent as any).offerDeadlineAt ?? 0;
  const timeLeft = Math.max(0, offerDeadlineAt - Date.now());

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>Intent</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{intent.title}</Text>
          <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
            {INTENT_CATEGORY_LABELS[intent.category as keyof typeof INTENT_CATEGORY_LABELS]} · ${budget?.min ?? 0}–${budget?.max ?? 0} · {intent.status}
          </Text>
          {intent.status === 'open' && timeLeft > 0 && (
            <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{Math.floor(timeLeft / 60000)}m left for offers</Text>
          )}
        </View>

        {isPartner && intent.status === 'open' && (
          <TouchableOpacity
            style={[styles.placeOfferBtn, { backgroundColor: themeGold }]}
            onPress={() => router.push({ pathname: '/intent/offer/create', params: { intentId: intent.id } } as any)}
          >
            <Ionicons name="pricetag" size={18} color="#000" />
            <Text style={styles.placeOfferBtnText}>Place offer</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Offers ({offers.length})</Text>
        {intent.status === 'locked' && (
          <View style={[styles.lockedBanner, { backgroundColor: themeGold + '20', borderColor: colors.border }]}>
            <Text style={[styles.lockedText, { color: colors.text }]}>You accepted an offer. Show PIN/QR at the partner to verify.</Text>
            <TouchableOpacity style={[styles.lockedBtn, { backgroundColor: themeGold }]} onPress={() => router.push({ pathname: '/intent/locked/[id]', params: { id: intent.id } } as any)}>
              <Text style={styles.lockedBtnText}>Show PIN / QR</Text>
            </TouchableOpacity>
            {user?.uid === intent.lockedPartnerId && (
              <TouchableOpacity style={[styles.lockedBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginTop: 8 }]} onPress={() => router.push({ pathname: '/intent/verify', params: { intentId: intent.id } } as any)}>
                <Text style={[styles.lockedBtnText, { color: colors.text }]}>I'm the partner — Verify fulfillment</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {intent.status === 'fulfilled' && (
          <View style={[styles.fulfilledBanner, { backgroundColor: COLORS.success + '20', borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={[styles.fulfilledText, { color: colors.text }]}>Fulfilled! Share your Deal Done Card.</Text>
            <TouchableOpacity style={[styles.dealBtn, { backgroundColor: COLORS.success }]} onPress={() => intent.dealCardId && router.push({ pathname: '/intent/deal/[cardId]', params: { cardId: intent.dealCardId } } as any)} disabled={!intent.dealCardId}>
              <Text style={styles.dealBtnText}>View Deal Card</Text>
            </TouchableOpacity>
          </View>
        )}

        {offers.length === 0 ? (
          <View style={[styles.emptyOffers, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyOffersText, { color: colors.textSecondary }]}>No offers yet.</Text>
          </View>
        ) : (
          offers.map((offer) => (
            <View key={offer.id} style={[styles.offerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.offerPartner, { color: colors.text }]}>{offer.partnerName}</Text>
              <Text style={[styles.offerHeadline, { color: colors.text }]}>{offer.terms?.headline ?? 'Offer'}</Text>
              {offer.terms?.price != null && <Text style={[styles.offerPrice, { color: colors.text }]}>${offer.terms.price}</Text>}
              <View style={styles.offerRow}>
                <Text style={[styles.offerStatus, { color: colors.textSecondary }]}>{offer.status}</Text>
                {canAccept && offer.status === 'active' && (
                  <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: themeGold }]} onPress={() => handleAccept(offer)} disabled={!!acceptingOfferId}>
                    {acceptingOfferId === offer.id ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.acceptBtnText}>Accept</Text>}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
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
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cardMeta: { fontSize: 12 },
  cardTime: { fontSize: 11, marginTop: 4 },
  placeOfferBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  placeOfferBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  lockedBanner: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  lockedText: { fontSize: 13, marginBottom: 10 },
  lockedBtn: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  lockedBtnText: { color: '#000', fontWeight: '700' },
  fulfilledBanner: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  fulfilledText: { flex: 1, fontSize: 14, fontWeight: '600' },
  dealBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  dealBtnText: { color: '#000', fontWeight: '700' },
  emptyOffers: { padding: 20, borderRadius: 12, borderWidth: 1 },
  emptyOffersText: { fontSize: 13, textAlign: 'center' },
  offerCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  offerPartner: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  offerHeadline: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  offerPrice: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  offerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offerStatus: { fontSize: 11 },
  acceptBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  acceptBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { marginTop: 8 },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16 },
});

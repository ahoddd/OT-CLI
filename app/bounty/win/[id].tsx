/**
 * OrbBounty™ — Win card: show deal won, time-to-win, value; share via ShareToSocialSheet.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useBountyDetail } from '../../../hooks/useOrbBounty';
import { bountyDeepLink } from '../../../constants/AppLinks';
import { ShareToSocialSheet } from '../../../components/ShareToSocialSheet';
import { bountySharePayload } from '../../../utils/shareToSocial';
import { useI18n } from '../../../context/I18nContext';

export default function WinCardScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { bounty, bids, loading, error } = useBountyDetail(id ?? null);
  const [shareVisible, setShareVisible] = useState(false);

  const acceptedBid = bounty?.lockedBidId
    ? (bids ?? []).find((b) => b.id === bounty.lockedBidId)
    : null;
  const partnerName = acceptedBid?.partnerName ?? 'Partner';
  const fulfilledAt = bounty?.fulfillment?.verifiedAt ?? bounty?.createdAt ?? 0;
  const timeToWinMs = fulfilledAt - (bounty?.createdAt ?? 0);
  const timeToWinHours = (timeToWinMs / (1000 * 60 * 60)).toFixed(1);
  const savings = acceptedBid?.terms?.discount ?? (acceptedBid?.terms?.price != null ? `$${acceptedBid.terms.price}` : 'Deal closed');
  const platformFeePercent = bounty?.platformFeePercent ?? 10;
  const showPlatformFee = platformFeePercent > 0;

  if (loading && !bounty) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !bounty) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Win card</Text>
        </View>
        <View style={styles.center}>
          <Text style={[styles.errText, { color: colors.text }]}>{error ?? 'Not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (bounty.status !== 'fulfilled') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Win card</Text>
        </View>
        <View style={styles.center}>
          <Text style={[styles.errText, { color: colors.text }]}>
            Win card is available after fulfillment is verified.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const sharePayload = bountySharePayload(
    `I won this deal on OrbTap: ${bounty.title} with ${partnerName}. Time to win: ${timeToWinHours}h — proof-backed on OrbBounty.`,
    bountyDeepLink(bounty.id),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Win card</Text>
        <TouchableOpacity onPress={() => setShareVisible(true)} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardBadge, { color: colors.textSecondary }]}>OrbBounty™</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{bounty.title}</Text>
          <Text style={[styles.cardPartner, { color: colors.textSecondary }]}>with {partnerName}</Text>
          <View style={[styles.row, { borderTopColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Time to win</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{timeToWinHours} hours</Text>
          </View>
          <View style={[styles.row, { borderTopColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Value</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{savings}</Text>
          </View>
          {showPlatformFee && (
            <View style={[styles.row, { borderTopColor: colors.border }]}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>OrbTap Service Fee</Text>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{platformFeePercent}%</Text>
            </View>
          )}
          <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
            {new Date(fulfilledAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShareVisible(true)}
        >
          <Ionicons name="share-outline" size={20} color={colors.text} />
          <Text style={[styles.shareButtonText, { color: colors.text }]}>Share win card</Text>
        </TouchableOpacity>
      </ScrollView>

      <ShareToSocialSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        payload={sharePayload}
        label="Share win card"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  shareBtn: { padding: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { fontSize: 14 },
  errText: { fontSize: 16, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { padding: 24, borderRadius: 16, borderWidth: 1 },
  cardBadge: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  cardPartner: { fontSize: 14, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1 },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 15, fontWeight: '700' },
  cardDate: { fontSize: 12, marginTop: 12 },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 24,
  },
  shareButtonText: { fontSize: 16, fontWeight: '700' },
});

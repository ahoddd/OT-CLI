/**
 * OrbBounty™ — Bounty Detail: bids list, accept bid, share, delete (creator or admin).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { isAdminEmail } from '../../constants/Admin';
import { COLORS } from '../../constants/Colors';
import { bountyDeepLink } from '../../constants/AppLinks';
import { ShareToSocialSheet } from '../../components/ShareToSocialSheet';
import { bountySharePayload } from '../../utils/shareToSocial';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { usePreferences } from '../../hooks/usePreferences';
import { useBountyDetail } from '../../hooks/useOrbBounty';
import * as api from '../../services/orbBounty';
import { BOUNTY_CATEGORY_LABELS } from '../../constants/orbBounty';
import type { BidDoc } from '../../constants/orbBounty';
import { alert as alertDialog, showErrorAlert } from '../../utils/alert';
import { useI18n } from '../../context/I18nContext';

function statusLabel(s: string): string {
  const map: Record<string, string> = { open: 'Open', locked: 'Locked', fulfilled: 'Fulfilled', expired: 'Expired', cancelled: 'Cancelled' };
  return map[s] ?? s;
}

export default function BountyDetailScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { flags } = useFlags();
  const { user } = useAuth();
  const { prefs } = usePreferences();
  const isAdmin = isAdminEmail(user?.email);
  const { isPartner } = useEffectiveTier();
  const { bounty, bids, loading, error, refresh } = useBountyDetail(id ?? null);
  const [refreshing, setRefreshing] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; title?: string; url?: string } | null>(null);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isCreator = user?.uid && bounty?.createdByUid === user.uid;
  const canDelete = isCreator || isAdmin;
  const canAccept = isCreator && bounty?.status === 'open' && bids.some((b) => b.status === 'active');

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleShare = () => {
    if (!bounty) return;
    const url = bountyDeepLink(bounty.id);
    const msg = `Check out this bounty on OrbTap: ${bounty.title}. ${bounty.budget ? `$${bounty.budget.min}–$${bounty.budget.max}` : ''} — bid or share.`;
    setSharePayload(bountySharePayload(msg, url));
    setShareVisible(true);
  };

  const handleAcceptBid = (bid: BidDoc) => {
    if (!bounty || !canAccept) return;
    alertDialog(
      'Accept this bid?',
      `${bid.partnerName}: ${bid.terms?.headline ?? 'Offer'}. You’ll get a PIN/QR for the partner to verify fulfillment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setAcceptingBidId(bid.id);
            const res = await api.bountyAcceptBid(bounty.id, bid.id);
            setAcceptingBidId(null);
            if (res.success) {
              router.push({ pathname: '/bounty/locked/[id]', params: { id: bounty.id } } as any);
            } else {
              showErrorAlert(
                'Bid couldn’t be accepted',
                res.message ?? 'We couldn’t accept this bid. Please try again.',
              );
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!bounty || !canDelete) return;
    alertDialog(
      'Cancel bounty?',
      'This will cancel the bounty. Existing bids will be closed.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const res = await api.bountyDeleteBounty(bounty.id);
            setDeleting(false);
            if (res.success) router.back();
            else showErrorAlert(
                'Bounty couldn\'t be cancelled',
                res.message ?? 'We couldn\'t cancel this bounty. Please try again.',
              );
          },
        },
      ]
    );
  };

  if (!flags.isOrbBountyEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Bounty</Text>
        </View>
        <View style={styles.offState}>
          <Text style={[styles.offText, { color: colors.text }]}>OrbBounty is disabled.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !bounty) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Bounty</Text>
        </View>
        <View style={styles.loadWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
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
          <Text style={[styles.title, { color: colors.text }]}>Bounty</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="gift-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Bounty not found</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{error ?? 'It may have been cancelled or expired.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const endAt = bounty.timeWindow?.endAt ?? bounty.createdAt + (bounty.ttlSeconds ?? 86400) * 1000;
  const timeLeft = Math.max(0, endAt - Date.now());

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>Bounty</Text>
        <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
        {canDelete && (
          <TouchableOpacity onPress={handleDelete} style={styles.iconBtn} disabled={deleting}>
            <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        <View style={[styles.stepRow, { borderColor: colors.border }]}>
          {(['open', 'locked', 'fulfilled'] as const).map((s, i) => {
            const statusOrder = ['open', 'locked', 'fulfilled'] as const;
            const label = s === 'open' ? 'Posted' : s === 'locked' ? 'Locked' : 'Fulfilled';
            const idx = statusOrder.indexOf(bounty.status);
            const active = statusOrder.indexOf(s) <= idx;
            return (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepDot, { backgroundColor: active ? themeGold : colors.border }]} />
                <Text style={[styles.stepLabel, { color: active ? colors.text : colors.textSecondary }]}>{label}</Text>
              </View>
            );
          })}
        </View>
        <View style={[styles.card, styles.cardGlass, { borderColor: colors.border }]}>
          {Platform.OS !== 'web' && (
            <BlurView intensity={isDark ? 50 : 58} tint={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, styles.cardBlur]} />
          )}
          {Platform.OS === 'web' && <View style={[StyleSheet.absoluteFill, styles.cardBlur, { backgroundColor: colors.surface }]} />}
          <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{bounty.title}</Text>
          <View style={styles.cardRow}>
            <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
              {BOUNTY_CATEGORY_LABELS[bounty.category as keyof typeof BOUNTY_CATEGORY_LABELS]} · ${bounty.budget?.min ?? 0}–${bounty.budget?.max ?? 0}
            </Text>
            <Text style={[styles.cardStatus, { color: colors.primary }]}>{statusLabel(bounty.status)}</Text>
          </View>
          {timeLeft > 0 && bounty.status === 'open' && (
            <Text style={[styles.cardTime, { color: colors.textSecondary }]}>
              {Math.floor(timeLeft / 3600000)}h left
            </Text>
          )}
          {bounty.sanityScore >= 70 && (
            <View style={styles.highLikelihood}>
              <Ionicons name="flash" size={12} color={themeGold} />
              <Text style={[styles.highLikelihoodText, { color: themeGold }]}>High likelihood</Text>
            </View>
          )}
          </View>
        </View>

        {isPartner && bounty.status === 'open' && (
          <TouchableOpacity
            style={[styles.placeBidBtn, { backgroundColor: themeGold ?? '#fbbf24' }]}
            onPress={() => router.push({ pathname: '/bounty/bid/create', params: { bountyId: bounty.id } } as any)}
          >
            <Ionicons name="pricetag" size={18} color="#000" />
            <Text style={styles.placeBidBtnText}>Place bid</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Bids ({bids.length})</Text>
        {bounty.status === 'locked' && bounty.lockedPartnerId && (
          <View style={[styles.lockedBanner, { backgroundColor: themeGold + '20', borderColor: colors.border }]}>
            <Text style={[styles.lockedText, { color: colors.text }]}>You accepted a bid. Show the PIN/QR at the partner to verify fulfillment.</Text>
            <TouchableOpacity
              style={[styles.lockedBtn, { backgroundColor: themeGold }]}
              onPress={() => router.push({ pathname: '/bounty/locked/[id]', params: { id: bounty.id } } as any)}
            >
              <Text style={styles.lockedBtnText}>Show PIN / QR</Text>
            </TouchableOpacity>
          </View>
        )}
        {bounty.status === 'fulfilled' && (
          <View style={[styles.fulfilledBanner, { backgroundColor: COLORS.success + '20', borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={[styles.fulfilledText, { color: colors.text }]}>Fulfilled! Share your Win Card.</Text>
            <TouchableOpacity
              style={[styles.winCardBtn, { backgroundColor: COLORS.success }]}
              onPress={() => router.push({ pathname: '/bounty/win/[id]', params: { id: bounty.id } } as any)}
            >
              <Text style={styles.winCardBtnText}>View Win Card</Text>
            </TouchableOpacity>
          </View>
        )}

        {bids.length === 0 ? (
          <View style={[styles.emptyBids, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyBidsText, { color: colors.textSecondary }]}>No bids yet. Partners will see your bounty in their Inbox.</Text>
          </View>
        ) : (
          bids.map((bid) => (
            <View key={bid.id} style={[styles.bidCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.bidPartner, { color: colors.text }]}>{bid.partnerName}</Text>
              <Text style={[styles.bidHeadline, { color: colors.text }]}>{bid.terms?.headline ?? 'Offer'}</Text>
              {bid.terms?.details ? <Text style={[styles.bidDetails, { color: colors.textSecondary }]} numberOfLines={2}>{bid.terms.details}</Text> : null}
              {bid.terms?.price != null && <Text style={[styles.bidPrice, { color: colors.text }]}>${bid.terms.price}</Text>}
              <View style={styles.bidRow}>
                <Text style={[styles.bidStatus, { color: colors.textSecondary }]}>{bid.status}</Text>
                {canAccept && bid.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: themeGold }]}
                    onPress={() => handleAcceptBid(bid)}
                    disabled={!!acceptingBidId}
                  >
                    {acceptingBidId === bid.id ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.acceptBtnText}>Accept</Text>}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ShareToSocialSheet visible={shareVisible} onClose={() => setShareVisible(false)} payload={sharePayload ?? { message: '', url: bountyDeepLink(bounty.id) }} label="Share bounty" />
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
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingVertical: 8 },
  stepItem: { flex: 1, alignItems: 'center' },
  stepDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  stepLabel: { fontSize: 10, fontWeight: '700' },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 16, overflow: 'hidden', position: 'relative' },
  cardGlass: {},
  cardBlur: { borderRadius: 14 },
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { fontSize: 12 },
  cardStatus: { fontSize: 12, fontWeight: '600' },
  cardTime: { fontSize: 11, marginTop: 4 },
  highLikelihood: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  highLikelihoodText: { fontSize: 11, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  lockedBanner: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  lockedText: { fontSize: 13, marginBottom: 10 },
  lockedBtn: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  lockedBtnText: { color: '#000', fontWeight: '700' },
  fulfilledBanner: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  fulfilledText: { flex: 1, fontSize: 14, fontWeight: '600' },
  winCardBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  winCardBtnText: { color: '#000', fontWeight: '700' },
  emptyBids: { padding: 20, borderRadius: 12, borderWidth: 1 },
  emptyBidsText: { fontSize: 13, textAlign: 'center' },
  bidCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  bidPartner: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  bidHeadline: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  bidDetails: { fontSize: 12, marginBottom: 4 },
  bidPrice: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  bidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bidStatus: { fontSize: 11 },
  acceptBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  acceptBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  placeBidBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, marginBottom: 16 },
  placeBidBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { marginTop: 8 },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 6, textAlign: 'center' },
});

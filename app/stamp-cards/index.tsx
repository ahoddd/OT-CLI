/**
 * Stamp Cards — Dedicated page: Reward Locker + all cards + Scan to stamp.
 * Entry from Wallet and from OrbSheet "View card". Proof-backed visits. Real perks.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';
import { useFlags } from '../../components/FlagContext';
import { useStampCards } from '../../hooks/useStampCards';
import { usePartners } from '../../context/PartnersContext';
import { RewardLockerSection } from '../../components/RewardLockerSection';
import { StampCardStack } from '../../components/StampCardStack';
import { StampCardModal } from '../../components/StampCardModal';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import type { StampCardWithProgram } from '../../hooks/useStampCards';
import { useI18n } from '../../context/I18nContext';

function sortCardsForDisplay(cards: StampCardWithProgram[]): StampCardWithProgram[] {
  const now = Date.now();
  return [...cards].sort((a, b) => {
    const aRewardReady = a.state.activeReward?.status === 'EARNED';
    const bRewardReady = b.state.activeReward?.status === 'EARNED';
    if (aRewardReady && !bRewardReady) return -1;
    if (!aRewardReady && bRewardReady) return 1;
    const aProg = a.program;
    const bProg = b.program;
    const aNext = a.state.lastStampAt && aProg?.cooldownHours ? a.state.lastStampAt + aProg.cooldownHours * 60 * 60 * 1000 : 0;
    const bNext = b.state.lastStampAt && bProg?.cooldownHours ? b.state.lastStampAt + bProg.cooldownHours * 60 * 60 * 1000 : 0;
    const aReady = !aNext || now >= aNext;
    const bReady = !bNext || now >= bNext;
    if (aReady && !bReady) return -1;
    if (!aReady && bReady) return 1;
    const aReq = aProg?.stampsRequired ?? 10;
    const bReq = bProg?.stampsRequired ?? 10;
    const aProgress = (a.state.stampCount ?? 0) / aReq;
    const bProgress = (b.state.stampCount ?? 0) / bReq;
    return bProgress - aProgress;
  });
}

export default function StampCardsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ focusPartnerId?: string }>();
  const focusPartnerId = params.focusPartnerId ?? '';
  const { colors } = useTheme();
  const { flags } = useFlags();
  const stampCardsEnabled = Boolean(flags?.moduleStampCards && flags?.stampCardsUserWallet);
  const { cardsWithPrograms, rewardLocker, loading, activeCardCount, rewardReadyCount, refetch } = useStampCards(stampCardsEnabled);
  const { getPartner } = usePartners();

  const activeCards = useMemo(() => cardsWithPrograms.filter((c) => c.program?.status === 'ACTIVE'), [cardsWithPrograms]);
  const sortedCards = useMemo(() => sortCardsForDisplay(activeCards), [activeCards]);

  const [detailCard, setDetailCard] = useState<StampCardWithProgram | null>(null);

  const partnerLogoMap = useMemo(() => {
    const m: Record<string, string | null> = {};
    activeCards.forEach((c) => {
      const pid = c.program?.partnerId;
      if (pid) m[pid] = getPartner(pid)?.logoUrl ?? null;
    });
    return m;
  }, [activeCards, getPartner]);

  const partnerTierMap = useMemo(() => {
    const m: Record<string, 'silver' | 'gold' | 'platinum'> = {};
    activeCards.forEach((c) => {
      const pid = c.program?.partnerId;
      if (pid) {
        const p = getPartner(pid);
        if (p?.tier) m[pid] = p.tier;
      }
    });
    return m;
  }, [activeCards, getPartner]);

  useEffect(() => {
    if (!stampCardsEnabled) {
      router.replace('/(tabs)/wallet' as any);
      return;
    }
  }, [stampCardsEnabled, router]);

  useEffect(() => {
    if (!focusPartnerId || sortedCards.length === 0) return;
    const card = sortedCards.find((c) => c.program?.partnerId === focusPartnerId);
    if (card) setDetailCard(card);
  }, [focusPartnerId, sortedCards]);

  const handleScan = () => {
    router.push('/(tabs)/scan' as any);
  };

  if (!stampCardsEnabled) return null;

  return (
    <ScreenWrapper
      title="Stamp Cards"
      headerLeft={
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      }
      headerRight={
        <TouchableOpacity style={[styles.scanToStampBtn, { backgroundColor: colors.primary }]} onPress={handleScan}>
          <Ionicons name="qr-code" size={20} color="#fff" />
          <Text style={styles.scanToStampText}>Scan to stamp</Text>
        </TouchableOpacity>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subline, { color: colors.textSecondary }]}>
          Proof-backed visits. Real perks. No fake check-ins. Only in OrbTap.
        </Text>
        {rewardReadyCount > 0 && (
          <Text style={[styles.rewardsReady, { color: colors.primary }]}>{rewardReadyCount} reward{rewardReadyCount !== 1 ? 's' : ''} ready</Text>
        )}

        {rewardLocker.length > 0 && (
          <View style={styles.rewardLockerWrap}>
            <RewardLockerSection items={rewardLocker} onRedeemPress={() => setDetailCard(null)} />
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MY CARDS</Text>
        {sortedCards.length > 1 && !loading && (
          <View style={styles.swipeHintRow}>
            <Ionicons name="swap-horizontal-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.swipeHintText, { color: colors.textSecondary }]}>
              Tap a card to open · swipe left/right to browse all cards
            </Text>
          </View>
        )}
        {loading ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading…</Text>
        ) : sortedCards.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Ionicons name="pricetag-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No stamp cards yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Visit a partner and scan their Stamp QR at the counter, or find partners on the map to get started.</Text>
            <TouchableOpacity style={[styles.findPartnersBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)/index' as any)}>
              <Text style={styles.findPartnersBtnText}>Find partners on map</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <StampCardStack
            cards={sortedCards}
            onCardPress={setDetailCard}
            nestedInScrollView
            maxHeight={9999}
          />
        )}
      </ScrollView>

      <StampCardModal
        visible={detailCard != null}
        cards={sortedCards}
        initialIndex={detailCard ? Math.max(0, sortedCards.findIndex((c) => c.state.id === detailCard.state.id)) : 0}
        onClose={() => setDetailCard(null)}
        onRedeem={(stateId) => {
          const item = rewardLocker.find((r) => r.stateId === stateId);
          if (item) setDetailCard(null);
        }}
        partnerLogoMap={partnerLogoMap}
        partnerTierMap={partnerTierMap}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerBtn: { padding: 8 },
  scanToStampBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.sm },
  scanToStampText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scrollContent: { paddingHorizontal: SPACE.base, paddingBottom: SPACE.xxl },
  subline: { fontSize: 13, marginBottom: SPACE.base },
  rewardsReady: { fontSize: 14, fontWeight: '800', marginBottom: SPACE.base },
  rewardLockerWrap: { marginBottom: SPACE.xl },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: SPACE.base, marginBottom: SPACE.xs },
  swipeHintRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: SPACE.sm },
  swipeHintText: { fontSize: 12, flex: 1 },
  empty: {
    padding: SPACE.xxl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: SPACE.sm },
  emptySub: { fontSize: 13, marginTop: 4 },
  findPartnersBtn: { marginTop: SPACE.lg, paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.md },
  findPartnersBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

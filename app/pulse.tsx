/**
 * OrbPulse™ Live — dedicated screen: ranked list with filters.
 * Proof-based only; no likes/boosts.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePulse, type PulseTile } from '../hooks/usePulse';
import { useFlags } from '../components/FlagContext';
import { useArena } from '../hooks/useArena';
import { COLORS } from '../constants/Colors';

export default function OrbPulseLiveScreen() {
  const router = useRouter();
  const { flags } = useFlags();
  const {
    liveTiles,
    trendingPartnersNow,
    trendingDropsNow,
    newDiscoveries,
    tonightPicks,
    loading,
    refresh,
  } = usePulse();
  const { contest, entries, canSubmit, canVote, refresh: refreshArena } = useArena();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'partners' | 'drops' | 'tonight' | 'new'>('all');

  if (!flags.isOrbPulseEnabled) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>OrbPulse™ Live</Text>
        </View>
        <View style={styles.offState}>
          <Ionicons name="pulse-outline" size={48} color="rgba(255,255,255,0.4)" />
          <Text style={styles.offText}>Pulse is off</Text>
          <Text style={styles.offSub}>Enable in Admin Hub to see live momentum.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh?.(), refreshArena?.()]);
    setRefreshing(false);
  };

  const FILTER_LABELS: Record<typeof filter, string> = {
  all: 'All',
  partners: 'Partners',
  drops: 'Drops',
  tonight: 'Tonight',
  new: 'New',
};

  const tilesForFilter: PulseTile[] =
    filter === 'partners'
      ? trendingPartnersNow.map((p) => ({
          type: 'partner' as const,
          id: `p_${p.partnerId}`,
          title: p.partnerName,
          category: p.category,
          whyTrending: `${p.verifiedCount24h} verified • last 24h`,
          entityId: p.partnerId,
          primaryCta: 'redeem',
          score: p.score,
        }))
      : filter === 'drops'
        ? trendingDropsNow.map((d) => ({
            type: 'drop' as const,
            id: `d_${d.id}`,
            title: d.title,
            category: d.category,
            whyTrending: `${d.qtyRemaining} left`,
            entityId: d.id,
            qtyRemaining: d.qtyRemaining,
            endAt: d.endAt,
            primaryCta: 'reserve_drop' as const,
            score: d.qtyRemaining,
            drop: d,
          }))
        : filter === 'tonight'
          ? tonightPicks
          : filter === 'new'
            ? newDiscoveries.map((p) => ({
                type: 'partner' as const,
                id: `new_${p.partnerId}`,
                title: p.partnerName,
                category: p.category,
                whyTrending: 'First-time visits',
                entityId: p.partnerId,
                primaryCta: 'redeem' as const,
                score: p.score,
              }))
            : liveTiles;

  const handleTilePress = (tile: PulseTile) => {
    if (tile.type === 'partner') {
      router.push({ pathname: '/partner/[id]', params: { id: tile.entityId } } as any);
    } else if (tile.type === 'drop' && tile.drop) {
      // Could open drop detail modal or reserve flow
      router.push({ pathname: '/partner/[id]', params: { id: tile.drop.partnerId } } as any);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>OrbPulse™ Live</Text>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'partners', 'drops', 'tonight', 'new'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator size="small" color={COLORS.neonBlue?.[0] ?? '#60a5fa'} />
          <Text style={styles.loadText}>Loading pulse…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          <Text style={styles.trustBadge}>Verified Momentum — proof-based only</Text>

          {flags.isOrbArenaPulseSurfacingEnabled && contest && (contest.status === 'LIVE' || contest.status === 'VOTING') ? (
            <TouchableOpacity
              style={styles.arenaHighlight}
              onPress={() => router.push('/arena')}
              activeOpacity={0.8}
            >
              <View style={styles.arenaHighlightTop}>
                <Text style={styles.arenaHighlightTitle}>OrbArena™</Text>
                <Text style={styles.arenaHighlightStatus}>
                  {contest.status === 'VOTING' ? 'Vote now' : 'Submit entry'}
                </Text>
              </View>
              <Text style={styles.arenaHighlightSub}>
                {contest.status === 'VOTING'
                  ? `${entries.filter((e: { contestId: string }) => e.contestId === contest.id).length} entries · Final hours`
                  : 'Proof-backed weekly challenge'}
              </Text>
              <View style={styles.ctaRow}>
                <Text style={styles.ctaLabel}>
                  {contest.status === 'VOTING' && canVote ? 'Vote now' : canSubmit ? 'Enter OrbArena' : 'View OrbArena'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity>
          ) : null}

          {tilesForFilter.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="pulse-outline" size={40} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>Pulse is warming up</Text>
              <Text style={styles.emptySub}>
                Verify your first action, start a quest, or browse drops to see live momentum.
              </Text>
            </View>
          ) : (
            tilesForFilter.map((tile) => (
              <TouchableOpacity
                key={tile.id}
                style={styles.tile}
                onPress={() => handleTilePress(tile)}
                activeOpacity={0.8}
              >
                <View style={styles.tileTop}>
                  <Text style={styles.tileTitle}>{tile.title}</Text>
                  <View style={styles.categoryWrap}>
                    <Text style={styles.tileCategory}>{tile.category}</Text>
                  </View>
                </View>
                <Text style={styles.whyTrending}>{tile.whyTrending}</Text>
                {tile.type === 'drop' && tile.qtyRemaining != null && (
                  <Text style={styles.qtyRemaining}>{tile.qtyRemaining} left</Text>
                )}
                <View style={styles.ctaRow}>
                  <Text style={styles.ctaLabel}>
                    {tile.primaryCta === 'reserve_drop' ? 'Reserve Drop' : 'Redeem / View'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: { marginRight: 12 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222',
  },
  filterPillActive: { backgroundColor: '#4ade80' },
  filterText: { color: '#888', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#000' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  trustBadge: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 16,
  },
  loadWrap: { padding: 40, alignItems: 'center' },
  loadText: { color: '#888', marginTop: 8 },
  arenaHighlight: {
    backgroundColor: '#1a1a20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B44',
  },
  arenaHighlightTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  arenaHighlightTitle: { color: '#F59E0B', fontSize: 16, fontWeight: '700' },
  arenaHighlightStatus: { color: '#4ade80', fontSize: 12, fontWeight: '600' },
  arenaHighlightSub: { color: '#888', fontSize: 12, marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { color: '#888', fontSize: 13, marginTop: 8, textAlign: 'center' },
  tile: {
    backgroundColor: '#1a1a20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a30',
  },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tileTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  categoryWrap: { backgroundColor: '#2a2a30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tileCategory: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  whyTrending: { color: '#4ade80', fontSize: 12, marginTop: 8 },
  qtyRemaining: { color: '#f59e0b', fontSize: 12, marginTop: 4 },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a30',
  },
  ctaLabel: { color: '#60a5fa', fontSize: 13, fontWeight: '600' },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  offSub: { color: '#888', fontSize: 13, marginTop: 4 },
});

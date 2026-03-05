/**
 * OrbPulse™ Live — dedicated screen: ranked list with filters.
 * Proof-based only; no likes/boosts.
 */

import React, { useState, useEffect, useRef } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePulse, type PulseTile } from '../hooks/usePulse';
import { usePolls } from '../hooks/usePolls';
import { useWallet } from '../hooks/useWallet';
import { useFlags } from '../components/FlagContext';
import { OTPointsBalanceLink } from '../components/OTPointsBalanceLink';
import { useTheme } from '../hooks/useTheme';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import { COLORS } from '../constants/Colors';
import { PollCard } from '../components/PollCard';
import { useSearchOpen } from '../context/SearchOpenContext';
import { GuidedTutorialOverlay } from '../components/GuidedTutorialOverlay';
import { useTutorial } from '../context/TutorialContext';
import { SponsoredAdSlot } from '../components/SponsoredAdSlot';
import { MoreSection } from '../components/MoreSection';
import { KitEmptyState } from '../components/ui';
import { useI18n } from '../context/I18nContext';
import { safeHaptics } from '../utils/safeHaptics';

export default function OrbPulseLiveScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const liveDotOpacity = useSharedValue(1);
  useEffect(() => {
    liveDotOpacity.value = withRepeat(
      withSequence(withTiming(0.2, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false,
    );
  }, []);
  const liveDotStyle = useAnimatedStyle(() => ({ opacity: liveDotOpacity.value }));
  const { flags } = useFlags();
  const { shouldShowTutorial, markCompleted, setSkipAllTutorials } = useTutorial();
  const [showPulseTutorial, setShowPulseTutorial] = useState(false);
  const {
    liveTiles,
    trendingPartnersNow,
    trendingDropsNow,
    newDiscoveries,
    tonightPicks,
    loading,
    refresh,
  } = usePulse();
  const { polls, loading: pollsLoading, refresh: refreshPolls, submitVote, getVotedOption, fromFirestore } = usePolls();
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<'all' | 'partners' | 'drops' | 'tonight' | 'new' | 'polls'>('all');
  const searchOpen = useSearchOpen();

  useEffect(() => {
    const f = params.filter as 'all' | 'partners' | 'drops' | 'tonight' | 'new' | 'polls' | undefined;
    if (f && ['all', 'partners', 'drops', 'tonight', 'new', 'polls'].includes(f)) setFilter(f);
  }, [params.filter]);
  const { balance } = useWallet();
  const { isPremium } = useEffectiveTier();

  React.useEffect(() => {
    if (shouldShowTutorial('pulse')) setShowPulseTutorial(true);
  }, [shouldShowTutorial]);

  if (!flags.isOrbPulseEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('pulse.pulse')}</Text>
          <TouchableOpacity style={styles.headerSearchBtn} onPress={() => searchOpen?.openSearch('all')} hitSlop={12}>
            <Ionicons name="search" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <GuidedTutorialOverlay
          visible={showPulseTutorial}
          tutorialId="pulse"
          onClose={() => { markCompleted('pulse'); setShowPulseTutorial(false); }}
          onSkipAll={() => { setSkipAllTutorials(); setShowPulseTutorial(false); }}
        />
        <View style={styles.offState}>
          <Ionicons name="pulse-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.offText, { color: colors.text }]}>Pulse is warming up</Text>
          <Text style={[styles.offSub, { color: colors.textSecondary }]}>Live momentum will appear here soon. Explore the map and complete missions in the meantime.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh?.(), refreshPolls?.()]);
    setRefreshing(false);
  };

  const FILTER_LABELS: Record<typeof filter, string> = {
    all: 'All',
    partners: 'Partners',
    drops: 'Drops',
    tonight: 'Tonight',
    new: 'New',
    polls: 'OrbVote',
  };

  const pollTiles: PulseTile[] = polls.slice(0, 10).map((p) => ({
    type: 'poll' as const,
    id: `poll_${p.id}`,
    title: p.question,
    category: p.partnerName,
    whyTrending: `${p.totalVotes} votes · Earn 5 OT`,
    entityId: p.id,
    primaryCta: 'vote',
    score: p.totalVotes,
    pollId: p.id,
  }));

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
              : filter === 'polls'
                ? pollTiles
                : liveTiles;

  const handleTilePress = (tile: PulseTile) => {
    if (tile.type === 'partner') {
      router.push({ pathname: '/partner/[id]', params: { id: tile.entityId } } as any);
    } else if (tile.type === 'drop' && tile.drop) {
      router.push({ pathname: '/drop/[id]', params: { id: tile.drop.id } } as any);
    } else if (tile.type === 'poll' && tile.pollId) {
      router.push('/vote' as any);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.title, { color: colors.text }]}>{t('pulse.pulse')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.danger + '22', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
              <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.danger }, liveDotStyle]} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.danger }}>LIVE</Text>
            </View>
          </View>
          <Text style={[styles.verifiedMomentumLabel, { color: colors.textSecondary }]}>Verified momentum — proof-based only</Text>
        </View>
        <OTPointsBalanceLink amount={balance} size={20} label="pts" compact textColor={colors.text} />
        <TouchableOpacity style={styles.headerSearchBtn} onPress={() => searchOpen?.openSearch('all')} hitSlop={12}>
          <Ionicons name="search" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <GuidedTutorialOverlay
        visible={showPulseTutorial}
        tutorialId="pulse"
        onClose={() => { markCompleted('pulse'); setShowPulseTutorial(false); }}
        onSkipAll={() => { setSkipAllTutorials(); setShowPulseTutorial(false); }}
      />

      <View style={styles.filterRow}>
        {(['all', 'partners', 'drops', 'tonight', 'new', 'polls'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive, { backgroundColor: filter === f ? COLORS.success : colors.surface, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => { safeHaptics.selectionAsync(); setFilter(f); }}
          >
            <Text style={[styles.filterText, { color: filter === f ? '#000' : colors.textSecondary }]}>
              {FILTER_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading || (filter === 'polls' && pollsLoading) ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading pulse…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
          }
        >
          <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="pulse" size={28} color={COLORS.success ?? '#4ADE80'} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>The city's live heartbeat</Text>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
              Trending partners and drops ranked by real verified actions—redemptions, completions, claims—not likes or boosts. Tap a filter above to narrow by Partners, Drops, Tonight, or New.
            </Text>
            <View style={[styles.heroTrustRow, { borderTopColor: colors.border }]}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.success ?? '#4ADE80'} />
              <Text style={[styles.heroTrustText, { color: colors.textSecondary }]}>Verified momentum — proof-based only. No fake engagement.</Text>
            </View>
          </View>

          {!isPremium && (
            <TouchableOpacity
              style={[styles.earlyAccessTeaser, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/premium' as any)}
              activeOpacity={0.9}
            >
              <Ionicons name="diamond-outline" size={18} color={themeGold} />
              <Text style={[styles.earlyAccessTeaserText, { color: colors.text }]}>Members get first access to drops</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {tilesForFilter.length === 0 ? (
            <View style={styles.empty}>
              <KitEmptyState
                title="Pulse is warming up"
                subtitle="Verify your first action, start a quest, or browse the map to see live momentum."
              />
              <TouchableOpacity style={[styles.emptyCta, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)' as any)} activeOpacity={0.88}>
                <Text style={styles.emptyCtaText}>Go to map</Text>
              </TouchableOpacity>
            </View>
          ) : filter === 'polls' ? (
            polls.length > 0 ? (
              polls.map((p) => (
                <View key={p.id} style={{ marginBottom: 16 }}>
                  <PollCard
                    poll={p}
                    onVote={fromFirestore ? submitVote : undefined}
                    votedOption={getVotedOption(p.id)}
                  />
                </View>
              ))
            ) : (
              <View style={styles.empty}>
                <Ionicons name="ellipse-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No polls yet</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Vote on OrbVote to earn OT. Polls from partners will appear here.
                </Text>
                <TouchableOpacity
                  style={[styles.orbVoteCta, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/vote' as any)}
                >
                  <Text style={styles.orbVoteCtaText}>Open OrbVote</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            tilesForFilter.map((tile) => (
              <TouchableOpacity
                key={tile.id}
                style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleTilePress(tile)}
                activeOpacity={0.8}
              >
                <View style={styles.tileTop}>
                  <Text style={[styles.tileTitle, { color: colors.text }]}>{tile.title}</Text>
                  <View style={[styles.categoryWrap, { backgroundColor: colors.surfaceHighlight }]}>
                    <Text style={[styles.tileCategory, { color: colors.textSecondary }]}>{tile.category}</Text>
                  </View>
                </View>
                <Text style={[styles.whyTrending, { color: COLORS.success }]}>{tile.whyTrending}</Text>
                {tile.type === 'drop' && tile.finalHours && (
                  <View style={[styles.finalHoursBadge, { backgroundColor: (themeGold) + '25', borderColor: themeGold }]}>
                    <Text style={[styles.finalHoursText, { color: themeGold }]}>Final hours</Text>
                  </View>
                )}
                {tile.type === 'drop' && tile.qtyRemaining != null && (
                  <Text style={[styles.qtyRemaining, { color: themeGold }]}>{tile.qtyRemaining} left</Text>
                )}
                <View style={[styles.ctaRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.ctaLabel, { color: colors.primary }]}>
                    {tile.primaryCta === 'reserve_drop' ? 'Reserve Drop' : 'Redeem / View'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))
          )}

          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <SponsoredAdSlot placement="orb_carousel" sectionTitle="SPONSORED" />
          </View>
          <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 24 }}>
            <MoreSection
              title="More"
              variant="rows"
              links={[
                { label: 'Missions', route: '/missions', icon: 'flag' },
                { label: 'Orb Signal', route: '/orbsignal', icon: 'radio' },
                { label: 'Leaderboard', route: '/leaderboard', icon: 'trophy' },
                { label: 'Stats', route: '/stats', icon: 'stats-chart' },
                { label: 'Partners', route: '/partners', icon: 'business' },
                { label: 'Bookmarks', route: '/bookmarks', icon: 'bookmark' },
              ]}
            />
          </View>
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
  headerTitleWrap: { flex: 1 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  verifiedMomentumLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },
  headerSearchBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 6 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  filterPillActive: { backgroundColor: '#4ade80' },
  filterText: { color: '#888', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#000' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  hero: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  heroIconWrap: { marginBottom: 10 },
  heroTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: 0.3 },
  heroDesc: { fontSize: 14, lineHeight: 21, marginBottom: 12, opacity: 0.95 },
  heroTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  heroTrustText: { fontSize: 12, fontWeight: '600' },
  earlyAccessTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  earlyAccessTeaserText: { fontSize: 13, fontWeight: '600', flex: 1 },
  quickLinksWrap: { marginBottom: 16, paddingVertical: 12, paddingHorizontal: 4, borderWidth: 1, borderRadius: 12 },
  quickLinksLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginHorizontal: 8 },
  quickLinksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 8 },
  quickLinkPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  quickLinkText: { fontSize: 12, fontWeight: '600' },
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
  emptyCta: { marginTop: 20, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  emptyCtaText: { color: '#000', fontSize: 16, fontWeight: '700' },
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
  finalHoursBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  finalHoursText: { fontSize: 11, fontWeight: '700' },
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
  orbVoteCta: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  orbVoteCtaText: { color: '#000', fontSize: 15, fontWeight: '800' },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  offSub: { color: '#888', fontSize: 13, marginTop: 4 },
});

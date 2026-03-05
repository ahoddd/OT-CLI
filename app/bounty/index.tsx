/**
 * OrbBounty™ — Home: Feed, My Bounties, Inbox (partner) tabs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { useOrbBounty } from '../../hooks/useOrbBounty';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { COLORS } from '../../constants/Colors';
import { PageHero } from '../../components/PageHero';
import { BOUNTY_CATEGORY_LABELS } from '../../constants/orbBounty';
import type { BountyDoc } from '../../constants/orbBounty';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { useI18n } from '../../context/I18nContext';

type TabKey = 'feed' | 'mine' | 'inbox';

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    open: 'Open',
    locked: 'Locked',
    fulfilled: 'Fulfilled',
    expired: 'Expired',
    cancelled: 'Cancelled',
  };
  return map[s] ?? s;
}

function BountyCard({
  bounty,
  onPress,
  colors,
  isDark,
}: {
  bounty: BountyDoc;
  onPress: () => void;
  colors: Record<string, string>;
  isDark?: boolean;
}) {
  const themeGold = COLORS.gold?.[0] ?? '#fbbf24';
  const endAt = bounty.timeWindow?.endAt ?? bounty.createdAt + (bounty.ttlSeconds ?? 86400) * 1000;
  const isExpired = endAt < Date.now();
  const tier = (bounty as { lockedPartnerTier?: PartnerTier }).lockedPartnerTier;
  const accentColor = tier ? PARTNER_TIER_COLORS[tier] : themeGold;
  return (
    <TouchableOpacity
      style={[styles.card, styles.cardGlass, { borderColor: accentColor + '50' }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {Platform.OS !== 'web' && (
        <BlurView intensity={isDark ? 50 : 58} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      )}
      {Platform.OS === 'web' && <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />}
      <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{bounty.title}</Text>
        <View style={styles.cardRow}>
          <Text style={[styles.cardCategory, { color: colors.textSecondary }]}>
            {BOUNTY_CATEGORY_LABELS[bounty.category as keyof typeof BOUNTY_CATEGORY_LABELS] ?? bounty.category}
          </Text>
          {tier ? (
            <View style={[styles.tierBadge, { backgroundColor: accentColor + '22', borderColor: accentColor + '66' }]}>
              <Text style={[styles.tierBadgeText, { color: accentColor }]}>{String(tier).charAt(0).toUpperCase() + String(tier).slice(1)}</Text>
            </View>
          ) : null}
          <Text style={[styles.cardStatus, { color: isExpired ? colors.textSecondary : colors.primary }]}>
            {statusLabel(bounty.status)}
          </Text>
        </View>
        <Text style={[styles.cardBudget, { color: colors.textSecondary }]}>
          {(bounty.budget?.min === 0 && bounty.budget?.max === 0) ? 'Flexible budget' : `$${bounty.budget?.min ?? 0}–$${bounty.budget?.max ?? 0}`} · {bounty.metrics?.bidCount ?? 0} bids
        </Text>
        {bounty.sanityScore >= 70 && (
          <View style={styles.highLikelihood}>
            <Ionicons name="flash" size={12} color={themeGold} />
            <Text style={[styles.highLikelihoodText, { color: themeGold }]}>High likelihood</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function OrbBountyHomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { flags } = useFlags();
  const { isPartner } = useEffectiveTier();
  const [tab, setTab] = useState<TabKey>(() => {
    const t = params.tab;
    if (t === 'mine' || t === 'feed' || t === 'inbox') return t;
    return 'feed';
  });
  const { feed, myBounties, inbox, loading, error, refresh, loadMyBounties } = useOrbBounty();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<BountyDoc['category'] | 'all'>('all');

  // Sync tab from URL when navigating with ?tab=mine (e.g. after creating a bounty)
  useEffect(() => {
    const t = params.tab;
    if (t === 'mine' || t === 'feed' || t === 'inbox') setTab(t);
  }, [params.tab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh(tab);
    setRefreshing(false);
  };

  // Load data for the active tab when tab changes
  useEffect(() => {
    refresh(tab);
  }, [tab]);

  // When returning from create or detail: refresh current tab and preload My Bounties so it's up to date
  useFocusEffect(
    useCallback(() => {
      refresh(tab);
      loadMyBounties();
    }, [tab, refresh, loadMyBounties])
  );

  const rawList = tab === 'feed' ? feed : tab === 'mine' ? myBounties : inbox;
  const list = React.useMemo(() => {
    let out = rawList;
    if (tab === 'feed') {
      if (categoryFilter !== 'all') out = out.filter((b) => b.category === categoryFilter);
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        out = out.filter((b) => (b.title?.toLowerCase().includes(q)) || (BOUNTY_CATEGORY_LABELS[b.category as keyof typeof BOUNTY_CATEGORY_LABELS]?.toLowerCase().includes(q)));
      }
    }
    return out;
  }, [rawList, tab, categoryFilter, searchQuery]);
  const emptyMessage =
    tab === 'feed'
      ? t('bounty.emptyFeed')
      : tab === 'mine'
        ? t('bounty.emptyMine')
        : t('bounty.emptyInbox');

  if (!flags.isOrbBountyEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('bounty.title')}</Text>
        </View>
        <View style={styles.offState}>
          <Ionicons name="gift-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.offText, { color: colors.text }]}>{t('bounty.offTitle')}</Text>
          <Text style={[styles.offSub, { color: colors.textSecondary }]}>{t('bounty.offSub')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('bounty.title')}</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: themeGold ?? '#fbbf24' }]}
          onPress={() => router.push('/bounty/create')}
        >
          <Ionicons name="add" size={20} color="#000" />
          <Text style={styles.createBtnText}>{t('bounty.post')}</Text>
        </TouchableOpacity>
      </View>

      <PageHero
        icon="gift"
        iconColor={themeGold}
        title={t('bounty.heroTitle')}
        description={t('bounty.heroDesc')}
        trustLine={t('bounty.heroTrust')}
      />

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabPill, { backgroundColor: tab === 'feed' ? themeGold + '28' : colors.surface }, tab === 'feed' && { borderWidth: 1, borderColor: themeGold }]}
          onPress={() => setTab('feed')}
        >
          <Text style={[styles.tabText, { color: tab === 'feed' ? themeGold : colors.textSecondary }]}>{t('bounty.feed')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, { backgroundColor: tab === 'mine' ? themeGold + '28' : colors.surface }, tab === 'mine' && { borderWidth: 1, borderColor: themeGold }]}
          onPress={() => setTab('mine')}
        >
          <Text style={[styles.tabText, { color: tab === 'mine' ? themeGold : colors.textSecondary }]}>{t('bounty.mine')}</Text>
        </TouchableOpacity>
        {isPartner && (
          <TouchableOpacity
            style={[styles.tabPill, { backgroundColor: tab === 'inbox' ? themeGold + '28' : colors.surface }, tab === 'inbox' && { borderWidth: 1, borderColor: themeGold }]}
            onPress={() => setTab('inbox')}
          >
            <Text style={[styles.tabText, { color: tab === 'inbox' ? themeGold : colors.textSecondary }]}>{t('bounty.inbox')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {tab === 'feed' && (
        <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
          <View style={[styles.searchWrap, { backgroundColor: colors.surface + 'ee', borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('bounty.searchPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {(['all', 'food', 'retail', 'services'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  { borderColor: colors.border },
                  categoryFilter === cat && { backgroundColor: themeGold + '28', borderColor: themeGold },
                ]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text style={[styles.categoryPillText, { color: categoryFilter === cat ? themeGold : colors.textSecondary }]}>
                  {cat === 'all' ? 'All' : BOUNTY_CATEGORY_LABELS[cat] ?? cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        >
          {error ? (
            <View style={[styles.errorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                onPress={() => { setRefreshing(true); refresh(tab).then(() => setRefreshing(false)); }}
              >
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {list.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="gift-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No bounties</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{emptyMessage}</Text>
              {tab === 'mine' && (
                <>
                  <TouchableOpacity style={[styles.emptyCta, { backgroundColor: themeGold ?? '#fbbf24', marginTop: 12 }]} onPress={() => router.push('/bounty/create')}>
                    <Text style={styles.emptyCtaText}>Create one</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.emptyCta, { borderWidth: 1, borderColor: colors.border, marginTop: 8 }]} onPress={() => setTab('feed')}>
                    <Text style={[styles.emptyCtaText, { color: colors.text }]}>Browse feed</Text>
                  </TouchableOpacity>
                </>
              )}
              {tab === 'inbox' && (
                <TouchableOpacity style={[styles.emptyCta, { borderWidth: 1, borderColor: colors.border, marginTop: 12 }]} onPress={() => setTab('feed')}>
                  <Text style={[styles.emptyCtaText, { color: colors.text }]}>Browse feed</Text>
                </TouchableOpacity>
              )}
              {tab === 'feed' && (
                <TouchableOpacity
                  style={[styles.emptyCta, { backgroundColor: themeGold ?? '#fbbf24' }]}
                  onPress={() => router.push('/bounty/create')}
                >
                  <Text style={styles.emptyCtaText}>Post a bounty</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            list.map((b) => (
              <BountyCard
                key={b.id}
                bounty={b as BountyDoc}
                onPress={() => router.push({ pathname: '/bounty/[id]', params: { id: b.id } } as any)}
                colors={colors}
                isDark={isDark}
              />
            ))
          )}
        </ScrollView>
      )}
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },
  tabRow: { flexDirection: 'row', padding: 12, gap: 8, borderBottomWidth: 1 },
  tabPill: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabPillActive: {},
  tabText: { fontSize: 13, fontWeight: '600' },
  tabTextActive: {},
  filterRow: { padding: 12, gap: 10, borderBottomWidth: 1 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  categoryScroll: { flexDirection: 'row', paddingBottom: 4 },
  categoryPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#444', marginRight: 8 },
  categoryPillText: { fontSize: 13, fontWeight: '600' },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { marginTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  errorCard: { padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  errorText: { fontSize: 14, marginBottom: 12 },
  retryBtn: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  emptyHint: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  emptyCta: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyCtaText: { color: '#000', fontWeight: '700', fontSize: 14 },
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardGlass: { minHeight: 88 },
  cardAccentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  cardContent: { padding: 16, paddingTop: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8, flexWrap: 'wrap' },
  cardCategory: { fontSize: 12 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  tierBadgeText: { fontSize: 10, fontWeight: '800' },
  cardStatus: { fontSize: 12, fontWeight: '600' },
  cardBudget: { fontSize: 11 },
  highLikelihood: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  highLikelihoodText: { fontSize: 11, fontWeight: '600' },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  offSub: { fontSize: 13, marginTop: 4 },
});

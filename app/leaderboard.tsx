import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { useStreak } from '../hooks/useStreak';
import { useAdminLayout } from '../context/AdminLayoutContext';
import { useSocial } from '../hooks/useSocial';
import { usePartners } from '../context/PartnersContext';
import { getSphereTierForXp } from '../constants/SphereLevels';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { LegendPodiumCard } from '../components/LegendPodiumCard';
import { safeHaptics } from '../utils/safeHaptics';
import { ShareToSocialSheet } from '../components/ShareToSocialSheet';
import { buildAppSharePayload } from '../utils/shareToSocial';
import { usePreferences } from '../hooks/usePreferences';
import { useFlags } from '../components/FlagContext';
import { SPACE, RADIUS, LIST_OPTIMIZATION } from '../constants/DesignTokens';
import { useAuth } from '../context/AuthContext';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import { isAdminEmail } from '../constants/Admin';
import { getLeaderboardExplorers, getLeaderboardStreaks } from '../services/leaderboardFirestore';
import { useI18n } from '../context/I18nContext';

const SAMPLE_EXPLORERS: { id: string; name: string; val: string; badge?: string }[] = [];
const SAMPLE_STREAKS: { id: string; name: string; val: string; badge?: string }[] = [];

export default function LeaderboardScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { streak } = useStreak();
  const { getDisplayName } = useAdminLayout();
  const { circles } = useSocial();
  const { partners, getPerksForPartner } = usePartners();
  const { prefs } = usePreferences();
  const { flags } = useFlags();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { tier: effectiveTier } = useEffectiveTier();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'users' | 'partners' | 'spheres' | 'streaks'>('users');
  const [liveExplorers, setLiveExplorers] = useState<{ id: string; name: string; val: string; badge?: string }[]>([]);
  const [liveStreaks, setLiveStreaks] = useState<{ id: string; name: string; val: string; badge?: string }[]>([]);

  React.useEffect(() => {
    if (!flags.isFirestoreLiveEnabled) return;
    getLeaderboardExplorers(50).then(setLiveExplorers).catch(() => setLiveExplorers([]));
  }, [flags.isFirestoreLiveEnabled]);

  React.useEffect(() => {
    if (!flags.isFirestoreLiveEnabled) return;
    getLeaderboardStreaks(50).then(setLiveStreaks).catch(() => setLiveStreaks([]));
  }, [flags.isFirestoreLiveEnabled]);

  React.useEffect(() => {
    const t = params.tab as 'users' | 'partners' | 'spheres' | 'streaks' | undefined;
    if (t === 'users' || t === 'partners' || t === 'spheres' || t === 'streaks') setTab(t);
  }, [params.tab]);

  React.useEffect(() => {
    if (!flags.isLeaderboardEnabled) router.back();
  }, [flags.isLeaderboardEnabled, router]);
  if (!flags.isLeaderboardEnabled) return null;

  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; url?: string; title?: string } | null>(null);
  const listBottomPadding = 24 + insets.bottom;

  const renderListFooter = () => (
    <View style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: 16 + insets.bottom }]}>
      <View style={[styles.quickLinksRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.quickPill, { backgroundColor: colors.background }]} onPress={() => { safeHaptics.selectionAsync(); router.push('/stats' as any); }}>
          <Ionicons name="stats-chart" size={16} color={colors.text} />
          <Text style={[styles.quickPillText, { color: colors.text }]}>{t('leaderboard.stats')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickPill, { backgroundColor: colors.background }]} onPress={() => { safeHaptics.selectionAsync(); router.push('/missions' as any); }}>
          <Ionicons name="flag" size={16} color={colors.text} />
          <Text style={[styles.quickPillText, { color: colors.text }]}>{t('leaderboard.missions')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickPill, { backgroundColor: colors.background }]} onPress={() => { safeHaptics.selectionAsync(); router.push('/vote' as any); }}>
          <Ionicons name="stats-chart" size={16} color={colors.text} />
          <Text style={[styles.quickPillText, { color: colors.text }]}>{t('leaderboard.orbVote')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickPill, { backgroundColor: colors.background }]} onPress={() => { safeHaptics.selectionAsync(); router.push('/spheres' as any); }}>
          <Ionicons name="people" size={16} color={colors.text} />
          <Text style={[styles.quickPillText, { color: colors.text }]}>{t('leaderboard.spheres')}</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.sharePrompt, { color: colors.textSecondary }]}>{t('leaderboard.sharePrompt')}</Text>
      <TouchableOpacity style={[styles.shareBtn, { backgroundColor: themeGold + '22', borderColor: themeGold }]} onPress={handleShareRank}>
        <Ionicons name="share-outline" size={18} color={themeGold} />
        <Text style={[styles.shareBtnText, { color: themeGold }]}>{t('leaderboard.shareYourRank')}</Text>
      </TouchableOpacity>
    </View>
  );

  const sphereLeaderboard = useMemo(() => {
    const publicCircles = circles.filter((c) => c.isPublic !== false);
    return [...publicCircles]
      .sort((a, b) => (b.sphereXp ?? 0) - (a.sphereXp ?? 0))
      .map((c) => {
        const tier = getSphereTierForXp(c.sphereXp ?? 0);
        const val = (c.sphereXp ?? 0) >= 1000
          ? `${((c.sphereXp ?? 0) / 1000).toFixed(1)}k XP`
          : `${c.sphereXp ?? 0} XP`;
        return { id: c.id, name: c.name, val, badge: tier.title };
      });
  }, [circles]);

  const partnerLeaderboard = useMemo(() => {
    return [...partners]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 25)
      .map((p) => {
        const perkCount = getPerksForPartner(p.id).length;
        return {
          id: p.id,
          name: p.name,
          val: perkCount ? `${perkCount} perk${perkCount !== 1 ? 's' : ''}` : p.category,
          tier: p.tier.charAt(0).toUpperCase() + p.tier.slice(1),
        };
      });
  }, [partners, getPerksForPartner]);

  const getData = () => {
    switch (tab) {
      case 'users': {
        const liveData = flags.isFirestoreLiveEnabled && liveExplorers.length > 0 ? liveExplorers : SAMPLE_EXPLORERS;
        if (user?.uid) {
          const self = { id: user.uid, name: user.displayName || 'You', val: `${streak.currentStreak}d streak`, badge: 'Explorer' };
          const withoutSelf = liveData.filter((e) => e.id !== user.uid);
          return [self, ...withoutSelf];
        }
        return liveData;
      }
      case 'partners': return partnerLeaderboard;
      case 'spheres': return sphereLeaderboard;
      case 'streaks': {
        if (!flags.isFirestoreLiveEnabled && user?.uid) {
          return [{ id: user.uid, name: user.displayName || 'You', val: `${streak.currentStreak} Days`, badge: streak.currentStreak >= 30 ? 'Veteran' : 'Rising' }];
        }
        return flags.isFirestoreLiveEnabled && liveStreaks.length > 0 ? liveStreaks : SAMPLE_STREAKS;
      }
    }
  };

  const getLabel = (tabKey: string) => {
    if (tabKey === 'users') return t('leaderboard.explorers');
    if (tabKey === 'partners') return t('leaderboard.partners');
    if (tabKey === 'spheres') return t('leaderboard.spheres');
    if (tabKey === 'streaks') return t('leaderboard.streaks');
    return '';
  };

  const handleShareRank = () => {
    safeHaptics.selectionAsync();
    setSharePayload(buildAppSharePayload(
      `I'm on the OrbTap Local Legends leaderboard — ${streak.currentStreak} day streak. ${prefs.shareMessage}`,
      'OrbTap Legends'
    ));
    setShareSheetVisible(true);
  };

  const data = getData() as { id: string; name: string; val: string; badge?: string; tier?: string }[];
  const isPartnerTab = tab === 'partners';
  const isSphereTab = tab === 'spheres';
  const isUserTab = tab === 'users';
  const isStreakTab = tab === 'streaks';
  const isUserOrStreakTab = isUserTab || isStreakTab;

  // "Only X OT behind" psychology callout
  const userRankIdx = data.findIndex((d) => d.id === user?.uid);
  const userRank = userRankIdx >= 0 ? userRankIdx + 1 : null;
  const nextAboveItem = userRankIdx > 0 ? data[userRankIdx - 1] : null;
  const behindCallout = useMemo(() => {
    if (!userRank || !nextAboveItem || !isUserTab) return null;
    // Extract numeric OT gap (very rough — real impl uses Firestore points)
    const nextVal = parseInt(nextAboveItem.val.replace(/[^0-9]/g, ''), 10);
    const userVal = userRankIdx >= 0 ? parseInt(data[userRankIdx].val.replace(/[^0-9]/g, ''), 10) : 0;
    const gap = isNaN(nextVal) || isNaN(userVal) ? null : nextVal - userVal;
    return { rank: userRank, gap, name: nextAboveItem.name };
  }, [userRank, nextAboveItem, isUserTab, data, userRankIdx]);

  // Territory Holder — top scanner per venue (Phase 7: real query; hide until backend wired)
  const territoryHolder = useMemo(() => {
    if (!isPartnerTab || !flags.isFirestoreLiveEnabled || partners.length === 0) return null;
    // Phase 7: query real top-scanner per venue from Firestore
    return null;
  }, [isPartnerTab, flags.isFirestoreLiveEnabled, partners.length]);

  const goToUserProfile = (userId: string) => {
    safeHaptics.selectionAsync();
    router.push(`/user/${userId}` as any);
  };

  const renderItem = ({ item, index }: { item: typeof data[0]; index: number }) => {
    const rank = index + 1;
    const score = item.val;
    const subtext = isPartnerTab ? (item as any).tier : (item as any).badge ?? '';
    // Mock rank change — alternating pattern for visual demo; replace with real data from Firestore
    const mockRankChange = index === 0 ? 0 : index % 3 === 1 ? (index % 6 < 3 ? 2 : -1) : index % 3 === 2 ? -3 : 1;
    const partnerTier = isPartnerTab && (item as any).tier === 'Platinum' ? 'pro' as const : undefined;
    const userTier = isUserOrStreakTab && item.id === user?.uid ? effectiveTier : undefined;

    if (rank <= 3) {
      const onPodiumPress = isSphereTab
        ? () => { safeHaptics.selectionAsync(); router.push(`/spheres/${item.id}` as any); }
        : isPartnerTab
          ? () => { safeHaptics.selectionAsync(); router.push(`/partner/${item.id}` as any); }
          : isUserOrStreakTab
            ? () => goToUserProfile(item.id)
            : undefined;
      return (
        <View style={styles.podiumWrap}>
          <LegendPodiumCard
            rank={rank as 1 | 2 | 3}
            name={item.name}
            score={score}
            subtext={subtext}
            isPartner={isPartnerTab}
            onPress={onPodiumPress}
          />
        </View>
      );
    }

    if (rank === 4) {
      return (
        <View>
          <View style={[styles.rankingsDivider, { borderColor: colors.border }]}>
            <Text style={[styles.rankingsDividerText, { color: colors.textSecondary }]}>RANKINGS</Text>
          </View>
          {isSphereTab ? (
            <TouchableOpacity activeOpacity={0.88} onPress={() => { safeHaptics.selectionAsync(); router.push(`/spheres/${item.id}` as any); }}>
              <LeaderboardRow rank={rank} name={item.name} score={score} subtext={subtext} isPartner={false} rankChange={mockRankChange} />
            </TouchableOpacity>
          ) : isPartnerTab ? (
            <LeaderboardRow rank={rank} name={item.name} score={score} subtext={subtext} isPartner tier={partnerTier} rankChange={mockRankChange} onPress={() => { safeHaptics.selectionAsync(); router.push(`/partner/${item.id}` as any); }} />
          ) : isUserOrStreakTab ? (
            <LeaderboardRow rank={rank} name={item.name} score={score} subtext={subtext} isPartner={false} tier={userTier} rankChange={mockRankChange} onPress={() => goToUserProfile(item.id)} />
          ) : (
            <LeaderboardRow rank={rank} name={item.name} score={score} subtext={subtext} isPartner={false} tier={userTier} rankChange={mockRankChange} />
          )}
        </View>
      );
    }

    if (isSphereTab) {
      return (
        <TouchableOpacity activeOpacity={0.88} onPress={() => { safeHaptics.selectionAsync(); router.push(`/spheres/${item.id}` as any); }}>
          <LeaderboardRow rank={rank} name={item.name} score={score} subtext={subtext} isPartner={false} rankChange={mockRankChange} />
        </TouchableOpacity>
      );
    }
    if (isPartnerTab) {
      return (
        <LeaderboardRow rank={rank} name={item.name} score={score} subtext={subtext} isPartner tier={partnerTier} rankChange={mockRankChange} onPress={() => { safeHaptics.selectionAsync(); router.push(`/partner/${item.id}` as any); }} />
      );
    }
    if (isUserOrStreakTab) {
      return (
        <LeaderboardRow rank={rank} name={item.name} score={score} subtext={subtext} isPartner={false} tier={userTier} rankChange={mockRankChange} onPress={() => goToUserProfile(item.id)} />
      );
    }
    return <LeaderboardRow rank={rank} name={item.name} score={score} subtext={subtext} isPartner={false} tier={userTier} rankChange={mockRankChange} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
        {/* Compact header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{getDisplayName('screen_leaderboard_header', 'Legends')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Single-line hero strip: trophy + tagline + streak + live */}
        <View style={[styles.heroStrip, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.trophyIcon, { backgroundColor: themeGold + '22' }]}>
            <Ionicons name="trophy" size={20} color={themeGold} />
          </View>
          <Text style={[styles.heroTag, { color: colors.textSecondary }]}>
            {getDisplayName('screen_leaderboard_hero', 'Local Legends')}
          </Text>
          <Text style={[styles.heroDot, { color: colors.textSecondary }]}>·</Text>
          <Text style={[styles.heroStreak, { color: colors.text }]}>Your streak: {streak.currentStreak}d</Text>
          <View style={[styles.livePill, { backgroundColor: themeGold + '18', borderColor: themeGold }]}>
            <View style={[styles.liveDot, { backgroundColor: themeGold }]} />
            <Text style={[styles.liveText, { color: themeGold }]}>Live</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {(['users', 'partners', 'spheres', 'streaks'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive, { borderColor: colors.border, backgroundColor: tab === t ? themeGold : colors.surface }]}
              onPress={() => { safeHaptics.selectionAsync(); setTab(t); }}
            >
              <Text style={[styles.tabText, { color: tab === t ? '#000' : colors.textSecondary }]}>{getLabel(t)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* List: Top 3 as podium cards, rest as achievement rows */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: listBottomPadding }]}
        removeClippedSubviews={LIST_OPTIMIZATION.removeClippedSubviews}
        maxToRenderPerBatch={LIST_OPTIMIZATION.maxToRenderPerBatch}
        windowSize={LIST_OPTIMIZATION.windowSize}
        initialNumToRender={LIST_OPTIMIZATION.initialNumToRender}
        ListHeaderComponent={
          <View style={styles.listHeaderWrap}>
            <View style={[styles.howItWorks, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.howItWorksTitle, { color: colors.text }]}>How the leaderboards work</Text>
              <Text style={[styles.howItWorksBody, { color: colors.textSecondary }]}>
                <Text style={styles.bold}>Explorers</Text> — Ranked by total XP. Earn XP by scanning at partners, completing missions, and staying active. Climb by doing more verified actions.{'\n\n'}
                <Text style={styles.bold}>Streaks</Text> — Ranked by daily streak (consecutive days with activity). Log in and complete at least one action each day to build your streak.{'\n\n'}
                <Text style={styles.bold}>Partners</Text> — Businesses on OrbTap. Tap to visit their page.{'\n\n'}
                <Text style={styles.bold}>Spheres</Text> — Teams ranked by collective XP. Join or create a sphere to compete together.
              </Text>
              <Text style={[styles.howItWorksTap, { color: colors.primary }]}>Tap a name to view their public profile (if they've allowed it).</Text>
            </View>
            {/* "Only X OT behind" callout — loss aversion psychology */}
            {behindCallout && behindCallout.gap != null && behindCallout.gap > 0 && (
              <View style={[styles.behindCallout, { backgroundColor: COLORS.danger + '12', borderColor: COLORS.danger + '50' }]}>
                <Ionicons name="arrow-up-circle" size={18} color={COLORS.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.behindCalloutTitle, { color: colors.text }]}>
                    You're #{behindCallout.rank} — only <Text style={{ color: COLORS.danger, fontWeight: '900' }}>{behindCallout.gap.toLocaleString()} OT</Text> behind {behindCallout.name}
                  </Text>
                  <Text style={[styles.behindCalloutSub, { color: colors.textSecondary }]}>Scan at a partner today to close the gap</Text>
                </View>
                <TouchableOpacity
                  style={[styles.behindCalloutBtn, { backgroundColor: COLORS.danger }]}
                  onPress={() => router.push('/(tabs)/scan' as any)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="qr-code" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Territory Holder mechanic */}
            {territoryHolder && (
              <View style={[styles.territoryCard, { backgroundColor: themeGold + '12', borderColor: themeGold + '44' }]}>
                <Ionicons name="flag" size={16} color={themeGold} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.territoryTitle, { color: colors.text }]}>Territory Holder — {territoryHolder.partnerName}</Text>
                  <Text style={[styles.territorySub, { color: colors.textSecondary }]}>
                    <Text style={{ fontWeight: '800', color: themeGold }}>{territoryHolder.holderName}</Text> · {territoryHolder.visits} verified visits this week
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.territoryBtn, { borderColor: themeGold + '55' }]}
                  onPress={() => router.push('/(tabs)/scan' as any)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.territoryBtnText, { color: themeGold }]}>Claim</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Engagement CTA when only self or no live users */}
            {isUserOrStreakTab && data.length <= 1 && (
              <View style={[styles.emptyLeaderboard, { backgroundColor: themeGold + '0E', borderColor: themeGold + '30' }]}>
                <Ionicons name="trophy-outline" size={40} color={themeGold} />
                <Text style={[styles.emptyLeaderTitle, { color: colors.text }]}>Be the first on the board</Text>
                <Text style={[styles.emptyLeaderSub, { color: colors.textSecondary }]}>
                  Scan at a partner, complete missions, and earn OT to claim your rank.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyLeaderBtn, { backgroundColor: themeGold }]}
                  onPress={() => router.push('/(tabs)' as any)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyLeaderBtnText}>Start exploring</Text>
                </TouchableOpacity>
              </View>
            )}
            {data.length > 0 ? (
              <>
                <Text style={[styles.listHeader, { color: colors.textSecondary }]}>Proof-weighted · Fair play</Text>
                {data.length >= 3 && (
                  <View style={[styles.top3Label, { backgroundColor: themeGold + '22', borderColor: themeGold }]}>
                    <Ionicons name="trophy" size={12} color={themeGold} />
                    <Text style={[styles.top3LabelText, { color: themeGold }]}>TOP 3</Text>
                  </View>
                )}
              </>
            ) : null}
          </View>
        }
        ListFooterComponent={renderListFooter}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIconWrap, { backgroundColor: themeGold + '18', borderColor: themeGold + '40' }]}>
              <Ionicons name="trophy" size={40} color={themeGold} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {tab === 'users' ? 'Be the first Legend' : tab === 'streaks' ? 'Start your streak today' : 'No rankings yet'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {tab === 'users'
                ? 'Scan at partners, complete missions, and earn OT Points to claim your spot.'
                : tab === 'streaks'
                ? 'Visit a partner and scan their QR every day to build an unstoppable streak.'
                : 'Rankings will appear here as activity grows.'}
            </Text>
            {(tab === 'users' || tab === 'streaks') && (
              <TouchableOpacity
                style={[styles.emptyCta, { backgroundColor: themeGold }]}
                onPress={() => router.push('/(tabs)/scan' as any)}
                activeOpacity={0.85}
              >
                <Ionicons name="qr-code" size={16} color="#000" />
                <Text style={styles.emptyCtaText}>Scan now to earn</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label="Share your rank"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // "Only X OT behind" callout
  behindCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    padding: SPACE.md,
    marginBottom: SPACE.md,
  },
  behindCalloutTitle: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  behindCalloutSub: { fontSize: 11, fontWeight: '400', marginTop: 2 },
  behindCalloutBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  // Territory Holder
  territoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    padding: SPACE.md,
    marginBottom: SPACE.md,
  },
  territoryTitle: { fontSize: 13, fontWeight: '800' },
  territorySub: { fontSize: 11, fontWeight: '400', marginTop: 2 },
  territoryBtn: { borderRadius: RADIUS.full, borderWidth: 1, paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs + 2 },
  territoryBtnText: { fontSize: 12, fontWeight: '800' },
  container: { flex: 1 },
  safe: { backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
  },
  backBtn: { padding: SPACE.xs },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  headerSpacer: { width: 40 },
  heroStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.base,
    gap: SPACE.sm,
    borderBottomWidth: 1,
  },
  trophyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTag: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  heroDot: { fontSize: 12 },
  heroStreak: { fontSize: 12, fontWeight: '700' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1, marginLeft: 'auto' },
  liveDot: { width: 4, height: 4, borderRadius: 2 },
  liveText: { fontSize: 10, fontWeight: '800' },
  tabRow: { flexDirection: 'row', paddingHorizontal: SPACE.base, paddingVertical: SPACE.sm, gap: SPACE.sm, borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.full, borderWidth: 1 },
  tabActive: {},
  tabText: { fontWeight: '700', fontSize: 12 },
  list: { paddingHorizontal: SPACE.base, paddingTop: SPACE.sm },
  listHeaderWrap: { marginBottom: SPACE.sm },
  howItWorks: { padding: SPACE.base, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACE.md },
  howItWorksTitle: { fontSize: 14, fontWeight: '800', marginBottom: SPACE.sm },
  howItWorksBody: { fontSize: 12, lineHeight: 18 },
  bold: { fontWeight: '700' },
  howItWorksTap: { fontSize: 11, fontWeight: '700', marginTop: SPACE.sm },
  listHeader: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  top3Label: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, marginTop: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1 },
  top3LabelText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  podiumWrap: { marginBottom: SPACE.sm },
  rankingsDivider: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.sm, marginTop: SPACE.sm, borderTopWidth: 1 },
  rankingsDividerText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  footer: {
    marginTop: SPACE.xl,
    padding: SPACE.base,
    paddingTop: SPACE.lg,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  quickLinksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, paddingBottom: SPACE.base, marginBottom: SPACE.base, borderBottomWidth: 1 },
  quickPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.sm },
  quickPillText: { fontSize: 12, fontWeight: '600' },
  sharePrompt: { fontSize: 12, fontWeight: '600', marginBottom: SPACE.sm, textAlign: 'center' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: RADIUS.sm, borderWidth: 1 },
  shareBtnText: { fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: SPACE.xl },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginBottom: SPACE.base },
  emptyTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: SPACE.sm },
  emptyText: { fontSize: 14, marginTop: 0, textAlign: 'center', lineHeight: 20 },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: SPACE.xl, paddingHorizontal: SPACE.xl, paddingVertical: SPACE.base, borderRadius: RADIUS.md },
  emptyCtaText: { fontSize: 15, fontWeight: '800', color: '#000' },
  emptyLeaderboard: { borderRadius: RADIUS.md, borderWidth: 1, padding: SPACE.xl, alignItems: 'center', marginBottom: SPACE.md },
  emptyLeaderTitle: { fontSize: 17, fontWeight: '800', marginTop: SPACE.md, marginBottom: SPACE.sm, textAlign: 'center' },
  emptyLeaderSub: { fontSize: 13, lineHeight: 18, textAlign: 'center', marginBottom: SPACE.xl },
  emptyLeaderBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.xl, paddingVertical: SPACE.md, borderRadius: RADIUS.md },
  emptyLeaderBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
});

/**
 * OrbPulse Commerce Feed (OrbFeed) — list of partner posts. Modes: Nearby, Tonight, Drops, New, etc.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOrbFeed } from '../../hooks/useOrbFeed';
import { useFollowing } from '../../hooks/useFollowing';
import { usePolls } from '../../hooks/usePolls';
import { usePreferences } from '../../hooks/usePreferences';
import { useFlags } from '../../components/FlagContext';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';
import {
  type OrbPost,
  type FeedMode,
  getPostTypeLabel,
  getCtaLabel,
  getPostTypeColor,
} from '../../constants/OrbFeed';
import { PollCard } from '../../components/PollCard';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { usePartners } from '../../context/PartnersContext';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { useSearchOpen } from '../../context/SearchOpenContext';
import { GuidedTutorialOverlay } from '../../components/GuidedTutorialOverlay';
import { useTutorial } from '../../context/TutorialContext';
import { ShareToSocialSheet } from '../../components/ShareToSocialSheet';
import { feedPostSharePayload } from '../../utils/shareToSocial';
import { feedPostDeepLink } from '../../constants/AppLinks';
import { SponsoredAdSlot } from '../../components/SponsoredAdSlot';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { useI18n } from '../../context/I18nContext';
import { SPACE, RADIUS, TYPE, SCROLL_CONTENT } from '../../constants/DesignTokens';

const FEED_MODES: { key: FeedMode; label: string }[] = [
  { key: 'nearby', label: 'Nearby' },
  { key: 'tonight', label: 'Tonight' },
  { key: 'drops', label: 'Drops' },
  { key: 'new', label: 'New' },
  { key: 'polls', label: 'OrbVote' },
  { key: 'services', label: 'Services' },
  { key: 'following', label: 'Following' },
  { key: 'deals', label: 'Deals' },
];

function formatExpires(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  if (d.getDate() !== now.getDate()) return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function OrbFeedScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { flags } = useFlags();
  const [mode, setMode] = useState<FeedMode>('nearby');
  const { prefs } = usePreferences();
  const { following, follow, unfollow } = useFollowing();
  const { posts, loading, refresh } = useOrbFeed(mode, prefs.contentMode ?? 'moderated', following);
  const { polls, loading: pollsLoading, refresh: refreshPolls, submitVote, getVotedOption, fromFirestore } = usePolls();
  const [refreshing, setRefreshing] = useState(false);
  const searchOpen = useSearchOpen();
  const [showFeedTutorial, setShowFeedTutorial] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<{ message: string; url?: string; title?: string } | null>(null);
  const { getPartner } = usePartners();
  const { shouldShowTutorial, markCompleted, setSkipAllTutorials } = useTutorial();

  useEffect(() => {
    if (shouldShowTutorial('feed')) setShowFeedTutorial(true);
  }, [shouldShowTutorial]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (!flags.isOrbFeedEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Commerce Feed</Text>
        </View>
        <View style={styles.offState}>
          <Ionicons name="newspaper-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.offText, { color: colors.text }]}>Feed is off</Text>
          <Text style={[styles.offSub, { color: colors.textSecondary }]}>Enable in Admin Hub.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), mode === 'polls' ? refreshPolls() : Promise.resolve()]);
    setRefreshing(false);
  };

  const handlePostPress = (post: OrbPost) => {
    router.push({ pathname: '/feed/[id]', params: { id: post.id } } as any);
  };

  const handleShare = (post: OrbPost) => {
    setSharePayload(feedPostSharePayload(
      `${post.title} — ${post.partnerName}. See it on OrbTap!`,
      feedPostDeepLink(post.id),
    ));
    setShareSheetVisible(true);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.headerWrap, { borderBottomColor: colors.border }]}>
        <View style={[styles.header, { borderBottomWidth: 0 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.title, { color: colors.text }]}>Commerce Feed</Text>
            <Text style={[styles.feedSubline, { color: colors.textSecondary }]} numberOfLines={1}>Verified partner drops & deals</Text>
          </View>
          <TouchableOpacity style={styles.headerSearchBtn} onPress={() => searchOpen?.openSearch('all')} hitSlop={12}>
            <Ionicons name="search" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterRow, { borderTopWidth: 1, borderTopColor: colors.border }]}
        >
          {FEED_MODES.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterPill,
                mode === key && { backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa', borderColor: COLORS.neonBlue?.[0] ?? '#60a5fa' },
                mode !== key && { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
              ]}
              onPress={() => setMode(key)}
            >
              <Text style={[styles.filterText, { color: mode === key ? '#000' : colors.textSecondary }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <GuidedTutorialOverlay
        visible={showFeedTutorial}
        tutorialId="feed"
        onClose={() => { markCompleted('feed'); setShowFeedTutorial(false); }}
        onSkipAll={() => { setSkipAllTutorials(); setShowFeedTutorial(false); }}
      />

      {loading || (mode === 'polls' && pollsLoading) ? (
        <View style={styles.loadWrap}>
          <SkeletonCard preset="feedCard" />
          <SkeletonCard preset="feedCard" />
          <SkeletonCard preset="feedCard" />
          <Text style={[styles.loadText, { color: colors.textSecondary, marginTop: 16 }]}>Loading…</Text>
        </View>
      ) : mode === 'polls' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
          }
        >
          <Text style={[styles.trustBadge, { color: colors.textSecondary }]}>
            Vote to earn 5 OT each · One vote per poll
          </Text>
          {polls.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="ellipse-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No polls yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Polls from partners will appear here. Check OrbVote for active polls.
              </Text>
              <TouchableOpacity
                style={[styles.pollsCta, { backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa' }]}
                onPress={() => router.push('/vote' as any)}
              >
                <Text style={styles.pollsCtaText}>Open OrbVote</Text>
              </TouchableOpacity>
            </View>
          ) : (
            polls
              .sort((a, b) => b.totalVotes - a.totalVotes)
              .map((p) => (
                <View key={p.id} style={styles.pollCardWrap}>
                  <PollCard
                    poll={p}
                    onVote={fromFirestore ? submitVote : undefined}
                    votedOption={getVotedOption(p.id)}
                  />
                </View>
              ))
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
          }
        >
          <Text style={[styles.trustBadge, { color: colors.textSecondary }]}>
            Proof-backed actions · Verified partners
          </Text>

          <View style={{ paddingHorizontal: SPACE.base, marginBottom: SPACE.md }}>
            <SponsoredAdSlot placement="orb_carousel" sectionTitle="SPONSORED" />
          </View>

          {posts.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="newspaper-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {mode === 'following' ? 'No one to show yet' : 'No posts in this filter'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {mode === 'following'
                  ? 'Follow partners from their posts to see them here.'
                  : 'Try another tab or pull to refresh.'}
              </Text>
              {mode === 'following' ? (
                <TouchableOpacity
                  style={[styles.emptyCta, { backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa' }]}
                  onPress={() => setMode('nearby')}
                >
                  <Text style={styles.emptyCtaText}>Browse all posts</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.emptyCta, { backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa', marginBottom: 10 }]}
                    onPress={() => router.push('/(tabs)' as any)}
                  >
                    <Text style={styles.emptyCtaText}>Explore map</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emptyCtaSecondary, { borderColor: colors.border }]}
                    onPress={() => router.push('/missions' as any)}
                  >
                    <Text style={[styles.emptyCtaSecondaryText, { color: colors.text }]}>Daily missions</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            posts.map((post) => {
              const partner = getPartner(post.partnerId);
              const tierColor = PARTNER_TIER_COLORS[partner?.tier ?? 'silver'];
              return (
              <TouchableOpacity
                key={post.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: tierColor + '99', borderLeftWidth: 4, borderLeftColor: tierColor }]}
                onPress={() => handlePostPress(post)}
                activeOpacity={0.88}
              >
                <View style={styles.cardTop}>
                  <View style={styles.partnerRow}>
                    <Text style={[styles.partnerName, { color: colors.text }]} numberOfLines={1}>
                      {post.partnerName}
                    </Text>
                    {post.partnerVerified && <VerifiedBadge size={14} tier={partner?.tier} />}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        if (following.has(post.partnerId)) unfollow(post.partnerId);
                        else follow(post.partnerId);
                      }}
                      style={[
                        styles.followBtn,
                        following.has(post.partnerId)
                          ? { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }
                          : { backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa', borderColor: COLORS.neonBlue?.[0] ?? '#60a5fa' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.followBtnText,
                          { color: following.has(post.partnerId) ? colors.textSecondary : '#000' },
                        ]}
                      >
                        {following.has(post.partnerId) ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.typePill, { backgroundColor: getPostTypeColor(post.type).bg }]}>
                    <Text style={[styles.typePillText, { color: getPostTypeColor(post.type).text }]}>
                      {getPostTypeLabel(post.type)}
                    </Text>
                  </View>
                </View>
                {post.mediaRefs.length > 0 ? (
                  <Image source={{ uri: post.mediaRefs[0] }} style={styles.heroImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.heroPlaceholder, { backgroundColor: colors.surfaceHighlight }]}>
                    <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                  </View>
                )}
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={[styles.cardBody, { color: colors.textSecondary }]} numberOfLines={2}>
                  {post.body}
                </Text>
                {(post.stats?.redemptionsVerified ?? 0) > 0 && (
                  <Text style={[styles.momentumStrip, { color: COLORS.success ?? '#4ade80' }]}>
                    {post.stats?.redemptionsVerified ?? 0} verified today
                  </Text>
                )}
                {post.scarcity?.quantityRemaining != null && (
                  <Text style={[styles.scarcity, { color: themeGold }]}>
                    {post.scarcity.quantityRemaining} left
                    {post.scarcity.expiresAt != null && ` · Expires ${formatExpires(post.scarcity.expiresAt)}`}
                  </Text>
                )}
                {post.boosted && (
                  <Text style={[styles.sponsored, { color: colors.textSecondary }]}>Sponsored</Text>
                )}
                <View style={[styles.ctaRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.ctaLabel, { color: tierColor }]}>
                    {getCtaLabel(post.cta.kind)}
                  </Text>
                  <View style={styles.secondaryActions}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleShare(post);
                      }}
                      style={styles.iconBtn}
                    >
                      <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
            })
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
      {sharePayload && (
        <ShareToSocialSheet
          visible={shareSheetVisible}
          onClose={() => { setShareSheetVisible(false); setSharePayload(null); }}
          payload={sharePayload}
          label="Share post"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerWrap: { borderBottomWidth: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.md,
  },
  backBtn: { marginRight: SPACE.md },
  headerTitleWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: TYPE.heading, fontWeight: '700' },
  feedSubline: { fontSize: TYPE.caption, fontWeight: '600', marginTop: 2 },
  headerSearchBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filterRow: { paddingHorizontal: SPACE.base, paddingVertical: SPACE.md, gap: SPACE.sm },
  filterPill: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  filterText: { fontSize: TYPE.label, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { ...SCROLL_CONTENT },
  trustBadge: {
    fontSize: TYPE.caption,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: SPACE.base,
  },
  loadWrap: { padding: SPACE.xxxl, alignItems: 'center' },
  loadText: { fontSize: TYPE.label },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: TYPE.subheading, fontWeight: '700', marginTop: SPACE.md },
  emptySub: { fontSize: TYPE.label, marginTop: SPACE.sm, textAlign: 'center', marginBottom: SPACE.sm },
  emptyCta: { marginTop: SPACE.md, paddingVertical: SPACE.md, paddingHorizontal: SPACE.xl, borderRadius: RADIUS.md },
  emptyCtaText: { color: '#000', fontSize: TYPE.body, fontWeight: '800' },
  emptyCtaSecondary: {
    marginTop: SPACE.xs,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  emptyCtaSecondaryText: { fontSize: TYPE.label, fontWeight: '700' },
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 0,
    marginBottom: SPACE.base,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: SPACE.md, paddingBottom: SPACE.sm },
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  partnerName: { fontSize: TYPE.body, fontWeight: '700', flex: 1, minWidth: 0 },
  followBtn: { paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs, borderRadius: RADIUS.sm, borderWidth: 1, marginLeft: SPACE.xs },
  followBtnText: { fontSize: TYPE.caption, fontWeight: '700' },
  typePill: { paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs, borderRadius: RADIUS.sm },
  typePillText: { fontSize: TYPE.caption, fontWeight: '700' },
  heroImage: { width: '100%', height: 160, backgroundColor: '#1a1a1e' },
  heroPlaceholder: { width: '100%', height: 120, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: TYPE.subheading, fontWeight: '700', paddingHorizontal: SPACE.md, paddingTop: SPACE.md },
  cardBody: { fontSize: TYPE.label, lineHeight: 20, paddingHorizontal: SPACE.md, paddingTop: SPACE.xs, paddingBottom: SPACE.sm },
  momentumStrip: { fontSize: TYPE.caption, fontWeight: '600', paddingHorizontal: SPACE.md, marginBottom: SPACE.xs },
  scarcity: { fontSize: TYPE.caption, fontWeight: '600', paddingHorizontal: SPACE.md, marginBottom: SPACE.xs },
  sponsored: { fontSize: TYPE.caption, paddingHorizontal: SPACE.md, marginBottom: SPACE.xs },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.md,
    borderTopWidth: 1,
  },
  ctaLabel: { fontSize: TYPE.label, fontWeight: '600' },
  secondaryActions: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  iconBtn: { padding: 6 },
  pollCardWrap: { marginBottom: SPACE.base },
  pollsCta: { marginTop: SPACE.base, paddingVertical: SPACE.md, paddingHorizontal: SPACE.xl, borderRadius: RADIUS.md, alignSelf: 'center' },
  pollsCtaText: { color: '#000', fontSize: TYPE.body, fontWeight: '800' },
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACE.xl },
  offText: { fontSize: TYPE.heading, fontWeight: '700', marginTop: SPACE.md },
  offSub: { fontSize: TYPE.label, marginTop: SPACE.xs, textAlign: 'center' },
});

/**
 * OrbTap Orb Hub — Sprint 12 "Mission Control" redesign.
 * Premium dark aesthetic, OrbHeroPanel, QuickActionsBar, ritual-first order,
 * live activity strip, upgrade CTA, frosted-glass category cards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';
import MasterDirectory from '../../components/MasterDirectory';
import { AllPagesGridModal } from '../../components/AllPagesGridModal';
import { GuidedTutorialOverlay } from '../../components/GuidedTutorialOverlay';
import { useTutorial } from '../../context/TutorialContext';
import { useDirectoryOpen } from '../../context/DirectoryOpenContext';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { useFlags } from '../../components/FlagContext';
import { usePreferences } from '../../hooks/usePreferences';
import { useOrbScope, getOrbScopeActionRoute } from '../../hooks/useOrbScope';
import { DailyFactCard } from '../../components/DailyFactCard';
import { DailyStreakOrb } from '../../components/DailyStreakOrb';
import { FeaturedPartnerCard } from '../../components/FeaturedPartnerCard';
import { FeaturedCarousel } from '../../components/FeaturedCarousel';
import { useFeaturedPartners } from '../../hooks/useFeaturedPartners';
import { SponsoredAdSlot } from '../../components/SponsoredAdSlot';
import { OrbScopeCard } from '../../components/OrbScopeCard';
import { OrbHeroPanel } from '../../components/OrbHeroPanel';
import { QuickActionsBar } from '../../components/QuickActionsBar';
import { useSearchOpen } from '../../context/SearchOpenContext';
import { useWallet } from '../../hooks/useWallet';
import { useXP } from '../../hooks/useXP';
import { useStreak } from '../../hooks/useStreak';
import { usePartners } from '../../context/PartnersContext';
import { useMyPartner } from '../../hooks/useMyPartner';
import { useEffectiveTier } from '../../hooks/useEffectiveTier';
import { PARTNER_TIER_COLORS } from '../../constants/PartnerTiers';
import { ORBSWIPE_HUB_SUBLINE } from '../../constants/ViralCopy';
import { useCurrentUserProfile } from '../../hooks/useCurrentUserProfile';
import { safeHaptics } from '../../utils/safeHaptics';
import { isAdminEmail } from '../../constants/Admin';
import type { FlagKey } from '../../constants/Flags';
import { useAdminLayout } from '../../context/AdminLayoutContext';
import { useMapHistory } from '../../context/MapHistoryContext';
import { useUserLocation } from '../../context/UserLocationContext';
import { distanceToPartner, formatDistanceMi } from '../../utils/location';
import { PerkGridModal } from '../../components/PerkGridModal';
import { FirstGridEntryModal } from '../../components/FirstGridEntryModal';
import { DoNextStrip } from '../../components/DoNextStrip';
import { TierGlow } from '../../components/TierGlow';
import type { Partner } from '../../constants/MockData';
import { useSocial } from '../../hooks/useSocial';
import { usePulse } from '../../hooks/usePulse';
import { useMissions, isMissionFullyComplete } from '../../context/MissionsContext';

const FIRST_GRID_ENTRY_STORAGE_KEY = 'ORBTAP_FIRST_GRID_ENTRY_SHOWN';

// ─── Hub tile definition ───
const HUB_CATEGORIES: Array<{
  id: string;
  label: string;
  accent: string;
  emoji: string;
  tiles: Array<{ id: string; label: string; subLabel: string; icon: string; color: string; route: string; flagKey?: FlagKey; minTier?: 'premium' | 'pro' }>;
}> = [
  {
    id: 'earn',
    label: 'Earn',
    accent: '#22C55E',
    emoji: '⚡',
    tiles: [
      { id: 'pulse', label: 'OrbPulse', subLabel: 'Live drops', icon: 'pulse', color: '#4ADE80', route: '/pulse', flagKey: 'isOrbPulseEnabled' },
      { id: 'missions', label: 'Missions', subLabel: 'Daily OT', icon: 'flag', color: '#FBBF24', route: '/missions', flagKey: 'isOrbQuestEnabled' },
      { id: 'vote', label: 'OrbVote', subLabel: 'Polls', icon: 'stats-chart', color: '#60A5FA', route: '/vote', flagKey: 'isOrbVoteEnabled' },
      { id: 'bounty', label: 'OrbBounty', subLabel: 'Deal Bounty', icon: 'gift', color: '#F59E0B', route: '/bounty', flagKey: 'isOrbBountyEnabled' },
    ],
  },
  {
    id: 'discover',
    label: 'Discover',
    accent: '#0EA5E9',
    emoji: '🗺️',
    tiles: [
      { id: 'map', label: 'Map', subLabel: 'Nearby', icon: 'map', color: '#22C55E', route: '/(tabs)' },
      { id: 'orbswipe', label: 'OrbSwipe Tonight', subLabel: ORBSWIPE_HUB_SUBLINE, icon: 'swap-horizontal', color: '#A78BFA', route: '/orbswipe', flagKey: 'isOrbSwipeEnabled' },
      { id: 'partners', label: 'Partners', subLabel: 'Browse & perks', icon: 'business', color: '#0EA5E9', route: '/partners' },
      { id: 'bookmarks', label: 'Bookmarks', subLabel: 'Saved', icon: 'bookmark', color: '#F59E0B', route: '/bookmarks', flagKey: 'isBookmarksEnabled' },
      { id: 'feed', label: 'Feed', subLabel: 'Commerce', icon: 'newspaper', color: '#4ADE80', route: '/feed', flagKey: 'isOrbFeedEnabled' },
    ],
  },
  {
    id: 'compete',
    label: 'Compete',
    accent: '#A78BFA',
    emoji: '🏆',
    tiles: [
      { id: 'leaderboard', label: 'Leaderboard', subLabel: 'Ranks', icon: 'trophy', color: '#A78BFA', route: '/leaderboard', flagKey: 'isLeaderboardEnabled' },
      { id: 'orbsignal', label: 'Orb Signal', subLabel: 'Predict', icon: 'radio', color: '#EF4444', route: '/orbsignal', flagKey: 'isOrbSignalEnabled', minTier: 'premium' },
    ],
  },
  {
    id: 'grow',
    label: 'Grow',
    accent: '#FBBF24',
    emoji: '📈',
    tiles: [
      { id: 'stats', label: 'Stats', subLabel: 'Your impact', icon: 'stats-chart', color: '#22C55E', route: '/stats', flagKey: 'isStatsEnabled' },
      { id: 'knowledge', label: 'Knowledge', subLabel: 'Learn', icon: 'bulb', color: '#FBBF24', route: '/knowledge', flagKey: 'isKnowledgeEnabled' },
      { id: 'premium', label: 'Premium', subLabel: 'Unlock more', icon: 'diamond', color: '#8B5CF6', route: '/premium' },
      { id: 'spheres', label: 'Spheres', subLabel: 'Groups', icon: 'people', color: '#8B5CF6', route: '/spheres' },
    ],
  },
  {
    id: 'go',
    label: 'Go',
    accent: '#60A5FA',
    emoji: '🚀',
    tiles: [
      { id: 'scan', label: 'Scan', subLabel: 'Redeem', icon: 'qr-code', color: '#4ADE80', route: '/(tabs)/scan' },
      { id: 'wallet', label: 'Vault', subLabel: 'Balance', icon: 'wallet', color: '#EF4444', route: '/(tabs)/wallet', flagKey: 'isOrbWalletEnabled' },
      { id: 'settings', label: 'Settings', subLabel: 'Preferences', icon: 'settings-sharp', color: '#9CA3AF', route: '/settings' },
      { id: 'admin', label: 'Admin', subLabel: 'Hub', icon: 'construct', color: '#FBBF24', route: '/admin' },
    ],
  },
];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getDisplayName(email: string | null | undefined, displayName: string | null | undefined): string {
  if (displayName?.trim()) return displayName.trim();
  if (email) {
    const local = email.split('@')[0];
    if (local?.trim()) return local.trim();
  }
  return 'there';
}

/** Compact live-activity pill shown in the strip */
function LivePill({ title, whyTrending, accent }: { title: string; whyTrending: string; accent: string }) {
  return (
    <View style={[liveStyles.pill, { backgroundColor: accent + '15', borderColor: accent + '40' }]}>
      <View style={[liveStyles.dot, { backgroundColor: accent }]} />
      <Text style={[liveStyles.pillName, { color: accent }]} numberOfLines={1}>{title}</Text>
      <Text style={[liveStyles.pillSub, { color: 'rgba(255,255,255,0.5)' }]} numberOfLines={1}>{whyTrending}</Text>
    </View>
  );
}

const liveStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    marginRight: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillName: { fontSize: 12, fontWeight: '700', maxWidth: 100 },
  pillSub: { fontSize: 10, fontWeight: '600', maxWidth: 120 },
});

/** Upgrade CTA card for free users */
function UpgradeCTACard({ themeGold, onPress, colors }: { themeGold: string; onPress: () => void; colors: any }) {
  const shimmerX = useSharedValue(-300);
  useEffect(() => {
    shimmerX.value = withRepeat(withTiming(400, { duration: 2500 }), -1, false);
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }] }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [upgradeStyles.card, pressed && { opacity: 0.92 }]}
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#1a1200']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={[themeGold + '30', '#A78BFA30', themeGold + '20']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Shimmer */}
      <Animated.View style={[upgradeStyles.shimmerWrap, shimmerStyle]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.06)', 'transparent']}
          style={upgradeStyles.shimmerGrad}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>
      <View style={upgradeStyles.inner}>
        <View style={upgradeStyles.headerRow}>
          <View style={[upgradeStyles.iconWrap, { backgroundColor: themeGold + '25' }]}>
            <Ionicons name="diamond" size={20} color={themeGold} />
          </View>
          <View style={upgradeStyles.textBlock}>
            <Text style={[upgradeStyles.title, { color: '#fff' }]}>Unlock OrbTap Premium</Text>
            <Text style={[upgradeStyles.sub, { color: 'rgba(255,255,255,0.6)' }]}>Everything you need to dominate the leaderboard</Text>
          </View>
        </View>
        <View style={upgradeStyles.bullets}>
          {[
            { icon: 'flash', text: 'Early drop access · First in line' },
            { icon: 'trending-up', text: '1.2× OT multiplier on every scan' },
            { icon: 'ticket', text: 'OrbPass monthly perks at partners' },
          ].map((b) => (
            <View key={b.text} style={upgradeStyles.bulletRow}>
              <Ionicons name={b.icon as any} size={13} color={themeGold} />
              <Text style={upgradeStyles.bulletText}>{b.text}</Text>
            </View>
          ))}
        </View>
        <View style={[upgradeStyles.ctaBtn, { backgroundColor: themeGold }]}>
          <Text style={upgradeStyles.ctaBtnText}>Upgrade now →</Text>
        </View>
      </View>
    </Pressable>
  );
}

const upgradeStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  shimmerWrap: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 200 },
  shimmerGrad: { width: 200, height: '100%' },
  inner: { padding: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '900', marginBottom: 2 },
  sub: { fontSize: 12, fontWeight: '500' },
  bullets: { gap: 8, marginBottom: 16 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', flex: 1 },
  ctaBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ctaBtnText: { color: '#000', fontSize: 15, fontWeight: '900' },
});

export default function OrbHubScreen() {
  const [dirVisible, setDirVisible] = useState(false);
  const [allPagesVisible, setAllPagesVisible] = useState(false);
  const [gridModalPartner, setGridModalPartner] = useState<Partner | null>(null);
  const searchOpen = useSearchOpen();
  const [showOrbTutorial, setShowOrbTutorial] = useState(false);
  const { shouldShowTutorial, markCompleted, setSkipAllTutorials } = useTutorial();
  const [orbScopeDismissed, setOrbScopeDismissed] = useState(false);
  const [ritualCompleteToday, setRitualCompleteToday] = useState(false);
  const [completedStreakCount, setCompletedStreakCount] = useState<number | null>(null);
  const [ritualPointsEarnedToday, setRitualPointsEarnedToday] = useState<number | null>(null);
  const [showFirstOrbModal, setShowFirstOrbModal] = useState(false);
  const [showFirstGridEntryModal, setShowFirstGridEntryModal] = useState(false);

  const router = useRouter();
  const directoryOpen = useDirectoryOpen();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { recentPartners } = useMapHistory();
  const { userLocation } = useUserLocation();
  const { user } = useAuth();
  const { flags } = useFlags();
  const { prefs } = usePreferences();
  const { streak } = useStreak();
  const { daily: orbScopeDaily, streak: orbScopeStreak, recordView: orbScopeRecordView, loading: orbScopeLoading } = useOrbScope();
  const orbScopeEnabled = Boolean(flags.isOrbScopeEnabled && prefs.orbScopeEnabled);
  const { getFeaturedPartner, getGridPartnersOrdered, partners, getActivePerksForPartner } = usePartners();
  const { myPartner } = useMyPartner();
  const { tier: effectiveTier, isPartner } = useEffectiveTier();
  const featuredPartner = getFeaturedPartner();
  const allGridPartners = React.useMemo(() => getGridPartnersOrdered(), [getGridPartnersOrdered]);
  const nearestPartner = React.useMemo(() => {
    if (!userLocation || allGridPartners.length === 0) return null;
    const withDist = allGridPartners.map((p) => {
      const mi = distanceToPartner(userLocation.latitude, userLocation.longitude, p);
      return { partner: p, mi: mi ?? 999 };
    });
    withDist.sort((a, b) => a.mi - b.mi);
    const first = withDist[0];
    if (!first || first.mi >= 999) return null;
    return { partner: first.partner, name: first.partner.name, distanceLabel: formatDistanceMi(first.mi) };
  }, [userLocation, allGridPartners]);
  const partnerAccount = isPartner && (myPartner ?? partners[0] ?? null);
  const partnerTierColor = partnerAccount ? PARTNER_TIER_COLORS[partnerAccount.tier] : null;
  const { slides: featuredSlides, loading: featuredLoading } = useFeaturedPartners();
  const { displayName: profileDisplayName, refresh: refreshProfile } = useCurrentUserProfile();
  const { balance } = useWallet();
  const rank = useXP();
  const displayName = profileDisplayName?.trim() || getDisplayName(user?.email ?? null, user?.displayName ?? null);
  const isRitualDoneToday = ritualCompleteToday || streak.lastCheckInDate === getToday();
  const displayStreak = completedStreakCount ?? streak.currentStreak;
  const { followingIds } = useSocial();
  const followedPartners = partners.filter((p) => followingIds.includes(p.id));
  const { liveTiles } = usePulse();
  const { todayMissions } = useMissions();
  const activeMissionCount = todayMissions.filter((m) => !isMissionFullyComplete(m)).length;

  useEffect(() => {
    if (shouldShowTutorial('orb')) setShowOrbTutorial(true);
  }, [shouldShowTutorial]);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      AsyncStorage.getItem('ORBTAP_SHOW_FIRST_ORB_PROMPT').then((v) => {
        if (v === '1') {
          setShowFirstOrbModal(true);
          AsyncStorage.removeItem('ORBTAP_SHOW_FIRST_ORB_PROMPT').catch(() => {});
        }
      });
      if (!user || !prefs.onboardingComplete) return;
      AsyncStorage.getItem(FIRST_GRID_ENTRY_STORAGE_KEY).then((v) => {
        if (v !== '1') setShowFirstGridEntryModal(true);
      });
    }, [refreshProfile, user, prefs.onboardingComplete]),
  );

  React.useEffect(() => {
    if (!directoryOpen) return;
    return directoryOpen.registerOpen(() => setDirVisible(true));
  }, [directoryOpen]);

  const handleNav = (route: string) => {
    safeHaptics.selectionAsync();
    router.push(route as any);
  };

  const layout = useAdminLayout();
  const flagBool = (key: FlagKey): boolean =>
    key === 'mapProvider' ? flags.mapProvider !== 'none' : !!(flags as Record<string, unknown>)[key];
  const showTile = (tileId: string, flagKey?: FlagKey) => {
    if (tileId === 'admin') return true;
    return !flagKey || flagBool(flagKey);
  };

  const getHubTileLabel = (tileId: string, defaultLabel: string): string => {
    const key = tileId === 'scan' ? 'tab_scan' : `dir_${tileId}`;
    const name = layout.getDisplayName(key, defaultLabel);
    if (tileId === 'orbswipe') return name + ' Tonight';
    return name;
  };

  const tierMeetsTile = (required?: 'premium' | 'pro'): boolean => {
    if (!required) return true;
    if (required === 'premium') return effectiveTier === 'premium' || effectiveTier === 'pro';
    return effectiveTier === 'pro';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MasterDirectory visible={dirVisible} onClose={() => setDirVisible(false)} />
      <AllPagesGridModal visible={allPagesVisible} onClose={() => setAllPagesVisible(false)} />
      <GuidedTutorialOverlay
        visible={showOrbTutorial}
        tutorialId="orb"
        onClose={() => { markCompleted('orb'); setShowOrbTutorial(false); }}
        onSkipAll={() => { setSkipAllTutorials(); setShowOrbTutorial(false); }}
      />
      <FirstGridEntryModal
        visible={showFirstGridEntryModal}
        onDismiss={() => {
          setShowFirstGridEntryModal(false);
          AsyncStorage.setItem(FIRST_GRID_ENTRY_STORAGE_KEY, '1').catch(() => {});
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {/* ① OrbHeroPanel — identity, balance, streak, tier */}
          <OrbHeroPanel
            colors={colors}
            isDark={isDark}
            balance={balance}
            displayName={displayName}
            level={rank.level}
            levelTitle={rank.title}
            streak={displayStreak}
            tier={effectiveTier as 'free' | 'premium' | 'pro'}
            isPartner={isPartner}
            ritualDone={isRitualDoneToday}
            ritualPoints={ritualPointsEarnedToday}
            themeGold={themeGold}
            onOpenSearch={searchOpen?.openSearch}
            onOpenDir={() => setDirVisible(true)}
          />

          {/* ② Partner command hero (partner accounts only) */}
          {partnerAccount && partnerTierColor && (
            <TierGlow tier={partnerAccount.tier} style={styles.partnerHeroCardWrap}>
              <Pressable
                style={({ pressed }) => [
                  styles.partnerHeroCard,
                  { backgroundColor: colors.surface, borderColor: partnerTierColor + '60' },
                  pressed && { opacity: 0.92 },
                ]}
                onPress={() => handleNav('/(tabs)/partner-dashboard')}
              >
                <LinearGradient
                  colors={[partnerTierColor + '18', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <View style={[styles.partnerHeroIconWrap, { backgroundColor: partnerTierColor + '25' }]}>
                  <Ionicons name="business" size={28} color={partnerTierColor} />
                </View>
                <View style={styles.partnerHeroText}>
                  <Text style={[styles.partnerHeroTitle, { color: colors.text }]}>Partner Command</Text>
                  <Text style={[styles.partnerHeroSub, { color: colors.textSecondary }]}>Manage perks, invites, menu, work orders — your hub</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={partnerTierColor} />
              </Pressable>
            </TierGlow>
          )}

          {/* ③ Daily Ritual Block — ABOVE featured for emotional engagement */}
          {flags.ritualDailyOrbEnabled && (
            <View style={[styles.ritualBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHead}>
                <View style={[styles.sectionAccent, { backgroundColor: themeGold }]} />
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DAILY RITUAL</Text>
              </View>
              {isRitualDoneToday ? (
                <View style={[styles.doneStrip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <LinearGradient colors={[themeGold, '#b45309']} style={styles.doneIconWrap}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  </LinearGradient>
                  <View style={styles.doneTextWrap}>
                    <Text style={[styles.doneTitle, { color: colors.text }]}>Daily ritual done</Text>
                    {ritualPointsEarnedToday != null && ritualPointsEarnedToday > 0 && (
                      <Text style={[styles.donePoints, { color: themeGold }]}>+{ritualPointsEarnedToday} OT earned</Text>
                    )}
                    <Text style={[styles.doneSub, { color: colors.textSecondary }]} numberOfLines={1}>
                      {displayStreak} day streak · See you again tomorrow!
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.orbWrap}>
                  <DailyStreakOrb
                    compact
                    onRitualComplete={(count, points) => {
                      setRitualCompleteToday(true);
                      setCompletedStreakCount(count);
                      if (typeof points === 'number') setRitualPointsEarnedToday(points);
                    }}
                  />
                </View>
              )}
            </View>
          )}

          {/* ④ QuickActionsBar — one tap to the 4 most-used actions */}
          <QuickActionsBar
            onPress={handleNav}
            missionCount={activeMissionCount}
            colors={colors}
          />

          {/* ⑤ Live Activity Strip — social proof from usePulse */}
          {flags.isOrbPulseEnabled && liveTiles.length > 0 && (
            <Animated.View entering={FadeInDown.duration(350)} style={styles.liveBlock}>
              <View style={styles.sectionHead}>
                <View style={[styles.liveDot, { backgroundColor: '#4ADE80' }]} />
                <Text style={[styles.sectionLabel, { color: '#4ADE80' }]}>LIVE NOW</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveRow}>
                {liveTiles.map((tile) => (
                  <TouchableOpacity key={tile.id} onPress={() => handleNav(tile.type === 'drop' ? `/drop/${tile.entityId}` : `/partner/${tile.entityId}`)}>
                    <LivePill title={tile.title} whyTrending={tile.whyTrending} accent="#4ADE80" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* ⑥ Smart Do-Next: OrbScope daily vibe or nearest partner scan CTA */}
          {orbScopeEnabled && !orbScopeDismissed && !orbScopeLoading && orbScopeDaily && (
            <View style={[styles.orbScopeCardWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.orbScopeHeader, { borderColor: colors.border }]}>
                <View style={styles.orbScopeTitleBlock}>
                  <View style={styles.sectionHead}>
                    <View style={[styles.sectionAccent, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DAILY VIBE</Text>
                  </View>
                  <Text style={[styles.orbScopeExplain, { color: colors.textSecondary }]} numberOfLines={1}>
                    One daily pick — try a drop, mission, or pulse to earn.
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setOrbScopeDismissed(true)} hitSlop={12}>
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <OrbScopeCard
                daily={orbScopeDaily}
                streak={orbScopeStreak}
                onDoIt={() => router.push(getOrbScopeActionRoute(orbScopeDaily.actionType) as any)}
                onView={orbScopeRecordView}
                shareCardEnabled={flags.isOrbScopeShareCardEnabled}
                streakEnabled={flags.isOrbScopeStreakEnabled}
                compact
              />
            </View>
          )}

          {!isPartner && nearestPartner && (orbScopeDismissed || !orbScopeEnabled || !orbScopeDaily) && (
            <DoNextStrip
              type="scan"
              partnerName={nearestPartner.name}
              distanceLabel={nearestPartner.distanceLabel}
              onPress={() => handleNav('/(tabs)')}
            />
          )}

          {/* ⑦ Featured Carousel — partner discovery */}
          {!featuredLoading && featuredSlides.length > 0 ? (
            <View style={styles.block}>
              <View style={styles.sectionHead}>
                <View style={[styles.sectionAccent, { backgroundColor: themeGold }]} />
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>FEATURED FOR YOU</Text>
              </View>
              <FeaturedCarousel slides={featuredSlides} />
            </View>
          ) : featuredPartner ? (
            <View style={styles.block}>
              <View style={styles.sectionHead}>
                <View style={[styles.sectionAccent, { backgroundColor: themeGold }]} />
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>FEATURED FOR YOU</Text>
              </View>
              <FeaturedPartnerCard partner={featuredPartner} />
            </View>
          ) : null}

          {/* ⑧ Sponsored */}
          <View style={styles.block}>
            <SponsoredAdSlot placement="orb_carousel" sectionTitle="SPONSORED" />
          </View>

          {/* ⑨ Following strip */}
          {followedPartners.length > 0 && (
            <View style={styles.block}>
              <View style={styles.sectionHead}>
                <View style={[styles.sectionAccent, { backgroundColor: '#A78BFA' }]} />
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  PARTNERS YOU FOLLOW
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.followingRow}
              >
                {followedPartners.map((fp) => {
                  const fpPerks = getActivePerksForPartner(fp.id);
                  const topPerk = fpPerks[0] ?? null;
                  const fpColor = PARTNER_TIER_COLORS[fp.tier];
                  return (
                    <TouchableOpacity
                      key={fp.id}
                      style={[styles.followCard, { backgroundColor: colors.surface, borderColor: fpColor + '55', borderLeftColor: fpColor }]}
                      onPress={() => { safeHaptics.selectionAsync(); router.push(`/partner/${fp.id}` as any); }}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.followCardName, { color: colors.text }]} numberOfLines={1}>{fp.name}</Text>
                      {topPerk ? (
                        <Text style={[styles.followCardPerk, { color: fpColor }]} numberOfLines={1}>
                          {topPerk.title} · {topPerk.cost} pts
                        </Text>
                      ) : (
                        <Text style={[styles.followCardPerk, { color: colors.textSecondary }]}>No active perks</Text>
                      )}
                      <Ionicons name="heart" size={11} color={fpColor} style={{ marginTop: 4 }} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ⑩ Hub Category Cards — frosted-glass category headers with dense tile grids */}
          <View style={[styles.hubCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LinearGradient
              colors={[colors.primary + '10', 'transparent', themeGold + '07']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.hubCardInner}>
              <View style={styles.hubTitleRow}>
                <View style={styles.hubTitleBlock}>
                  <Text style={[styles.hubTitle, { color: colors.text }]}>{layout.getDisplayName('screen_orb_hub_title', 'Your Hub')}</Text>
                  <Text style={[styles.hubSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>Tap any tile · see all pages →</Text>
                </View>
                <TouchableOpacity
                  style={[styles.hubAllPagesBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setAllPagesVisible(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="grid" size={18} color={colors.text} />
                  <Text style={[styles.hubAllPagesLabel, { color: colors.text }]}>All pages</Text>
                </TouchableOpacity>
              </View>

              {/* Categories as frosted-glass cards */}
              {HUB_CATEGORIES.map((cat) => {
                const visibleTiles = cat.tiles.filter((t) => {
                  if (t.id === 'admin') return isAdminEmail(user?.email);
                  return showTile(t.id, t.flagKey);
                });
                if (visibleTiles.length === 0) return null;
                return (
                  <View
                    key={cat.id}
                    style={[styles.catCard, { borderColor: cat.accent + '28', backgroundColor: cat.accent + '08' }]}
                  >
                    {/* Category header */}
                    <View style={[styles.catHeader, { borderLeftColor: cat.accent }]}>
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.catLabel, { color: cat.accent }]}>{cat.label}</Text>
                    </View>
                    {/* Tile grid */}
                    <View style={styles.hubTilesRow}>
                      {visibleTiles.map((tile) => {
                        const isLocked = !tierMeetsTile(tile.minTier);
                        return (
                          <Pressable
                            key={tile.id}
                            style={({ pressed }) => [
                              styles.hubTile,
                              { backgroundColor: colors.background, borderColor: isLocked ? colors.border + '80' : colors.border },
                              pressed && styles.hubTilePressed,
                              isLocked && { opacity: 0.7 },
                            ]}
                            onPress={() => handleNav(tile.route)}
                          >
                            {isLocked && (
                              <View style={styles.hubTileLockBadge}>
                                <Ionicons name="lock-closed" size={9} color={themeGold} />
                              </View>
                            )}
                            <View style={[styles.hubTileIcon, { backgroundColor: tile.color + (isDark ? '28' : '18') }]}>
                              <Ionicons name={tile.icon as any} size={18} color={tile.color} />
                            </View>
                            <Text style={[styles.hubTileLabel, { color: colors.text }]} numberOfLines={1}>
                              {getHubTileLabel(tile.id, tile.label)}
                            </Text>
                            <Text style={[styles.hubTileSub, { color: colors.textSecondary }]} numberOfLines={1}>{tile.subLabel}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ⑪ OrbScope card already rendered above if enabled */}

          {/* ⑫ Upgrade CTA — for free users only */}
          {effectiveTier === 'free' && !isPartner && (
            <UpgradeCTACard
              themeGold={themeGold}
              onPress={() => handleNav('/premium')}
              colors={colors}
            />
          )}

          {/* ⑬ Learn — DailyFactCard */}
          {flags.isKnowledgeEnabled && (
            <View style={[styles.blockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHead}>
                <View style={[styles.sectionAccent, { backgroundColor: themeGold }]} />
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>LEARN</Text>
              </View>
              <DailyFactCard />
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.spheresCta, pressed && { opacity: 0.95 }]}
            onPress={() => handleNav('/spheres')}
          >
            <LinearGradient colors={['#8B5CF6', '#6d28d9']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={styles.spheresCtaContent}>
              <View style={styles.spheresCtaIconWrap}>
                <Ionicons name="people" size={28} color="#fff" />
              </View>
              <View style={styles.spheresCtaText}>
                <Text style={styles.spheresCtaTitle}>Spheres</Text>
                <Text style={styles.spheresCtaSub}>Invite-only groups. Pool OT, unlock rewards, share real experiences.</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.9)" />
            </View>
          </Pressable>

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showFirstOrbModal} transparent animationType="fade">
        <Pressable style={[styles.firstOrbModalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]} onPress={() => setShowFirstOrbModal(false)}>
          <Pressable style={[styles.firstOrbModalBox, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.firstOrbModalIconWrap, { backgroundColor: COLORS.neonBlue[0] + '22' }]}>
              <Ionicons name="map" size={40} color={COLORS.neonBlue[0]} />
            </View>
            <Text style={[styles.firstOrbModalTitle, { color: colors.text }]}>Find your first orb</Text>
            <Text style={[styles.firstOrbModalSub, { color: colors.textSecondary }]}>Tap an orb on the map to see perks and earn OT Points.</Text>
            <TouchableOpacity
              style={[styles.firstOrbModalBtn, { backgroundColor: COLORS.neonBlue[0] }]}
              onPress={() => { setShowFirstOrbModal(false); router.replace('/(tabs)' as any); }}
              activeOpacity={0.9}
            >
              <Text style={styles.firstOrbModalBtnText}>Go to map</Text>
              <Ionicons name="arrow-forward" size={18} color="#000" />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 0 },
  bottomPad: { height: 120 },
  block: { marginBottom: 16 },
  blockCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 14,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionAccent: { width: 4, height: 14, borderRadius: 2, marginRight: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  // Ritual block
  ritualBlock: {
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 10,
  },
  orbWrap: { alignSelf: 'center' },
  doneStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  doneIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  doneTextWrap: { flex: 1, minWidth: 0 },
  doneTitle: { fontSize: 13, fontWeight: '800' },
  donePoints: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  doneSub: { fontSize: 11, fontWeight: '600', marginTop: 1, opacity: 0.85 },
  // Live strip
  liveBlock: { marginBottom: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  liveRow: { paddingBottom: 4 },
  // OrbScope
  orbScopeCardWrap: {
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 6,
  },
  orbScopeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, paddingBottom: 4, borderBottomWidth: 1 },
  orbScopeTitleBlock: { flex: 1, minWidth: 0, marginRight: 8 },
  orbScopeExplain: { fontSize: 10, fontWeight: '600', marginTop: 2, opacity: 0.9 },
  // Partner hero
  partnerHeroCardWrap: { marginBottom: 14, overflow: 'visible', borderRadius: 16 },
  partnerHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  partnerHeroIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  partnerHeroText: { flex: 1, minWidth: 0 },
  partnerHeroTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  partnerHeroSub: { fontSize: 12, fontWeight: '600' },
  // Hub card
  hubCard: {
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  hubCardInner: { padding: 12 },
  hubTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 },
  hubTitleBlock: { flex: 1, minWidth: 0 },
  hubTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2, marginBottom: 2 },
  hubSubtitle: { fontSize: 11, fontWeight: '600', opacity: 0.9 },
  hubAllPagesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  hubAllPagesLabel: { fontSize: 11, fontWeight: '700' },
  // Category cards
  catCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderLeftWidth: 4,
    paddingLeft: 8,
    marginBottom: 10,
  },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  // Tiles inside categories
  hubTilesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hubTile: {
    width: '30%',
    minWidth: 80,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  hubTileLockBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubTilePressed: { opacity: 0.85 },
  hubTileIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  hubTileLabel: { fontSize: 10, fontWeight: '800', marginBottom: 1 },
  hubTileSub: { fontSize: 9, fontWeight: '600', opacity: 0.9 },
  // Following
  followingRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  followCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  followCardName: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  followCardPerk: { fontSize: 11, fontWeight: '500' },
  // Spheres CTA
  spheresCta: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 88,
    position: 'relative',
  },
  spheresCtaContent: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  spheresCtaIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  spheresCtaText: { flex: 1, minWidth: 0 },
  spheresCtaTitle: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
  spheresCtaSub: { color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: '600', marginTop: 4, lineHeight: 16 },
  // First orb modal
  firstOrbModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  firstOrbModalBox: { borderRadius: 20, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  firstOrbModalIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  firstOrbModalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  firstOrbModalSub: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  firstOrbModalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, width: '100%' },
  firstOrbModalBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
});

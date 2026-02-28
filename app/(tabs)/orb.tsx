/**
 * OrbTap Orb Hub — Super Dashboard
 * Strategic command center for users and partners: identity, featured, do-next, categorized hub, quick actions, learn.
 * Designed to drive engagement, discovery, and business value in one scannable, premium experience.
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
import { CommandCenterHeader } from '../../components/CommandCenterHeader';
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

const FIRST_GRID_ENTRY_STORAGE_KEY = 'ORBTAP_FIRST_GRID_ENTRY_SHOWN';

// ─── Hub tile definition: category, label, subLabel, icon, color, route, optional flag ───
const HUB_CATEGORIES: Array<{
  id: string;
  label: string;
  accent: string;
  tiles: Array<{ id: string; label: string; subLabel: string; icon: string; color: string; route: string; flagKey?: FlagKey }>;
}> = [
  {
    id: 'earn',
    label: 'Earn',
    accent: '#22C55E',
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
    tiles: [
      { id: 'leaderboard', label: 'Leaderboard', subLabel: 'Ranks', icon: 'trophy', color: '#A78BFA', route: '/leaderboard', flagKey: 'isLeaderboardEnabled' },
      { id: 'orbsignal', label: 'Orb Signal', subLabel: 'Predict', icon: 'radio', color: '#EF4444', route: '/orbsignal', flagKey: 'isOrbSignalEnabled' },
    ],
  },
  {
    id: 'grow',
    label: 'Grow',
    accent: '#FBBF24',
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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
  const { getFeaturedPartner, getGridPartnersOrdered, partners, getPerksForPartner } = usePartners();
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
  const { displayName: profileDisplayName, username: profileUsername, refresh: refreshProfile } = useCurrentUserProfile();
  const { balance } = useWallet();
  const rank = useXP();
  const displayName = profileDisplayName?.trim() || getDisplayName(user?.email ?? null, user?.displayName ?? null);
  const isRitualDoneToday = ritualCompleteToday || streak.lastCheckInDate === getToday();
  const displayStreak = completedStreakCount ?? streak.currentStreak;
  const { followingIds } = useSocial();
  const followedPartners = partners.filter((p) => followingIds.includes(p.id));

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
      // First-time Grid entry modal (once per user, after onboarding)
      if (!user || !prefs.onboardingComplete) return;
      AsyncStorage.getItem(FIRST_GRID_ENTRY_STORAGE_KEY).then((v) => {
        if (v !== '1') setShowFirstGridEntryModal(true);
      });
    }, [refreshProfile, user, prefs.onboardingComplete])
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
          {/* ─── 1. HERO: Identity, balance, search, directory ─── */}
          <CommandCenterHeader
            colors={colors}
            balance={balance}
            displayName={displayName}
            profileUsername={profileUsername}
            sloganText="What to do today? Start here."
            hintText="Deals nearby · Missions · Scan to earn OT"
            searchOpen={searchOpen}
            onNav={handleNav}
            onOpenDir={() => setDirVisible(true)}
            level={rank.level}
            levelTitle={rank.title}
            tier={effectiveTier}
            isPartner={isPartner}
          />

          {/* ─── Partner command hero: prominent entry for partner accounts ─── */}
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

          {/* ─── 2. FEATURED: Partner carousel — value for businesses & discovery ─── */}
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

          {/* Sponsored — right below featured; always visible (carousel or premium placeholder) */}
          <View style={styles.block}>
            <SponsoredAdSlot placement="orb_carousel" sectionTitle="SPONSORED" />
          </View>

          {/* FOLLOWING — activity from partners you follow */}
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
                  const fpPerks = getPerksForPartner(fp.id);
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

          {/* ─── 3. DO NEXT: One primary action — ritual, daily vibe, or CTA ─── */}
          {flags.ritualDailyOrbEnabled && (
            <View style={[styles.doNextCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHead}>
                <View style={[styles.sectionAccent, { backgroundColor: themeGold }]} />
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DO NEXT</Text>
              </View>
              {isRitualDoneToday ? (
                <View style={[styles.doneStrip, styles.doneStripCompact, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <LinearGradient colors={[themeGold, '#b45309']} style={styles.doneIconCompact}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  </LinearGradient>
                  <View style={styles.doneTextWrap}>
                    <Text style={[styles.doneTitle, styles.doneTitleCompact, { color: colors.text }]}>Daily ritual done</Text>
                    {ritualPointsEarnedToday != null && ritualPointsEarnedToday > 0 && (
                      <Text style={[styles.donePointsEarned, { color: themeGold }]} numberOfLines={1}>
                        +{ritualPointsEarnedToday} OT earned
                      </Text>
                    )}
                    <Text style={[styles.doneSub, styles.doneSubCompact, { color: colors.textSecondary }]} numberOfLines={1}>
                      {displayStreak} day streak · See you again tomorrow!
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.orbWrapCompact}>
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

          {/* Do next: Scan at nearest partner — when OrbScope dismissed or no daily vibe */}
          {!isPartner && nearestPartner && (orbScopeDismissed || !orbScopeEnabled || !orbScopeDaily) && (
            <DoNextStrip
              type="scan"
              partnerName={nearestPartner.name}
              distanceLabel={nearestPartner.distanceLabel}
              onPress={() => handleNav('/(tabs)')}
            />
          )}

          {/* ─── 4. HUB: Categorized dashboard — Earn, Discover, Compete, Grow, Go ─── */}
          <View style={[styles.hubCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LinearGradient
              colors={[(colors.primary) + '12', 'transparent', (themeGold) + '08']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.hubCardInner}>
              <View style={styles.hubTitleRow}>
                <View style={styles.hubTitleBlock}>
                  <Text style={[styles.hubTitle, { color: colors.text }]}>{layout.getDisplayName('screen_orb_hub_title', 'Your Hub')}</Text>
                  <Text style={[styles.hubSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>Tap a tile or see all pages.</Text>
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
              {HUB_CATEGORIES.map((cat) => {
                const visibleTiles = cat.tiles.filter((t) => {
                  if (t.id === 'admin') return isAdminEmail(user?.email);
                  return showTile(t.id, t.flagKey);
                });
                if (visibleTiles.length === 0) return null;
                return (
                  <View key={cat.id} style={styles.hubCategory}>
                    <View style={[styles.hubCategoryLabelWrap, { borderLeftColor: cat.accent }]}>
                      <Text style={[styles.hubCategoryLabel, { color: colors.text }]}>{cat.label}</Text>
                    </View>
                    <View style={styles.hubTilesRow}>
                      {visibleTiles.map((tile) => (
                        <Pressable
                          key={tile.id}
                          style={({ pressed }) => [
                            styles.hubTile,
                            { backgroundColor: colors.background, borderColor: colors.border },
                            pressed && styles.hubTilePressed,
                          ]}
                          onPress={() => handleNav(tile.route)}
                        >
                          <View style={[styles.hubTileIcon, { backgroundColor: tile.color + (isDark ? '28' : '18') }]}>
                            <Ionicons name={tile.icon as any} size={20} color={tile.color} />
                          </View>
                          <Text style={[styles.hubTileLabel, { color: colors.text }]} numberOfLines={1}>{getHubTileLabel(tile.id, tile.label)}</Text>
                          <Text style={[styles.hubTileSub, { color: colors.textSecondary }]} numberOfLines={1}>{tile.subLabel}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ─── 5. LEARN: Knowledge + Spheres CTA ─── */}
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
        <Pressable style={styles.firstOrbModalOverlay} onPress={() => setShowFirstOrbModal(false)}>
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
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  bottomPad: { height: 100 },
  firstOrbModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  firstOrbModalBox: { borderRadius: 20, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  firstOrbModalIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  firstOrbModalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  firstOrbModalSub: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  firstOrbModalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, width: '100%' },
  firstOrbModalBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  block: { marginBottom: 16 },
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
  blockCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 14,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionAccent: { width: 4, height: 14, borderRadius: 2, marginRight: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  doNextCard: {
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 10,
  },
  orbWrapCompact: { alignSelf: 'center' },
  doneStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  doneStripCompact: { padding: 8, gap: 8 },
  doneIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  doneIconCompact: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  doneTextWrap: { flex: 1, minWidth: 0 },
  doneTitle: { fontSize: 15, fontWeight: '800' },
  doneTitleCompact: { fontSize: 13 },
  donePointsEarned: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  doneSub: { fontSize: 12, fontWeight: '600', marginTop: 2, opacity: 0.85 },
  doneSubCompact: { fontSize: 11, marginTop: 1 },
  hubCard: {
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  hubCardInner: { padding: 12 },
  hubTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 },
  hubTitleBlock: { flex: 1, minWidth: 0, marginRight: 8 },
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
  hubCategory: { marginBottom: 10 },
  hubCategoryLabelWrap: { borderLeftWidth: 3, paddingLeft: 6, marginBottom: 6 },
  hubCategoryLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  hubTilesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hubTile: {
    width: '30%',
    minWidth: 88,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  hubTilePressed: { opacity: 0.85 },
  hubTileIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  hubTileLabel: { fontSize: 10, fontWeight: '800', marginBottom: 1 },
  hubTileSub: { fontSize: 9, fontWeight: '600', opacity: 0.9 },
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
});

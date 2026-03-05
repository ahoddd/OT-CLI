/**
 * Discovery Hub — OrbTap's primary discovery screen.
 * Three unified views: Map (explore) · Grid (browse) · Swipe (plan)
 * Shared filters, search, missions, and history across all views.
 */

import React, { useState, Suspense, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ScrollView,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Context & Hooks
import { useSearchOpen } from '../../context/SearchOpenContext';
import { useTutorial } from '../../context/TutorialContext';
import { usePartners } from '../../context/PartnersContext';
import { useBookmarks } from '../../context/BookmarkContext';
import { useMapHistory } from '../../context/MapHistoryContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useFlags } from '../../components/FlagContext';
import { useWallet } from '../../hooks/useWallet';
import { OTPointsBalanceLink } from '../../components/OTPointsBalanceLink';
import { useDrops } from '../../hooks/useDrops';
import { usePulse } from '../../hooks/usePulse';
import { useMissions } from '../../context/MissionsContext';
import { useSocial } from '../../hooks/useSocial';
import { useUserLocation } from '../../context/UserLocationContext';
import { useNextPerkGoal } from '../../hooks/useNextPerkGoal';

// Components
import { OrbSheet } from '../../components/OrbSheet';
import { FlashDrop } from '../../components/FlashDrop';
import MasterDirectory from '../../components/MasterDirectory';
import { MapErrorBoundary } from '../../components/MapErrorBoundary';
import { OrbTapMapFallback } from '../../components/OrbTapMapFallback';
import { GuidedTutorialOverlay } from '../../components/GuidedTutorialOverlay';
import { OrbTapLogoMark } from '../../components/OrbTapLogoMark';
import { DoNextStrip } from '../../components/DoNextStrip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GettingStartedFirstStepStrip, MAP_GET_STARTED_DISMISSED_KEY } from '../../components/GettingStartedUserChecklist';
import { SavedIntentModule } from '../../components/SavedIntentModule';
import { PerkGridModal } from '../../components/PerkGridModal';

// New Discovery Hub components
import { DiscoveryToggle } from '../../components/DiscoveryToggle';
import type { DiscoveryView } from '../../components/DiscoveryToggle';
import { DiscoveryFilterBar } from '../../components/DiscoveryFilterBar';
import type { FilterId } from '../../components/DiscoveryFilterBar';
import { PartnerGridView } from '../../components/PartnerGridView';
import { MapNearbyTray } from '../../components/MapNearbyTray';
import { LiveActivityPill } from '../../components/LiveActivityPill';
import { InlineOrbSwipe } from '../../components/InlineOrbSwipe';
import { TierLegend } from '../../components/TierLegend';

// Types & constants
import { Partner } from '../../constants/MockData';
import type { PartnerTier } from '../../constants/PartnerTiers';
import { PARTNER_TIER_COLORS, PARTNER_TIER_LABELS } from '../../constants/PartnerTiers';
import { COLORS } from '../../constants/Colors';
import { SPACE, RADIUS, TYPE, SCROLL_CONTENT } from '../../constants/DesignTokens';
import { distanceToPartner, formatDistanceMi } from '../../utils/location';
import { safeHaptics } from '../../utils/safeHaptics';

const isExpoGo = Constants.appOwnership === 'expo';

const LazyOrbTapMap = React.lazy(() =>
  import('../../components/OrbTapMap').then((m) => ({ default: m.OrbTapMap }))
);

export default function DiscoveryHubScreen() {
  // ─── View state ───────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<DiscoveryView>('map');
  const [activeFilters, setActiveFilters] = useState<FilterId[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // ─── UI state ─────────────────────────────────────────────────────────────
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [gridModalPartner, setGridModalPartner] = useState<Partner | null>(null);
  const [isDirectoryVisible, setIsDirectoryVisible] = useState(false);
  const [historyOverlayVisible, setHistoryOverlayVisible] = useState(false);
  const [showMapTutorial, setShowMapTutorial] = useState(false);
  const [flashDropDismissed, setFlashDropDismissed] = useState(false);
  const [getStartedStripDismissed, setGetStartedStripDismissed] = useState(false);

  // ─── Advanced filter state (from modal) ───────────────────────────────────
  const [tierFilter, setTierFilter] = useState<PartnerTier | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [hotSpotOnly, setHotSpotOnly] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // ─── Hooks ────────────────────────────────────────────────────────────────
  const router = useRouter();
  const { focusMissions } = useLocalSearchParams<{ focusMissions?: string }>();
  const searchOpen = useSearchOpen();
  const { colors, isDark } = useTheme();
  const themeGold = COLORS.gold[0];
  const { flags } = useFlags();
  const { user } = useAuth();
  const { verifiedActions, balance } = useWallet();
  const nextPerkGoal = useNextPerkGoal();
  const { drops, loading: dropsLoading, refresh: refreshDrops } = useDrops();
  const { liveTiles } = usePulse();
  const { todayMissions, totalMissionsCompletedCount } = useMissions();
  const { circles, followingIds, isFollowing } = useSocial();
  const { bookmarkedPartners, bookmarkedPerks } = useBookmarks();
  const { getGridPartnersOrdered, getActivePerksForPartner, getPartner, partners } = usePartners();
  const { recentPartners, addToHistory } = useMapHistory();
  const { userLocation, refreshLocation, requestPermission } = useUserLocation();
  const { shouldShowTutorial, markCompleted, setSkipAllTutorials } = useTutorial();

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (shouldShowTutorial('map')) setShowMapTutorial(true);
  }, [shouldShowTutorial]);

  useEffect(() => {
    if (focusMissions === '1') setActiveView('map');
  }, [focusMissions]);

  useFocusEffect(
    useCallback(() => {
      requestPermission().then((ok) => {
        if (ok) refreshLocation();
      });
    }, [requestPermission, refreshLocation])
  );

  useEffect(() => {
    AsyncStorage.getItem(MAP_GET_STARTED_DISMISSED_KEY).then((v) => {
      setGetStartedStripDismissed(v === 'true');
    });
  }, []);

  // ─── Derived data ─────────────────────────────────────────────────────────
  const allPartners = useMemo(() => getGridPartnersOrdered(), [getGridPartnersOrdered]);

  const missionPartnerIds = useMemo(() => {
    const ids = new Set<string>();
    todayMissions.forEach((m) => m.steps?.forEach((s) => s.partnerId && ids.add(s.partnerId)));
    return Array.from(ids);
  }, [todayMissions]);

  const doNextMissionPartner = useMemo(() => {
    const mission = todayMissions.find(
      (m) => !m.completed && (m.steps?.some((s) => !s.completed) ?? true)
    );
    if (!mission) return null;
    const step = mission.steps?.find((s) => !s.completed);
    const partnerId = step?.partnerId ?? mission.partnerId;
    if (!partnerId) return null;
    const partner = getPartner(partnerId);
    return partner ? { name: partner.name } : null;
  }, [todayMissions, getPartner]);

  const hotSpotPartnerIds = useMemo(() => {
    const ids = new Set<string>();
    allPartners.forEach((p) => {
      if (p.tier === 'gold') ids.add(p.id);
    });
    return ids;
  }, [allPartners]);

  const hotSpotPartnerIdsArray = useMemo(() => [...hotSpotPartnerIds], [hotSpotPartnerIds]);

  const gridCategories = useMemo(() => {
    const set = new Set<string>();
    allPartners.forEach((p) => {
      const c = p.category != null ? String(p.category).trim() : '';
      if (c) set.add(p.category);
    });
    const seen = new Set<string>();
    return [
      'all',
      ...Array.from(set)
        .sort()
        .filter((c) => {
          const t = String(c).trim();
          if (!t) return false;
          const k = t.toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        }),
    ];
  }, [allPartners]);

  /** Apply all filters (chip + advanced) to the partner list. */
  const filteredPartners = useMemo(() => {
    let result = [...allPartners];

    // Advanced modal filters
    if (tierFilter !== 'all') result = result.filter((p) => p.tier === tierFilter);
    if (categoryFilter !== 'all') {
      result = result.filter((p) => {
        const pCat = p.category != null ? String(p.category).trim() : '';
        return pCat.toLowerCase() === String(categoryFilter).trim().toLowerCase();
      });
    }
    if (hotSpotOnly) result = result.filter((p) => hotSpotPartnerIds.has(p.id));

    // Quick chip filters
    if (activeFilters.includes('gold_plus'))
      result = result.filter((p) => p.tier !== 'silver');
    if (activeFilters.includes('following'))
      result = result.filter((p) => isFollowing(p.id));
    if (activeFilters.includes('deals'))
      result = result.filter((p) => drops.some((d) => d.partnerId === p.id && d.qtyRemaining > 0 && d.endAt > Date.now()));
    if (activeFilters.includes('near_me') && userLocation) {
      result = result.filter((p) => {
        const mi = distanceToPartner(userLocation.latitude, userLocation.longitude, p);
        return mi !== null && mi <= 5;
      });
    }
    // open_now filter — approximate (skip complex hours parsing for now)

    return result;
  }, [
    allPartners,
    tierFilter,
    categoryFilter,
    hotSpotOnly,
    hotSpotPartnerIds,
    activeFilters,
    isFollowing,
    drops,
    userLocation,
  ]);

  const hasActiveFilters =
    tierFilter !== 'all' ||
    categoryFilter !== 'all' ||
    hotSpotOnly ||
    activeFilters.length > 0;

  // Auto-expand filter bar when a filter is active (e.g. navigated here with pre-applied filter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (hasActiveFilters) setFiltersExpanded(true);
  }, [hasActiveFilters]);

  const resolvePartner = useCallback(
    (id: string): Partner | null =>
      allPartners.find((p) => p.id === id) ?? recentPartners.find((p) => p.id === id) ?? null,
    [allPartners, recentPartners]
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectPartner = useCallback(
    (partner: Partner) => {
      setSelectedPartner(partner);
      addToHistory(partner);
    },
    [addToHistory]
  );

  const handleFilterToggle = useCallback((id: FilterId) => {
    if (id === 'all') {
      setActiveFilters([]);
      return;
    }
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    setTierFilter('all');
    setCategoryFilter('all');
    setHotSpotOnly(false);
  }, []);

  const handleViewChange = useCallback((view: DiscoveryView) => {
    safeHaptics.selectionAsync();
    // Close sheet when switching away from map
    if (view !== 'map') setSelectedPartner(null);
    setActiveView(view);
  }, []);

  // ─── Map provider logic ───────────────────────────────────────────────────
  const hasMapboxToken = (() => {
    const fromEnv =
      typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_MAPBOX_TOKEN?.trim?.();
    if (fromEnv) return true;
    const fromExtra = Constants.expoConfig?.extra?.mapboxAccessToken;
    return typeof fromExtra === 'string' && fromExtra.trim().length > 0;
  })();
  const isWeb = Platform.OS === 'web';
  const showMapbox = hasMapboxToken && flags.mapProvider === 'mapbox' && !isExpoGo && !isWeb;

  const fallbackMap = (
    <OrbTapMapFallback
      onSelectPartner={handleSelectPartner}
      selectedId={selectedPartner?.id ?? null}
      missionPartnerIds={missionPartnerIds}
    />
  );

  const mapContent = isWeb ? (
    <View style={[styles.mapPlaceholder, { backgroundColor: colors.background }]}>
      <Ionicons name="map-outline" size={48} color={colors.textSecondary} style={{ marginBottom: SPACE.md }} />
      <Text style={[styles.mapPlaceholderTitle, { color: colors.text }]}>OrbTap Map</Text>
      <Text style={[styles.mapPlaceholderSub, { color: colors.textSecondary }]}>
        The interactive map is available in the OrbTap mobile app.
      </Text>
      <TouchableOpacity
        style={[styles.mapPlaceholderBtn, { backgroundColor: COLORS.neonBlue[0] }]}
        onPress={() => typeof window !== 'undefined' && window.open('https://apps.apple.com/app/orbtap', '_blank')}
      >
        <Text style={styles.mapPlaceholderBtnText}>Get the app</Text>
      </TouchableOpacity>
    </View>
  ) : showMapbox ? (
    <MapErrorBoundary key="mapbox" fallback={fallbackMap}>
      <Suspense fallback={fallbackMap}>
        <LazyOrbTapMap
          onSelectPartner={handleSelectPartner}
          selectedId={selectedPartner?.id ?? null}
          missionPartnerIds={missionPartnerIds}
          hotSpotPartnerIds={hotSpotPartnerIdsArray}
        />
      </Suspense>
    </MapErrorBoundary>
  ) : (
    fallbackMap
  );

  // ─── Getting Started strip logic ──────────────────────────────────────────
  const hasScanned = verifiedActions.length > 0;
  const hasCompletedMission = totalMissionsCompletedCount > 0;
  const hasJoinedSphere = circles.length > 0;
  const hasBookmark = bookmarkedPartners.length > 0 || bookmarkedPerks.length > 0;
  const showGettingStarted =
    !hasScanned || !hasCompletedMission || !hasJoinedSphere || !hasBookmark;

  function formatCategoryLabel(cat: string): string {
    if (!cat || cat === 'all') return cat === 'all' ? 'All' : '';
    const t = String(cat).trim();
    if (t.toUpperCase() === 'CAFE') return 'Cafe';
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        {/* Left: OrbTap brand logo */}
        <OrbTapLogoMark variant="small" />

        {/* Center: Search bar */}
        <TouchableOpacity
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
          ]}
          onPress={() => searchOpen?.openSearch('map')}
          activeOpacity={0.8}
          accessibilityRole="search"
          accessibilityLabel="Search OrbTap"
        >
          <Ionicons name="search" size={14} color={colors.textSecondary} />
          <Text style={[styles.searchBarText, { color: colors.textSecondary }]}>
            Search OrbTap...
          </Text>
        </TouchableOpacity>

        {/* Right: Balance (single canonical OT points), Pulse, Menu */}
        <View style={styles.headerRight}>
          <View style={styles.headerBalanceWrap}>
            <OTPointsBalanceLink
              amount={balance}
              size={18}
              label="pts"
              compact
              textColor={colors.text}
            />
          </View>
          {flags.isOrbPulseEnabled && (
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/pulse' as any)}
              accessibilityLabel="Pulse feed"
            >
              <View>
                <Ionicons
                  name="pulse"
                  size={22}
                  color={liveTiles.length > 0 ? colors.primary : colors.text}
                />
                {liveTiles.length > 0 && (
                  <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setIsDirectoryVisible(true)}
            accessibilityLabel="Open directory"
          >
            <Ionicons name="menu-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── VIEW TOGGLE + FILTER CHIP ─────────────────────────────────── */}
      <View style={styles.toggleWrap}>
        <DiscoveryToggle activeView={activeView} onChange={handleViewChange} />
        {activeView !== 'swipe' && (
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: colors.surface,
                borderColor: hasActiveFilters ? COLORS.neonBlue[0] : colors.border,
              },
            ]}
            onPress={() => {
              setFiltersExpanded((v) => !v);
              safeHaptics.selectionAsync();
            }}
            onLongPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel={hasActiveFilters ? `Filters active, ${[tierFilter !== 'all', categoryFilter !== 'all', hotSpotOnly, ...activeFilters.map(() => true)].filter(Boolean).length} applied` : 'Show filters'}
          >
            <Ionicons name="options" size={16} color={hasActiveFilters ? COLORS.neonBlue[0] : colors.text} />
            {hasActiveFilters && (
              <View style={[styles.filterChipBadge, { backgroundColor: COLORS.neonBlue[0] }]}>
                <Text style={styles.filterChipBadgeText}>
                  {[tierFilter !== 'all', categoryFilter !== 'all', hotSpotOnly, ...activeFilters.map(() => true)].filter(Boolean).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── FILTER BAR (collapsible, map + grid only) ─────────────────── */}
      {filtersExpanded && activeView !== 'swipe' && (
        <DiscoveryFilterBar
          activeFilters={activeFilters}
          onToggle={handleFilterToggle}
          partnerCount={filteredPartners.length}
        />
      )}

      {/* ── MISSION STRIP (map + grid) ────────────────────────────────── */}
      {activeView !== 'swipe' && missionPartnerIds.length > 0 && (
        <TouchableOpacity
          style={[
            styles.missionStrip,
            { backgroundColor: themeGold + '18', borderBottomColor: colors.border },
          ]}
          onPress={() => router.push('/missions' as any)}
          activeOpacity={0.85}
        >
          <View style={[styles.missionStripIcon, { backgroundColor: themeGold + '30' }]}>
            <Ionicons name="flag" size={16} color={themeGold} />
          </View>
          <Text style={[styles.missionStripText, { color: colors.text }]}>
            {missionPartnerIds.length} mission stop{missionPartnerIds.length !== 1 ? 's' : ''}{' '}
            nearby — tap gold orbs
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* ── DO NEXT STRIP (map + grid) ────────────────────────────────── */}
      {activeView !== 'swipe' && (doNextMissionPartner || showGettingStarted) && (
        <View style={styles.doNextWrap}>
          {doNextMissionPartner ? (
            <DoNextStrip
              type="mission"
              partnerName={doNextMissionPartner.name}
              onPress={() => router.push('/missions' as any)}
            />
          ) : showGettingStarted ? (
            <GettingStartedFirstStepStrip
              hasScanned={hasScanned}
              hasCompleteProfile={false}
              hasCompletedMission={hasCompletedMission}
              hasTriedOrbSwipe={false}
              hasJoinedSphere={hasJoinedSphere}
              hasBookmark={hasBookmark}
              hasInvited={false}
              dismissable
              dismissed={getStartedStripDismissed}
              onDismiss={() => {
                setGetStartedStripDismissed(true);
                AsyncStorage.setItem(MAP_GET_STARTED_DISMISSED_KEY, 'true').catch(() => {});
              }}
            />
          ) : null}
        </View>
      )}

      {/* ── FLASH DROP (map only, inline so map stays uncluttered) ────── */}
      {activeView === 'map' && !flashDropDismissed && flags.isOrbDropsEnabled && drops.length > 0 && (
        <View style={styles.flashDropInlineWrap}>
          <FlashDrop
            inline
            partnerId={drops[0].partnerId}
            partnerName={drops[0].partnerName}
            otAmount={75}
            remainingSlots={drops[0].qtyRemaining}
            totalSlots={drops[0].qtyTotal}
            expiresAt={drops[0].endAt}
            onDismiss={() => setFlashDropDismissed(true)}
          />
        </View>
      )}

      {/* ── SAVED INTENTS (map only) ─────────────────────────────────── */}
      {flags.isOrbSwipeSavedIntentsEnabled && activeView === 'map' && (
        <View style={{ paddingHorizontal: SPACE.base, paddingTop: SPACE.sm }}>
          <SavedIntentModule uid={user?.uid ?? 'anon'} />
        </View>
      )}

      {/* ── LIVE ACTIVITY (map only) — inline bar, zero map overlap ─── */}
      {activeView === 'map' && (
        <LiveActivityPill drops={drops} pulseCount={liveTiles.length} inline />
      )}

      {/* ── CONTENT AREA ─────────────────────────────────────────────── */}
      <View style={styles.contentArea}>
        {/* MAP VIEW ─────────────────────────────────────────────────── */}
        {activeView === 'map' && (
          <>
            {/* Map fill */}
            <View style={styles.mapContainer}>
              {mapContent}

              {/* History button: top-left on map */}
              {!selectedPartner && (
                <View style={styles.mapHistoryWrap} pointerEvents="box-none">
                  <TouchableOpacity
                    style={[
                      styles.mapHistoryBtn,
                      {
                        backgroundColor: isDark
                          ? 'rgba(0,0,0,0.72)'
                          : 'rgba(255,255,255,0.92)',
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setHistoryOverlayVisible((v) => !v)}
                    accessibilityLabel="Recent views"
                  >
                    <Ionicons name="time-outline" size={20} color={colors.text} />
                    {recentPartners.length > 0 && (
                      <View
                        style={[
                          styles.mapHistoryBadge,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text style={styles.mapHistoryBadgeText}>
                          {Math.min(recentPartners.length, 5)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* History panel */}
                  {historyOverlayVisible && (
                    <>
                      <Pressable
                        style={styles.historyBackdrop}
                        onPress={() => setHistoryOverlayVisible(false)}
                      />
                      <View
                        style={[
                          styles.historyPanel,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.historyPanelHeader,
                            { borderBottomColor: colors.border },
                          ]}
                        >
                          <Ionicons
                            name="time"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.historyPanelTitle,
                              { color: colors.text },
                            ]}
                          >
                            Recent views
                          </Text>
                        </View>
                        {recentPartners.length === 0 ? (
                          <View style={styles.historyPanelEmpty}>
                            <Text
                              style={[
                                styles.historyPanelEmptyText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              Tap pins on the map to see places here.
                            </Text>
                          </View>
                        ) : (
                          <ScrollView
                            style={styles.historyPanelList}
                            showsVerticalScrollIndicator={false}
                          >
                            {recentPartners.slice(0, 5).map((p) => {
                              const full = resolvePartner(p.id);
                              return (
                                <TouchableOpacity
                                  key={p.id}
                                  style={[
                                    styles.historyPanelItem,
                                    { borderBottomColor: colors.border },
                                  ]}
                                  onPress={() => {
                                    if (full) handleSelectPartner(full);
                                    setHistoryOverlayVisible(false);
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <View
                                    style={[
                                      styles.historyPanelItemDot,
                                      {
                                        backgroundColor:
                                          PARTNER_TIER_COLORS[p.tier] ??
                                          colors.textSecondary,
                                      },
                                    ]}
                                  />
                                  <View style={styles.historyPanelItemText}>
                                    <Text
                                      style={[
                                        styles.historyPanelItemName,
                                        { color: colors.text },
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {p.name}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.historyPanelItemCat,
                                        { color: colors.textSecondary },
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {p.category}
                                    </Text>
                                  </View>
                                  <Ionicons
                                    name="chevron-forward"
                                    size={14}
                                    color={colors.textSecondary}
                                  />
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        )}
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Backdrop closes sheet on map tap */}
              {selectedPartner && (
                <Pressable
                  style={styles.sheetBackdrop}
                  onPress={() => setSelectedPartner(null)}
                  accessibilityLabel="Close partner sheet"
                />
              )}
            </View>

            {/* OrbSheet overlay */}
            {selectedPartner && (
              <View style={styles.orbSheetWrapper} pointerEvents="box-none">
                <OrbSheet
                  partner={selectedPartner}
                  onClose={() => setSelectedPartner(null)}
                  onSelectPartner={handleSelectPartner}
                  swipePartners={allPartners}
                  isMissionPartner={missionPartnerIds.includes(selectedPartner.id)}
                />
              </View>
            )}

            {/* Map overlays: Tier legend top-right; Nearby tray bottom */}
            <View style={styles.mapLegendWrap} pointerEvents="box-none">
              <TierLegend hasMissionOrbs={missionPartnerIds.length > 0} position="top" />
            </View>
            <MapNearbyTray
              partners={filteredPartners}
              selectedId={selectedPartner?.id ?? null}
              onSelectPartner={handleSelectPartner}
            />
          </>
        )}

        {/* GRID VIEW ────────────────────────────────────────────────── */}
        {activeView === 'grid' && (
          <>
            <PartnerGridView
              partners={filteredPartners}
              drops={drops}
              onRefresh={refreshDrops}
              refreshing={dropsLoading}
            />
            {/* PerkGridModal when tapping a partner in grid */}
            {gridModalPartner && (
              <PerkGridModal
                visible={!!gridModalPartner}
                partner={gridModalPartner}
                onClose={() => setGridModalPartner(null)}
              />
            )}
          </>
        )}

        {/* SWIPE VIEW ───────────────────────────────────────────────── */}
        {activeView === 'swipe' && <InlineOrbSwipe />}
      </View>

      {/* ── GLOBAL OVERLAYS ──────────────────────────────────────────── */}
      <MasterDirectory
        visible={isDirectoryVisible}
        onClose={() => setIsDirectoryVisible(false)}
      />

      <GuidedTutorialOverlay
        visible={showMapTutorial}
        tutorialId="map"
        onClose={() => {
          markCompleted('map');
          setShowMapTutorial(false);
        }}
        onSkipAll={() => {
          setSkipAllTutorials();
          setShowMapTutorial(false);
        }}
      />

      {/* ── ADVANCED FILTER MODAL ────────────────────────────────────── */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.filterModalContainer}>
          <Pressable
            style={styles.filterOverlay}
            onPress={() => setFilterModalVisible(false)}
          />
          <View
            style={[
              styles.filterPanel,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.filterPanelHandle, { backgroundColor: colors.border }]} />

            <View style={styles.filterPanelTitleRow}>
              <Text style={[styles.filterPanelTitle, { color: colors.text }]}>Filters</Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={[styles.filterClearAll, { backgroundColor: COLORS.neonBlue[0] }]}
                  onPress={() => {
                    clearAllFilters();
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.filterClearAllText}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.filterResultCount, { color: colors.textSecondary }]}>
              {filteredPartners.length}{' '}
              {filteredPartners.length === 1 ? 'partner' : 'partners'}
            </Text>

            {/* Tier filter */}
            <Text style={[styles.filterPanelLabel, { color: colors.textSecondary }]}>Tier</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterPanelScroll}
              contentContainerStyle={styles.filterPanelRow}
            >
              <TouchableOpacity
                style={[
                  styles.filterPanelChip,
                  { borderColor: colors.border },
                  tierFilter === 'all' && {
                    backgroundColor: colors.text,
                    borderColor: colors.text,
                  },
                ]}
                onPress={() => setTierFilter('all')}
              >
                <Text
                  style={[
                    styles.filterPanelChipText,
                    { color: tierFilter === 'all' ? colors.background : colors.text },
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {(['silver', 'gold', 'platinum'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.filterPanelChip,
                    { borderColor: colors.border },
                    tierFilter === t && {
                      backgroundColor: PARTNER_TIER_COLORS[t],
                      borderColor: PARTNER_TIER_COLORS[t],
                    },
                  ]}
                  onPress={() => setTierFilter(t)}
                >
                  <View
                    style={[
                      styles.filterDot,
                      { backgroundColor: PARTNER_TIER_COLORS[t] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.filterPanelChipText,
                      {
                        color:
                          tierFilter === t
                            ? t === 'gold' || t === 'platinum'
                              ? '#000'
                              : '#fff'
                            : colors.text,
                      },
                    ]}
                  >
                    {PARTNER_TIER_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Hot Spots filter */}
            <Text style={[styles.filterPanelLabel, { color: colors.textSecondary }]}>Hot Spots</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterPanelScroll}
              contentContainerStyle={styles.filterPanelRow}
            >
              <TouchableOpacity
                style={[
                  styles.filterPanelChip,
                  {
                    borderColor: hotSpotOnly ? '#FFB347' : colors.border,
                    backgroundColor: hotSpotOnly ? '#FFB34720' : 'transparent',
                  },
                ]}
                onPress={() => setHotSpotOnly((v) => !v)}
              >
                <Ionicons
                  name="flash"
                  size={13}
                  color={hotSpotOnly ? '#FFB347' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterPanelChipText,
                    { color: hotSpotOnly ? '#FFB347' : colors.text },
                  ]}
                >
                  2× OT Hot Spots
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Category filter */}
            <Text style={[styles.filterPanelLabel, { color: colors.textSecondary }]}>
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterPanelScroll}
              contentContainerStyle={[styles.filterPanelRow, { paddingBottom: SPACE.base }]}
            >
              {gridCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterPanelChip,
                    { borderColor: colors.border },
                    categoryFilter === cat && {
                      backgroundColor: COLORS.neonBlue[0],
                      borderColor: COLORS.neonBlue[0],
                    },
                  ]}
                  onPress={() => setCategoryFilter(cat)}
                >
                  <Text
                    style={[
                      styles.filterPanelChipText,
                      {
                        color:
                          categoryFilter === cat ? '#fff' : colors.text,
                      },
                    ]}
                  >
                    {formatCategoryLabel(cat)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.filterApplyBtn, { backgroundColor: COLORS.neonBlue[0] }]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.filterApplyBtnText}>
                Show {filteredPartners.length} partner{filteredPartners.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.sm,
    gap: SPACE.sm,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  searchBarText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  headerBalanceWrap: {
    marginRight: 4,
    justifyContent: 'center',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  // ── Toggle + filter chip ────────────────────────────────────────────────
  toggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACE.sm,
    paddingBottom: SPACE.xs,
    paddingRight: SPACE.base,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    padding: 8,
    flexShrink: 0,
    position: 'relative',
  },
  filterChipBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  filterChipBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  // ── Mission strip ───────────────────────────────────────────────────────
  missionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingVertical: 10,
    gap: SPACE.sm,
    borderBottomWidth: 1,
  },
  missionStripIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.xs,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  missionStripText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // ── Do Next ─────────────────────────────────────────────────────────────
  doNextWrap: {
    // DoNextStrip handles its own padding
  },

  // ── Content area ────────────────────────────────────────────────────────
  contentArea: {
    flex: 1,
  },

  // ── Map view ────────────────────────────────────────────────────────────
  mapContainer: {
    flex: 1,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  orbSheetWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  // ── Map placeholder (web / Expo Go) ─────────────────────────────────────
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.xxl,
  },
  mapPlaceholderTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: SPACE.sm,
    textAlign: 'center',
  },
  mapPlaceholderSub: {
    fontSize: TYPE.label,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: SPACE.xl,
  },
  mapPlaceholderBtn: {
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.xxl,
    borderRadius: RADIUS.md,
  },
  mapPlaceholderBtnText: {
    color: '#fff',
    fontSize: TYPE.body,
    fontWeight: '700',
  },

  flashDropInlineWrap: {
    paddingTop: SPACE.xs,
  },
  mapLegendWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  // ── History overlay ─────────────────────────────────────────────────────
  mapHistoryWrap: {
    position: 'absolute',
    top: SPACE.md,
    left: SPACE.md,
    zIndex: 5,
  },
  mapHistoryBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapHistoryBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapHistoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  historyBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  historyPanel: {
    position: 'absolute',
    top: 48,
    left: 0,
    width: 220,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  historyPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    padding: SPACE.md,
    borderBottomWidth: 1,
  },
  historyPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  historyPanelEmpty: {
    padding: SPACE.md,
  },
  historyPanelEmptyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  historyPanelList: {
    maxHeight: 200,
  },
  historyPanelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    gap: SPACE.sm,
  },
  historyPanelItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  historyPanelItemText: {
    flex: 1,
  },
  historyPanelItemName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  historyPanelItemCat: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },

  // ── Advanced filter modal ────────────────────────────────────────────────
  filterModalContainer: {
    flex: 1,
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    paddingTop: SPACE.sm,
    paddingHorizontal: SPACE.base,
    paddingBottom: SPACE.sm,
    maxHeight: '55%',
  },
  filterPanelHandle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACE.sm,
  },
  filterPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  filterPanelTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  filterClearAll: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  filterClearAllText: {
    color: '#fff',
    fontSize: TYPE.caption,
    fontWeight: '700',
  },
  filterResultCount: {
    fontSize: TYPE.caption,
    fontWeight: '500',
    marginBottom: SPACE.sm,
  },
  filterPanelLabel: {
    fontSize: TYPE.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: SPACE.xs,
    marginTop: SPACE.sm,
  },
  filterPanelScroll: {
    flexGrow: 0,
  },
  filterPanelRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    paddingVertical: SPACE.xs,
  },
  filterPanelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  filterPanelChipText: {
    fontSize: TYPE.label,
    fontWeight: '600',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterApplyBtn: {
    marginTop: SPACE.md,
    marginBottom: SPACE.sm,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  filterApplyBtnText: {
    color: '#fff',
    fontSize: TYPE.body,
    fontWeight: '800',
  },
});

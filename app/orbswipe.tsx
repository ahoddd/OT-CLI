/**
 * OrbSwipe — Tinder-style full-screen swipe deck, OrbTray, Fuse My Night.
 * Swipe right = add to night, left = next, up = reserve/do now.
 *
 * Fortifications: Fuse Never Fails, Card Detail Sheet, SavedIntents on swipe-right.
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView, Animated as RNAnimated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAdminLayout } from '../context/AdminLayoutContext';
import { useFlags } from '../components/FlagContext';
import { useOrbSwipePreferences } from '../hooks/useOrbSwipePreferences';
import { useDrops } from '../hooks/useDrops';
import { useMissions } from '../context/MissionsContext';
import { useOrbSwipeDeck } from '../hooks/useOrbSwipeDeck';
import { useFusedPlan, type FusedPlanStop, type FusedPlan } from '../hooks/useFuseOptions';
import { useFuseEngine, type FuseOutcome } from '../hooks/useFuseEngine';
import { OrbSwipeControlsSheet } from '../components/OrbSwipeControlsSheet';
import { OrbSwipeCardStack } from '../components/OrbSwipeCardStack';
import { OrbSwipeCardDetailSheet } from '../components/OrbSwipeCardDetailSheet';
import { TonightRecapShareCard } from '../components/TonightRecapShareCard';
import {
  ORBSWIPE_LOW_SUPPLY_THRESHOLD,
  ORBSWIPE_TRAY_FUSE_THRESHOLD,
  ORBSWIPE_TRAY_MAX,
  ORBSWIPE_RADIUS_PRESETS_MI,
} from '../constants/OrbSwipeConfig';
import {
  LOW_SUPPLY_HEADLINE,
  ORBSWIPE_DECK_HINT,
  ORBSWIPE_FUSE_CTA,
  ORBSWIPE_FUSE_SUBLINE,
  ORBSWIPE_FUSE_MODAL_TITLE,
  ORBSWIPE_FUSE_CTA_START,
  ORBSWIPE_TRAY_EMPTY_SUB,
  ORBSWIPE_TRAY_RESET,
  ORBSWIPE_TRAY_RESET_CONFIRM,
  FUSE_NO_PICKS_HEADLINE,
  FUSE_NO_PICKS_SUB,
  FUSE_RETRY_CTA,
  FUSE_MAP_PICKS_CTA,
} from '../constants/ViralCopy';
import { usePreferences } from '../hooks/usePreferences';
import { setOrbSwipePendingWin, clearOrbSwipePendingWin } from '../services/orbswipeOrigin';
import { logOrbSwipeEvent } from '../services/orbswipeAnalytics';
import { createSavedIntent } from '../services/savedIntents';
import type { OrbSwipeCard } from '../constants/OrbSwipeDeck';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import { usePartners } from '../context/PartnersContext';
import { confirm as confirmDialog } from '../utils/alert';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function OrbSwipeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const layout = useAdminLayout();
  const { flags } = useFlags();
  const { prefs, setRadiusMiles } = useOrbSwipePreferences();
  const { prefs: userPrefs } = usePreferences();
  const { drops, refresh: refreshDrops } = useDrops();
  const { todayMissions } = useMissions();

  useFocusEffect(
    useCallback(() => {
      refreshDrops();
    }, [refreshDrops])
  );
  const { partners } = usePartners();

  const [controlsVisible, setControlsVisible] = useState(false);
  const [recapVisible, setRecapVisible] = useState(false);
  const [fuseModalVisible, setFuseModalVisible] = useState(false);
  const [showExplain, setShowExplain] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tray, setTray] = useState<OrbSwipeCard[]>([]);
  const [swipeCount, setSwipeCount] = useState(0);
  const [detailSheetCard, setDetailSheetCard] = useState<OrbSwipeCard | null>(null);
  const [detailSheetVisible, setDetailSheetVisible] = useState(false);
  const [activePlan, setActivePlan] = useState<FusedPlan | null>(null);
  const [completedStops, setCompletedStops] = useState<Set<number>>(new Set());

  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const recapDataRef = useRef<{ stopNames: string[]; pointsEarned: number }>({ stopNames: [], pointsEarned: 0 });
  const lastSkippedRef = useRef<{ card: OrbSwipeCard; index: number } | null>(null);

  const { cards } = useOrbSwipeDeck(drops, todayMissions, prefs, {
    sponsoredCountThisSession: swipeCount,
    sponsoredEnabled: !userPrefs.premiumMember,
  });

  const [sessionCards, setSessionCards] = useState<OrbSwipeCard[]>([]);
  useEffect(() => {
    if (currentIndex === 0 && cards.length > 0) {
      setSessionCards(cards);
      return;
    }
    if (sessionCards.length > 0 && currentIndex >= sessionCards.length) {
      setSessionCards(cards);
      setCurrentIndex(0);
    }
  }, [currentIndex, cards, sessionCards.length]);

  const fusedPlan = useFusedPlan(tray, drops, todayMissions);

  const showFuseNeverFails = flags.isOrbSwipeFuseNeverFailsEnabled;
  const showCardDetailSheet = flags.isOrbSwipeCardDetailSheetEnabled;
  const showSavedIntents = flags.isOrbSwipeSavedIntentsEnabled;

  const trayPartnerIds = useMemo(() => tray.map((c) => c.partnerId), [tray]);
  const fuseEngine = useFuseEngine(drops, todayMissions, partners, prefs.radiusMiles, trayPartnerIds);

  const pageTitle = layout.getDisplayName('screen_orbswipe_title', 'OrbSwipe');
  const showV11Controls = flags.isOrbSwipeV11ControlsEnabled;
  const showLowSupplyFallback = flags.isOrbSwipeLowSupplyFallbackEnabled;

  const deck = sessionCards.length > 0 ? sessionCards : cards;
  const currentCard = deck[currentIndex] ?? null;
  const deckCardCount = deck.length;
  const isLowSupply = showLowSupplyFallback && deckCardCount < ORBSWIPE_LOW_SUPPLY_THRESHOLD && deckCardCount >= 0;
  const canFuse = tray.length >= ORBSWIPE_TRAY_FUSE_THRESHOLD;
  const showFewerSponsoredOption = Boolean(userPrefs.premiumMember);

  const nextRadiusPreset = useMemo(() => {
    const idx = ORBSWIPE_RADIUS_PRESETS_MI.indexOf(prefs.radiusMiles as (typeof ORBSWIPE_RADIUS_PRESETS_MI)[number]);
    if (idx < 0 || idx >= ORBSWIPE_RADIUS_PRESETS_MI.length - 1) return null;
    return ORBSWIPE_RADIUS_PRESETS_MI[idx + 1];
  }, [prefs.radiusMiles]);

  useEffect(() => {
    if (!currentCard) return;
    const placement = currentCard.type === 'SPONSORED_CARD' ? 'sponsored' : 'organic';
    logOrbSwipeEvent({
      type: placement === 'sponsored' ? 'sponsored_impression' : 'impression',
      cardId: currentCard.id,
      cardType: currentCard.type,
      partnerId: currentCard.partnerId,
      dropId: 'dropId' in currentCard ? currentCard.dropId : undefined,
      missionId: 'missionId' in currentCard ? currentCard.missionId : undefined,
      placement,
    });
  }, [currentCard?.id]);

  useEffect(() => {
    const anim = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const advance = useCallback(() => {
    setSwipeCount((c) => c + 1);
    setCurrentIndex((i) => i + 1);
  }, []);

  const undoSkip = useCallback(() => {
    if (!lastSkippedRef.current) return;
    const { index } = lastSkippedRef.current;
    setCurrentIndex(index);
    setSwipeCount((c) => Math.max(0, c - 1));
    lastSkippedRef.current = null;
  }, []);

  const createIntentFromCard = useCallback(async (card: OrbSwipeCard) => {
    if (!showSavedIntents) return;
    const kind = card.type === 'DROP_CARD' ? 'DROP' as const
      : card.type === 'MISSION_CARD' ? 'MISSION' as const
      : 'PARTNER' as const;
    const refId = card.type === 'DROP_CARD' && 'dropId' in card ? card.dropId
      : card.type === 'MISSION_CARD' && 'missionId' in card ? card.missionId
      : card.partnerId;
    await createSavedIntent({
      uid: user?.uid ?? 'anon',
      kind,
      refId,
      displayName: card.partnerName,
      displaySub: card.valueSummary,
      partnerId: card.partnerId,
      tier: card.tier,
    });
  }, [showSavedIntents]);

  const addToTray = useCallback(() => {
    if (!currentCard) return;
    if (tray.length < ORBSWIPE_TRAY_MAX) {
      setTray((t) => [...t, currentCard]);
      logOrbSwipeEvent({
      type: 'tray_add',
      cardId: currentCard.id,
      cardType: currentCard.type,
      partnerId: currentCard.partnerId,
      dropId: 'dropId' in currentCard ? currentCard.dropId : undefined,
      missionId: 'missionId' in currentCard ? currentCard.missionId : undefined,
      placement: currentCard.type === 'SPONSORED_CARD' ? 'sponsored' : 'organic',
      });
      createIntentFromCard(currentCard);
    }
    logOrbSwipeEvent({
      type: 'swipe_right',
      cardId: currentCard.id,
      cardType: currentCard.type,
      partnerId: currentCard.partnerId,
    });
    advance();
  }, [currentCard, tray.length, advance, createIntentFromCard]);

  const skip = useCallback(() => {
    if (currentCard) {
      lastSkippedRef.current = { card: currentCard, index: currentIndex };
      logOrbSwipeEvent({
        type: 'swipe_left',
        cardId: currentCard.id,
        cardType: currentCard.type,
        partnerId: currentCard.partnerId,
      });
    }
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    advance();
  }, [currentCard, currentIndex, advance]);

  const openDetail = useCallback(() => {
    if (!currentCard) return;
    safeHaptics.selectionAsync();
    if (showCardDetailSheet) {
      logOrbSwipeEvent({
        type: 'open_detail',
        cardId: currentCard.id,
        cardType: currentCard.type,
        partnerId: currentCard.partnerId,
      });
      setDetailSheetCard(currentCard);
      setDetailSheetVisible(true);
      return;
    }
    if (currentCard.type === 'DROP_CARD' && 'dropId' in currentCard) {
      logOrbSwipeEvent({
        type: 'open_drop',
        cardId: currentCard.id,
        cardType: currentCard.type,
        partnerId: currentCard.partnerId,
        dropId: currentCard.dropId,
        placement: 'organic',
      });
      logOrbSwipeEvent({ type: 'cta_click', cardId: currentCard.id, cardType: currentCard.type, partnerId: currentCard.partnerId, dropId: currentCard.dropId });
      router.push(`/drop/${currentCard.dropId}?from=orbswipe` as any);
      advance();
    } else if (currentCard.type === 'MISSION_CARD' && 'missionId' in currentCard) {
      logOrbSwipeEvent({
        type: 'open_mission',
        cardId: currentCard.id,
        cardType: currentCard.type,
        partnerId: currentCard.partnerId,
        missionId: currentCard.missionId,
      });
      logOrbSwipeEvent({ type: 'cta_click', cardId: currentCard.id, cardType: currentCard.type, partnerId: currentCard.partnerId, missionId: currentCard.missionId });
      router.push('/missions' as any);
      advance();
    } else {
      logOrbSwipeEvent({ type: 'cta_click', cardId: currentCard.id, cardType: currentCard.type, partnerId: currentCard.partnerId });
      router.push(`/partner/${currentCard.partnerId}?from=orbswipe` as any);
      advance();
    }
  }, [currentCard, advance, router, showCardDetailSheet]);

  const handleDetailSave = useCallback((card: OrbSwipeCard) => {
    createIntentFromCard(card);
  }, [createIntentFromCard]);

  const navigateToStop = useCallback(
    async (stop: FusedPlanStop) => {
      logOrbSwipeEvent({
        type: 'fuse_select',
        partnerId: stop.partnerId,
        dropId: stop.dropId,
        missionId: stop.missionId,
      });
      setFuseModalVisible(false);
      if (stop.type === 'drop' && stop.dropId && stop.partnerId) {
        await setOrbSwipePendingWin({ type: 'drop', dropId: stop.dropId, partnerId: stop.partnerId });
      } else if (stop.type === 'mission' && stop.missionId && stop.partnerId) {
        await setOrbSwipePendingWin({ type: 'mission', missionId: stop.missionId, partnerId: stop.partnerId });
      }
      router.push(stop.route as any);
    },
    [router]
  );

  const handleFuseOutcomeSelect = useCallback(
    (outcome: FuseOutcome) => {
      if (outcome.route) {
        router.push(outcome.route as any);
      } else if (outcome.type === 'EXPAND_RADIUS_AND_RETRY') {
        handleExpandRadius();
      }
    },
    [router]
  );

  const handleExpandRadius = () => {
    if (nextRadiusPreset != null) setRadiusMiles(nextRadiusPreset);
    setControlsVisible(true);
  };

  const handleClearTray = useCallback(() => {
    confirmDialog(ORBSWIPE_TRAY_RESET, ORBSWIPE_TRAY_RESET_CONFIRM, { confirmText: 'Clear', cancelText: 'Keep' }).then((ok) => {
      if (ok) setTray([]);
    });
  }, []);

  const startPlan = useCallback(() => {
    setActivePlan(fusedPlan);
    setCompletedStops(new Set());
    setFuseModalVisible(false);
    logOrbSwipeEvent({ type: 'plan_started' as any, partnerId: fusedPlan.stops[0]?.partnerId ?? '' });
  }, [fusedPlan]);

  const goToStop = useCallback(
    async (stop: FusedPlanStop) => {
      logOrbSwipeEvent({
        type: 'fuse_select',
        partnerId: stop.partnerId,
        dropId: stop.dropId,
        missionId: stop.missionId,
      });
      if (stop.type === 'drop' && stop.dropId && stop.partnerId) {
        await setOrbSwipePendingWin({ type: 'drop', dropId: stop.dropId, partnerId: stop.partnerId });
      } else if (stop.type === 'mission' && stop.missionId && stop.partnerId) {
        await setOrbSwipePendingWin({ type: 'mission', missionId: stop.missionId, partnerId: stop.partnerId });
      }
      router.push(stop.route as any);
    },
    [router]
  );

  const markStopDone = useCallback((order: number) => {
    setCompletedStops((prev) => {
      const next = new Set(prev);
      next.add(order);
      return next;
    });
  }, []);

  const currentPlanStop = useMemo(() => {
    if (!activePlan) return null;
    return activePlan.stops.find((s) => !completedStops.has(s.order)) ?? null;
  }, [activePlan, completedStops]);

  const allStopsDone = activePlan != null && completedStops.size >= activePlan.stops.length;

  const handleNightComplete = useCallback(async () => {
    if (!activePlan) return;
    recapDataRef.current = {
      stopNames: activePlan.stops.map((s) => s.partnerName),
      pointsEarned: activePlan.totalPointsPotential,
    };
    await clearOrbSwipePendingWin();
    setRecapVisible(true);
    setActivePlan(null);
    setCompletedStops(new Set());
    setTray([]);
  }, [activePlan]);

  const cancelPlan = useCallback(() => {
    setActivePlan(null);
    setCompletedStops(new Set());
  }, []);

  const showFuseNeverFailsEmpty = showFuseNeverFails && !currentCard;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header with live indicator */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {pageTitle}
          </Text>
          {deckCardCount > 0 && (
            <View style={styles.liveRow}>
              <RNAnimated.View style={[styles.liveDot, { opacity: pulseAnim, backgroundColor: colors.success }]} />
              <Text style={[styles.liveText, { color: colors.textSecondary }]}>
                {deckCardCount} live near you
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerRightRow}>
          {lastSkippedRef.current != null ? (
            <TouchableOpacity onPress={undoSkip} style={styles.headerBtn} hitSlop={12} accessibilityLabel="Undo last skip">
              <Ionicons name="arrow-undo" size={22} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
          {showV11Controls ? (
            <TouchableOpacity onPress={() => setControlsVisible(true)} style={styles.headerBtn} hitSlop={12}>
              <Ionicons name="options-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>
      </View>

      {/* Low supply banner — compact */}
      {showLowSupplyFallback && isLowSupply && (
        <View style={[styles.lowSupplyBanner, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
          <Text style={[styles.lowSupplyTitle, { color: colors.text }]}>{LOW_SUPPLY_HEADLINE}</Text>
          <View style={styles.lowSupplyRow}>
            {nextRadiusPreset != null && (
              <TouchableOpacity style={[styles.lowSupplyBtn, { backgroundColor: colors.primary }]} onPress={handleExpandRadius}>
                <Text style={styles.lowSupplyBtnText}>Expand radius</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.lowSupplyBtn, { borderColor: colors.border }]} onPress={() => setControlsVisible(true)}>
              <Text style={[styles.lowSupplyBtnText, { color: colors.text }]}>Tune</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.lowSupplyBtn, { borderColor: colors.border }]} onPress={() => router.push('/(tabs)' as any)}>
              <Text style={[styles.lowSupplyBtnText, { color: colors.text }]}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Hero — compact, premium, live feel */}
      {showExplain && (
        <View style={[styles.heroCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '28' }]}>
          <View style={styles.heroContent}>
            <View style={styles.heroTitleRow}>
              <Ionicons name="flash" size={16} color={colors.primary} />
              <Text style={[styles.heroTitle, { color: colors.text }]}>Build your night</Text>
            </View>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
              Swipe to discover · Pick one or fuse a plan
            </Text>
            <View style={styles.heroChips}>
              <View style={[styles.heroChip, { backgroundColor: colors.success + '18' }]}>
                <Ionicons name="arrow-forward" size={11} color={colors.success} />
                <Text style={[styles.heroChipText, { color: colors.success }]}>Add</Text>
              </View>
              <View style={[styles.heroChip, { backgroundColor: colors.error + '18' }]}>
                <Ionicons name="arrow-back" size={11} color={colors.error} />
                <Text style={[styles.heroChipText, { color: colors.error }]}>Skip</Text>
              </View>
              <View style={[styles.heroChip, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="arrow-up" size={11} color={colors.primary} />
                <Text style={[styles.heroChipText, { color: colors.primary }]}>Details</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowExplain(false)} hitSlop={12} style={styles.heroDismiss}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Card stack or empty — flex so tray always visible below */}
      <View style={styles.stackContainer}>
        {currentCard ? (
          <>
            <OrbSwipeCardStack
              cards={deck}
              currentIndex={currentIndex}
              onSwipeRight={addToTray}
              onSwipeLeft={skip}
              onSwipeUp={openDetail}
              onAdvance={() => {}}
              onTap={openDetail}
            />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>{ORBSWIPE_DECK_HINT}</Text>
          </>
        ) : showFuseNeverFailsEmpty && fuseEngine.outcomes.length > 0 ? (
          /* Fuse Never Fails: fallback outcomes when deck is empty */
          <View style={[styles.emptyDeck, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="flash" size={44} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{FUSE_NO_PICKS_HEADLINE}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{FUSE_NO_PICKS_SUB}</Text>
            {fuseEngine.outcomes.map((outcome) => (
              <TouchableOpacity
                key={outcome.id}
                style={[styles.fuseOutcomeBtn, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '44' }]}
                onPress={() => handleFuseOutcomeSelect(outcome)}
                activeOpacity={0.8}
              >
                <View style={styles.fuseOutcomeContent}>
                  <Text style={[styles.fuseOutcomeLabel, { color: colors.text }]}>{outcome.label}</Text>
                  <Text style={[styles.fuseOutcomeSub, { color: colors.textSecondary }]}>{outcome.subLabel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            ))}
            <View style={styles.emptyCtaRow}>
              {nextRadiusPreset != null && (
                <TouchableOpacity style={[styles.emptyCtaBtn, { backgroundColor: colors.primary }]} onPress={handleExpandRadius}>
                  <Ionicons name="resize" size={16} color="#000" />
                  <Text style={styles.emptyCtaBtnText}>{FUSE_RETRY_CTA}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.emptyCtaBtn, { borderColor: colors.border }]} onPress={() => router.push('/(tabs)' as any)}>
                <Ionicons name="map" size={16} color={colors.text} />
                <Text style={[styles.emptyCtaBtnText, { color: colors.text }]}>{FUSE_MAP_PICKS_CTA}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyDeck, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="layers-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No cards right now</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Discover more on the map or in the feed.</Text>
            <View style={styles.emptyCtaRow}>
              <TouchableOpacity style={[styles.emptyCtaBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)' as any)}>
                <Ionicons name="map" size={16} color="#000" />
                <Text style={[styles.emptyCtaBtnText, { color: '#000' }]}>{FUSE_MAP_PICKS_CTA}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.emptyCtaBtn, { borderColor: colors.border }]} onPress={() => router.push('/feed' as any)}>
                <Ionicons name="newspaper-outline" size={16} color={colors.text} />
                <Text style={[styles.emptyCtaBtnText, { color: colors.text }]}>Commerce Feed</Text>
              </TouchableOpacity>
            </View>
            {nextRadiusPreset != null && (
              <TouchableOpacity style={[styles.emptyCtaBtn, { borderColor: colors.border, marginTop: SPACE.sm }]} onPress={handleExpandRadius}>
                <Ionicons name="resize" size={16} color={colors.text} />
                <Text style={[styles.emptyCtaBtnText, { color: colors.text }]}>{FUSE_RETRY_CTA}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Tray — OrbTap “night tray” */}
      {activePlan ? (
        <View style={[styles.planSection, { backgroundColor: colors.background }]}>
          <View style={styles.planHeader}>
            <View style={styles.planHeaderLeft}>
              <Ionicons name="rocket" size={15} color={colors.primary} />
              <Text style={[styles.planHeaderTitle, { color: colors.text }]}>Your Night Plan</Text>
            </View>
            <Text style={[styles.planProgress, { color: colors.primary }]} numberOfLines={1}>
              {completedStops.size}/{activePlan.stops.length}
            </Text>
            <TouchableOpacity onPress={cancelPlan} hitSlop={12}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.planProgressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.planProgressFill,
                {
                  backgroundColor: allStopsDone ? colors.success : colors.primary,
                  width: `${(completedStops.size / activePlan.stops.length) * 100}%`,
                },
              ]}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.planStopsRow}>
            {activePlan.stops.map((stop) => {
              const isDone = completedStops.has(stop.order);
              const isCurrent = currentPlanStop?.order === stop.order;
              return (
                <TouchableOpacity
                  key={`plan-${stop.order}`}
                  style={[
                    styles.planStopCard,
                    { backgroundColor: colors.surface, borderColor: isCurrent ? colors.primary : colors.border },
                    isDone && { opacity: 0.55 },
                  ]}
                  onPress={() => { if (!isDone) goToStop(stop); }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.planStopDot, { backgroundColor: isDone ? colors.success : isCurrent ? colors.primary : colors.border }]}>
                    {isDone ? (
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    ) : (
                      <Text style={styles.planStopDotText}>{stop.order}</Text>
                    )}
                  </View>
                  <Text style={[styles.planStopName, { color: colors.text }]} numberOfLines={1}>{stop.partnerName}</Text>
                  {stop.urgency && <Text style={[styles.planStopUrgency, { color: colors.error }]}>{stop.urgency}</Text>}
                  {isCurrent && !isDone && (
                    <View style={[styles.planGoChip, { backgroundColor: colors.primary }]}>
                      <Text style={styles.planGoChipText}>Go</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {allStopsDone ? (
            <View style={styles.planCompleteSection}>
              <Text style={[styles.planCompleteText, { color: colors.success }]} numberOfLines={1}>
                Night Complete! +{activePlan.totalPointsPotential} OT
              </Text>
              <Text style={[styles.planCompleteSubtext, { color: colors.textSecondary }]} numberOfLines={2}>
                Great night. Share your wins or plan the next one.
              </Text>
              <View style={styles.planCompleteActions}>
                <TouchableOpacity
                  style={[styles.planShareBtn, { backgroundColor: colors.success }]}
                  onPress={handleNightComplete}
                  activeOpacity={0.9}
                >
                  <Ionicons name="share-social" size={14} color="#fff" />
                  <Text style={[styles.planShareBtnText, { color: '#fff' }]} numberOfLines={1}>Share & Finish</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.planCompleteSecBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]}
                  onPress={() => { setActivePlan(null); setCompletedStops(new Set()); setTray([]); setCurrentIndex(0); setSwipeCount(0); }}
                  activeOpacity={0.9}
                >
                  <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
                  <Text style={[styles.planCompleteSecBtnText, { color: colors.primary }]} numberOfLines={1}>Plan another night</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.planCompleteSecBtn, { borderColor: colors.border }]}
                  onPress={() => router.push('/(tabs)' as any)}
                  activeOpacity={0.9}
                >
                  <Ionicons name="map" size={14} color={colors.text} />
                  <Text style={[styles.planCompleteSecBtnText, { color: colors.text }]} numberOfLines={1}>Explore map</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : currentPlanStop ? (
            <View style={styles.planActionRow}>
              <TouchableOpacity
                style={[styles.planMarkDoneBtn, { borderColor: colors.success }]}
                onPress={() => markStopDone(currentPlanStop.order)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.planMarkDoneText, { color: colors.success }]}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.planCurrentGoBtn, { backgroundColor: colors.primary }]}
                onPress={() => goToStop(currentPlanStop)}
                activeOpacity={0.9}
              >
                <Ionicons name="navigate" size={14} color="#000" />
                <Text style={styles.planCurrentGoBtnText}>Go to {currentPlanStop.partnerName}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : (
      <View style={[styles.traySection, styles.traySectionGlass]}>
        {Platform.OS !== 'web' && (
          <BlurView intensity={48} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        )}
        {Platform.OS === 'web' && <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface + 'ee' }]} />}
        <View style={styles.trayHeader}>
          <View style={styles.trayHeaderLeft}>
            <Ionicons name="layers" size={15} color={colors.primary} />
            <Text style={[styles.trayTitle, { color: colors.text }]}>
              {tray.length > 0 ? 'Your Night' : 'Night Tray'}
            </Text>
            {tray.length > 0 && (
              <View style={[styles.trayCountBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.trayCountText}>{tray.length}</Text>
              </View>
            )}
            {tray.length > 0 && tray.length < ORBSWIPE_TRAY_FUSE_THRESHOLD && (
              <Text style={[styles.trayProgressHint, { color: colors.textSecondary }]}>
                {tray.length} of {ORBSWIPE_TRAY_FUSE_THRESHOLD} to Fuse
              </Text>
            )}
          </View>
          <View style={styles.trayCapacity}>
            {Array.from({ length: ORBSWIPE_TRAY_MAX }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.trayCapDot,
                  { backgroundColor: i < tray.length ? colors.primary : colors.border },
                ]}
              />
            ))}
          </View>
          {tray.length > 0 && (
            <TouchableOpacity onPress={handleClearTray} hitSlop={12}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {tray.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trayChipRow}
          >
            {tray.map((card, index) => {
              const chipRoute = card.type === 'DROP_CARD' && 'dropId' in card
                ? `/drop/${(card as any).dropId}?from=orbswipe`
                : card.type === 'MISSION_CARD' && 'missionId' in card
                ? '/missions'
                : `/partner/${card.partnerId}?from=orbswipe`;
              const tierColor = PARTNER_TIER_COLORS[card.tier] ?? colors.border;
              const chipIcon: keyof typeof Ionicons.glyphMap = card.type === 'DROP_CARD' ? 'flash' : card.type === 'MISSION_CARD' ? 'flag' : 'navigate';
              return (
                <TouchableOpacity
                  key={`tray-${index}-${card.id}`}
                  style={[styles.trayChip, { backgroundColor: tierColor + '12', borderColor: tierColor + '40' }]}
                  onPress={() => router.push(chipRoute as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={chipIcon} size={13} color={tierColor} />
                  <Text style={[styles.trayChipText, { color: colors.text }]} numberOfLines={1}>
                    {card.partnerName}
                  </Text>
                  <Ionicons name="chevron-forward" size={11} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={[styles.trayEmpty, { color: colors.textSecondary }]}>{ORBSWIPE_TRAY_EMPTY_SUB}</Text>
        )}

        {canFuse ? (
          <TouchableOpacity
            style={[styles.fuseBtn, { backgroundColor: colors.primary }]}
            onPress={() => setFuseModalVisible(true)}
            activeOpacity={0.9}
          >
            <Ionicons name="flash" size={20} color="#000" />
            <Text style={styles.fuseBtnText}>{ORBSWIPE_FUSE_CTA}</Text>
            <Text style={styles.fuseBtnSub}>{ORBSWIPE_FUSE_SUBLINE}</Text>
          </TouchableOpacity>
        ) : tray.length > 0 ? (
          <Text style={[styles.trayHint, { color: colors.textSecondary }]}>Tap to go · Add more to fuse</Text>
        ) : null}
      </View>
      )}

      <OrbSwipeControlsSheet
        visible={controlsVisible}
        onClose={() => setControlsVisible(false)}
        showFewerSponsoredOption={showFewerSponsoredOption}
      />

      <Modal visible={fuseModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFuseModalVisible(false)} />
          <View style={[styles.fuseModal, styles.fuseModalGlass, { borderColor: colors.border }]}>
            {Platform.OS !== 'web' && (
              <BlurView intensity={64} tint={isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, styles.fuseModalBlur]} />
            )}
            {Platform.OS === 'web' && <View style={[StyleSheet.absoluteFill, styles.fuseModalBlur, { backgroundColor: colors.surface + 'f5' }]} />}
            <View style={styles.fusePlanHeader}>
              <Ionicons name="flash" size={22} color={colors.primary} />
              <View style={{ marginLeft: SPACE.sm, flex: 1 }}>
                <Text style={[styles.fuseModalTitle, { color: colors.text }]}>{ORBSWIPE_FUSE_MODAL_TITLE}</Text>
                <Text style={[styles.fuseModalSub, { color: colors.textSecondary }]}>
                  {fusedPlan.stops.length} {fusedPlan.stops.length === 1 ? 'stop' : 'stops'} fused from your picks
                </Text>
              </View>
            </View>

            <ScrollView style={styles.fusePlanScroll} showsVerticalScrollIndicator={false}>
              {fusedPlan.stops.map((stop) => (
                <TouchableOpacity
                  key={`stop-${stop.order}`}
                  style={[styles.fusePlanStop, { borderColor: colors.border, backgroundColor: colors.primary + '06' }]}
                  onPress={() => navigateToStop(stop)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.fusePlanStopNum, { backgroundColor: colors.primary }]}>
                    <Text style={styles.fusePlanStopNumText}>{stop.order}</Text>
                  </View>
                  <View style={styles.fusePlanStopBody}>
                    <Text style={[styles.fusePlanStopName, { color: colors.text }]} numberOfLines={1}>{stop.partnerName}</Text>
                    <Text style={[styles.fusePlanStopLabel, { color: colors.textSecondary }]} numberOfLines={1}>{stop.label}</Text>
                    {stop.urgency && (
                      <Text style={[styles.fusePlanStopUrgency, { color: colors.error }]}>{stop.urgency}</Text>
                    )}
                  </View>
                  <View style={styles.fusePlanStopEnd}>
                    <Text style={[styles.fusePlanStopPts, { color: colors.primary }]}>{stop.pointsPotential} OT</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {fusedPlan.totalPointsPotential > 0 && (
              <View style={[styles.fusePlanTotal, { borderTopColor: colors.border }]}>
                <Text style={[styles.fusePlanTotalLabel, { color: colors.textSecondary }]}>Total potential</Text>
                <Text style={[styles.fusePlanTotalVal, { color: colors.primary }]}>{fusedPlan.totalPointsPotential} OT</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.fusePrimaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => { safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); startPlan(); }}
              activeOpacity={0.88}
            >
              <Ionicons name="rocket" size={18} color="#fff" />
              <Text style={styles.fusePrimaryBtnText}>{ORBSWIPE_FUSE_CTA_START}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.fuseModalClose, { borderColor: colors.border }]} onPress={() => setFuseModalVisible(false)}>
              <Text style={[styles.fuseModalCloseText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={recapVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRecapVisible(false)} />
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.recapWrap}>
            <TonightRecapShareCard
              visible={recapVisible}
              onClose={() => setRecapVisible(false)}
              stopNames={recapDataRef.current.stopNames}
              pointsEarned={recapDataRef.current.pointsEarned}
              isPotential
              onPlanAnother={() => {
                setRecapVisible(false);
                setTray([]);
                setCurrentIndex(0);
                setActivePlan(null);
                setCompletedStops(new Set());
              }}
              onViewMap={() => {
                setRecapVisible(false);
                router.push('/(tabs)' as any);
              }}
            />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Card Detail Sheet (Phase B) */}
      {showCardDetailSheet && (
        <OrbSwipeCardDetailSheet
          card={detailSheetCard}
          visible={detailSheetVisible}
          onClose={() => setDetailSheetVisible(false)}
          onAddToTray={(card) => {
            if (tray.length < ORBSWIPE_TRAY_MAX) {
              setTray((t) => [...t, card]);
              createIntentFromCard(card);
            }
          }}
          onSave={handleDetailSave}
          onReserve={async (card) => {
            if (card.type === 'DROP_CARD' && 'dropId' in card) {
              await setOrbSwipePendingWin({ type: 'drop', dropId: (card as any).dropId, partnerId: card.partnerId });
            } else if (card.type === 'MISSION_CARD' && 'missionId' in card) {
              await setOrbSwipePendingWin({ type: 'mission', missionId: (card as any).missionId, partnerId: card.partnerId });
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.md,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerRightRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontWeight: '600' },
  lowSupplyBanner: { padding: SPACE.md, borderRadius: RADIUS.md, borderWidth: 1, marginHorizontal: SPACE.base, marginTop: SPACE.sm },
  lowSupplyTitle: { fontSize: 14, fontWeight: '800', marginBottom: SPACE.sm },
  lowSupplyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  lowSupplyBtn: { paddingVertical: SPACE.sm, paddingHorizontal: SPACE.base, borderRadius: RADIUS.sm, borderWidth: 1 },
  lowSupplyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: SPACE.base,
    marginTop: SPACE.sm,
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  heroContent: { flex: 1 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.xs },
  heroTitle: { fontSize: 15, fontWeight: '800' },
  heroSub: { fontSize: 12, lineHeight: 16, marginBottom: SPACE.sm },
  heroChips: { flexDirection: 'row', gap: SPACE.sm },
  heroChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 3, paddingHorizontal: 8, borderRadius: RADIUS.full },
  heroChipText: { fontSize: 11, fontWeight: '700' },
  heroDismiss: { padding: SPACE.xs },
  stackContainer: { flex: 1, minHeight: 0, justifyContent: 'center', paddingHorizontal: SPACE.sm },
  hint: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: SPACE.sm },
  emptyDeck: {
    minHeight: 200,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.xl,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: SPACE.base },
  emptySub: { fontSize: 13, marginTop: SPACE.sm, textAlign: 'center', paddingHorizontal: SPACE.lg, marginBottom: SPACE.lg },
  emptyCtaRow: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.sm },
  emptyCtaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.base,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  emptyCtaBtnSecondary: { flex: undefined, width: '100%' },
  emptyCtaBtnText: { color: '#000', fontSize: 13, fontWeight: '700' },
  traySection: { paddingHorizontal: SPACE.base, paddingBottom: SPACE.md, paddingTop: SPACE.sm },
  traySectionGlass: { position: 'relative', overflow: 'hidden', borderRadius: RADIUS.lg },
  trayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACE.sm },
  trayHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, flexWrap: 'wrap' },
  trayTitle: { fontSize: 14, fontWeight: '800' },
  trayProgressHint: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  trayCountBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trayCountText: { color: '#000', fontSize: 11, fontWeight: '800' },
  trayCapacity: { flexDirection: 'row', gap: 4, marginRight: SPACE.sm },
  trayCapDot: { width: 6, height: 6, borderRadius: 3 },
  trayChipRow: { paddingBottom: SPACE.sm, gap: SPACE.sm },
  trayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  trayChipText: { fontSize: 13, fontWeight: '700', maxWidth: 120 },
  trayEmpty: { fontSize: 12, paddingVertical: SPACE.sm },
  trayHint: { fontSize: 11, textAlign: 'center', marginTop: SPACE.xs },
  fuseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    marginTop: SPACE.sm,
  },
  fuseBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  fuseBtnSub: { color: 'rgba(0,0,0,0.75)', fontSize: 12, marginLeft: 2 },
  planSection: { paddingHorizontal: SPACE.base, paddingBottom: SPACE.md, paddingTop: SPACE.sm },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACE.sm },
  planHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  planHeaderTitle: { fontSize: 14, fontWeight: '800' },
  planProgress: { fontSize: 13, fontWeight: '800', marginRight: SPACE.sm },
  planProgressBar: { height: 3, borderRadius: 2, marginBottom: SPACE.sm, overflow: 'hidden' },
  planProgressFill: { height: '100%', borderRadius: 2 },
  planStopsRow: { gap: SPACE.sm, paddingBottom: SPACE.sm },
  planStopCard: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    minWidth: 110,
    alignItems: 'center',
    gap: 4,
  },
  planStopDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planStopDotText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  planStopName: { fontSize: 12, fontWeight: '700', maxWidth: 100, textAlign: 'center' },
  planStopUrgency: { fontSize: 10, fontWeight: '700' },
  planGoChip: { paddingVertical: 2, paddingHorizontal: 10, borderRadius: RADIUS.full, marginTop: 2 },
  planGoChipText: { color: '#000', fontSize: 11, fontWeight: '800' },
  planActionRow: { flexDirection: 'row', gap: SPACE.sm, marginTop: SPACE.xs },
  planMarkDoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  planMarkDoneText: { fontSize: 13, fontWeight: '700' },
  planCurrentGoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.md,
  },
  planCurrentGoBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },
  planCompleteRow: { alignItems: 'center', marginTop: SPACE.sm, gap: SPACE.sm },
  planCompleteSection: { alignItems: 'center', marginTop: SPACE.sm, gap: SPACE.sm, paddingHorizontal: SPACE.sm },
  planCompleteText: { fontSize: 15, fontWeight: '800' },
  planCompleteSubtext: { fontSize: 12, textAlign: 'center' },
  planCompleteActions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, justifyContent: 'center', marginTop: SPACE.xs },
  planCompleteSecBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.sm, borderWidth: 1 },
  planCompleteSecBtnText: { fontSize: 12, fontWeight: '700' },
  planShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.xl,
    borderRadius: RADIUS.md,
  },
  planShareBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACE.xl },
  recapWrap: { width: '100%' },
  fuseModal: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACE.xl },
  fuseModalGlass: { position: 'relative', overflow: 'hidden' },
  fuseModalBlur: { borderRadius: RADIUS.lg },
  fuseModalTitle: { fontSize: 18, fontWeight: '800', marginBottom: SPACE.xs },
  fuseModalSub: { fontSize: 13, marginBottom: SPACE.base },
  fusePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    marginTop: SPACE.md,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    minHeight: 52,
    alignSelf: 'stretch',
  },
  fusePrimaryBtnText: { fontWeight: '700', fontSize: 16, color: '#fff' },
  fuseModalClose: { marginTop: SPACE.md, paddingVertical: SPACE.md, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center' },
  fuseModalCloseText: { fontSize: 14, fontWeight: '600' },
  fusePlanHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACE.base },
  fusePlanScroll: { maxHeight: 280 },
  fusePlanStop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACE.sm,
  },
  fusePlanStopNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fusePlanStopNumText: { color: '#000', fontSize: 13, fontWeight: '800' },
  fusePlanStopBody: { flex: 1, marginLeft: SPACE.md },
  fusePlanStopName: { fontSize: 15, fontWeight: '700' },
  fusePlanStopLabel: { fontSize: 12, marginTop: 2 },
  fusePlanStopUrgency: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  fusePlanStopEnd: { alignItems: 'flex-end', marginLeft: SPACE.sm },
  fusePlanStopPts: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  fusePlanTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACE.md,
    borderTopWidth: 1,
    marginBottom: SPACE.md,
  },
  fusePlanTotalLabel: { fontSize: 13, fontWeight: '600' },
  fusePlanTotalVal: { fontSize: 16, fontWeight: '800' },
  fuseStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACE.sm,
  },
  fuseStartBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  fuseOutcomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACE.sm,
    width: '100%',
  },
  fuseOutcomeContent: { flex: 1 },
  fuseOutcomeLabel: { fontSize: 14, fontWeight: '700' },
  fuseOutcomeSub: { fontSize: 12, marginTop: 2 },
});

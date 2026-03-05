/**
 * Meal Mode — full-screen OrbSwipe meal discovery.
 * Top rail filters, swipe deck, tray, Fuse My Meal, compare, plan detail.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useFlags } from '../components/FlagContext';
import { useMealProposals } from '../hooks/useMealProposals';
import { useMealFuse, buildMealPlan, type MealFuseOption } from '../hooks/useMealFuse';
import { logMealEvent } from '../hooks/useMealAnalytics';
import { useWalletContext } from '../context/WalletContext';
import { MealProposalCard } from '../components/MealProposalCard';
import { MealProposalCardStack } from '../components/MealProposalCardStack';
import { MealProposalDetailSheet } from '../components/MealProposalDetailSheet';
import { MealCompareSheet } from '../components/MealCompareSheet';
import { MealPlanDetailSheet } from '../components/MealPlanDetailSheet';
import { MealRecapShareCard } from '../components/MealRecapShareCard';
import { MealVerifiedReviewCTA } from '../components/MealVerifiedReviewCTA';
import { MealSphereVote } from '../components/MealSphereVote';
import {
  MEAL_TYPE_LABELS,
  BUDGET_PRESETS,
  RADIUS_PRESETS_MI,
  MEAL_VIBE_TAGS,
  PARTY_SIZE_PRESETS,
  getMealTimeRelevance,
  getWhyLabel,
  type MealType,
  type MealProposal,
  type MealVibeTag,
  type MealPlan,
} from '../constants/MealProposals';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import { SPACE, RADIUS } from '../constants/DesignTokens';
import { createSavedIntent } from '../services/savedIntents';
import { auth } from '../firebaseConfig';
import { useI18n } from '../context/I18nContext';

const TRAY_MAX = 5;

export default function MealModeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const params = useLocalSearchParams<{ sphereId?: string; sphereName?: string; sphereType?: string }>();
  const { getPublished, createPlan, updatePlanStatus, sphereVotes, addSphereVote, getVotesForProposal } = useMealProposals();
  const { createVerifiedAction } = useWalletContext();

  // Filters
  const [filterMealType, setFilterMealType] = useState<MealType | null>(null);
  const [filterBudgetIdx, setFilterBudgetIdx] = useState(3);
  const [filterRadiusIdx, setFilterRadiusIdx] = useState(2);
  const [filterPartySize, setFilterPartySize] = useState(2);
  const [filterVibes, setFilterVibes] = useState<MealVibeTag[]>([]);

  // Deck state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tray, setTray] = useState<MealProposal[]>([]);
  const [lockedProposalId, setLockedProposalId] = useState<string | undefined>();
  const [detailProposal, setDetailProposal] = useState<MealProposal | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [compareVisible, setCompareVisible] = useState(false);
  const [fuseModalVisible, setFuseModalVisible] = useState(false);
  const [planSheetVisible, setPlanSheetVisible] = useState(false);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [activePlanProposal, setActivePlanProposal] = useState<MealProposal | null>(null);
  const [recapVisible, setRecapVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [completedProofId, setCompletedProofId] = useState<string | null>(null);

  const sphereContext = params.sphereId ? { id: params.sphereId, name: params.sphereName ?? 'Sphere', type: params.sphereType ?? 'pal' } : null;
  const isMealEnabled = flags['orbswipe.mealProposals'];

  const allPublished = getPublished();
  const hour = new Date().getHours();

  const filteredProposals = useMemo(() => {
    let list = allPublished;
    if (filterMealType) list = list.filter((p) => p.mealType === filterMealType);
    const budgetMax = BUDGET_PRESETS[filterBudgetIdx]?.maxCents ?? Infinity;
    if (budgetMax < Infinity) list = list.filter((p) => (p.pricing.priceCentsPerPerson ?? p.pricing.priceCentsTotal ?? 0) <= budgetMax);
    if (filterVibes.length > 0) list = list.filter((p) => p.targeting.tags?.some((t) => filterVibes.includes(t)));
    if (sphereContext) {
      const scopeMap: Record<string, string> = { couple: 'COUPLE', fami: 'FAMILY', pal: 'PAL' };
      const sphereTarget = scopeMap[sphereContext.type] ?? 'SOLO';
      list = list.filter((p) => p.targeting.sphereTargets?.includes(sphereTarget as any) || !p.targeting.sphereTargets?.length);
    }
    list = list.filter((p) => p.partySize.maxPeople >= filterPartySize && p.partySize.minPeople <= filterPartySize);
    return list.sort((a, b) => getMealTimeRelevance(b.mealType, hour) - getMealTimeRelevance(a.mealType, hour));
  }, [allPublished, filterMealType, filterBudgetIdx, filterVibes, filterPartySize, sphereContext, hour]);

  const currentProposal = filteredProposals[currentIndex] ?? null;
  const fuseOptions = useMealFuse(tray, sphereVotes, lockedProposalId);
  const canFuse = tray.length >= 1 && fuseOptions.length > 0 && flags['orbswipe.mealTrayFuse'];

  useEffect(() => {
    if (!currentProposal) return;
    logMealEvent({ proposalId: currentProposal.id, uid: auth.currentUser?.uid ?? 'anon', action: 'IMPRESSION' });
  }, [currentProposal?.id]);

  const advance = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, filteredProposals.length));
  }, [filteredProposals.length]);

  const addToTray = useCallback(() => {
    if (!currentProposal || tray.length >= TRAY_MAX) return;
    setTray((t) => [...t, currentProposal]);
    const _uid = auth.currentUser?.uid ?? 'anon';
    logMealEvent({ proposalId: currentProposal.id, uid: _uid, action: 'SWIPE_RIGHT_TRAY' });
    createSavedIntent({
      uid: _uid,
      kind: 'MEAL_PROPOSAL',
      refId: currentProposal.id,
      displayName: currentProposal.partnerName ?? currentProposal.title,
      displaySub: currentProposal.title,
      partnerId: currentProposal.partnerId,
      tier: currentProposal.partnerTier,
    }).catch(() => {});
    advance();
  }, [currentProposal, tray.length, advance]);

  const skip = useCallback(() => {
    if (currentProposal) {
      logMealEvent({ proposalId: currentProposal.id, uid: auth.currentUser?.uid ?? 'anon', action: 'SWIPE_LEFT_DISMISS' });
    }
    advance();
  }, [currentProposal, advance]);

  const handleSuperOrb = useCallback(() => {
    if (!currentProposal) return;
    logMealEvent({ proposalId: currentProposal.id, uid: auth.currentUser?.uid ?? 'anon', action: 'SUPER_ORB' });
    setLockedProposalId(currentProposal.id);
    setDetailProposal(currentProposal);
    setDetailVisible(true);
  }, [currentProposal]);

  const handleCreatePlan = useCallback(async (proposal: MealProposal, partySize: number, scope: 'SOLO' | 'SPHERE') => {
    const planDraft = buildMealPlan(
      proposal, auth.currentUser?.uid ?? 'anon', scope, partySize,
      tray.map((t) => t.id),
      sphereContext?.id,
    );
    const plan = await createPlan(planDraft);
    logMealEvent({ proposalId: proposal.id, uid: auth.currentUser?.uid ?? 'anon', action: 'FUSE_SELECT' });
    setActivePlan(plan);
    setActivePlanProposal(proposal);
    setPlanSheetVisible(true);
  }, [tray, sphereContext, createPlan]);

  const handleFuseSelect = useCallback(async (option: MealFuseOption) => {
    setFuseModalVisible(false);
    await handleCreatePlan(option.proposal, filterPartySize, sphereContext ? 'SPHERE' : 'SOLO');
  }, [handleCreatePlan, filterPartySize, sphereContext]);

  const handleCheckIn = useCallback(async () => {
    if (!activePlan || !activePlanProposal) return;
    try {
      const action = await createVerifiedAction(
        activePlanProposal.partnerId,
        activePlan.id,
        50,
        { ledgerReason: 'Meal plan check-in', actionType: 'MEAL_PLAN_COMPLETE' },
      );
      await updatePlanStatus(activePlan.id, 'COMPLETED', { verifiedActionId: action.id, proofId: action.id });
      setCompletedProofId(action.id);
      setPlanSheetVisible(false);
      setRecapVisible(true);
    } catch (e) {
      if (__DEV__) console.error('Meal check-in error:', e);
    }
  }, [activePlan, activePlanProposal, createVerifiedAction, updatePlanStatus]);

  const toggleVibe = (tag: MealVibeTag) => {
    setFilterVibes((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  if (!isMealEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Meal Mode coming soon</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: colors.primary }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Rail — Filters */}
      <View style={[styles.topRail, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.modeTitle, { color: colors.text }]}>
          {sphereContext ? `Meals for ${sphereContext.name}` : 'Meal Mode'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {/* Meal type */}
        {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map((mt) => (
          <TouchableOpacity
            key={mt}
            style={[styles.filterChip, { backgroundColor: filterMealType === mt ? colors.primary + '22' : colors.surface, borderColor: filterMealType === mt ? colors.primary : colors.border }]}
            onPress={() => setFilterMealType(filterMealType === mt ? null : mt)}
          >
            <Text style={[styles.filterChipText, { color: filterMealType === mt ? colors.primary : colors.text }]}>{MEAL_TYPE_LABELS[mt]}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterDivider} />
        {/* Budget */}
        {BUDGET_PRESETS.map((bp, idx) => (
          <TouchableOpacity
            key={bp.id}
            style={[styles.filterChip, { backgroundColor: filterBudgetIdx === idx ? colors.primary + '22' : colors.surface, borderColor: filterBudgetIdx === idx ? colors.primary : colors.border }]}
            onPress={() => setFilterBudgetIdx(idx)}
          >
            <Text style={[styles.filterChipText, { color: filterBudgetIdx === idx ? colors.primary : colors.text }]}>{bp.label}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterDivider} />
        {/* Party size */}
        {PARTY_SIZE_PRESETS.map((ps) => (
          <TouchableOpacity
            key={ps}
            style={[styles.filterChip, { backgroundColor: filterPartySize === ps ? colors.primary + '22' : colors.surface, borderColor: filterPartySize === ps ? colors.primary : colors.border }]}
            onPress={() => setFilterPartySize(ps)}
          >
            <Text style={[styles.filterChipText, { color: filterPartySize === ps ? colors.primary : colors.text }]}>{ps === 1 ? '1' : ps <= 4 ? `${ps}` : `${ps}+`}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterDivider} />
        {/* Vibes */}
        {MEAL_VIBE_TAGS.slice(0, 5).map((vt) => (
          <TouchableOpacity
            key={vt.id}
            style={[styles.filterChip, { backgroundColor: filterVibes.includes(vt.id) ? colors.primary + '22' : colors.surface, borderColor: filterVibes.includes(vt.id) ? colors.primary : colors.border }]}
            onPress={() => toggleVibe(vt.id)}
          >
            <Text style={[styles.filterChipText, { color: filterVibes.includes(vt.id) ? colors.primary : colors.text }]}>{vt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Card stack — gesture swipe (same as OrbSwipe): left = skip, right = add to tray, up = details */}
      <View style={styles.cardArea}>
        {currentProposal && filteredProposals.length > 0 ? (
          <MealProposalCardStack
            proposals={filteredProposals}
            currentIndex={currentIndex}
            onSwipeRight={addToTray}
            onSwipeLeft={skip}
            onSwipeUp={() => {
              if (currentProposal) {
                setDetailProposal(currentProposal);
                setDetailVisible(true);
              }
            }}
            onTap={() => {
              if (currentProposal) {
                setDetailProposal(currentProposal);
                setDetailVisible(true);
              }
            }}
          />
        ) : (
          <View style={[styles.emptyDeck, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {allPublished.length > 0 ? 'No meals match your filters' : 'No more meals'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {allPublished.length > 0
                ? 'Try "Any" budget, a different party size, or clear meal type / vibes to see more cards'
                : 'Try adjusting your filters or expanding your search'}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Tray + Fuse */}
      <View style={[styles.traySection, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trayScroll}>
          {tray.length > 0 ? (
            tray.map((p, i) => (
              <View key={`tray-${i}-${p.id}`} style={[styles.trayChip, { backgroundColor: (PARTNER_TIER_COLORS[p.partnerTier ?? 'silver']) + '28', borderColor: (PARTNER_TIER_COLORS[p.partnerTier ?? 'silver']) + '88' }]}>
                <Text style={[styles.trayChipText, { color: colors.text }]} numberOfLines={1}>{p.partnerName ?? p.title}</Text>
                {lockedProposalId === p.id && <Ionicons name="lock-closed" size={12} color={colors.primary} />}
              </View>
            ))
          ) : (
            <Text style={[styles.trayEmpty, { color: colors.textSecondary }]}>Swipe right to add to tray</Text>
          )}
        </ScrollView>

        <View style={styles.trayCtas}>
          {tray.length >= 2 && (
            <TouchableOpacity style={[styles.compareCta, { borderColor: colors.primary }]} onPress={() => setCompareVisible(true)}>
              <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
              <Text style={[styles.compareCtaText, { color: colors.primary }]}>Compare</Text>
            </TouchableOpacity>
          )}
          {canFuse && (
            <TouchableOpacity style={[styles.fuseCta, { backgroundColor: colors.primary }]} onPress={() => setFuseModalVisible(true)}>
              <Ionicons name="flash" size={20} color="#000" />
              <Text style={styles.fuseCtaText}>
                {sphereContext ? `Fuse for ${sphereContext.name}` : 'Fuse My Meal'}
              </Text>
            </TouchableOpacity>
          )}
          {tray.length > 0 && !canFuse && (
            <Text style={[styles.trayHint, { color: colors.textSecondary }]}>Add more picks to Fuse</Text>
          )}
        </View>

        {/* Sphere vote module */}
        {sphereContext && tray.length > 0 && flags['orbswipe.mealSphereVote'] && (
          <MealSphereVote
            proposals={tray}
            getVotes={getVotesForProposal}
            onVote={(id) => addSphereVote(id, auth.currentUser?.uid ?? 'anon')}
            memberCount={2}
            readyCount={1}
          />
        )}
      </View>

      {/* Detail Sheet */}
      <MealProposalDetailSheet
        proposal={detailProposal}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onAddToTray={(p) => {
          if (tray.length < TRAY_MAX) setTray((t) => [...t, p]);
        }}
        onCreatePlan={handleCreatePlan}
        sphereContext={sphereContext}
      />

      {/* Compare Sheet */}
      <MealCompareSheet
        proposals={tray}
        visible={compareVisible}
        onClose={() => setCompareVisible(false)}
        onSelect={(p) => setLockedProposalId(p.id)}
      />

      {/* Fuse Modal */}
      <Modal visible={fuseModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFuseModalVisible(false)} />
          <View style={[styles.fuseModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.fuseModalTitle, { color: colors.text }]}>Fuse My Meal</Text>
            <Text style={[styles.fuseModalSub, { color: colors.textSecondary }]}>
              {sphereContext ? `Best picks for ${sphereContext.name}` : 'Your best meal options'}
            </Text>
            {fuseOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.fuseRow, { backgroundColor: colors.primary + '0c', borderColor: colors.primary + '44' }]}
                onPress={() => handleFuseSelect(opt)}
                activeOpacity={0.8}
              >
                <View style={styles.fuseRowContent}>
                  <Text style={[styles.fuseRowLabel, { color: colors.text }]}>{opt.label}</Text>
                  <Text style={[styles.fuseRowSub, { color: colors.textSecondary }]}>{opt.subLabel}</Text>
                </View>
                <View style={[styles.fuseRowCta, { backgroundColor: colors.primary }]}>
                  <Text style={styles.fuseRowCtaText}>Go</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.fuseClose, { borderColor: colors.border }]} onPress={() => setFuseModalVisible(false)}>
              <Text style={[styles.fuseCloseText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Plan Detail */}
      <MealPlanDetailSheet
        plan={activePlan}
        proposal={activePlanProposal}
        visible={planSheetVisible}
        onClose={() => setPlanSheetVisible(false)}
        onStartNavigation={() => { setPlanSheetVisible(false); router.push('/(tabs)' as any); }}
        onCheckIn={handleCheckIn}
      />

      {/* Recap Share */}
      <Modal visible={recapVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { setRecapVisible(false); setReviewVisible(true); }} />
          <View style={styles.recapWrap}>
            {activePlanProposal && (
              <MealRecapShareCard
                visible={recapVisible}
                onClose={() => { setRecapVisible(false); setReviewVisible(true); }}
                proposal={activePlanProposal}
                partySizeChosen={activePlan?.partySizeChosen ?? 2}
                pointsEarned={50}
                topMenuItem={activePlanProposal.menuItems[0]?.name}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Verified Review CTA */}
      {activePlanProposal && completedProofId && (
        <Modal visible={reviewVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setReviewVisible(false)} />
            <View style={styles.reviewWrap}>
              <MealVerifiedReviewCTA
                partnerId={activePlanProposal.partnerId}
                partnerName={activePlanProposal.partnerName ?? 'Partner'}
                proofId={completedProofId}
                visible={reviewVisible}
                onDismiss={() => setReviewVisible(false)}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topRail: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.sm, paddingVertical: SPACE.sm, borderBottomWidth: 1 },
  backBtn: { width: 40, alignItems: 'center' },
  modeTitle: { fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center' },
  filterBar: { maxHeight: 44 },
  filterContent: { paddingHorizontal: SPACE.sm, gap: 6, alignItems: 'center' },
  filterChip: { paddingVertical: 5, paddingHorizontal: SPACE.md, borderRadius: RADIUS.sm, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  filterDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 2 },
  cardArea: { flex: 1, paddingHorizontal: SPACE.sm, paddingVertical: SPACE.sm, justifyContent: 'center' },
  cardTouch: { flex: 1 },
  emptyDeck: { flex: 1, borderRadius: RADIUS.xl, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', padding: SPACE.xl },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: SPACE.base },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: SPACE.sm },
  swipeControls: { flexDirection: 'row', justifyContent: 'center', gap: SPACE.xl, paddingVertical: SPACE.sm },
  swipeBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  skipBtn: {},
  superBtn: {},
  addBtn: {},
  traySection: { paddingHorizontal: SPACE.base, paddingBottom: SPACE.base, paddingTop: SPACE.sm, borderTopWidth: 1 },
  trayScroll: { paddingBottom: SPACE.xs, flexDirection: 'row', gap: SPACE.sm },
  trayChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: SPACE.sm, paddingHorizontal: SPACE.base, borderRadius: 20, borderWidth: 1.5 },
  trayChipText: { fontSize: 13, fontWeight: '700', maxWidth: 120 },
  trayEmpty: { fontSize: 12, paddingVertical: SPACE.sm },
  trayCtas: { flexDirection: 'row', gap: SPACE.sm, marginTop: SPACE.xs },
  compareCta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: SPACE.sm, paddingHorizontal: SPACE.base, borderRadius: RADIUS.sm, borderWidth: 1.5 },
  compareCtaText: { fontSize: 13, fontWeight: '700' },
  fuseCta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.sm, borderRadius: RADIUS.md },
  fuseCtaText: { color: '#000', fontSize: 15, fontWeight: '800' },
  trayHint: { fontSize: 12, paddingVertical: SPACE.xs },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACE.xl },
  recapWrap: { width: '100%' },
  reviewWrap: { width: '100%' },
  fuseModal: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACE.xl },
  fuseModalTitle: { fontSize: 18, fontWeight: '800', marginBottom: SPACE.xs },
  fuseModalSub: { fontSize: 13, marginBottom: SPACE.base },
  fuseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.md, paddingHorizontal: SPACE.base, borderRadius: RADIUS.md, borderWidth: 1.5, marginBottom: SPACE.sm },
  fuseRowContent: { flex: 1 },
  fuseRowLabel: { fontSize: 15, fontWeight: '700' },
  fuseRowSub: { fontSize: 12, marginTop: 2 },
  fuseRowCta: { paddingVertical: SPACE.sm, paddingHorizontal: SPACE.base, borderRadius: RADIUS.sm },
  fuseRowCtaText: { color: '#000', fontSize: 13, fontWeight: '800' },
  fuseClose: { marginTop: SPACE.sm, paddingVertical: SPACE.md, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center' },
  fuseCloseText: { fontSize: 14, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backLink: { fontSize: 15, fontWeight: '700', marginTop: SPACE.base },
});

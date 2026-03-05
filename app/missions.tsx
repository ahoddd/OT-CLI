/**
 * Missions — Premium daily missions: pick a mood, choose a plan, visit partners, scan to verify, earn OT + Sphere XP.
 * Win-win-win: users earn rewards, OrbTap drives engagement, partners get foot traffic. Fully wired to wallet & stats.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import {
  useMissions,
  type GenerateOption,
  type DailyMission,
  isMissionFullyComplete,
  completedStepsCount,
} from '../context/MissionsContext';
import { useWalletContext } from '../context/WalletContext';
import { useOrbinomics } from '../context/OrbinomicsContext';
import { LEDGER_REASON } from '../constants/OrbinomicsPolicy';
import { useSocial } from '../hooks/useSocial';
import { useBadges } from '../hooks/useBadges';
import { OTPointsBadge } from '../components/OTPointsBadge';
import { OTPointsBalanceLink } from '../components/OTPointsBalanceLink';
import { usePartners } from '../context/PartnersContext';
import { COLORS } from '../constants/Colors';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import { alert as alertDialog } from '../utils/alert';
import { promptAndOpenDirections } from '../utils/openDirections';
import { MoreSection } from '../components/MoreSection';
import { KitEmptyState } from '../components/ui';
import { SPACE } from '../constants/DesignTokens';
import { MOOD_PRESETS, type MoodId } from '../constants/MissionsMoods';
import { useI18n } from '../context/I18nContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MOOD_ITEM_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12 * 3) / 4;

const GENERATE_OPTION_KEYS: { option: GenerateOption; labelKey: string; sublabelKey: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { option: 'all', labelKey: 'missions.allDay', sublabelKey: 'missions.allDaySub', icon: 'sunny' },
  { option: 'lunch_dinner', labelKey: 'missions.lunchDinner', sublabelKey: 'missions.lunchDinnerSub', icon: 'restaurant' },
  { option: 'dinner', labelKey: 'missions.dinner', sublabelKey: 'missions.dinnerSub', icon: 'moon' },
];

const MOOD_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  leaf: 'leaf',
  restaurant: 'restaurant',
  'trail-sign': 'navigate',
  flash: 'flash',
  moon: 'moon',
  compass: 'compass',
  cafe: 'cafe',
  people: 'people',
};

function formatDeadline(deadlineAt: number): string {
  const now = Date.now();
  if (deadlineAt <= now) return 'Expired';
  const hours = Math.floor((deadlineAt - now) / (60 * 60 * 1000));
  const mins = Math.floor(((deadlineAt - now) % (60 * 60 * 1000)) / (60 * 1000));
  if (hours >= 24) {
    const d = new Date(deadlineAt);
    return `Due ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function deadlineShort(deadlineAt: number): string {
  const d = new Date(deadlineAt);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const MEAL_SLOT_COLORS: Record<DailyMission['mealSlot'], string> = { breakfast: '#f59e0b', lunch: '#3b82f6', dinner: '#8b5cf6' };

function MealSlotBadge({ slot }: { slot: DailyMission['mealSlot'] }) {
  const { t } = useI18n();
  const labelKey = slot === 'breakfast' ? 'missions.breakfast' : slot === 'lunch' ? 'missions.lunch' : 'missions.dinner';
  const color = MEAL_SLOT_COLORS[slot];
  return (
    <View style={[styles.mealPill, { backgroundColor: color + '28', borderColor: color }]}>
      <Text style={[styles.mealPillText, { color }]}>{t(labelKey)}</Text>
    </View>
  );
}

export default function MissionsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const {
    todayMissions,
    selectedMood,
    setSelectedMood,
    generateMissions,
    completeMission,
    completeStep,
    totalRewardPoints,
    completedRewardPoints,
    totalMissionsCompletedCount,
    dailyFullCompletionBonusPoints,
    loading: missionsLoading,
  } = useMissions();
  const { balance, addTransaction, createVerifiedAction, verifiedActions } = useWalletContext();
  const { applyFeeRate } = useOrbinomics();
  const { circles, addSphereXp } = useSocial();
  const { earnBadge } = useBadges();
  const { getPartner } = usePartners();
  const { isPremium } = useEffectiveTier();
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ points: number; sphereXp: number } | null>(null);
  const [bonusToast, setBonusToast] = useState(false);
  const bonusAwardedDateRef = useRef<string | null>(null);
  const [weeklyCompleted, setWeeklyCompleted] = useState(0);
  const WEEKLY_KEY = 'ORBTAP_MISSIONS_WEEKLY_V1';
  const WEEKLY_TARGET = 5;
  const WEEKLY_BONUS = 500;

  const getWeekStart = useCallback(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const copy = new Date(d);
    copy.setDate(diff);
    return copy.toDateString();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(WEEKLY_KEY).then((raw) => {
      if (raw) {
        try {
          const { week, count } = JSON.parse(raw);
          if (week === getWeekStart()) setWeeklyCompleted(count);
          else setWeeklyCompleted(0);
        } catch {
          setWeeklyCompleted(0);
        }
      }
    });
  }, [getWeekStart]);

  const incrementWeeklyCompleted = useCallback(() => {
    setWeeklyCompleted((prev) => {
      const next = prev + 1;
      const weekStart = getWeekStart();
      AsyncStorage.setItem(WEEKLY_KEY, JSON.stringify({ week: weekStart, count: next })).catch(() => {});
      if (next === WEEKLY_TARGET) {
        addTransaction({
          type: 'earn',
          amount: WEEKLY_BONUS,
          reason: LEDGER_REASON.EMIT_QUEST_COMPLETE,
          ref: { actionId: 'missions_weekly_bonus' },
        });
      }
      return next;
    });
  }, [getWeekStart, addTransaction]);

  /** Award daily full-completion bonus once per day when all missions are complete. */
  const missionsCompleteCount = todayMissions.filter((m) => isMissionFullyComplete(m)).length;
  const allComplete = todayMissions.length > 0 && missionsCompleteCount === todayMissions.length;
  useEffect(() => {
    if (!allComplete || dailyFullCompletionBonusPoints <= 0) return;
    const todayKey = new Date().toDateString();
    if (bonusAwardedDateRef.current === todayKey) return;
    bonusAwardedDateRef.current = todayKey;
    AsyncStorage.getItem('ORBTAP_MISSIONS_BONUS_DATE').then((stored) => {
      if (stored === todayKey) return;
      addTransaction({
        type: 'earn',
        amount: dailyFullCompletionBonusPoints,
        reason: LEDGER_REASON.EMIT_QUEST_COMPLETE,
        ref: { actionId: 'missions_daily_bonus' },
      });
      AsyncStorage.setItem('ORBTAP_MISSIONS_BONUS_DATE', todayKey).catch(() => {});
      setBonusToast(true);
    });
  }, [allComplete, dailyFullCompletionBonusPoints, addTransaction]);

  useEffect(() => {
    if (!bonusToast) return;
    const t = setTimeout(() => setBonusToast(false), 2500);
    return () => clearTimeout(t);
  }, [bonusToast]);

  /** User can only mark a step/mission done if they have proof (verified action) for that partner. */
  const hasProofForPartner = useCallback(
    (partnerId: string) => verifiedActions.some((a) => a.partnerId === partnerId),
    [verifiedActions]
  );

  const awardMissionComplete = useCallback(
    async (mission: DailyMission) => {
      const { net } = applyFeeRate(mission.rewardPoints);
      const firstPartnerId = mission.steps?.[0]?.partnerId ?? mission.partnerId;
      if (firstPartnerId) {
        await createVerifiedAction(firstPartnerId, `mission_${mission.id}`, net, {
          ledgerReason: LEDGER_REASON.EMIT_QUEST_COMPLETE,
          actionType: 'MISSION_COMPLETE',
        });
      } else {
        await addTransaction({
          type: 'earn',
          amount: mission.rewardPoints,
          reason: LEDGER_REASON.EMIT_QUEST_COMPLETE,
          ref: undefined,
        });
      }
      circles.forEach((c) => addSphereXp(c.id, 'mission_complete'));
      const newCount = totalMissionsCompletedCount + 1;
      if (newCount >= 1) earnBadge('missions_1');
      if (newCount >= 1) earnBadge('first_mission');
      if (newCount >= 5) earnBadge('missions_5');
      if (newCount >= 10) earnBadge('missions_10');
      if (newCount >= 25) earnBadge('missions_25');
      if (newCount >= 50) earnBadge('missions_50');
      if (newCount >= 100) earnBadge('missions_100');
    },
    [applyFeeRate, createVerifiedAction, addTransaction, circles, addSphereXp, totalMissionsCompletedCount, earnBadge]
  );

  const handleGenerate = (option: GenerateOption) => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    generateMissions(option, selectedMood);
  };

  const handleCompleteMission = async (mission: DailyMission) => {
    if (isMissionFullyComplete(mission)) return;
    const firstPartnerId = mission.steps?.[0]?.partnerId ?? mission.partnerId;
    if (firstPartnerId && !hasProofForPartner(firstPartnerId)) {
      const partner = getPartner(firstPartnerId);
      const name = partner?.name ?? 'this partner';
      alertDialog(
        'Verify at location',
        `Scan the QR at ${name} first to prove you visited. Then you can complete this mission.`,
        [{ text: 'OK' }, { text: 'Open Scanner', onPress: () => router.push('/(tabs)/scan' as any) }]
      );
      return;
    }
    safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompletingId(mission.id);
    completeMission(mission.id);
    await awardMissionComplete(mission);
    incrementWeeklyCompleted();
    setCelebration({ points: mission.rewardPoints, sphereXp: mission.rewardSphereXp });
    setTimeout(() => setCelebration(null), 2200);
    if (firstPartnerId) {
      const { recordPartnerMissionComplete } = await import('../services/partnerAnalytics');
      recordPartnerMissionComplete(firstPartnerId, { leadSource: 'orbtap_mission', missionId: mission.id }).catch(() => {});
    }
    setCompletingId(null);
  };

  const handleCompleteStep = (mission: DailyMission, stepIndex: number) => {
    const step = mission.steps?.[stepIndex];
    if (!step || step.completed) return;
    if (!step.partnerId) {
      alertDialog('Verify at location', 'This step requires a partner check-in. Use Scan to verify at the location.', [{ text: 'OK' }]);
      return;
    }
    if (!hasProofForPartner(step.partnerId)) {
      const partner = getPartner(step.partnerId);
      const name = partner?.name ?? 'this partner';
      alertDialog(
        'Verify at location',
        `Scan the QR at ${name} first to prove you visited. Then you can mark this step done.`,
        [{ text: 'OK' }, { text: 'Open Scanner', onPress: () => router.push('/(tabs)/scan' as any) }]
      );
      return;
    }
    safeHaptics.selectionAsync();
    setCompletingId(mission.id);
    completeStep(mission.id, stepIndex, async () => {
      await awardMissionComplete(mission);
      setCelebration({ points: mission.rewardPoints, sphereXp: mission.rewardSphereXp });
      setTimeout(() => setCelebration(null), 2200);
      setCompletingId(null);
    });
    if (!mission.steps?.every((s, i) => i === stepIndex || s.completed)) setCompletingId(null);
  };

  /** When user has proof for a step/mission, auto-complete it (no "Mark done" / "Complete" buttons). */
  useFocusEffect(
    useCallback(() => {
      if (missionsLoading) return;
      todayMissions.forEach((mission) => {
        if (isMissionFullyComplete(mission)) return;
        const firstId = mission.steps?.[0]?.partnerId ?? mission.partnerId;
        if (mission.steps && mission.steps.length > 0) {
          mission.steps.forEach((step, idx) => {
            if (!step.completed && step.partnerId && hasProofForPartner(step.partnerId)) {
              completeStep(mission.id, idx, () => awardMissionComplete(mission));
            }
          });
        } else if (firstId && hasProofForPartner(firstId)) {
          completeMission(mission.id);
          awardMissionComplete(mission);
        }
      });
    }, [todayMissions, missionsLoading, verifiedActions, hasProofForPartner, completeStep, completeMission, awardMissionComplete])
  );

  const firstDeadline = todayMissions.length > 0 ? Math.min(...todayMissions.map((m) => m.deadlineAt)) : 0;
  const progressPct = totalRewardPoints > 0 ? completedRewardPoints / totalRewardPoints : 0;
  const progressSv = useSharedValue(progressPct);
  useEffect(() => {
    progressSv.value = withTiming(progressPct, { duration: 450 });
  }, [progressPct]);
  const PROGRESS_BAR_WIDTH = Math.max(0, SCREEN_WIDTH - 32 - 36);
  const animatedFillStyle = useAnimatedStyle(() => ({
    width: interpolate(progressSv.value, [0, 1], [0, PROGRESS_BAR_WIDTH]),
  }));

  if (missionsLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadWrap}>
          <ActivityIndicator size="small" color={themeGold} />
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading missions…</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      title="Missions"
      headerLeft={
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      }
      headerRight={<OTPointsBalanceLink amount={balance} size={22} label="pts" compact textColor={colors.text} />}
    >
        {celebration != null && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[styles.celebrationToast, { backgroundColor: (COLORS.success ?? '#4ade80') + 'ee' }]}
          >
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.celebrationText}>
              Mission complete! +{celebration.points} OT · +{celebration.sphereXp} Sphere XP
            </Text>
          </Animated.View>
        )}
        {bonusToast && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[styles.celebrationToast, { backgroundColor: themeGold + 'ee', top: celebration != null ? 72 : 0 }]}
          >
            <Ionicons name="trophy" size={28} color="#fff" />
            <Text style={styles.celebrationText}>
              All missions done! +{dailyFullCompletionBonusPoints} OT daily bonus
            </Text>
          </Animated.View>
        )}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ─── HERO: Bold gradient, headline, today's progress when missions exist ─── */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.heroOuter}>
            <LinearGradient
              colors={isDark ? ['#1e1b4b', '#0f172a', '#020617'] : [colors.primary + '22', (themeGold) + '14', colors.background]}
              style={styles.heroGradient}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.heroInner}>
              <View style={[styles.heroIconRing, { borderColor: themeGold + '50' }]}>
                <View style={[styles.heroIconBg, { backgroundColor: colors.primary + '35' }]}>
                  <Ionicons name="flag" size={36} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.heroHeadline, { color: colors.text }]}>Missions</Text>
              <Text style={[styles.heroTagline, { color: colors.textSecondary }]}>
                Visit partners, scan to verify, earn OT + Sphere XP. Daily caps keep rewards fair for everyone.
              </Text>
              {todayMissions.length > 0 ? (
                <>
                  <View style={[styles.heroProgressCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }]}>
                    <View style={styles.heroProgressRow}>
                      <View style={styles.heroProgressStat}>
                        <Text style={[styles.heroProgressNum, { color: colors.text }]}>{missionsCompleteCount}</Text>
                        <Text style={[styles.heroProgressDenom, { color: colors.textSecondary }]}>/ {todayMissions.length} missions</Text>
                      </View>
                      <View style={[styles.heroProgressDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.heroProgressStat}>
                        <Text style={[styles.heroProgressNum, { color: themeGold }]}>{completedRewardPoints}</Text>
                        <Text style={[styles.heroProgressDenom, { color: colors.textSecondary }]}>/ {totalRewardPoints} OT</Text>
                      </View>
                      {allComplete && dailyFullCompletionBonusPoints > 0 && (
                        <>
                          <View style={[styles.heroProgressDivider, { backgroundColor: colors.border }]} />
                          <View style={styles.heroProgressStat}>
                            <Ionicons name="trophy" size={18} color={COLORS.success ?? '#4ade80'} />
                            <Text style={[styles.heroProgressBonus, { color: COLORS.success ?? '#4ade80' }]}>+{dailyFullCompletionBonusPoints} bonus</Text>
                          </View>
                        </>
                      )}
                    </View>
                    {firstDeadline > 0 && (
                      <View style={[styles.heroDeadlineRow, { borderTopColor: colors.border }]}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.heroDeadlineText, { color: colors.textSecondary }]}>Due by {deadlineShort(firstDeadline)} today</Text>
                      </View>
                    )}
                  </View>
                </>
              ) : todayMissions.length === 0 ? (
                <View style={[styles.heroDeadlinePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="flash-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.heroDeadlineText, { color: colors.textSecondary }]}>Choose a plan below to get started</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* ─── MOOD: "How are you feeling?" horizontal scroll ─── */}
          <Animated.View entering={FadeInDown.delay(60).duration(380)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>How are you feeling?</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Missions will match your mood</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodScrollContent} style={styles.moodScroll}>
              {MOOD_PRESETS.map((mood) => {
                const iconName = MOOD_ICONS[mood.icon] ?? 'ellipse';
                const isSelected = selectedMood === mood.id;
                return (
                  <TouchableOpacity
                    key={mood.id}
                    style={[
                      styles.moodChip,
                      {
                        backgroundColor: isSelected ? mood.color + '28' : colors.surface,
                        borderColor: isSelected ? mood.color : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => { safeHaptics.selectionAsync(); setSelectedMood(isSelected ? null : (mood.id as MoodId)); }}
                    activeOpacity={0.85}
                    accessibilityLabel={`Mood: ${mood.label}`}
                    accessibilityRole="button"
                  >
                    <View style={[styles.moodChipIcon, { backgroundColor: mood.color + '25' }]}>
                      <Ionicons name={iconName as any} size={22} color={mood.color} />
                    </View>
                    <Text style={[styles.moodChipLabel, { color: isSelected ? mood.color : colors.text }]} numberOfLines={1}>{mood.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* ─── PLAN: "Get your missions" — 3 premium cards ─── */}
          <Animated.View entering={FadeInDown.delay(100).duration(380)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Get your missions</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Pick one to generate today's plan</Text>
            <View style={styles.planGrid}>
              {GENERATE_OPTION_KEYS.map(({ option, labelKey, sublabelKey, icon }) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleGenerate(option)}
                  activeOpacity={0.88}
                  accessibilityLabel={`${t('missions.generate')}: ${t(labelKey)}`}
                  accessibilityRole="button"
                >
                  <LinearGradient colors={[(themeGold) + '28', (themeGold) + '08']} style={styles.planCardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <View style={[styles.planCardIconWrap, { backgroundColor: (themeGold) + '25' }]}>
                    <Ionicons name={icon} size={28} color={themeGold} />
                  </View>
                  <Text style={[styles.planCardTitle, { color: colors.text }]}>{t(labelKey)}</Text>
                  <Text style={[styles.planCardSub, { color: colors.textSecondary }]}>{t(sublabelKey)}</Text>
                  <View style={[styles.planCardCta, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.planCardCtaText, { color: colors.primary }]}>{t('missions.generate')}</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {todayMissions.length > 0 && (
            <>
              {/* Today's progress bar — animated fill */}
              <Animated.View entering={FadeInDown.delay(140).duration(380)} style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.progressCardHeader}>
                  <Text style={[styles.progressCardTitle, { color: colors.text }]}>Today's progress</Text>
                  <Text style={[styles.progressCardSub, { color: colors.textSecondary }]}>
                    {completedRewardPoints} / {totalRewardPoints} OT
                    {dailyFullCompletionBonusPoints > 0 && ` · +${dailyFullCompletionBonusPoints} when you finish all`}
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.surfaceHighlight }]}>
                  <Animated.View style={[styles.progressTrackFill, { backgroundColor: COLORS.success ?? '#4ade80' }, animatedFillStyle]} />
                </View>
              </Animated.View>

              {/* Bonus Round banner — motivate final mission completion */}
              {missionsCompleteCount >= 2 && todayMissions.length === 3 && !allComplete && (
                <Animated.View entering={FadeInDown.duration(350)} style={[styles.bonusRoundBanner, { borderColor: '#4ADE80' + '55' }]}>
                  <LinearGradient colors={['#4ADE8022', '#4ADE8008']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <Ionicons name="flash" size={20} color="#4ADE80" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bonusRoundTitle, { color: '#4ADE80' }]}>Bonus Round! 🎯</Text>
                    <Text style={[styles.bonusRoundSub, { color: colors.textSecondary }]}>2/3 done — complete the last mission for a bonus</Text>
                  </View>
                </Animated.View>
              )}

              {/* Mission cards — premium elevated design */}
              {todayMissions.map((mission, missionIdx) => {
                const stepsDone = completedStepsCount(mission);
                const totalSteps = mission.steps?.length ?? 1;
                const fullyComplete = isMissionFullyComplete(mission);
                const firstPartnerId = mission.steps?.[0]?.partnerId ?? mission.partnerId;
                const firstPartner = firstPartnerId ? getPartner(firstPartnerId) : null;
                const slotColor = MEAL_SLOT_COLORS[mission.mealSlot];
                return (
                  <Animated.View
                    key={mission.id}
                    entering={FadeInDown.delay(180 + missionIdx * 70).duration(400)}
                    style={[styles.missionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={[styles.missionCardAccent, { backgroundColor: slotColor }]} />
                    <View style={styles.missionCardBody}>
                      <View style={styles.missionCardHeader}>
                        <MealSlotBadge slot={mission.mealSlot} />
                        {(() => {
                          const now = Date.now();
                          const hoursLeft = (mission.deadlineAt - now) / (60 * 60 * 1000);
                          const isUrgent = !fullyComplete && new Date().getHours() >= 18 && hoursLeft < 4 && hoursLeft > 0;
                          return (
                            <View style={[styles.missionDeadline, { backgroundColor: isUrgent ? '#ef444422' : colors.surfaceHighlight, borderColor: isUrgent ? '#ef4444' : 'transparent', borderWidth: isUrgent ? 1 : 0 }]}>
                              {isUrgent && <Ionicons name="warning" size={12} color="#ef4444" />}
                              <Text style={[styles.missionDeadlineText, { color: isUrgent ? '#ef4444' : colors.textSecondary, fontWeight: isUrgent ? '800' : '600' }]}>{formatDeadline(mission.deadlineAt)}</Text>
                            </View>
                          );
                        })()}
                        {fullyComplete && (
                          <View style={[styles.missionDonePill, { backgroundColor: (COLORS.success ?? '#4ade80') + '22', borderColor: COLORS.success ?? '#4ade80' }]}>
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.success ?? '#4ade80'} />
                            <Text style={[styles.missionDoneText, { color: COLORS.success ?? '#4ade80' }]}>Done</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.missionTitle, { color: colors.text }]}>{mission.title}</Text>
                      <Text style={[styles.missionDesc, { color: colors.textSecondary }]}>{mission.description}</Text>

                      {mission.steps && mission.steps.length > 0 && (
                        <View style={styles.stepsBlock}>
                          <View style={styles.stepsHeaderRow}>
                            <View style={[styles.stepsProgressPill, { backgroundColor: slotColor + '28' }]}>
                              <Text style={[styles.stepsProgressText, { color: slotColor }]}>{stepsDone}/{totalSteps} steps</Text>
                            </View>
                          </View>
                          {mission.steps.map((step, idx) => {
                            const partner = step.partnerId ? getPartner(step.partnerId) : null;
                            const partnerName = partner?.name ?? step.label;
                            return (
                              <View key={step.stepId} style={[styles.stepItem, { borderBottomColor: colors.border }]}>
                                <View style={[styles.stepIconWrap, { backgroundColor: step.completed ? (COLORS.success ?? '#4ade80') + '22' : colors.surfaceHighlight }]}>
                                  <Ionicons name={step.completed ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={step.completed ? COLORS.success ?? '#4ade80' : colors.textSecondary} />
                                </View>
                                <View style={styles.stepBody}>
                                  <Text style={[styles.stepLabel, { color: step.completed ? colors.textSecondary : colors.text }]} numberOfLines={2}>
                                    {step.completed ? partnerName : `Check in at ${partnerName}`}
                                  </Text>
                                  {!step.completed && !fullyComplete && (
                                    <View style={styles.stepActions}>
                                      {partner?.location && (
                                        <TouchableOpacity style={[styles.stepBtn, { backgroundColor: colors.primary }]} onPress={() => { safeHaptics.selectionAsync(); promptAndOpenDirections(partner.location!.lat, partner.location!.lng); }} accessibilityLabel="Directions" accessibilityRole="button">
                                          <Ionicons name="navigate" size={14} color="#fff" />
                                          <Text style={styles.stepBtnText}>Directions</Text>
                                        </TouchableOpacity>
                                      )}
                                      <TouchableOpacity style={[styles.stepBtn, { backgroundColor: colors.primary }]} onPress={() => { safeHaptics.selectionAsync(); router.push({ pathname: '/(tabs)', params: { focusMissions: '1' } } as any); }} accessibilityLabel="View on map" accessibilityRole="button">
                                        <Ionicons name="map" size={14} color="#fff" />
                                        <Text style={styles.stepBtnText}>Map</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity style={[styles.stepBtnPrimary, { backgroundColor: slotColor }]} onPress={() => { safeHaptics.selectionAsync(); router.push('/(tabs)/scan' as any); }} accessibilityLabel="Scan at purchase to complete" accessibilityRole="button">
                                        <Text style={styles.stepBtnPrimaryText}>Scan at purchase</Text>
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}

                      <View style={[styles.missionFooter, { borderTopColor: colors.border }]}>
                        <View style={styles.rewardsRow}>
                          <OTPointsBadge amount={mission.rewardPoints} size={22} label="ot" compact textColor={colors.text} />
                          <Text style={[styles.sphereXpText, { color: colors.textSecondary }]}>+{mission.rewardSphereXp} Sphere XP</Text>
                        </View>
                        {!fullyComplete && (!mission.steps || mission.steps.length === 0) && (
                          <TouchableOpacity style={[styles.scanCta, { backgroundColor: colors.primary }]} onPress={() => { safeHaptics.selectionAsync(); router.push('/(tabs)/scan' as any); }}>
                            <Ionicons name="qr-code" size={18} color="#fff" />
                            <Text style={styles.scanCtaText}>Scan at purchase</Text>
                          </TouchableOpacity>
                        )}
                        {!fullyComplete && mission.steps && mission.steps.length > 0 && stepsDone < totalSteps && firstPartner && (
                          <TouchableOpacity style={[styles.mapCtaSecondary, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]} onPress={() => { safeHaptics.selectionAsync(); router.push({ pathname: '/(tabs)', params: { focusMissions: '1' } } as any); }}>
                            <Ionicons name="map" size={18} color={colors.primary} />
                            <Text style={[styles.mapCtaSecondaryText, { color: colors.text }]}>View on map</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
              {/* Weekly challenge card */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.weeklyChallengeCard, { backgroundColor: themeGold + '18', borderColor: themeGold + '55' }]}>
                <View style={styles.weeklyChallengeHeader}>
                  <Ionicons name="trophy" size={22} color={themeGold} />
                  <Text style={[styles.weeklyChallengeTitle, { color: colors.text }]}>Weekly challenge</Text>
                </View>
                <Text style={[styles.weeklyChallengeBody, { color: colors.textSecondary }]}>
                  Complete {WEEKLY_TARGET} missions this week → earn {WEEKLY_BONUS} bonus OT
                </Text>
                <View style={[styles.weeklyChallengeProgress, { backgroundColor: colors.surfaceHighlight }]}>
                  <View style={[styles.weeklyChallengeFill, { backgroundColor: themeGold, width: `${Math.min(100, (weeklyCompleted / WEEKLY_TARGET) * 100)}%` as any }]} />
                </View>
                <Text style={[styles.weeklyChallengeCount, { color: themeGold }]}>{weeklyCompleted}/{WEEKLY_TARGET} done</Text>
              </Animated.View>
            </>
          )}

          {todayMissions.length === 0 && (
            <>
              <Animated.View entering={FadeIn.delay(180).duration(400)}>
                <KitEmptyState
                  title="Your missions await"
                  subtitle="Choose a mood (optional), then tap a plan. You'll get 1–3 missions — one check-in each. Complete all 3 for the OT bonus. Scan at the partner when you're there to complete."
                />
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.weeklyChallengeCard, { backgroundColor: themeGold + '18', borderColor: themeGold + '55' }]}>
                <View style={styles.weeklyChallengeHeader}>
                  <Ionicons name="trophy" size={22} color={themeGold} />
                  <Text style={[styles.weeklyChallengeTitle, { color: colors.text }]}>Weekly challenge</Text>
                </View>
                <Text style={[styles.weeklyChallengeBody, { color: colors.textSecondary }]}>
                  Complete {WEEKLY_TARGET} missions this week → earn {WEEKLY_BONUS} bonus OT
                </Text>
                <View style={[styles.weeklyChallengeProgress, { backgroundColor: colors.surfaceHighlight }]}>
                  <View style={[styles.weeklyChallengeFill, { backgroundColor: themeGold, width: `${Math.min(100, (weeklyCompleted / WEEKLY_TARGET) * 100)}%` as any }]} />
                </View>
                <Text style={[styles.weeklyChallengeCount, { color: themeGold }]}>{weeklyCompleted}/{WEEKLY_TARGET} done</Text>
              </Animated.View>
            </>
          )}

          <Animated.View entering={FadeIn.delay(220).duration(380)}>
            <TouchableOpacity style={[styles.linkCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push('/(tabs)/spheres')}>
              <View style={[styles.linkCardIcon, { backgroundColor: colors.primary + '22' }]}>
                <Ionicons name="people" size={24} color={colors.primary} />
              </View>
              <View style={styles.linkCardText}>
                <Text style={[styles.linkCardTitle, { color: colors.text }]}>
                  {circles.length > 0 ? `Spheres earn XP on every mission` : 'Spheres earn XP with you'}
                </Text>
                <Text style={[styles.linkCardSub, { color: colors.textSecondary }]}>
                  {circles.length > 0 ? 'Level up together' : 'Create a Sphere to earn with friends'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push('/(tabs)/wallet')}>
              <View style={[styles.linkCardIcon, { backgroundColor: (themeGold) + '22' }]}>
                <Ionicons name="wallet" size={24} color={themeGold} />
              </View>
              <View style={styles.linkCardText}>
                <Text style={[styles.linkCardTitle, { color: colors.text }]}>Spend OT on perks</Text>
                <Text style={[styles.linkCardSub, { color: colors.textSecondary }]}>Redeem at partners</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {!isPremium && (
              <TouchableOpacity style={[styles.linkCard, styles.linkCardPremium, { backgroundColor: themeGold + '14', borderColor: themeGold }]} onPress={() => router.push('/premium' as any)}>
                <View style={[styles.linkCardIcon, { backgroundColor: themeGold + '30' }]}>
                  <Ionicons name="diamond" size={24} color={themeGold} />
                </View>
                <View style={styles.linkCardText}>
                  <Text style={[styles.linkCardTitle, { color: colors.text }]}>OrbTap Plans</Text>
                  <Text style={[styles.linkCardSub, { color: colors.textSecondary }]}>See what you're missing</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={themeGold} />
              </TouchableOpacity>
            )}
          </Animated.View>

          <MoreSection
            title="More"
            variant="rows"
            links={[
              { label: 'OrbPulse', route: '/pulse', icon: 'pulse' },
              { label: 'OrbVote', route: '/vote', icon: 'stats-chart' },
              { label: 'Leaderboard', route: '/leaderboard', icon: 'trophy' },
              { label: 'Stats', route: '/stats', icon: 'stats-chart' },
              { label: 'Scan & redeem', route: '/(tabs)/scan', icon: 'qr-code' },
              { label: 'Partners', route: '/partners', icon: 'business' },
            ]}
          />

          <View style={{ height: 48 }} />
        </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  // Hero
  heroOuter: { borderRadius: 24, marginBottom: 28, overflow: 'hidden' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroInner: { paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center' },
  heroIconRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroIconBg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  heroHeadline: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  heroTagline: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 8, marginBottom: 20 },
  heroProgressCard: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 16 },
  heroProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12 },
  heroProgressStat: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  heroProgressNum: { fontSize: 20, fontWeight: '800' },
  heroProgressDenom: { fontSize: 14, fontWeight: '600' },
  heroProgressDivider: { width: 1, height: 18 },
  heroProgressBonus: { fontSize: 13, fontWeight: '700', marginLeft: 4 },
  heroDeadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  heroDeadlineText: { fontSize: 13, fontWeight: '600' },
  heroDeadlinePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  // Sections
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, marginBottom: 14 },
  // Mood
  moodScroll: { marginHorizontal: -16 },
  moodScrollContent: { paddingHorizontal: 16, paddingBottom: 8, gap: 10, flexDirection: 'row' },
  moodChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, marginRight: 10 },
  moodChipIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  moodChipLabel: { fontSize: 14, fontWeight: '700', maxWidth: 90 },
  // Plan
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  planCard: { width: (SCREEN_WIDTH - 16 * 2 - 12 * 2) / 3, borderRadius: 18, borderWidth: 1, padding: 14, minHeight: 160, overflow: 'hidden' },
  planCardGradient: { ...StyleSheet.absoluteFillObject },
  planCardIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  planCardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  planCardSub: { fontSize: 11, fontWeight: '500', marginBottom: 10 },
  planCardCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10 },
  planCardCtaText: { fontSize: 12, fontWeight: '700' },
  // Bonus round banner
  bonusRoundBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16, overflow: 'hidden',
  },
  bonusRoundTitle: { fontSize: 14, fontWeight: '900' },
  bonusRoundSub: { fontSize: 12, marginTop: 2 },
  // Progress
  progressCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 20 },
  progressCardHeader: { marginBottom: 12 },
  progressCardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  progressCardSub: { fontSize: 13, fontWeight: '500' },
  progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressTrackFill: { height: '100%', borderRadius: 5 },
  // Mission card
  missionCard: { borderRadius: 20, borderWidth: 1, marginBottom: 20, overflow: 'hidden', flexDirection: 'row' },
  missionCardAccent: { width: 5 },
  missionCardBody: { flex: 1, padding: 18 },
  missionCardHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  missionDeadline: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  missionDeadlineText: { fontSize: 12, fontWeight: '600' },
  missionDonePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  missionDoneText: { fontSize: 12, fontWeight: '700' },
  missionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  missionDesc: { fontSize: 14, lineHeight: 21, marginBottom: 14 },
  stepsBlock: { marginBottom: 4 },
  stepsHeaderRow: { marginBottom: 10 },
  stepsProgressPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  stepsProgressText: { fontSize: 12, fontWeight: '700' },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  stepIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepBody: { flex: 1, minWidth: 0 },
  stepLabel: { fontSize: 15, fontWeight: '600' },
  stepActions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  stepBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  stepBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepBtnPrimary: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  stepBtnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  missionFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 14, marginTop: 8, borderTopWidth: 1 },
  rewardsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sphereXpText: { fontSize: 13, fontWeight: '600' },
  scanCta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  scanCtaText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  mapCtaSecondary: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  mapCtaSecondaryText: { fontSize: 14, fontWeight: '700' },
  mealPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  mealPillText: { fontSize: 12, fontWeight: '700' },
  // Empty
  emptyCard: { borderRadius: 24, borderWidth: 1, padding: 36, alignItems: 'center', marginBottom: 24 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 23, marginBottom: 8 },
  emptyHint: { fontSize: 13, textAlign: 'center', fontStyle: 'italic' },
  // Link cards
  weeklyChallengeCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  weeklyChallengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  weeklyChallengeTitle: { fontSize: 16, fontWeight: '800' },
  weeklyChallengeBody: { fontSize: 13, marginBottom: 12 },
  weeklyChallengeProgress: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  weeklyChallengeFill: { height: '100%', borderRadius: 4 },
  weeklyChallengeCount: { fontSize: 13, fontWeight: '800' },
  linkCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10, gap: 14 },
  linkCardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  linkCardText: { flex: 1, minWidth: 0 },
  linkCardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  linkCardSub: { fontSize: 13 },
  linkCardPremium: {},
  // Toasts & loading
  celebrationToast: {
    position: 'absolute', top: 0, left: 16, right: 16, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
  celebrationText: { color: '#fff', fontSize: 16, fontWeight: '800', flex: 1 },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { marginTop: 12, fontSize: 14 },
  backBtn: { marginRight: 12, padding: 4 },
});

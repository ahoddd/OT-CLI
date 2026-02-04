import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { useMissions, type GenerateOption, type DailyMission } from '../context/MissionsContext';
import { useWalletContext } from '../context/WalletContext';
import { useOrbinomics } from '../context/OrbinomicsContext';
import { useSocial } from '../hooks/useSocial';
import { useBadges } from '../hooks/useBadges';
import { OTPointsBadge } from '../components/OTPointsBadge';
import { HOLO_COLORS, SHINE_COLORS, HOLO_BORDER_WIDTH } from '../constants/PremiumStyles';
import { MOCK_PERKS, TIER_COLORS } from '../constants/MockData';
import { COLORS } from '../constants/Colors';
import * as Haptics from 'expo-haptics';

const GENERATE_OPTIONS: { option: GenerateOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { option: 'all', label: 'Breakfast + Lunch + Dinner', icon: 'sunny' },
  { option: 'lunch_dinner', label: 'Lunch + Dinner', icon: 'restaurant' },
  { option: 'dinner', label: 'Dinner only', icon: 'moon' },
];

function MealSlotBadge({ slot }: { slot: DailyMission['mealSlot'] }) {
  const labels = { breakfast: 'BREAKFAST', lunch: 'LUNCH', dinner: 'DINNER' };
  const colors = { breakfast: '#f59e0b', lunch: '#3b82f6', dinner: '#8b5cf6' };
  return (
    <View style={[styles.mealPill, { backgroundColor: colors[slot] + '28', borderColor: colors[slot] }]}>
      <Text style={[styles.mealPillText, { color: colors[slot] }]}>{labels[slot]}</Text>
    </View>
  );
}

export default function MissionsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    todayMissions,
    generateMissions,
    completeMission,
    totalRewardPoints,
    completedRewardPoints,
    totalMissionsCompletedCount,
    loading: missionsLoading,
  } = useMissions();
  const { addTransaction, balance } = useWalletContext();
  const { applyFeeRate } = useOrbinomics();
  const { circles, addSphereXp } = useSocial();
  const { earnBadge } = useBadges();
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleGenerate = (option: GenerateOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    generateMissions(option);
  };

  const handleComplete = async (mission: DailyMission) => {
    if (mission.completed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompletingId(mission.id);
    completeMission(mission.id);
    const { net } = applyFeeRate(mission.rewardPoints);
    await addTransaction({
      type: 'earn',
      amount: mission.rewardPoints,
      reason: `Mission: ${mission.title}`,
      ref: mission.partnerId ? { partnerId: mission.partnerId } : undefined,
    });
    circles.forEach((c) => addSphereXp(c.id, 'mission_complete'));
    const newCount = totalMissionsCompletedCount + 1;
    if (newCount >= 1) earnBadge('missions_1');
    if (newCount >= 10) earnBadge('missions_10');
    if (newCount >= 50) earnBadge('missions_50');
    if (newCount >= 100) earnBadge('missions_100');
    setCompletingId(null);
  };

  const samplePerks = MOCK_PERKS.slice(0, 6);

  if (missionsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadWrap}>
            <ActivityIndicator size="large" color={COLORS.neonBlue[0]} />
            <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading missions…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Daily Missions</Text>
          <View style={styles.balanceWrap}>
            <OTPointsBadge amount={balance} size={20} label="pts" compact textColor={COLORS.gold[0]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Generate missions — premium card */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GENERATE TODAY'S MISSIONS</Text>
          <View style={styles.generateCardWrap}>
            <LinearGradient colors={[...HOLO_COLORS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.holoBorder}>
              <View style={[styles.generateCard, { backgroundColor: isDark ? '#0d0d12' : '#14141a' }]}>
                <LinearGradient colors={[...SHINE_COLORS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
                {GENERATE_OPTIONS.map(({ option, label, icon }) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.generateBtn, { borderColor: colors.border }]}
                    onPress={() => handleGenerate(option)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={icon} size={22} color={COLORS.neonBlue[0]} />
                    <Text style={[styles.generateBtnLabel, { color: colors.text }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Today's missions */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TODAY'S MISSIONS</Text>
          {todayMissions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="flag-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No missions yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Tap a option above to generate breakfast, lunch, and/or dinner missions.</Text>
            </View>
          ) : (
            <>
              <View style={[styles.summaryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total OT Points at stake</Text>
                <OTPointsBadge amount={totalRewardPoints} size={24} label="pts" compact textColor={COLORS.gold[0]} />
              </View>
              <View style={[styles.summaryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Earned so far</Text>
                <OTPointsBadge amount={completedRewardPoints} size={24} label="pts" compact textColor={COLORS.success} />
              </View>
              {todayMissions.map((mission) => (
                <View key={mission.id} style={styles.missionCardWrap}>
                  <LinearGradient colors={[...HOLO_COLORS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.holoBorder}>
                    <View style={[styles.missionCard, { backgroundColor: isDark ? '#0d0d12' : '#14141a' }, mission.completed && styles.missionCardDone]}>
                      <LinearGradient colors={[...SHINE_COLORS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
                      <View style={styles.missionHeader}>
                        <MealSlotBadge slot={mission.mealSlot} />
                        {mission.completed ? (
                          <View style={[styles.doneBadge, { backgroundColor: COLORS.success + '30', borderColor: COLORS.success }]}>
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                            <Text style={[styles.doneText, { color: COLORS.success }]}>Done</Text>
                          </View>
                        ) : (
                          <OTPointsBadge amount={mission.rewardPoints} size={18} label="pts" compact textColor={COLORS.gold[0]} />
                        )}
                      </View>
                      <Text style={[styles.missionTitle, { color: colors.text }]}>{mission.title}</Text>
                      <Text style={[styles.missionDesc, { color: colors.textSecondary }]}>{mission.description}</Text>
                      {!mission.completed && (
                        <TouchableOpacity
                          style={[styles.completeBtn, { backgroundColor: COLORS.neonBlue[0] }]}
                          onPress={() => handleComplete(mission)}
                          disabled={completingId === mission.id}
                        >
                          {completingId === mission.id ? (
                            <ActivityIndicator size="small" color="#000" />
                          ) : (
                            <>
                              <Ionicons name="checkmark-done" size={20} color="#000" />
                              <Text style={styles.completeBtnText}>Complete · Earn {applyFeeRate(mission.rewardPoints).net} OT Points</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </>
          )}

          {/* What you can get with OT Points */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>WHAT YOU CAN GET WITH OT POINTS</Text>
          <View style={[styles.rewardsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.rewardsIntro, { color: colors.textSecondary }]}>
              Redeem perks at partner venues. Complete missions to earn more — Orbinomics applies a small fee on earn so points stay valuable.
            </Text>
            {samplePerks.map((perk) => (
              <TouchableOpacity
                key={perk.id}
                style={[styles.rewardRow, { borderTopColor: colors.border }]}
                onPress={() => router.push(`/perk/${perk.id}` as any)}
                activeOpacity={0.8}
              >
                <Text style={[styles.rewardTitle, { color: colors.text }]} numberOfLines={1}>{perk.title}</Text>
                <OTPointsBadge amount={perk.cost} size={16} label="pts" compact textColor={TIER_COLORS[perk.tier]} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.mapCta, { borderColor: colors.border }]}
              onPress={() => router.replace('/(tabs)')}
            >
              <Ionicons name="map" size={20} color={COLORS.neonBlue[0]} />
              <Text style={[styles.mapCtaText, { color: colors.text }]}>View all perks on map</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadText: { fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  balanceWrap: {},
  scroll: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12, marginTop: 8 },
  generateCardWrap: { marginBottom: 8 },
  holoBorder: { padding: HOLO_BORDER_WIDTH, borderRadius: 16 },
  generateCard: {
    borderRadius: 14,
    overflow: 'hidden',
    padding: 14,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  generateBtnLabel: { fontSize: 15, fontWeight: '700', flex: 1 },
  emptyCard: {
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 14, fontWeight: '600' },
  missionCardWrap: { marginBottom: 12 },
  missionCard: {
    borderRadius: 14,
    overflow: 'hidden',
    padding: 18,
  },
  missionCardDone: { opacity: 0.85 },
  missionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  mealPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  mealPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  doneText: { fontSize: 12, fontWeight: '800' },
  missionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 6, letterSpacing: 0.2 },
  missionDesc: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  completeBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  rewardsCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  rewardsIntro: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  rewardTitle: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 12 },
  mapCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  mapCtaText: { fontSize: 15, fontWeight: '800' },
});

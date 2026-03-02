import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { useBadges } from '../hooks/useBadges';
import { useWallet } from '../hooks/useWallet';
import { BadgePill } from '../components/BadgePill';
import { LegacyBadgeDetailModal, RitualBadgeDetailModal } from '../components/BadgeDetailModal';
import { RITUAL_TIER_COLORS } from '../constants/RitualBadges';
import type { RitualBadgeDef } from '../constants/RitualBadges';
import { safeHaptics } from '../utils/safeHaptics';
import type { BadgeDef } from '../constants/Badges';
import { useStreak } from '../hooks/useStreak';
import { useEffectiveTier } from '../hooks/useEffectiveTier';

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'founding', label: 'FOUNDING' },
  { key: 'missions', label: 'MISSIONS' },
  { key: 'reviews', label: 'REVIEWS' },
  { key: 'streak', label: 'STREAKS' },
  { key: 'scans', label: 'CHECK-INS' },
  { key: 'one_time', label: 'MILESTONES' },
  { key: 'partner', label: 'PARTNERS' },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { earnedIds, foundingStats, hasBadge, earnBadge, loading, refresh, ritualEarnedBadges, allBadges, getBadgesByCategory } = useBadges();
  const { verifiedActions, balance } = useWallet();
  const { streak } = useStreak();
  const { tier: effectiveTier } = useEffectiveTier();
  const [refreshing, setRefreshing] = React.useState(false);

  // Award check-in and partner badges when counts are met
  React.useEffect(() => {
    if (!verifiedActions?.length || !earnBadge) return;
    const count = verifiedActions.length;
    const distinctPartners = new Set(verifiedActions.map((a: { partnerId?: string }) => a.partnerId).filter(Boolean)).size;
    if (count >= 1 && !hasBadge('first_scan')) earnBadge('first_scan');
    if (count >= 5 && !hasBadge('scans_5')) earnBadge('scans_5');
    if (count >= 25 && !hasBadge('scans_25')) earnBadge('scans_25');
    if (count >= 100 && !hasBadge('scans_100')) earnBadge('scans_100');
    if (distinctPartners >= 5 && !hasBadge('partners_5')) earnBadge('partners_5');
    if (distinctPartners >= 25 && !hasBadge('partners_25')) earnBadge('partners_25');
  }, [verifiedActions?.length, earnBadge, hasBadge]);
  const [detailBadge, setDetailBadge] = React.useState<BadgeDef | null>(null);
  const [ritualDetailBadge, setRitualDetailBadge] = React.useState<RitualBadgeDef | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const founding500Left = Math.max(0, foundingStats.founding500SpotsLeft);
  const showFoundingUrgency = founding500Left > 0 && founding500Left <= 500;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Achievements</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.neonBlue[0]} />}
        >
          {showFoundingUrgency && (
            <Animated.View entering={FadeInDown.duration(400)} style={[styles.foundingBanner, { borderColor: themeGold + '60' }]}>
              <LinearGradient colors={[themeGold + '30', themeGold + '10', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={styles.foundingBannerRow}>
                <View style={[styles.foundingIconWrap, { backgroundColor: themeGold + '30' }]}>
                  <Ionicons name="diamond" size={28} color={themeGold} />
                </View>
                <View style={styles.foundingBannerBody}>
                  <Text style={[styles.foundingBannerTitle, { color: '#fff' }]}>Founding Member Badge</Text>
                  <Text style={[styles.foundingBannerSub, { color: 'rgba(255,255,255,0.7)' }]}>
                    Only {founding500Left} spots left — claim yours before they're gone.
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.summary}>
            <Text style={[styles.summaryCount, { color: themeGold }]}>{earnedIds.length + ritualEarnedBadges.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>badges earned</Text>
            <Text style={[styles.summaryDetail, { color: colors.textSecondary }]}>
              {earnedIds.length}/{allBadges.length} legacy · {ritualEarnedBadges.length}/40 ritual
            </Text>
          </Animated.View>

          {/* Legacy badges — earned first */}
          {CATEGORIES.map(({ key, label }, catIndex) => {
            const raw = getBadgesByCategory(key as any);
            if (raw.length === 0) return null;
            // Sort: earned first
            const list = [...raw].sort((a, b) => {
              const aE = hasBadge(a.id) ? 1 : 0;
              const bE = hasBadge(b.id) ? 1 : 0;
              return bE - aE;
            });
            const catEarned = list.filter((b) => hasBadge(b.id)).length;
            return (
              <Animated.View key={key} entering={FadeInDown.delay(100 + catIndex * 60).duration(380)} style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{label}</Text>
                  <Text style={[styles.sectionEarned, { color: themeGold }]}>{catEarned}/{list.length}</Text>
                </View>
                <View style={styles.badgeGrid}>
                  {list.map((badge) => {
                    const earned = hasBadge(badge.id);
                    return (
                      <TouchableOpacity
                        key={badge.id}
                        style={[
                          styles.badgeCard,
                          { backgroundColor: colors.surface, borderColor: earned ? themeGold + '55' : colors.border },
                          !earned && styles.badgeCardLocked,
                        ]}
                        onPress={() => { safeHaptics.selectionAsync(); setDetailBadge(badge); }}
                        activeOpacity={0.8}
                      >
                        {earned && (
                          <View style={[styles.earnedChip, { backgroundColor: themeGold + '22', borderColor: themeGold + '55' }]}>
                            <Ionicons name="checkmark-circle" size={10} color={themeGold} />
                            <Text style={[styles.earnedChipText, { color: themeGold }]}>Earned</Text>
                          </View>
                        )}
                        <BadgePill badge={badge} earned={earned} size="large" showName={false} />
                        <Text style={[styles.badgeName, { color: earned ? colors.text : colors.textSecondary }]} numberOfLines={1}>{badge.name}</Text>
                        <Text style={[styles.badgeDesc, { color: colors.textSecondary }]} numberOfLines={2}>{badge.description}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
            );
          })}

          {/* Ritual collectibles */}
          {ritualEarnedBadges.length > 0 && (
            <Animated.View entering={FadeInDown.delay(500).duration(380)} style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RITUAL COLLECTIBLES</Text>
                <Text style={[styles.sectionEarned, { color: themeGold }]}>{ritualEarnedBadges.length} earned</Text>
              </View>
              <Text style={[styles.ritualHint, { color: colors.textSecondary }]}>Tap the orb daily to earn more.</Text>
              <View style={styles.badgeGrid}>
                {ritualEarnedBadges.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: (RITUAL_TIER_COLORS[b.tier] ?? colors.border) + '55' }]}
                    onPress={() => { safeHaptics.selectionAsync(); setRitualDetailBadge(b); }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.earnedChip, { backgroundColor: (RITUAL_TIER_COLORS[b.tier] ?? colors.border) + '22', borderColor: (RITUAL_TIER_COLORS[b.tier] ?? colors.border) + '55' }]}>
                      <Ionicons name="checkmark-circle" size={10} color={RITUAL_TIER_COLORS[b.tier]} />
                      <Text style={[styles.earnedChipText, { color: RITUAL_TIER_COLORS[b.tier] }]}>Earned</Text>
                    </View>
                    <View style={[styles.ritualIconWrap, { backgroundColor: (RITUAL_TIER_COLORS[b.tier] ?? colors.border) + '30' }]}>
                      <Text style={[styles.ritualTierText, { color: RITUAL_TIER_COLORS[b.tier] }]}>{b.tier}</Text>
                    </View>
                    <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>{b.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}
          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
      <LegacyBadgeDetailModal visible={!!detailBadge} badge={detailBadge} onClose={() => setDetailBadge(null)} />
      <RitualBadgeDetailModal visible={!!ritualDetailBadge} badge={ritualDetailBadge} onClose={() => setRitualDetailBadge(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scroll: { padding: 20, paddingTop: 8 },
  foundingBanner: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24, overflow: 'hidden' },
  foundingBannerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  foundingIconWrap: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  foundingBannerBody: { flex: 1 },
  foundingBannerTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  foundingBannerSub: { fontSize: 13, lineHeight: 20 },
  summary: { alignItems: 'center', marginBottom: 28 },
  summaryCount: { fontSize: 52, fontWeight: '900' },
  summaryLabel: { fontSize: 14, marginTop: 4 },
  summaryDetail: { fontSize: 11, marginTop: 6, opacity: 0.7 },
  section: { marginBottom: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  sectionEarned: { fontSize: 11, fontWeight: '800' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '47%', borderRadius: 16, padding: 16, borderWidth: 1, alignItems: 'center' },
  badgeCardLocked: { opacity: 0.5 },
  earnedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 100, borderWidth: 1, marginBottom: 8,
  },
  earnedChipText: { fontSize: 9, fontWeight: '800' },
  badgeName: { fontSize: 13, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  badgeDesc: { fontSize: 11, marginTop: 4, textAlign: 'center', lineHeight: 16 },
  ritualHint: { fontSize: 12, marginBottom: 12 },
  ritualIconWrap: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  ritualTierText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
});

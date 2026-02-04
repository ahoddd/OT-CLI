import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { useBadges } from '../hooks/useBadges';
import { BadgePill } from '../components/BadgePill';
import { BADGES, getBadgesByCategory } from '../constants/Badges';
import * as Haptics from 'expo-haptics';

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'founding', label: 'FOUNDING' },
  { key: 'missions', label: 'MISSIONS' },
  { key: 'reviews', label: 'REVIEWS' },
  { key: 'streak', label: 'STREAKS' },
  { key: 'one_time', label: 'MILESTONES' },
  { key: 'partner', label: 'PARTNERS' },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { earnedIds, foundingStats, hasBadge, loading, refresh } = useBadges();
  const [refreshing, setRefreshing] = React.useState(false);

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
            <View style={[styles.foundingBanner, { backgroundColor: COLORS.gold[0] + '18', borderColor: COLORS.gold[0] + '50' }]}>
              <LinearGradient colors={[COLORS.gold[0] + '25', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={styles.foundingBannerRow}>
                <View style={[styles.foundingIconWrap, { backgroundColor: COLORS.gold[0] + '30' }]}>
                  <Ionicons name="diamond" size={28} color={COLORS.gold[0]} />
                </View>
                <View style={styles.foundingBannerBody}>
                  <Text style={[styles.foundingBannerTitle, { color: colors.text }]}>Founding Member badge</Text>
                  <Text style={[styles.foundingBannerSub, { color: colors.textSecondary }]}>
                    Only {founding500Left} spots left. Share OrbTap so friends can claim theirs before they’re gone.
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.summary}>
            <Text style={[styles.summaryCount, { color: COLORS.neonBlue[0] }]}>{earnedIds.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>of {BADGES.length} badges earned</Text>
          </View>

          {CATEGORIES.map(({ key, label }) => {
            const list = getBadgesByCategory(key as any);
            if (list.length === 0) return null;
            return (
              <View key={key} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{label}</Text>
                <View style={styles.badgeGrid}>
                  {list.map((badge) => (
                    <TouchableOpacity
                      key={badge.id}
                      style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => Haptics.selectionAsync()}
                      activeOpacity={0.8}
                    >
                      <BadgePill badge={badge} earned={hasBadge(badge.id)} size="large" showName={false} />
                      <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>{badge.name}</Text>
                      <Text style={[styles.badgeDesc, { color: colors.textSecondary }]} numberOfLines={2}>{badge.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
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
  summaryCount: { fontSize: 48, fontWeight: '900' },
  summaryLabel: { fontSize: 14, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '47%', borderRadius: 16, padding: 16, borderWidth: 1, alignItems: 'center' },
  badgeName: { fontSize: 13, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  badgeDesc: { fontSize: 11, marginTop: 4, textAlign: 'center', lineHeight: 16 },
});

/**
 * OrbTap Stats — Your impact at a glance.
 * User view: OT Points, verified actions, streak, missions, badges, level.
 * Partner view: Verified visits, redemptions, traffic (when partner mode).
 * Freemium: core stats free; premium teasers (30-day trends, export, compare) without being pushy.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '../hooks/useWallet';
import { useGamification } from '../hooks/useGamification';
import { useStreak } from '../hooks/useStreak';
import { useMissions } from '../context/MissionsContext';
import { useBadges } from '../hooks/useBadges';
import { usePreferences } from '../hooks/usePreferences';
import { useTheme } from '../hooks/useTheme';
import { COLORS } from '../constants/Colors';

const CARD_GAP = 12;

// Mock partner stats (replace with real when backend wired)
const MOCK_PARTNER_STATS = {
  verifiedVisits: 124,
  perkRedemptions: 89,
  avgRating: 4.9,
  revenueEst: 12400,
  weeklyTraffic: [42, 58, 51, 72, 88, 65, 79],
};

export default function StatsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { prefs } = usePreferences();
  const isPartner = prefs.partnerMode ?? false;
  const isPremium = prefs.premiumMember ?? false;

  const { balance, history, verifiedActions } = useWallet();
  const { rank } = useGamification();
  const { streak } = useStreak();
  const missions = useMissions();
  const { earnedIds } = useBadges();

  const totalEarned = history
    .filter((t) => t.type === 'earn')
    .reduce((s, t) => s + t.amount, 0);
  const totalSpent = history
    .filter((t) => t.type === 'spend')
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const verifiedCount = verifiedActions?.length ?? 0;
  const totalMissionsCompleted = missions.totalMissionsCompletedCount ?? 0;
  const badgeCount = earnedIds?.length ?? 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {isPartner ? 'Partner Insights' : 'Your Stats'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isPartner ? (
          <>
            {/* Partner hero */}
            <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <LinearGradient
                colors={[COLORS.gold[0] + '22', COLORS.gold[1] + '11']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroIconWrap}>
                <Ionicons name="business" size={32} color={COLORS.gold[0]} />
              </View>
              <Text style={[styles.heroValue, { color: colors.text }]}>
                {MOCK_PARTNER_STATS.verifiedVisits.toLocaleString()}
              </Text>
              <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Verified Visits</Text>
            </View>

            <View style={styles.statRow}>
              <StatCard
                label="Perk Redemptions"
                value={MOCK_PARTNER_STATS.perkRedemptions.toLocaleString()}
                icon="gift"
                color={COLORS.neonBlue?.[0] ?? '#60a5fa'}
                colors={colors}
              />
              <StatCard
                label="Avg. Rating"
                value={String(MOCK_PARTNER_STATS.avgRating)}
                icon="star"
                color={COLORS.gold[0]}
                colors={colors}
              />
            </View>
            <View style={styles.statRow}>
              <StatCard
                label="Revenue Est."
                value={`$${(MOCK_PARTNER_STATS.revenueEst / 1000).toFixed(1)}k`}
                icon="trending-up"
                color={COLORS.success}
                colors={colors}
              />
              <View style={[styles.chartPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>This Week</Text>
                <View style={styles.barRow}>
                  {MOCK_PARTNER_STATS.weeklyTraffic.map((h, i) => (
                    <View key={i} style={styles.barCol}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: Math.max(12, (h / 100) * 48),
                            backgroundColor: i === 4 ? (COLORS.neonBlue?.[0] ?? '#60a5fa') : colors.border,
                          },
                        ]}
                      />
                      <Text style={[styles.barDay, { color: colors.textSecondary }]}>
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* User hero: OT Points */}
            <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <LinearGradient
                colors={[COLORS.neonBlue?.[0] + '22', COLORS.neonBlue?.[1] + '11']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroIconWrap}>
                <Ionicons name="wallet" size={32} color={COLORS.neonBlue?.[0] ?? '#60a5fa'} />
              </View>
              <Text style={[styles.heroValue, { color: colors.text }]}>{balance.toLocaleString()}</Text>
              <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>OT Points</Text>
              <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                {totalEarned.toLocaleString()} earned · {totalSpent.toLocaleString()} spent
              </Text>
            </View>

            {/* Core stats row */}
            <View style={styles.statRow}>
              <StatCard
                label="Verified Actions"
                value={String(verifiedCount)}
                icon="checkmark-circle"
                color={COLORS.success}
                colors={colors}
              />
              <StatCard
                label="Day Streak"
                value={String(streak.currentStreak)}
                icon="flame"
                color={COLORS.gold[0]}
                colors={colors}
              />
            </View>
            <View style={styles.statRow}>
              <StatCard
                label="Missions Done"
                value={String(totalMissionsCompleted)}
                icon="flag"
                color={COLORS.neonBlue?.[0] ?? '#60a5fa'}
                colors={colors}
              />
              <StatCard
                label="Badges"
                value={String(badgeCount)}
                icon="ribbon"
                color={COLORS.gold[0]}
                colors={colors}
              />
            </View>

            {/* Level progress */}
            <View style={[styles.levelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.levelHeader}>
                <Text style={[styles.levelTitle, { color: colors.text }]}>{rank.title}</Text>
                <Text style={[styles.levelSub, { color: colors.textSecondary }]}>Level {rank.level}</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, rank.progress * 100)}%`,
                      backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                {rank.xpToNextLevel.toLocaleString()} XP to Level {rank.level + 1}
              </Text>
            </View>
          </>
        )}

        {/* Premium teaser — soft, empowering */}
        <View style={[styles.premiumSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.premiumHeader}>
            <Ionicons name="diamond-outline" size={20} color={COLORS.gold[0]} />
            <Text style={[styles.premiumTitle, { color: colors.text }]}>See Your Full Potential</Text>
          </View>
          <Text style={[styles.premiumSub, { color: colors.textSecondary }]}>
            {isPremium
              ? 'You have 30-day trends, city comparisons, exportable reports, and more.'
              : 'Premium members get 30-day trends, city comparisons, and exportable reports. Unlock when you\'re ready.'}
          </Text>
          <View style={styles.premiumRow}>
            <TeaserPill icon="analytics" label="30-Day Trends" colors={colors} />
            <TeaserPill icon="people" label="Compare to City" colors={colors} />
          </View>
          <View style={styles.premiumRow}>
            <TeaserPill icon="document-text" label="Export Report" colors={colors} />
            {isPartner && <TeaserPill icon="funnel" label="Conversion Funnel" colors={colors} />}
          </View>
          <TouchableOpacity
            style={[styles.upgradeCta, { backgroundColor: COLORS.gold[0] + '20', borderColor: COLORS.gold[0] }]}
            onPress={() => router.push(isPremium ? '/compare-accounts' as any : '/premium' as any)}
          >
            <Text style={[styles.upgradeCtaText, { color: COLORS.gold[0] }]}>
              {isPremium ? 'View membership benefits' : 'Explore Premium'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gold[0]} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  colors,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  colors: { surface: string; border: string; text: string; textSecondary: string };
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function TeaserPill({
  icon,
  label,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: { border: string; textSecondary: string };
}) {
  return (
    <View style={[styles.teaserPill, { backgroundColor: colors.border + '30', borderColor: colors.border }]}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
      <Text style={[styles.teaserLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  headerRight: { width: 36 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroValue: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5 },
  heroLabel: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  heroSub: { fontSize: 12, marginTop: 6 },
  statRow: { flexDirection: 'row', gap: CARD_GAP, marginBottom: CARD_GAP },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  chartPreview: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  chartLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 52 },
  barCol: { alignItems: 'center', flex: 1 },
  barFill: { width: 8, borderRadius: 4, minHeight: 4 },
  barDay: { fontSize: 9, marginTop: 4, fontWeight: '600' },
  levelCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  levelTitle: { fontSize: 16, fontWeight: '700' },
  levelSub: { fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 11, fontWeight: '600' },
  premiumSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  premiumHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  premiumTitle: { fontSize: 16, fontWeight: '700' },
  premiumSub: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  premiumRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  teaserPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  teaserLabel: { fontSize: 12, fontWeight: '600' },
  upgradeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
  },
  upgradeCtaText: { fontSize: 14, fontWeight: '700' },
});

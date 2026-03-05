/**
 * OrbTap Stats — Your impact at a glance.
 * User view: OT Points, verified actions, streak, missions, badges, level.
 * Partner view: Verified visits, redemptions, traffic (when partner mode).
 * Freemium: core stats free; premium teasers (30-day trends, export, compare) without being pushy.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useWallet } from '../hooks/useWallet';
import { useXP } from '../hooks/useXP';
import { useStreak } from '../hooks/useStreak';
import { useMissions } from '../context/MissionsContext';
import { useBadges } from '../hooks/useBadges';
import { usePreferences } from '../hooks/usePreferences';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import { useTheme } from '../hooks/useTheme';
import { useFlags } from '../components/FlagContext';
import { COLORS } from '../constants/Colors';
import { SPACE } from '../constants/DesignTokens';
import { ProgressRing } from '../components/ui/ProgressRing';
import { useMyPartner } from '../hooks/useMyPartner';
import { getPartnerAnalyticsSummary, getPartnerAnalyticsDailyHistory, type PartnerAnalyticsSummary } from '../services/partnerAnalytics';
import { useI18n } from '../context/I18nContext';

const CARD_GAP = 12;

export default function StatsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { flags } = useFlags();
  const { prefs } = usePreferences();
  const { isPremium, isPro, isPartner } = useEffectiveTier();

  useEffect(() => {
    if (!flags.isStatsEnabled) router.back();
  }, [flags.isStatsEnabled, router]);

  const { myPartnerId } = useMyPartner();
  const [partnerSummary, setPartnerSummary] = useState<PartnerAnalyticsSummary | null>(null);
  const [partnerWeekly, setPartnerWeekly] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    if (!isPartner || !myPartnerId) return;
    let cancelled = false;
    (async () => {
      try {
        const [summary, daily] = await Promise.all([
          getPartnerAnalyticsSummary(myPartnerId, 30),
          getPartnerAnalyticsDailyHistory(myPartnerId, 7),
        ]);
        if (!cancelled) {
          setPartnerSummary(summary);
          setPartnerWeekly(daily.map((d) => d.total));
        }
      } catch {
        // keep zeros on error
      }
    })();
    return () => { cancelled = true; };
  }, [isPartner, myPartnerId]);

  if (!flags.isStatsEnabled) return null;

  const { balance, history, verifiedActions } = useWallet();
  const rank = useXP();
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
                colors={[themeGold + '22', COLORS.gold[1] + '11']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroIconWrap}>
                <Ionicons name="business" size={32} color={themeGold} />
              </View>
              <Text style={[styles.heroValue, { color: colors.text }]}>
                {(partnerSummary?.views ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Profile Views</Text>
            </View>

            <View style={styles.statRow}>
              <StatCard
                label="Missions Done"
                value={(partnerSummary?.missionsCompleted ?? 0).toLocaleString()}
                icon="flag"
                color={COLORS.neonBlue?.[0] ?? '#60a5fa'}
                colors={colors}
              />
              <StatCard
                label="Followers"
                value={(partnerSummary?.follows ?? 0).toLocaleString()}
                icon="people"
                color={themeGold}
                colors={colors}
              />
            </View>
            <View style={styles.statRow}>
              <StatCard
                label="Reviews"
                value={(partnerSummary?.reviews ?? 0).toLocaleString()}
                icon="star"
                color={COLORS.success}
                colors={colors}
              />
              <View style={[styles.chartPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>This Week</Text>
                <View style={styles.barRow}>
                  {partnerWeekly.map((h, i) => (
                    <View key={i} style={styles.barCol}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: Math.max(12, (h / Math.max(1, ...partnerWeekly)) * 48),
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
            {/* User hero: OT Points — tappable to wallet */}
            <Animated.View entering={FadeInDown.duration(500)}>
              <TouchableOpacity style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push('/(tabs)/wallet' as any)} activeOpacity={0.9} accessibilityLabel="Your OT Points. Tap to open Wallet." accessibilityRole="button">
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
                  {totalEarned.toLocaleString()} earned \u00B7 {totalSpent.toLocaleString()} spent
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Core stats row */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.statRow}>
              <View style={[styles.bentoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ProgressRing progress={verifiedCount > 0 ? Math.min(1, verifiedCount / 20) : 0} size={56} strokeWidth={5} color={COLORS.success} backgroundColor={colors.border} />
                <Text style={[styles.bentoValue, { color: colors.text }]}>{verifiedCount}</Text>
                <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>Verified Actions</Text>
              </View>
              <View style={[styles.bentoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ProgressRing progress={streak.bestStreak > 0 ? Math.min(1, streak.currentStreak / Math.max(1, streak.bestStreak)) : 0} size={56} strokeWidth={5} color={themeGold} backgroundColor={colors.border} />
                <Text style={[styles.bentoValue, { color: colors.text }]}>{streak.currentStreak}</Text>
                <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>Day Streak</Text>
              </View>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.statRow}>
              <StatCard label="Missions Done" value={String(totalMissionsCompleted)} icon="flag" color={COLORS.neonBlue?.[0] ?? '#60a5fa'} colors={colors} />
              <StatCard label="Badges" value={String(badgeCount)} icon="ribbon" color={themeGold} colors={colors} />
            </Animated.View>

            {/* Level progress */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.levelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.levelHeader}>
                <View>
                  <Text style={[styles.levelTitle, { color: colors.text }]}>{rank.title}</Text>
                  <Text style={[styles.levelSub, { color: colors.textSecondary }]}>Level {rank.level} \u00B7 {rank.xp.toLocaleString()} XP</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/leaderboard' as any)} style={[styles.rankBtn, { backgroundColor: COLORS.neonBlue?.[0] + '15' }]}>
                  <Ionicons name="podium" size={16} color={COLORS.neonBlue?.[0] ?? '#60a5fa'} />
                  <Text style={[styles.rankBtnText, { color: COLORS.neonBlue?.[0] ?? '#60a5fa' }]}>Leaderboard</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[styles.progressFill, { width: `${Math.min(100, rank.progress * 100)}%`, backgroundColor: COLORS.neonBlue?.[0] ?? '#60a5fa' }]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                {rank.isMaxLevel ? 'Max level \u2014 you\u2019re an Orb Master!' : `${rank.xpToNextLevel.toLocaleString()} XP to Level ${rank.level + 1}`}
              </Text>
            </Animated.View>

            {/* Quick actions */}
            <Animated.View entering={FadeInDown.delay(260).duration(400)} style={styles.quickActions}>
              <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push('/missions' as any)}>
                <Ionicons name="flag" size={20} color="#FBBF24" />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Missions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push('/achievements' as any)}>
                <Ionicons name="ribbon" size={20} color="#A78BFA" />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Badges</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push('/upgrades' as any)}>
                <Ionicons name="flash" size={20} color="#22C55E" />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Power-ups</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        {/* Premium teaser — soft, empowering */}
        <View style={[styles.premiumSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.premiumHeader}>
            <Ionicons name="diamond-outline" size={20} color={themeGold} />
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
            style={[styles.upgradeCta, { backgroundColor: themeGold + '20', borderColor: themeGold }]}
            onPress={() => router.push(isPremium ? '/compare-accounts' as any : '/premium' as any)}
          >
            <Text style={[styles.upgradeCtaText, { color: themeGold }]}>
              {isPremium ? 'View membership benefits' : 'View OrbTap Plans'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={themeGold} />
          </TouchableOpacity>
          {isPremium && !isPro && (
            <TouchableOpacity
              style={[styles.proTeaseLink, { borderColor: colors.border }]}
              onPress={() => router.push('/premium?tier=pro' as any)}
            >
              <Text style={[styles.proTeaseLinkText, { color: colors.textSecondary }]}>See what Pro members unlock</Text>
              <Ionicons name="star" size={14} color="#a78bfa" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 8, marginBottom: 10 }]}>MORE</Text>
        <View style={[styles.moreLinksCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.moreLinkRow, { borderBottomColor: colors.border }]} onPress={() => router.push('/leaderboard' as any)}>
            <Ionicons name="trophy" size={20} color={colors.text} />
            <Text style={[styles.moreLinkText, { color: colors.text }]}>Leaderboard</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.moreLinkRow, { borderBottomColor: colors.border }]} onPress={() => router.push('/missions' as any)}>
            <Ionicons name="flag" size={20} color={colors.text} />
            <Text style={[styles.moreLinkText, { color: colors.text }]}>Missions</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.moreLinkRow, { borderBottomColor: colors.border }]} onPress={() => router.push('/people' as any)}>
            <Ionicons name="people" size={20} color={colors.text} />
            <Text style={[styles.moreLinkText, { color: colors.text }]}>People</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.moreLinkRow, { borderBottomColor: colors.border }]} onPress={() => router.push('/spheres' as any)}>
            <Ionicons name="people" size={20} color={colors.text} />
            <Text style={[styles.moreLinkText, { color: colors.text }]}>Spheres</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.moreLinkRow, { borderBottomWidth: 0 }]} onPress={() => router.push('/(tabs)/wallet' as any)}>
            <Ionicons name="wallet" size={20} color={colors.text} />
            <Text style={[styles.moreLinkText, { color: colors.text }]}>Wallet</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
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
  sub,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  colors: { surface: string; border: string; text: string; textSecondary: string };
  sub?: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      {sub ? <Text style={[styles.statSub, { color: colors.textSecondary }]}>{sub}</Text> : null}
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
  scrollContent: { padding: SPACE.base, paddingBottom: 120 },
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
  bentoCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: SPACE.base,
    alignItems: 'center',
  },
  bentoValue: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  bentoLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
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
  statSub: { fontSize: 10, fontWeight: '600', marginTop: 2, opacity: 0.7 },
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
  levelSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  rankBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  rankBtnText: { fontSize: 12, fontWeight: '700' },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickActionBtn: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  quickActionText: { fontSize: 12, fontWeight: '700' },
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
  proTeaseLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  proTeaseLinkText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  moreLinksCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  moreLinkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, gap: 12 },
  moreLinkText: { fontSize: 15, fontWeight: '600', flex: 1 },
});

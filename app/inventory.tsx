/**
 * OrbTap Inventory — earned badges, active power-ups, and proof receipts.
 * Pulls live data from useBadges, useWallet, and useStreak.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useBadges } from '../hooks/useBadges';
import { useWallet } from '../hooks/useWallet';
import { useStreak } from '../hooks/useStreak';
import { useEffectiveTier } from '../hooks/useEffectiveTier';
import { LegacyBadgeDetailModal } from '../components/BadgeDetailModal';
import { SPACE, RADIUS } from '../constants/DesignTokens';
import { COLORS } from '../constants/Colors';
import type { BadgeDef } from '../constants/Badges';
import { useI18n } from '../context/I18nContext';

type InventoryTab = 'badges' | 'powerups' | 'receipts';

const POWER_UP_META: Record<string, { label: string; icon: string; description: string; color: string }> = {
  quest_reroll: { label: 'Quest Reroll', icon: 'refresh-circle', description: 'Reroll your daily missions for a fresh set.', color: '#8b5cf6' },
  quest_booster: { label: 'Quest Booster', icon: 'rocket', description: 'Double the OT Points from your next mission.', color: '#f59e0b' },
  streak_shield: { label: 'Streak Shield', icon: 'shield-checkmark', description: 'Protects your streak if you miss a day.', color: '#3b82f6' },
  multiplier_24h: { label: '24h Multiplier', icon: 'flash', description: 'Earn 2× OT Points for the next 24 hours.', color: '#10b981' },
  drop_reserve_fee: { label: 'Drop Reserve', icon: 'pricetag', description: 'Reserve access to an exclusive OrbDrop.', color: '#ef4444' },
  early_access_unlock: { label: 'Early Access', icon: 'key', description: 'Unlock early access to a drop or feature.', color: '#f97316' },
  receipt_cosmetics: { label: 'Receipt Frame', icon: 'color-palette', description: 'Apply a custom frame to your Proof Receipts.', color: '#ec4899' },
  circle_bonus_pool: { label: 'Circle Pool Boost', icon: 'people-circle', description: 'Add a bonus to your sphere\'s shared OT pool.', color: '#6366f1' },
  pulse_alerts_filters: { label: 'Pulse Filters', icon: 'filter', description: 'Unlock advanced filters for OrbPulse alerts.', color: '#14b8a6' },
};

export default function InventoryScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { earnedBadges, loading: badgesLoading } = useBadges();
  const { history, verifiedActions } = useWallet();
  const { streak } = useStreak();
  const { tier } = useEffectiveTier();

  const [tab, setTab] = useState<InventoryTab>('badges');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null);

  // Build power-up inventory from spend history
  const powerUps = useMemo(() => {
    const counts: Record<string, number> = {};
    history
      .filter((t) => t.type === 'spend')
      .forEach((t) => {
        const key = Object.entries({
          quest_reroll: 'quest_reroll',
          quest_booster: 'quest_booster',
          streak_shield: 'streak_shield',
          multiplier_24h: 'multiplier_24h',
          drop_reserve_fee: 'drop_reserve_fee',
          early_access_unlock: 'early_access_unlock',
          receipt_cosmetics: 'receipt_cosmetics',
          circle_bonus_pool: 'circle_bonus_pool',
          pulse_alerts_filters: 'pulse_alerts_filters',
        }).find(([, v]) => t.reason?.toLowerCase().includes(v))?.[0];
        if (key) counts[key] = (counts[key] ?? 0) + 1;
      });
    return Object.entries(POWER_UP_META).map(([key, meta]) => ({
      key,
      ...meta,
      usedCount: counts[key] ?? 0,
    }));
  }, [history]);

  // Proof receipts = verified actions (scans, missions, etc.)
  const receipts = useMemo(() => {
    return [...verifiedActions]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);
  }, [verifiedActions]);

  const tierColor = tier === 'gold' ? themeGold : tier === 'platinum' ? '#a855f7' : colors.textSecondary;
  const tierLabel = tier === 'gold' ? 'Gold' : tier === 'platinum' ? 'Legendary' : 'Silver';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Inventory</Text>
          <View style={[styles.tierPill, { backgroundColor: tierColor + '20', borderColor: tierColor + '50' }]}>
            <Text style={[styles.tierPillText, { color: tierColor }]}>{tierLabel}</Text>
          </View>
        </View>

        {/* Streak hero strip */}
        <View style={[styles.heroStrip, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.heroStat, { borderRightColor: colors.border }]}>
            <Text style={[styles.heroVal, { color: themeGold }]}>{streak.currentStreak}</Text>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Day Streak</Text>
          </View>
          <View style={[styles.heroStat, { borderRightColor: colors.border }]}>
            <Text style={[styles.heroVal, { color: colors.text }]}>{earnedBadges.length}</Text>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Badges</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={[styles.heroVal, { color: colors.text }]}>{verifiedActions.length}</Text>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Scans</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          {([
            { id: 'badges', label: 'Badges', icon: 'ribbon' },
            { id: 'powerups', label: 'Power-Ups', icon: 'flash' },
            { id: 'receipts', label: 'Receipts', icon: 'receipt' },
          ] as const).map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, tab === t.id && { backgroundColor: themeGold + '20', borderColor: themeGold }]}
              onPress={() => setTab(t.id)}
            >
              <Ionicons name={t.icon as any} size={15} color={tab === t.id ? themeGold : colors.textSecondary} />
              <Text style={[styles.tabText, { color: tab === t.id ? themeGold : colors.textSecondary }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* BADGES TAB */}
        {tab === 'badges' && (
          <>
            {badgesLoading ? (
              <View style={styles.centered}>
                <Ionicons name="ribbon-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading badges…</Text>
              </View>
            ) : earnedBadges.length === 0 ? (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyWrap}>
                <View style={[styles.emptyIconCircle, { backgroundColor: themeGold + '18', borderColor: themeGold + '40' }]}>
                  <Ionicons name="ribbon" size={40} color={themeGold} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No badges yet</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Earn badges by scanning at partners, building streaks, completing missions, and more.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: themeGold }]}
                  onPress={() => router.push('/missions' as any)}
                >
                  <Ionicons name="flag" size={16} color="#000" />
                  <Text style={styles.emptyBtnText}>Start a mission</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {earnedBadges.length} badge{earnedBadges.length !== 1 ? 's' : ''} earned
                </Text>
                <View style={styles.badgeGrid}>
                  {earnedBadges.map((badge, idx) => (
                    <Animated.View key={badge.id} entering={FadeInDown.delay(idx * 40).duration(300)}>
                      <TouchableOpacity
                        style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: badge.color + '40', borderBottomColor: badge.color }]}
                        onPress={() => setSelectedBadge(badge)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.badgeIconWrap, { backgroundColor: badge.color + '18' }]}>
                          <Ionicons name={badge.icon as any} size={28} color={badge.color} />
                        </View>
                        <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={2}>
                          {badge.name}
                        </Text>
                        {badge.category === 'founding' && (
                          <View style={[styles.founderTag, { backgroundColor: themeGold + '20' }]}>
                            <Text style={[styles.founderTagText, { color: themeGold }]}>Founder</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* POWER-UPS TAB */}
        {tab === 'powerups' && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Spend OT Points in the Wallet to activate power-ups
            </Text>
            {powerUps.map((pu, idx) => (
              <Animated.View key={pu.key} entering={FadeInDown.delay(idx * 30).duration(300)}>
                <View style={[styles.powerUpRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.powerUpIconWrap, { backgroundColor: pu.color + '18' }]}>
                    <Ionicons name={pu.icon as any} size={22} color={pu.color} />
                  </View>
                  <View style={styles.powerUpContent}>
                    <Text style={[styles.powerUpLabel, { color: colors.text }]}>{pu.label}</Text>
                    <Text style={[styles.powerUpDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {pu.description}
                    </Text>
                  </View>
                  {pu.usedCount > 0 && (
                    <View style={[styles.usedBadge, { backgroundColor: pu.color + '18' }]}>
                      <Text style={[styles.usedBadgeText, { color: pu.color }]}>×{pu.usedCount}</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            ))}
            <TouchableOpacity
              style={[styles.walletBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/wallet' as any)}
            >
              <Ionicons name="wallet" size={18} color={themeGold} />
              <Text style={[styles.walletBtnText, { color: themeGold }]}>Go to Wallet to spend OT Points</Text>
              <Ionicons name="chevron-forward" size={16} color={themeGold} />
            </TouchableOpacity>
          </>
        )}

        {/* RECEIPTS TAB */}
        {tab === 'receipts' && (
          <>
            {receipts.length === 0 ? (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyWrap}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.border, borderColor: colors.border }]}>
                  <Ionicons name="receipt" size={40} color={colors.textSecondary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No receipts yet</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Your verified scan history will appear here as proof of every visit and action.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/(tabs)/scan' as any)}
                >
                  <Ionicons name="qr-code" size={16} color="#fff" />
                  <Text style={[styles.emptyBtnText, { color: '#fff' }]}>Scan a partner</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {receipts.length} verified action{receipts.length !== 1 ? 's' : ''} · proof-backed
                </Text>
                {receipts.map((action, idx) => {
                  const d = new Date(action.createdAt);
                  const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                  return (
                    <Animated.View key={`${action.partnerId}-${action.createdAt}-${idx}`} entering={FadeInDown.delay(idx * 25).duration(300)}>
                      <TouchableOpacity
                        style={[styles.receiptRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => router.push({ pathname: '/scan/success', params: { partner: action.partnerId, points: String(action.pointsAwarded), tier: 'silver', createdAt: String(action.createdAt) } } as any)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.receiptIcon, { backgroundColor: colors.primary + '18' }]}>
                          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                        </View>
                        <View style={styles.receiptContent}>
                          <Text style={[styles.receiptPartner, { color: colors.text }]} numberOfLines={1}>
                            {action.partnerId || 'Verified action'}
                          </Text>
                          <Text style={[styles.receiptMeta, { color: colors.textSecondary }]}>
                            {dateStr} · {timeStr}
                          </Text>
                        </View>
                        <View style={styles.receiptRight}>
                          <Text style={[styles.receiptPoints, { color: themeGold }]}>+{action.pointsAwarded}</Text>
                          <Text style={[styles.receiptOt, { color: colors.textSecondary }]}>OT</Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>

      <LegacyBadgeDetailModal
        visible={selectedBadge != null}
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeTop: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    gap: SPACE.sm,
    minHeight: 56,
  },
  backBtn: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800' },
  tierPill: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  tierPillText: { fontSize: 12, fontWeight: '800' },
  heroStrip: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACE.base,
    borderRightWidth: 1,
  },
  heroVal: { fontSize: 22, fontWeight: '900' },
  heroLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs,
    gap: SPACE.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tabText: { fontSize: 12, fontWeight: '700' },
  scroll: { paddingHorizontal: SPACE.base, paddingTop: SPACE.base, paddingBottom: SPACE.xxl },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: SPACE.sm },
  // Badges
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  badgeCard: {
    width: 100,
    padding: SPACE.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    alignItems: 'center',
    gap: 2,
    ...(Platform.OS !== 'web' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 } : {}),
  },
  badgeIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  badgeName: { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 14 },
  founderTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.xs },
  founderTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  // Power-ups
  powerUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.base,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    marginBottom: SPACE.sm,
  },
  powerUpIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerUpContent: { flex: 1 },
  powerUpLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  powerUpDesc: { fontSize: 12, lineHeight: 16 },
  usedBadge: { paddingHorizontal: SPACE.sm, paddingVertical: 4, borderRadius: RADIUS.xs },
  usedBadgeText: { fontSize: 13, fontWeight: '800' },
  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.base,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    marginTop: SPACE.base,
  },
  walletBtnText: { flex: 1, fontSize: 14, fontWeight: '700' },
  // Receipts
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.base,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    marginBottom: SPACE.sm,
  },
  receiptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptContent: { flex: 1 },
  receiptPartner: { fontSize: 14, fontWeight: '700' },
  receiptMeta: { fontSize: 12, marginTop: 2 },
  receiptRight: { alignItems: 'flex-end' },
  receiptPoints: { fontSize: 16, fontWeight: '900' },
  receiptOt: { fontSize: 11, fontWeight: '600' },
  // Empty states
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: SPACE.xl },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: SPACE.base,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: SPACE.sm },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: SPACE.xl },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.base,
    borderRadius: RADIUS.md,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
});

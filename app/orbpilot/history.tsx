/**
 * OrbPilot™ — Private Visit History: list of past verified visits.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { SPACE, RADIUS } from '../../constants/DesignTokens';
import { pilotUserHistory } from '../../services/orbPilot';
import type { VisitDoc } from '../../constants/OrbPilot';
import { useI18n } from '../../context/I18nContext';

const PILOT_PURPLE = '#7C3AED';
const SUCCESS_GREEN = '#22C55E';

type FilterKey = 'all' | 'today' | 'week';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isThisWeek(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  return diffMs <= 7 * 24 * 60 * 60 * 1000 && diffMs >= 0;
}

function VisitCard({ visit, colors, index }: { visit: VisitDoc; colors: Record<string, string>; index: number }) {
  const dateStr = visit.verifiedISO ? formatDate(visit.verifiedISO) : formatDate(visit.createdAt);
  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(index * 50)}
      style={[styles.card, { backgroundColor: colors.card }]}
    >
      <View style={[styles.cardLeft, { backgroundColor: SUCCESS_GREEN + '18' }]}>
        <Ionicons name="shield-checkmark" size={22} color={SUCCESS_GREEN} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.partnerName, { color: colors.text }]} numberOfLines={1}>
            {(visit as any).partnerName ?? visit.partnerId}
          </Text>
          {visit.isNewCustomer && (
            <View style={[styles.newBadge, { backgroundColor: PILOT_PURPLE + '20' }]}>
              <Text style={[styles.newBadgeText, { color: PILOT_PURPLE }]}>New</Text>
            </View>
          )}
        </View>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateStr}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.pointsText, { color: SUCCESS_GREEN }]}>+{visit.rewardPoints}</Text>
        <Text style={[styles.otLabel, { color: colors.textSecondary }]}>OT</Text>
      </View>
    </Animated.View>
  );
}

export default function OrbPilotHistory() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();

  const [visits, setVisits] = useState<VisitDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await pilotUserHistory(50);
    if (res.success) {
      setVisits(res.visits as VisitDoc[]);
    } else {
      setError(res.message ?? 'Failed to load visit history');
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  const filteredVisits = useMemo(() => {
    if (filter === 'today') return visits.filter((v) => isToday(v.verifiedISO ?? v.createdAt));
    if (filter === 'week') return visits.filter((v) => isThisWeek(v.verifiedISO ?? v.createdAt));
    return visits;
  }, [visits, filter]);

  const totalPoints = useMemo(() => visits.reduce((sum, v) => sum + (v.rewardPoints ?? 0), 0), [visits]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Visit History</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Privacy disclaimer */}
      <View style={[styles.privacyBanner, { backgroundColor: PILOT_PURPLE + '12' }]}>
        <Ionicons name="lock-closed-outline" size={14} color={PILOT_PURPLE} />
        <Text style={[styles.privacyText, { color: PILOT_PURPLE }]}>
          Your visit history is private and never shared
        </Text>
      </View>

      {/* Stats summary (when data loaded) */}
      {visits.length > 0 && (
        <Animated.View entering={FadeInDown.duration(350)} style={[styles.statRow, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{visits.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Visits</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: SUCCESS_GREEN }]}>{totalPoints}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>OT Earned</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: PILOT_PURPLE }]}>
              {visits.filter((v) => v.isNewCustomer).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>New Places</Text>
          </View>
        </Animated.View>
      )}

      {/* Filter row */}
      <View style={styles.filterRow}>
        {FILTERS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterChip,
              { backgroundColor: filter === key ? PILOT_PURPLE : colors.card },
            ]}
            onPress={() => setFilter(key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, { color: filter === key ? '#fff' : colors.textSecondary }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadHistory} tintColor={colors.textSecondary} />
        }
      >
        {loading && visits.length === 0 ? (
          <ActivityIndicator size="large" color={PILOT_PURPLE} style={{ marginTop: 60 }} />
        ) : error ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="wifi-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Error loading history</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: PILOT_PURPLE }]} onPress={loadHistory}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredVisits.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="shield-checkmark-outline" size={56} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {filter !== 'all' ? `No visits ${filter === 'today' ? 'today' : 'this week'}` : 'No verified visits yet'}
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              {filter !== 'all'
                ? 'Try the "All" filter to see your complete history.'
                : 'Claim an offer nearby to earn OT Points on your first verified visit.'}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={[styles.retryBtn, { backgroundColor: PILOT_PURPLE }]}
                onPress={() => router.push('/orbpilot')}
              >
                <Text style={styles.retryBtnText}>Find Nearby Offers</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredVisits.map((visit, i) => (
            <VisitCard key={visit.id} visit={visit} colors={colors} index={i} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.md,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: SPACE.md,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  privacyText: { fontSize: 12, fontWeight: '600' },
  statRow: {
    flexDirection: 'row',
    marginHorizontal: SPACE.md,
    marginBottom: 12,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statDivider: { width: 1 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACE.md,
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: SPACE.md, paddingBottom: 40, gap: 10 },
  card: {
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLeft: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 3 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  partnerName: { fontSize: 15, fontWeight: '700', flex: 1 },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  newBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  dateText: { fontSize: 12 },
  cardRight: { alignItems: 'flex-end', gap: 1 },
  pointsText: { fontSize: 18, fontWeight: '800' },
  otLabel: { fontSize: 10, fontWeight: '700' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

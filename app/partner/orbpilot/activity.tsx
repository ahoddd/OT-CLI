/**
 * OrbPilot™ Activity Log — Partner verification attempt history with filtering.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useFlags } from '../../../components/FlagContext';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { pilotPartnerActivity } from '../../../services/orbPilot';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import { REJECTION_REASON_LABEL } from '../../../constants/OrbPilot';
import type { VerifyOutcome, RejectionReason } from '../../../constants/OrbPilot';
import { useI18n } from '../../../context/I18nContext';

type FilterType = 'all' | VerifyOutcome;

const FILTERS: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'pending', label: 'Pending' },
  { key: 'expired', label: 'Expired' },
];

const OUTCOME_CONFIG: Record<
  VerifyOutcome,
  { label: string; color: string; icon: string; bgColor: string }
> = {
  verified: { label: 'Verified', color: '#22C55E', icon: 'checkmark-circle', bgColor: '#22C55E20' },
  rejected: { label: 'Rejected', color: '#EF4444', icon: 'close-circle', bgColor: '#EF444420' },
  pending: { label: 'Pending', color: '#F59E0B', icon: 'time', bgColor: '#F59E0B20' },
  expired: { label: 'Expired', color: '#6B7280', icon: 'hourglass', bgColor: '#6B728020' },
};

function redactUserId(userId: string): string {
  if (!userId || userId.length < 6) return '———';
  return userId.slice(0, 7) + '…';
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

interface AttemptItem {
  id?: string;
  userId: string;
  outcome: VerifyOutcome;
  rejectionReason?: RejectionReason;
  initiatedISO: string;
  requiresPin?: boolean;
  pinUsed?: boolean;
  rewardPoints?: number;
  isNewCustomer?: boolean;
}

function ActivityRow({
  item,
  colors,
}: {
  item: AttemptItem;
  colors: Record<string, string>;
}) {
  const cfg = OUTCOME_CONFIG[item.outcome] ?? OUTCOME_CONFIG.pending;
  return (
    <View style={[rowStyles.row, { backgroundColor: colors.card }]}>
      {/* Outcome icon */}
      <View style={[rowStyles.outcomeWrap, { backgroundColor: cfg.bgColor }]}>
        <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={rowStyles.topLine}>
          <Text style={[rowStyles.userId, { color: colors.text }]}>
            {redactUserId(item.userId)}
          </Text>
          {item.isNewCustomer && (
            <View style={rowStyles.newBadge}>
              <Text style={rowStyles.newBadgeText}>New</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Text style={[rowStyles.timestamp, { color: colors.textSecondary }]}>
            {formatTimestamp(item.initiatedISO)}
          </Text>
        </View>

        <View style={rowStyles.bottomLine}>
          {/* Outcome chip */}
          <View style={[rowStyles.outcomeChip, { backgroundColor: cfg.bgColor }]}>
            <Text style={[rowStyles.outcomeChipText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          {/* Rejection reason */}
          {item.rejectionReason && (
            <Text style={[rowStyles.rejectionText, { color: '#EF4444' }]}>
              {REJECTION_REASON_LABEL[item.rejectionReason] ?? item.rejectionReason}
            </Text>
          )}

          {/* Reward points */}
          {item.outcome === 'verified' && item.rewardPoints != null && (
            <Text style={[rowStyles.pointsText, { color: '#22C55E' }]}>
              +{item.rewardPoints} pts
            </Text>
          )}

          {/* PIN indicator */}
          {item.pinUsed && (
            <View style={rowStyles.pinChip}>
              <Ionicons name="keypad-outline" size={10} color="#A78BFA" />
              <Text style={rowStyles.pinChipText}>PIN</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', padding: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  outcomeWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  userId: { fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  newBadge: { backgroundColor: '#A78BFA30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full },
  newBadgeText: { color: '#A78BFA', fontSize: 10, fontWeight: '700' },
  timestamp: { fontSize: 11 },
  bottomLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  outcomeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  outcomeChipText: { fontSize: 11, fontWeight: '700' },
  rejectionText: { fontSize: 11, flex: 1 },
  pointsText: { fontSize: 12, fontWeight: '700' },
  pinChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#A78BFA15', paddingHorizontal: 6, paddingVertical: 3, borderRadius: RADIUS.full },
  pinChipText: { color: '#A78BFA', fontSize: 10, fontWeight: '700' },
});

export default function OrbPilotActivity() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isOrbPilotEnabled, isOrbPilotPartnerEnabled } = useFlags();
  const router = useRouter();
  const { myPartnerId } = useMyPartner();

  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async (isRefresh = false) => {
    if (!myPartnerId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await pilotPartnerActivity(myPartnerId, 100);
    if (res.success) {
      setAttempts(res.attempts as AttemptItem[]);
    } else {
      setError(res.message ?? 'Failed to load activity');
    }
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [myPartnerId]);

  useFocusEffect(
    useCallback(() => {
      fetchActivity();
    }, [fetchActivity]),
  );

  if (!isOrbPilotEnabled || !isOrbPilotPartnerEnabled) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>OrbPilot not enabled</Text>
      </SafeAreaView>
    );
  }

  const filtered = filter === 'all'
    ? attempts
    : attempts.filter((a) => a.outcome === filter);

  // Compute counts for filter badges
  const counts: Record<FilterType, number> = {
    all: attempts.length,
    verified: attempts.filter((a) => a.outcome === 'verified').length,
    rejected: attempts.filter((a) => a.outcome === 'rejected').length,
    pending: attempts.filter((a) => a.outcome === 'pending').length,
    expired: attempts.filter((a) => a.outcome === 'expired').length,
  };

  const totalVerified = counts.verified;
  const conversionRate = attempts.length > 0 ? ((totalVerified / attempts.length) * 100).toFixed(0) : '—';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Activity Log</Text>
        <TouchableOpacity
          onPress={() => fetchActivity()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      {!loading && attempts.length > 0 && (
        <View style={[styles.summaryBar, { backgroundColor: colors.card }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#22C55E' }]}>{counts.verified}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Verified</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border ?? '#333' }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{counts.rejected}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Rejected</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border ?? '#333' }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{counts.pending}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border ?? '#333' }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{conversionRate}%</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Conv.</Text>
          </View>
        </View>
      )}

      {/* Filter row */}
      <View style={styles.filterScrollWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: f }) => {
            const active = filter === f.key;
            const cfg = f.key !== 'all' ? OUTCOME_CONFIG[f.key as VerifyOutcome] : null;
            const activeColor = cfg?.color ?? '#7C3AED';
            return (
              <TouchableOpacity
                onPress={() => setFilter(f.key)}
                style={[
                  styles.filterChip,
                  active
                    ? { backgroundColor: activeColor + '20', borderColor: activeColor }
                    : { backgroundColor: colors.card, borderColor: colors.border ?? '#333' },
                ]}
              >
                <Text style={[styles.filterChipText, { color: active ? activeColor : colors.textSecondary }]}>
                  {f.label}
                </Text>
                <View style={[styles.filterCount, { backgroundColor: active ? activeColor + '30' : colors.background }]}>
                  <Text style={[styles.filterCountText, { color: active ? activeColor : colors.textSecondary }]}>
                    {counts[f.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#60A5FA" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: SPACE.base }}>
          <Ionicons name="wifi-outline" size={40} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchActivity()}
            style={[styles.retryBtn, { borderColor: '#60A5FA40' }]}
          >
            <Text style={{ color: '#60A5FA', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item.id ?? String(i)}
          contentContainerStyle={{ padding: SPACE.base, gap: 8, paddingBottom: 40 }}
          renderItem={({ item }) => <ActivityRow item={item} colors={colors} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchActivity(true)}
              tintColor="#60A5FA"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name={
                  filter === 'verified'
                    ? 'checkmark-circle-outline'
                    : filter === 'rejected'
                    ? 'close-circle-outline'
                    : filter === 'pending'
                    ? 'time-outline'
                    : 'list-outline'
                }
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {filter === 'all' ? 'No activity yet' : `No ${filter} attempts`}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                {filter === 'all'
                  ? 'Verification attempts will appear here once your campaign is active.'
                  : `No ${filter} verification attempts found in the selected filter.`}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.base,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  summaryBar: {
    flexDirection: 'row',
    marginHorizontal: SPACE.base,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 4,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600' },
  summaryDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },
  filterScrollWrap: { marginBottom: 8 },
  filterList: { paddingHorizontal: SPACE.base, gap: 8, paddingVertical: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  filterCount: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full, minWidth: 20, alignItems: 'center' },
  filterCountText: { fontSize: 11, fontWeight: '800' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: RADIUS.sm, borderWidth: 1 },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});

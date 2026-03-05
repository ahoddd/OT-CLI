/**
 * OrbPilot™ Admin — Visit Audit Explorer: search and inspect verification attempts.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../context/AuthContext';
import { isAdminEmail } from '../../../constants/Admin';
import { useOrbPilotAdmin } from '../../../hooks/useOrbPilotAdmin';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import type { VerifyOutcome, RejectionReason } from '../../../constants/OrbPilot';
import { REJECTION_REASON_LABEL } from '../../../constants/OrbPilot';
import { useI18n } from '../../../context/I18nContext';

type AuditAttempt = {
  id: string;
  userId: string;
  partnerId: string;
  campaignId: string;
  outcome: VerifyOutcome;
  rejectionReason?: RejectionReason;
  initiatedISO: string;
  pinBruteForceFlagged: boolean;
};

const LIMIT_OPTIONS = [20, 50, 100, 200] as const;
type LimitOption = typeof LIMIT_OPTIONS[number];

const OUTCOME_COLOR: Record<VerifyOutcome, string> = {
  pending: '#FBBF24',
  verified: '#22C55E',
  rejected: '#EF4444',
  expired: '#94A3B8',
};

const OUTCOME_LABEL: Record<VerifyOutcome, string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  expired: 'Expired',
};

export default function OrbPilotAdminAudit() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { audit, loading, fetchAudit } = useOrbPilotAdmin();

  const [userId, setUserId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [limit, setLimit] = useState<LimitOption>(50);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isAdminEmail(user?.email ?? '')) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Admin only</Text>
      </SafeAreaView>
    );
  }

  const handleSearch = async () => {
    setHasSearched(true);
    await fetchAudit({
      userId: userId.trim() || undefined,
      partnerId: partnerId.trim() || undefined,
      campaignId: campaignId.trim() || undefined,
      limit,
    });
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    } catch {
      return iso;
    }
  };

  const attempts = audit as AuditAttempt[];

  const renderAttempt = ({ item }: { item: AuditAttempt }) => {
    const outcomeColor = OUTCOME_COLOR[item.outcome] ?? '#94A3B8';
    const outcomeLabel = OUTCOME_LABEL[item.outcome] ?? item.outcome;
    const shortUserId = item.userId ? `${item.userId.slice(0, 8)}…` : '—';

    return (
      <View style={[styles.attemptCard, { backgroundColor: colors.card }]}>
        {/* Header row */}
        <View style={styles.attemptHeader}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.attemptUser, { color: colors.text }]}>
              User: <Text style={{ fontFamily: 'monospace', fontWeight: '600' }}>{shortUserId}</Text>
            </Text>
            <Text style={[styles.attemptMeta, { color: colors.textSecondary }]} numberOfLines={1}>
              Partner: {item.partnerId || '—'}
            </Text>
            <Text style={[styles.attemptMeta, { color: colors.textSecondary }]} numberOfLines={1}>
              Campaign: {item.campaignId || '—'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={[styles.outcomePill, { backgroundColor: outcomeColor + '25', borderColor: outcomeColor }]}>
              <Text style={[styles.outcomeText, { color: outcomeColor }]}>{outcomeLabel}</Text>
            </View>
            {item.pinBruteForceFlagged && (
              <View style={[styles.flagPill, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}>
                <Ionicons name="warning" size={10} color="#EF4444" />
                <Text style={[styles.flagText, { color: '#EF4444' }]}>Brute Force</Text>
              </View>
            )}
          </View>
        </View>

        {/* Rejection reason */}
        {item.rejectionReason && (
          <View style={[styles.rejectionRow, { backgroundColor: '#EF444412' }]}>
            <Ionicons name="close-circle" size={12} color="#EF4444" />
            <Text style={[styles.rejectionText, { color: '#EF4444' }]}>
              {REJECTION_REASON_LABEL[item.rejectionReason] ?? item.rejectionReason}
            </Text>
          </View>
        )}

        {/* Timestamp */}
        <Text style={[styles.attemptTime, { color: colors.textSecondary }]}>
          Initiated: {formatDateTime(item.initiatedISO)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Visit Audit Explorer</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search form */}
      <View style={[styles.searchCard, { backgroundColor: colors.card }]}>
        <View style={styles.inputRow}>
          <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border ?? '#374151' }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>User ID</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Filter by userId…"
              placeholderTextColor={colors.textSecondary}
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border ?? '#374151' }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Partner ID</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Filter by partnerId…"
              placeholderTextColor={colors.textSecondary}
              value={partnerId}
              onChangeText={setPartnerId}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
        <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border ?? '#374151', marginBottom: SPACE.sm }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Campaign ID</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Filter by campaignId…"
            placeholderTextColor={colors.textSecondary}
            value={campaignId}
            onChangeText={setCampaignId}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Limit picker */}
        <View style={styles.limitRow}>
          <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>Limit:</Text>
          {LIMIT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.limitChip,
                {
                  backgroundColor: limit === opt ? '#0EA5E9' : colors.background,
                  borderColor: limit === opt ? '#0EA5E9' : (colors.border ?? '#374151'),
                },
              ]}
              onPress={() => setLimit(opt)}
            >
              <Text style={[styles.limitChipText, { color: limit === opt ? '#fff' : colors.textSecondary }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.searchBtn, loading && { opacity: 0.6 }]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="search" size={16} color="#fff" />
          )}
          <Text style={styles.searchBtnText}>{loading ? 'Searching…' : 'Search'}</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {!loading && hasSearched && attempts.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try different filters or expand the limit</Text>
        </View>
      )}

      {!loading && attempts.length > 0 && (
        <View style={{ paddingHorizontal: SPACE.md, paddingTop: SPACE.sm }}>
          <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
            {attempts.length} attempt{attempts.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      <FlatList
        data={attempts}
        keyExtractor={(item) => item.id ?? item.initiatedISO}
        renderItem={renderAttempt}
        contentContainerStyle={{ paddingHorizontal: SPACE.md, paddingBottom: SPACE.xxl }}
        ItemSeparatorComponent={() => <View style={{ height: SPACE.sm }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE.md, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  searchCard: { margin: SPACE.md, borderRadius: RADIUS.md, padding: SPACE.md, marginBottom: SPACE.sm },
  inputRow: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.sm },
  inputWrap: { flex: 1, borderRadius: RADIUS.sm, borderWidth: 1, paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs },
  inputLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  input: { fontSize: 13, paddingVertical: 2 },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, marginBottom: SPACE.md },
  limitLabel: { fontSize: 12, fontWeight: '600', marginRight: 4 },
  limitChip: { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1 },
  limitChipText: { fontSize: 12, fontWeight: '600' },
  searchBtn: { backgroundColor: '#0EA5E9', borderRadius: RADIUS.md, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  resultCount: { fontSize: 12, fontWeight: '600', marginBottom: SPACE.sm },
  attemptCard: { borderRadius: RADIUS.md, padding: SPACE.md },
  attemptHeader: { flexDirection: 'row', gap: SPACE.sm, marginBottom: 6 },
  attemptUser: { fontSize: 13, fontWeight: '600' },
  attemptMeta: { fontSize: 12 },
  outcomePill: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  outcomeText: { fontSize: 11, fontWeight: '700' },
  flagPill: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, gap: 3 },
  flagText: { fontSize: 10, fontWeight: '700' },
  rejectionRow: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: RADIUS.xs, paddingHorizontal: SPACE.sm, paddingVertical: 5, marginBottom: 5 },
  rejectionText: { fontSize: 12, fontWeight: '600' },
  attemptTime: { fontSize: 11, marginTop: 2 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingTop: SPACE.xxl },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13 },
});

/**
 * OrbPilot™ Admin — Trust Tier Manager: view and override user trust tiers.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../context/AuthContext';
import { isAdminEmail } from '../../../constants/Admin';
import { useOrbPilotAdmin } from '../../../hooks/useOrbPilotAdmin';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import type { TrustTier, UserTrustDoc } from '../../../constants/OrbPilot';
import { TRUST_TIER_COLOR, TRUST_TIER_LABEL } from '../../../constants/OrbPilot';
import { useI18n } from '../../../context/I18nContext';

const TIER_FILTERS: Array<'all' | TrustTier> = ['all', 'bronze', 'silver', 'gold', 'platinum'];

export default function OrbPilotAdminTrust() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { trustUsers, loading, fetchTrust, overrideTrust } = useOrbPilotAdmin();

  const [activeFilter, setActiveFilter] = useState<'all' | TrustTier>('all');
  const [overrideUserId, setOverrideUserId] = useState('');
  const [overrideTier, setOverrideTier] = useState<TrustTier>('silver');
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);

  useEffect(() => {
    fetchTrust(activeFilter === 'all' ? undefined : activeFilter);
  }, [activeFilter]);

  if (!isAdminEmail(user?.email ?? '')) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Admin only</Text>
      </SafeAreaView>
    );
  }

  const users = trustUsers as UserTrustDoc[];

  // Distribution summary
  const distribution: Record<TrustTier, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  for (const u of users) {
    if (u.tier in distribution) distribution[u.tier]++;
  }

  const handleOverride = async () => {
    if (!overrideUserId.trim()) {
      Alert.alert('Missing', 'Enter a User ID');
      return;
    }
    if (!overrideReason.trim()) {
      Alert.alert('Missing', 'Enter a reason for the override');
      return;
    }
    Alert.alert(
      'Override Trust Tier',
      `Set ${overrideUserId.trim().slice(0, 8)}… to ${TRUST_TIER_LABEL[overrideTier]}?\n\nReason: ${overrideReason.trim()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Override', onPress: async () => {
            setOverriding(true);
            const res = await overrideTrust(overrideUserId.trim(), overrideTier, overrideReason.trim());
            setOverriding(false);
            if (res.success) {
              Alert.alert('Done', 'Trust tier overridden successfully');
              setOverrideUserId('');
              setOverrideReason('');
              fetchTrust(activeFilter === 'all' ? undefined : activeFilter);
            } else {
              Alert.alert('Error', res.message ?? 'Override failed');
            }
          }
        }
      ]
    );
  };

  const renderUser = ({ item }: { item: UserTrustDoc }) => {
    const tierColor = TRUST_TIER_COLOR[item.tier] ?? '#94A3B8';
    const tierLabel = TRUST_TIER_LABEL[item.tier] ?? item.tier;
    const shortId = item.userId ? `${item.userId.slice(0, 8)}…` : '—';

    return (
      <View style={[styles.userCard, { backgroundColor: colors.card }]}>
        <View style={styles.userHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userId, { color: colors.text }]}>
              {shortId}
            </Text>
            {item.adminNote ? (
              <Text style={[styles.adminNote, { color: '#F59E0B' }]} numberOfLines={1}>
                Note: {item.adminNote}
              </Text>
            ) : null}
          </View>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + '25', borderColor: tierColor }]}>
            <Text style={[styles.tierBadgeText, { color: tierColor }]}>{tierLabel}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>{item.vv30d ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>VV 30d</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{item.rejections30d ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rejections</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: item.pinBruteForceFlags > 0 ? '#EF4444' : colors.textSecondary }]}>{item.pinBruteForceFlags ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Brute Flags</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Trust Tier Manager</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE.xxl }}>
          {/* Distribution summary */}
          <View style={[styles.card, { backgroundColor: colors.card, marginHorizontal: SPACE.md, marginBottom: SPACE.md }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Distribution</Text>
            <View style={styles.distRow}>
              {(['bronze', 'silver', 'gold', 'platinum'] as TrustTier[]).map((tier) => {
                const c = TRUST_TIER_COLOR[tier];
                return (
                  <View key={tier} style={styles.distItem}>
                    <Text style={[styles.distValue, { color: c }]}>{distribution[tier]}</Text>
                    <Text style={[styles.distLabel, { color: colors.textSecondary }]}>{TRUST_TIER_LABEL[tier]}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {TIER_FILTERS.map((f) => {
              const isActive = activeFilter === f;
              const chipColor = f === 'all' ? '#7C3AED' : TRUST_TIER_COLOR[f as TrustTier];
              return (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? chipColor : colors.card,
                      borderColor: isActive ? chipColor : (colors.border ?? '#374151'),
                    },
                  ]}
                  onPress={() => setActiveFilter(f)}
                >
                  <Text style={[styles.filterChipText, { color: isActive ? '#fff' : colors.textSecondary }]}>
                    {f === 'all' ? 'All' : TRUST_TIER_LABEL[f as TrustTier]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* User list */}
          {loading ? (
            <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: SPACE.xxl }} />
          ) : users.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No users found</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try a different tier filter</Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: SPACE.md, gap: SPACE.sm }}>
              <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                {users.length} user{users.length !== 1 ? 's' : ''}
              </Text>
              {users.map((u) => renderUser({ item: u }))}
            </View>
          )}

          {/* Override form */}
          <View style={[styles.card, { backgroundColor: colors.card, marginHorizontal: SPACE.md, marginTop: SPACE.lg }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Override User Tier</Text>

            <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border ?? '#374151' }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>User ID</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter full userId…"
                placeholderTextColor={colors.textSecondary}
                value={overrideUserId}
                onChangeText={setOverrideUserId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>New Tier</Text>
            <View style={styles.tierChipsRow}>
              {(['bronze', 'silver', 'gold', 'platinum'] as TrustTier[]).map((tier) => {
                const c = TRUST_TIER_COLOR[tier];
                const isSelected = overrideTier === tier;
                return (
                  <TouchableOpacity
                    key={tier}
                    style={[
                      styles.tierChip,
                      {
                        backgroundColor: isSelected ? c : colors.background,
                        borderColor: isSelected ? c : (colors.border ?? '#374151'),
                      },
                    ]}
                    onPress={() => setOverrideTier(tier)}
                  >
                    <Text style={[styles.tierChipText, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                      {TRUST_TIER_LABEL[tier]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border ?? '#374151', marginTop: SPACE.sm }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Reason (required)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text }]}
                placeholder="Reason for override…"
                placeholderTextColor={colors.textSecondary}
                value={overrideReason}
                onChangeText={setOverrideReason}
                multiline
                numberOfLines={3}
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.overrideBtn, overriding && { opacity: 0.6 }]}
              onPress={handleOverride}
              disabled={overriding}
            >
              {overriding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="shield-checkmark" size={16} color="#fff" />
              )}
              <Text style={styles.overrideBtnText}>{overriding ? 'Applying…' : 'Override Tier'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE.md, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  card: { borderRadius: RADIUS.md, padding: SPACE.md },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: SPACE.sm },
  distRow: { flexDirection: 'row', gap: SPACE.sm },
  distItem: { flex: 1, alignItems: 'center', gap: 2 },
  distValue: { fontSize: 22, fontWeight: '800' },
  distLabel: { fontSize: 11, textAlign: 'center' },
  filterRow: { paddingHorizontal: SPACE.md, gap: SPACE.xs, marginBottom: SPACE.md },
  filterChip: { borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  resultCount: { fontSize: 12, fontWeight: '600', marginBottom: SPACE.xs },
  userCard: { borderRadius: RADIUS.md, padding: SPACE.md, marginBottom: SPACE.sm },
  userHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.sm, marginBottom: SPACE.sm },
  userId: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  adminNote: { fontSize: 11, marginTop: 2 },
  tierBadge: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  tierBadgeText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: SPACE.sm },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingTop: SPACE.xxl, gap: SPACE.sm },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13 },
  inputWrap: { borderRadius: RADIUS.sm, borderWidth: 1, paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs, marginBottom: SPACE.sm },
  inputLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  input: { fontSize: 13, paddingVertical: 2 },
  textArea: { minHeight: 64, textAlignVertical: 'top' },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACE.xs },
  tierChipsRow: { flexDirection: 'row', gap: SPACE.xs, flexWrap: 'wrap', marginBottom: SPACE.sm },
  tierChip: { borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  tierChipText: { fontSize: 13, fontWeight: '600' },
  overrideBtn: { backgroundColor: '#22C55E', borderRadius: RADIUS.md, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: SPACE.xs },
  overrideBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

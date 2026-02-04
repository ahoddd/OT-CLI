/**
 * OrbArena™ — Competition hub.
 * Current contest, categories, Submit / Vote CTAs, integrity snippet.
 * Proof-backed entries; verified human voting.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFlags } from '../../components/FlagContext';
import { useArena } from '../../hooks/useArena';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';
import { getCategoryLabel, type ArenaCategory, ARENA_CATEGORIES } from '../../constants/Arena';

export default function ArenaHubScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { flags } = useFlags();
  const {
    contest,
    entries,
    loading,
    canSubmit,
    canVote,
    getIntegrityStats,
    refresh,
  } = useArena();
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<ArenaCategory | null>(null);

  if (!flags.isOrbArenaEnabled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>OrbArena™</Text>
        </View>
        <View style={styles.offState}>
          <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.offText, { color: colors.text }]}>OrbArena is off</Text>
          <Text style={[styles.offSub, { color: colors.textSecondary }]}>
            Enable in Admin Hub to compete with proof.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const integrity = contest ? getIntegrityStats(contest.id) : null;
  const contestEntries = contest
    ? entries.filter((e) => e.contestId === contest.id && (category == null || e.category === category))
    : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>OrbArena™</Text>
      </View>

      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator size="small" color={COLORS.gold[0]} />
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
          }
        >
          {contest && (
            <>
              <View style={[styles.contestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.contestHeader}>
                  <Ionicons name="trophy" size={24} color={COLORS.gold[0]} />
                  <Text style={[styles.contestTitle, { color: colors.text }]}>
                    OrbProof Challenge — Weekly
                  </Text>
                </View>
                <Text style={[styles.contestStatus, { color: colors.textSecondary }]}>
                  {contest.status === 'LIVE' && 'Entry window open'}
                  {contest.status === 'VOTING' && 'Voting open'}
                  {contest.status === 'CLOSED' && 'Closed'}
                </Text>
                <View style={styles.ctaRow}>
                  {canSubmit && contest.status === 'LIVE' && (
                    <TouchableOpacity
                      style={styles.primaryCta}
                      onPress={() =>
                        router.push({
                          pathname: '/arena/contest/[id]',
                          params: { id: contest.id },
                        } as any)
                      }
                    >
                      <Text style={styles.primaryCtaText}>Submit entry</Text>
                      <Ionicons name="add" size={20} color="#000" />
                    </TouchableOpacity>
                  )}
                  {canVote && contest.status === 'VOTING' && (
                    <TouchableOpacity
                      style={styles.primaryCta}
                      onPress={() =>
                        router.push({
                          pathname: '/arena/contest/[id]',
                          params: { id: contest.id },
                        } as any)
                      }
                    >
                      <Text style={styles.primaryCtaText}>Vote now</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#000" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {flags.isOrbArenaIntegrityPanelEnabled && integrity && (
                <View style={[styles.integrityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.integrityTitle, { color: colors.text }]}>Integrity</Text>
                  <Text style={[styles.integrityStat, { color: colors.textSecondary }]}>
                    {integrity.totalVotes} verified votes • {integrity.cleanVotesPercent}% clean
                  </Text>
                </View>
              )}

              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATEGORIES</Text>
              <View style={styles.categoryRow}>
                {ARENA_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPill,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      category === cat && styles.categoryPillActive,
                    ]}
                    onPress={() => setCategory(category === cat ? null : cat)}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: category === cat ? '#000' : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {getCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ENTRIES</Text>
              {contestEntries.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No entries yet. Submit from a Proof Card when entry window is open.
                  </Text>
                </View>
              ) : (
                contestEntries.slice(0, 20).map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={[styles.entryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() =>
                      router.push({
                        pathname: '/arena/entry/[id]',
                        params: { id: entry.id },
                      } as any)
                    }
                  >
                    <Text style={[styles.entryCaption, { color: colors.text }]} numberOfLines={2}>
                      {entry.caption || 'No caption'}
                    </Text>
                    <Text style={[styles.entryMeta, { color: colors.textSecondary }]}>
                      {getCategoryLabel(entry.category)} • {entry.partnerId}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
          {!contest && (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active contest.</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
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
  offState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  offText: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  offSub: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  loadWrap: { padding: 40, alignItems: 'center' },
  loadText: { marginTop: 8, fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  contestCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  contestHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  contestTitle: { fontSize: 17, fontWeight: '800' },
  contestStatus: { fontSize: 13, marginBottom: 16 },
  ctaRow: { flexDirection: 'row', gap: 10 },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.gold[0],
  },
  primaryCtaText: { fontSize: 15, fontWeight: '700', color: '#000' },
  integrityCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  integrityTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  integrityStat: { fontSize: 13 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillActive: { backgroundColor: COLORS.gold[0], borderColor: COLORS.gold[0] },
  categoryPillText: { fontSize: 12, fontWeight: '600' },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  entryCaption: { flex: 1, fontSize: 14, fontWeight: '600' },
  entryMeta: { fontSize: 11, marginRight: 8 },
  empty: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});

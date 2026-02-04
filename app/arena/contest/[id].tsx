/**
 * OrbArena™ — Contest detail: entries list by category, vote / submit entry entry point.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useArena } from '../../../hooks/useArena';
import { useTheme } from '../../../hooks/useTheme';
import { getCategoryLabel, type ArenaCategory, ARENA_CATEGORIES } from '../../../constants/Arena';
import { COLORS } from '../../../constants/Colors';

export default function ArenaContestScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { contest, entries, canSubmit, canVote, getIntegrityStats } = useArena();
  const contestEntries = id ? entries.filter((e) => e.contestId === id) : [];
  const integrity = id ? getIntegrityStats(id) : null;

  const currentContest = contest?.id === id ? contest : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {currentContest ? 'Weekly Challenge' : 'Contest'}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {currentContest && (
          <>
            <Text style={[styles.status, { color: colors.textSecondary }]}>
              {currentContest.status === 'LIVE' && 'Entry window open — submit your proof'}
              {currentContest.status === 'VOTING' && 'Voting open — vote for your favorite'}
              {currentContest.status === 'CLOSED' && 'Contest closed'}
            </Text>
            {integrity && (
              <Text style={[styles.integrity, { color: colors.textSecondary }]}>
                {integrity.totalVotes} verified votes • {integrity.cleanVotesPercent}% clean
              </Text>
            )}
            {ARENA_CATEGORIES.map((cat) => {
              const catEntries = contestEntries.filter((e) => e.category === cat);
              if (catEntries.length === 0) return null;
              return (
                <View key={cat} style={styles.categoryBlock}>
                  <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
                    {getCategoryLabel(cat)}
                  </Text>
                  {catEntries.map((entry) => (
                    <TouchableOpacity
                      key={entry.id}
                      style={[styles.entryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() =>
                        router.push({ pathname: '/arena/entry/[id]', params: { id: entry.id } } as any)
                      }
                    >
                      <Text style={[styles.entryCaption, { color: colors.text }]} numberOfLines={2}>
                        {entry.caption || 'No caption'}
                      </Text>
                      <Text style={[styles.entryMeta, { color: colors.textSecondary }]}>
                        {entry.partnerId}
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
            {contestEntries.length === 0 && (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No entries in this contest yet.
                </Text>
                {canSubmit && currentContest.status === 'LIVE' && (
                  <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                    Add an entry from your Proof Card (Enter OrbArena).
                  </Text>
                )}
              </View>
            )}
          </>
        )}
        {!currentContest && (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Contest not found.</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  status: { fontSize: 14, marginBottom: 8 },
  integrity: { fontSize: 12, marginBottom: 20 },
  categoryBlock: { marginBottom: 20 },
  categoryLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
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
  empty: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  emptyHint: { fontSize: 13, marginTop: 8, textAlign: 'center' },
});

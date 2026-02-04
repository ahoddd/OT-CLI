/**
 * OrbArena™ — Entry detail: proof snippet, vote button, share.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useArena } from '../../../hooks/useArena';
import { useTheme } from '../../../hooks/useTheme';
import { getCategoryLabel } from '../../../constants/Arena';
import { COLORS } from '../../../constants/Colors';
import { ARENA_ENTRIES_KEY } from '../../../constants/Arena';
import { ORBTAP_APP_LINK } from '../../../constants/AppLinks';

export default function ArenaEntryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { canVote, vote, getVoteForEntry, contest } = useArena();
  const [entries, setEntries] = React.useState<Array<{ id: string; contestId: string; caption: string; category: string; partnerId: string; verifiedActionId: string }>>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ARENA_ENTRIES_KEY);
        const list = raw ? JSON.parse(raw) : [];
        setEntries(Array.isArray(list) ? list : []);
      } catch {
        setEntries([]);
      }
    })();
  }, [id]);

  const entry = useMemo(() => entries.find((e) => e.id === id), [entries, id]);
  const currentContest = contest?.id === entry?.contestId ? contest : null;
  const hasVoted = entry && currentContest ? getVoteForEntry(currentContest.id, entry.id) != null : false;

  const handleVote = async () => {
    if (!entry || !currentContest || !canVote || hasVoted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nonce = `vote_${currentContest.id}_${entry.id}_${Date.now()}`;
    await vote({ contestId: currentContest.id, entryId: entry.id, clientNonce: nonce });
    router.back();
  };

  const handleShare = async () => {
    if (!entry) return;
    const message = `Vote for this OrbArena entry: "${(entry.caption || '').slice(0, 60)}…" — ${ORBTAP_APP_LINK}/arena/entry/${entry.id}`;
    try {
      await Share.share({ message, title: 'OrbArena Entry' });
    } catch {}
  };

  if (!entry) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Entry</Text>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Entry not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Entry</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.proofSnippet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark" size={20} color="#4ade80" />
          <Text style={[styles.proofLabel, { color: colors.text }]}>Proof-backed</Text>
          <Text style={[styles.proofMeta, { color: colors.textSecondary }]}>
            {entry.partnerId} • {getCategoryLabel(entry.category as any)}
          </Text>
        </View>
        <Text style={[styles.caption, { color: colors.text }]}>{entry.caption || 'No caption'}</Text>
        <Text style={[styles.integrityNote, { color: colors.textSecondary }]}>
          Votes are proof-weighted for fairness.
        </Text>
        <View style={styles.actions}>
          {canVote && currentContest?.status === 'VOTING' && (
            <TouchableOpacity
              style={[styles.voteBtn, hasVoted && styles.voteBtnDisabled]}
              onPress={handleVote}
              disabled={hasVoted}
            >
              <Ionicons name={hasVoted ? 'checkmark-circle' : 'checkmark-circle-outline'} size={22} color={hasVoted ? COLORS.success : '#000'} />
              <Text style={[styles.voteBtnText, hasVoted && { color: COLORS.success }]}>
                {hasVoted ? 'Voted' : 'Vote'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.shareBtn, { borderColor: colors.border }]} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.text} />
            <Text style={[styles.shareBtnText, { color: colors.text }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  content: { padding: 16 },
  proofSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  proofLabel: { fontSize: 14, fontWeight: '700', flex: 1 },
  proofMeta: { fontSize: 12 },
  caption: { fontSize: 16, lineHeight: 24, marginBottom: 16 },
  integrityNote: { fontSize: 12, marginBottom: 24 },
  actions: { flexDirection: 'row', gap: 12 },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: COLORS.gold[0],
  },
  voteBtnDisabled: { backgroundColor: 'rgba(74, 222, 128, 0.2)' },
  voteBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  shareBtnText: { fontSize: 15, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 14 },
});

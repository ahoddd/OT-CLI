/**
 * Partner — List my OrbVote polls. Delete only within 8 hours of creation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../context/AuthContext';
import { COLORS } from '../../../constants/Colors';
import * as pollsService from '../../../services/polls';
import type { Poll } from '../../../constants/Polls';
import { safeHaptics } from '../../../utils/safeHaptics';
import { alert as alertDialog, showErrorAlert } from '../../../utils/alert';
import { useI18n } from '../../../context/I18nContext';

const PARTNER_DELETE_WINDOW_HOURS = 8;

export default function PartnerPollsScreen({ embedInTabs }: { embedInTabs?: boolean } = {}) {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPolls = useCallback(async () => {
    setLoading(true);
    const list = await pollsService.getPolls();
    const mine = list.filter((p) => p.partnerId === user?.uid);
    setPolls(mine);
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  const canDelete = (poll: Poll) => pollsService.canDeletePoll(poll, user?.uid ?? undefined, false);

  const handleDelete = (poll: Poll) => {
    if (!canDelete(poll)) return;
    safeHaptics.selectionAsync();
    alertDialog(
      'Delete poll',
      `"${poll.question.slice(0, 50)}${poll.question.length > 50 ? '…' : ''}" — You can only delete within ${PARTNER_DELETE_WINDOW_HOURS} hours of creation.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(poll.id);
            const result = await pollsService.deletePoll(poll.id);
            setDeletingId(null);
            if (result.success) {
              setPolls((prev) => prev.filter((p) => p.id !== poll.id));
            } else {
              showErrorAlert('Request didn’t complete', result.error ?? 'We couldn’t delete the poll. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (ms: number | undefined) => {
    if (ms == null) return '—';
    const d = new Date(ms);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDeleteHint = (poll: Poll) => {
    if (canDelete(poll)) return `Delete (within ${PARTNER_DELETE_WINDOW_HOURS}h)`;
    if (poll.createdAt != null) {
      const elapsed = Date.now() - poll.createdAt;
      const hoursLeft = Math.max(0, PARTNER_DELETE_WINDOW_HOURS - elapsed / (60 * 60 * 1000));
      if (hoursLeft <= 0) return 'Delete window passed';
    }
    return 'Cannot delete';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!embedInTabs && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        {embedInTabs && <View style={styles.backBtn} />}
        <Text style={[styles.title, { color: colors.text }]}>My polls</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/partner/polls/create' as any)}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Polls you created. You can delete within {PARTNER_DELETE_WINDOW_HOURS} hours of creation.
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textSecondary} style={styles.loader} />
        ) : polls.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="ellipse-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No polls yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Create a poll to get customer votes on OrbVote.</Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/partner/polls/create' as any)}
            >
              <Text style={styles.primaryBtnText}>Create poll</Text>
            </TouchableOpacity>
          </View>
        ) : (
          polls.map((poll) => {
            const deletable = canDelete(poll);
            return (
              <View key={poll.id} style={[styles.pollRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.pollRowBody}>
                  <Text style={[styles.pollQuestion, { color: colors.text }]} numberOfLines={2}>{poll.question}</Text>
                  <Text style={[styles.pollMeta, { color: colors.textSecondary }]}>
                    {poll.totalVotes} votes · Created {formatDate(poll.createdAt)}
                  </Text>
                  <Text style={[styles.deleteHint, { color: colors.textSecondary }]}>{getDeleteHint(poll)}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.deleteBtn,
                    { backgroundColor: deletable ? COLORS.danger + '22' : colors.background },
                  ]}
                  onPress={() => handleDelete(poll)}
                  disabled={!deletable || deletingId === poll.id}
                >
                  {deletingId === poll.id ? (
                    <ActivityIndicator size="small" color={COLORS.danger} />
                  ) : (
                    <Ionicons name="trash-outline" size={22} color={deletable ? COLORS.danger : colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { padding: 8, marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  createBtn: { padding: 4 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  hint: { fontSize: 13, marginBottom: 16 },
  loader: { marginVertical: 16 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  primaryBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  pollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  pollRowBody: { flex: 1, minWidth: 0 },
  pollQuestion: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  pollMeta: { fontSize: 12, marginBottom: 2 },
  deleteHint: { fontSize: 11 },
  deleteBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
});

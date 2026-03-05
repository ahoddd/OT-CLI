/**
 * Admin — OrbVote poll management. Create polls (unlimited); delete any poll anytime.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { SPACE, RADIUS } from '../../../constants/DesignTokens';
import { KitCard } from '../../../components/ui/KitCard';
import { KitButton } from '../../../components/ui/KitButton';
import { COLORS } from '../../../constants/Colors';
import * as pollsService from '../../../services/polls';
import type { Poll } from '../../../constants/Polls';
import { safeHaptics } from '../../../utils/safeHaptics';
import { alert as alertDialog, showErrorAlert } from '../../../utils/alert';
import { useI18n } from '../../../context/I18nContext';

export default function AdminPollsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPolls = useCallback(async () => {
    setLoading(true);
    const list = await pollsService.getPolls();
    setPolls(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  const handleDelete = (poll: Poll) => {
    safeHaptics.selectionAsync();
    alertDialog(
      'Delete poll',
      `"${poll.question.slice(0, 50)}${poll.question.length > 50 ? '…' : ''}" — This cannot be undone.`,
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>OrbVote — Admin</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <KitCard variant="solid" style={{ marginBottom: SPACE.base, alignItems: 'center' }}>
          <Ionicons name="ellipse-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Create a poll</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Admin can create unlimited polls. They appear in OrbVote for users to vote.</Text>
          <KitButton
            title="Create poll"
            onPress={() => router.push('/admin/polls/create' as any)}
            style={{ marginTop: SPACE.sm }}
          />
        </KitCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>All polls — delete anytime</Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textSecondary} style={styles.loader} />
        ) : polls.length === 0 ? (
          <KitCard variant="solid">
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No polls yet. Create one above.</Text>
          </KitCard>
        ) : (
          polls.map((poll) => (
            <KitCard key={poll.id} variant="solid" style={styles.pollRow}>
            <View style={[styles.pollRowInner, { borderColor: colors.border }]}>
              <View style={styles.pollRowBody}>
                <Text style={[styles.pollQuestion, { color: colors.text }]} numberOfLines={2}>{poll.question}</Text>
                <Text style={[styles.pollMeta, { color: colors.textSecondary }]}>
                  {poll.partnerName} · {poll.totalVotes} votes · {formatDate(poll.createdAt)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: COLORS.danger + '22' }]}
                onPress={() => handleDelete(poll)}
                disabled={deletingId === poll.id}
              >
                {deletingId === poll.id ? (
                  <ActivityIndicator size="small" color={COLORS.danger} />
                ) : (
                  <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
                )}
              </TouchableOpacity>
            </View>
            </KitCard>
          ))
        )}

        <TouchableOpacity
          style={[styles.linkRow, { borderTopColor: colors.border }]}
          onPress={() => router.push('/vote' as any)}
        >
          <Text style={[styles.linkText, { color: colors.text }]}>View OrbVote (user experience)</Text>
          <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.base, paddingVertical: SPACE.md, borderBottomWidth: 1 },
  backBtn: { padding: SPACE.sm, marginRight: SPACE.md },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  headerRight: { width: SPACE.xxxl },
  scroll: { flex: 1 },
  content: { padding: SPACE.base, paddingBottom: SPACE.xxl },
  cardTitle: { fontSize: 18, fontWeight: '700', marginTop: SPACE.md, marginBottom: SPACE.sm },
  cardSub: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: SPACE.lg },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginTop: SPACE.xl, marginBottom: SPACE.md },
  loader: { marginVertical: SPACE.base },
  emptyText: { fontSize: 14 },
  pollRow: { marginBottom: SPACE.sm },
  pollRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACE.md,
  },
  pollRowBody: { flex: 1, minWidth: 0 },
  pollQuestion: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  pollMeta: { fontSize: 12 },
  deleteBtn: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginLeft: SPACE.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACE.xl, paddingTop: SPACE.base, borderTopWidth: 1 },
  linkText: { fontSize: 15, fontWeight: '600' },
});

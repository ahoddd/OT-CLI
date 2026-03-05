/**
 * OrbVote™ — Premium polls. Strategic design to drive traffic.
 * Integrates with wallet (earn OT), partners, and Pulse.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/Colors';
import { useTheme } from '../../hooks/useTheme';
import { usePolls } from '../../hooks/usePolls';
import { useWallet } from '../../hooks/useWallet';
import { useAuth } from '../../context/AuthContext';
import { OTPointsBalanceLink } from '../../components/OTPointsBalanceLink';
import { isAdminEmail } from '../../constants/Admin';
import * as pollsService from '../../services/polls';
import { useFlags } from '../../components/FlagContext';
import { PollCard } from '../../components/PollCard';
import { safeHaptics } from '../../utils/safeHaptics';
import { showErrorAlert } from '../../utils/alert';

const POLL_VOTE_REWARD = 5;

export default function OrbVoteScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold?.[0];
  const { flags } = useFlags();
  const { balance } = useWallet();
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  const { polls, loading, refresh, submitVote, getVotedOption, fromFirestore } = usePolls();

  const handleAdminDeletePoll = async (pollId: string) => {
    const result = await pollsService.deletePoll(pollId);
    if (result.success) refresh();
    else showErrorAlert('Request didn’t complete', result.error ?? 'We couldn’t delete the poll. Please try again.');
  };

  React.useEffect(() => {
    if (!flags.isOrbVoteEnabled) router.back();
  }, [flags.isOrbVoteEnabled, router]);
  if (!flags.isOrbVoteEnabled) return null;

  // Refetch polls when screen is focused (e.g. after creating a poll) so new polls appear
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const sponsored = [...polls.filter((p) => p.type === 'sponsored')].sort((a, b) => b.totalVotes - a.totalVotes);
  const featured = [...polls.filter((p) => p.type === 'featured')].sort((a, b) => b.totalVotes - a.totalVotes);
  const standard = [...polls.filter((p) => p.type === 'standard')].sort((a, b) => b.totalVotes - a.totalVotes);

  const votedCount = polls.filter((p) => getVotedOption(p.id) != null).length;
  const unvotedCount = polls.length - votedCount;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>OrbVote™</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {polls.length} poll{polls.length !== 1 ? 's' : ''} · Vote to earn {POLL_VOTE_REWARD} OT each
            </Text>
            <Text style={[styles.headerTagline, { color: colors.textSecondary }]}>Vote with OT. Shape what's next for local.</Text>
          </View>
          <View style={styles.headerRight}>
            <OTPointsBalanceLink amount={balance} size={20} label="pts" compact textColor={colors.text} />
            {isAdmin && (
              <TouchableOpacity
                onPress={() => { safeHaptics.selectionAsync(); router.push('/admin/polls/create' as any); }}
                style={styles.createBtn}
              >
                <Ionicons name="add" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.text} />}
      >
        {/* Hero — compelling, drives action */}
        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LinearGradient
            colors={[(COLORS.neonBlue?.[0] ?? '#60a5fa') + '30', themeGold + '10', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.heroTop}>
            <View style={[styles.heroIconWrap, { backgroundColor: COLORS.neonBlue?.[0] + '24' }]}>
              <Ionicons name="checkmark-done-circle" size={40} color={COLORS.neonBlue?.[0] ?? '#60a5fa'} />
            </View>
            <View style={styles.heroStats}>
              <View style={[styles.statPill, { backgroundColor: colors.surfaceHighlight }]}>
                <Ionicons name="stats-chart" size={14} color={COLORS.success} />
                <Text style={[styles.statText, { color: colors.text }]}>{polls.reduce((s, p) => s + p.totalVotes, 0).toLocaleString()} total votes</Text>
              </View>
              {unvotedCount > 0 && (
                <View style={[styles.ctaPill, { backgroundColor: COLORS.neonBlue?.[0] + '28', borderColor: COLORS.neonBlue?.[0] }]}>
                  <Text style={[styles.ctaText, { color: COLORS.neonBlue?.[0] }]}>
                    {unvotedCount} poll{unvotedCount !== 1 ? 's' : ''} left — earn +{unvotedCount * POLL_VOTE_REWARD} OT
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Your voice shapes local</Text>
          <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
            Verified partners ask. You vote. Everyone sees real results. One vote per poll. Earn {POLL_VOTE_REWARD} OT Points per vote — no politics, just insight.
          </Text>
          <Text style={[styles.heroVoteLine, { color: colors.textSecondary }]}>Vote with OT. Shape what's next for local.</Text>
          <View style={[styles.integrityStrip, { borderTopColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.success ?? '#4ade80'} />
            <Text style={[styles.integrityText, { color: colors.textSecondary }]}>
              One vote per user · Results visible after voting · Tap partner to visit
            </Text>
          </View>
        </View>

        {/* Quick link to partners via Pulse */}
        <TouchableOpacity
          style={[styles.quickLink, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => { safeHaptics.selectionAsync(); router.push('/pulse' as any); }}
          activeOpacity={0.85}
        >
          <Ionicons name="pulse" size={22} color={COLORS.neonBlue?.[0]} />
          <View style={styles.quickLinkText}>
            <Text style={[styles.quickLinkTitle, { color: colors.text }]}>See who's trending</Text>
            <Text style={[styles.quickLinkSub, { color: colors.textSecondary }]}>OrbPulse Live — verified momentum</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {sponsored.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={16} color={themeGold} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SPONSORED</Text>
            </View>
            {sponsored.map((p) => (
              <PollCard
                key={p.id}
                poll={p}
                onVote={fromFirestore ? submitVote : undefined}
                votedOption={getVotedOption(p.id)}
                variant="featured"
                showDeleteButton={isAdmin}
                onDelete={isAdmin ? handleAdminDeletePoll : undefined}
              />
            ))}
          </>
        )}

        {featured.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={16} color={COLORS.neonBlue?.[0]} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FEATURED</Text>
            </View>
            {featured.map((p) => (
              <PollCard
                key={p.id}
                poll={p}
                onVote={fromFirestore ? submitVote : undefined}
                votedOption={getVotedOption(p.id)}
                showDeleteButton={isAdmin}
                onDelete={isAdmin ? handleAdminDeletePoll : undefined}
              />
            ))}
          </>
        )}

        {standard.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={16} color={COLORS.success} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>COMMUNITY</Text>
            </View>
            {standard.map((p) => (
              <PollCard
                key={p.id}
                poll={p}
                onVote={fromFirestore ? submitVote : undefined}
                votedOption={getVotedOption(p.id)}
                showDeleteButton={isAdmin}
                onDelete={isAdmin ? handleAdminDeletePoll : undefined}
              />
            ))}
          </>
        )}

        {!loading && polls.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="ellipse-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No polls right now</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Check back soon. Partners create polls via Admin or OrbVote — your vote earns OT Points.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: COLORS.neonBlue?.[0] }]}
              onPress={() => router.push('/pulse' as any)}
            >
              <Text style={styles.emptyBtnText}>Browse OrbPulse</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.walletCta, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="wallet" size={20} color={themeGold} />
          <Text style={[styles.walletCtaText, { color: colors.textSecondary }]}>
            Balance: {balance.toLocaleString()} OT
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/wallet' as any)}>
            <Text style={[styles.walletCtaLink, { color: COLORS.neonBlue?.[0] }]}>View wallet</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  headerSub: { fontSize: 12, marginTop: 2 },
  headerTagline: { fontSize: 10, fontWeight: '600', marginTop: 2, fontStyle: 'italic' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  createBtn: { padding: 8 },
  content: { padding: 16, paddingBottom: 24 },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  heroStats: { flex: 1, gap: 10 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statText: { fontSize: 13, fontWeight: '700' },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  ctaText: { fontSize: 13, fontWeight: '800' },
  heroTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10, letterSpacing: -0.3 },
  heroDesc: { fontSize: 15, lineHeight: 23, opacity: 0.95 },
  heroVoteLine: { fontSize: 13, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  integrityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
  },
  integrityText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 14,
  },
  quickLinkText: { flex: 1 },
  quickLinkTitle: { fontSize: 15, fontWeight: '800' },
  quickLinkSub: { fontSize: 12, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  empty: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
    marginTop: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  emptyBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  emptyBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  walletCta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 24,
    gap: 12,
  },
  walletCtaText: { flex: 1, fontSize: 14, fontWeight: '700' },
  walletCtaLink: { fontSize: 14, fontWeight: '800' },
});

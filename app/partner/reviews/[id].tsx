/**
 * All Reviews for a partner — sort & filter (Amazon-style).
 * Phase 5: Reply and Report actions, pagination.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePartners } from '../../../context/PartnersContext';
import { useReviews } from '../../../hooks/useReviews';
import type { Review } from '../../../hooks/useReviews';
import { useTheme } from '../../../hooks/useTheme';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { COLORS } from '../../../constants/Colors';
import { PARTNER_TIER_COLORS } from '../../../constants/PartnerTiers';
import { alert as alertDialog } from '../../../utils/alert';
import { useI18n } from '../../../context/I18nContext';

const PAGE_SIZE = 10;

export type SortOption = 'highest' | 'lowest' | 'newest' | 'oldest';
export type FilterOption = 'all' | '5' | '4+' | '3+' | '2+' | '1' | 'verified';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest', label: 'Lowest rated' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '5', label: '5 stars' },
  { value: '4+', label: '4+ stars' },
  { value: '3+', label: '3+ stars' },
  { value: '2+', label: '2+ stars' },
  { value: '1', label: '1 star' },
  { value: 'verified', label: 'Verified only' },
];

function sortReviews(reviews: Review[], sort: SortOption): Review[] {
  const arr = [...reviews];
  switch (sort) {
    case 'highest':
      return arr.sort((a, b) => b.rating - a.rating);
    case 'lowest':
      return arr.sort((a, b) => a.rating - b.rating);
    case 'newest':
      return arr.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    case 'oldest':
      return arr.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    default:
      return arr;
  }
}

function filterReviews(reviews: Review[], filter: FilterOption): Review[] {
  if (filter === 'all') return reviews;
  if (filter === 'verified') return reviews.filter((r) => r.verified);
  if (filter === '5') return reviews.filter((r) => r.rating === 5);
  if (filter === '4+') return reviews.filter((r) => r.rating >= 4);
  if (filter === '3+') return reviews.filter((r) => r.rating >= 3);
  if (filter === '2+') return reviews.filter((r) => r.rating >= 2);
  if (filter === '1') return reviews.filter((r) => r.rating === 1);
  return reviews;
}

function formatReviewDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} wk ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function PartnerAllReviewsScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const { getPartner } = usePartners();
  const { getPartnerReviews, getOrbScore } = useReviews();
  const [sort, setSort] = useState<SortOption>('newest');
  const [filter, setFilter] = useState<FilterOption>('all');

  const partner = getPartner(id ?? '');
  const allReviews = partner ? getPartnerReviews(partner.id) : [];
  const orbScore = partner ? getOrbScore(partner.id) : { score: 0, verifiedCount: 0, totalCount: 0, label: 'No reviews yet' };
  const tierColor = partner ? (PARTNER_TIER_COLORS[partner.tier] ?? colors.textSecondary) : colors.textSecondary;

  const filtered = useMemo(() => filterReviews(allReviews, filter), [allReviews, filter]);
  const sorted = useMemo(() => sortReviews(filtered, sort), [filtered, sort]);
  const isOwnPage = partner && myPartnerId === partner.id;
  const paginated = useMemo(() => sorted.slice(0, page * PAGE_SIZE), [sorted, page]);
  const hasMore = paginated.length < sorted.length;

  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : null;

  const ratingDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    allReviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
    });
    const max = Math.max(1, ...counts);
    return counts.map((c, i) => ({ stars: i + 1, count: c, pct: max > 0 ? (c / max) * 100 : 0 }));
  }, [allReviews]);

  if (!partner) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.text }]}>Partner not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleReply = async () => {
    if (!replyModal || !partner || !replyText.trim()) return;
    await addPartnerReply(replyModal.id, partner.id, replyText);
    setReplyModal(null);
    setReplyText('');
  };

  const renderReview = ({ item: r }: { item: Review }) => (
    <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.reviewCardHeader}>
        <View style={styles.reviewCardHeaderLeft}>
          <Text style={[styles.reviewAuthor, { color: colors.text }]}>{r.userName}</Text>
          {r.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: tierColor + '25', borderColor: tierColor }]}>
              <Ionicons name="checkmark-circle" size={12} color={tierColor} />
              <Text style={[styles.verifiedBadgeText, { color: tierColor }]}>Verified visit</Text>
            </View>
          )}
        </View>
        <View style={styles.reviewCardMeta}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons key={s} name={s <= r.rating ? 'star' : 'star-outline'} size={14} color={themeGold} />
            ))}
          </View>
          <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>{formatReviewDate(r.date)}</Text>
        </View>
      </View>
      <Text style={[styles.reviewBody, { color: colors.text }]}>{r.text}</Text>
      {r.partnerReply && (
        <View style={[styles.replyBlock, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.replyLabel, { color: colors.textSecondary }]}>Your reply</Text>
          <Text style={[styles.replyText, { color: colors.text }]}>{r.partnerReply}</Text>
        </View>
      )}
      <View style={styles.reviewActions}>
        {isOwnPage && !r.partnerReply && (
          <TouchableOpacity onPress={() => { setReplyModal(r); setReplyText(''); }} style={[styles.actionBtn, { borderColor: tierColor }]}>
            <Ionicons name="chatbubble-outline" size={14} color={tierColor} />
            <Text style={[styles.actionBtnText, { color: tierColor }]}>Reply</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.push({ pathname: '/report', params: { reviewId: r.id, partnerId: r.partnerId, name: `Review by ${r.userName}` } } as any)} style={[styles.actionBtn, { borderColor: colors.border }]}>
          <Ionicons name="flag-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>Reviews</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{partner.name}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Orb Score + avg */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <View style={[styles.orbScorePill, { backgroundColor: tierColor + '22', borderColor: tierColor }]}>
              <Text style={[styles.orbScoreValue, { color: tierColor }]}>{orbScore.score}</Text>
              <Text style={[styles.orbScoreMax, { color: colors.textSecondary }]}>/100</Text>
            </View>
            <View style={styles.summaryMeta}>
              <Text style={[styles.orbScoreLabel, { color: colors.textSecondary }]}>Orb Score™</Text>
              <Text style={[styles.orbScoreTier, { color: tierColor }]}>{orbScore.label}</Text>
            </View>
            {avgRating && (
              <View style={styles.avgBlock}>
                <Ionicons name="star" size={20} color={themeGold} />
                <Text style={[styles.avgValue, { color: colors.text }]}>{avgRating}</Text>
                <Text style={[styles.avgCount, { color: colors.textSecondary }]}>({allReviews.length})</Text>
              </View>
            )}
          </View>
        </View>

        {/* Rating distribution (Amazon-style) */}
        {allReviews.length > 0 && (
          <View style={[styles.distributionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>RATING BREAKDOWN</Text>
            {ratingDistribution.map(({ stars, count, pct }) => (
              <View key={stars} style={styles.distributionRow}>
                <View style={styles.distributionStars}>
                  <Text style={[styles.distributionStarsText, { color: colors.textSecondary }]}>{stars}</Text>
                  <Ionicons name="star" size={14} color={themeGold} />
                </View>
                <View style={[styles.distributionBarBg, { backgroundColor: colors.background }]}>
                  <View style={[styles.distributionBarFill, { width: `${pct}%`, backgroundColor: themeGold }]} />
                </View>
                <Text style={[styles.distributionCount, { color: colors.textSecondary }]}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Sort */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SORT BY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                { borderColor: colors.border, backgroundColor: sort === opt.value ? tierColor + '25' : colors.surface },
              ]}
              onPress={() => { setSort(opt.value); setPage(1); }}
            >
              <Text style={[styles.chipText, { color: sort === opt.value ? tierColor : colors.text }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>FILTER</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                { borderColor: colors.border, backgroundColor: filter === opt.value ? tierColor + '25' : colors.surface },
              ]}
              onPress={() => { setFilter(opt.value); setPage(1); }}
            >
              <Text style={[styles.chipText, { color: filter === opt.value ? tierColor : colors.text }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results count */}
        <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
          {sorted.length} {sorted.length === 1 ? 'review' : 'reviews'}
        </Text>

        {/* List */}
        {sorted.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No reviews match this filter</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try changing the filter or sort.</Text>
          </View>
        ) : (
          <>
            {paginated.map((r) => (
              <View key={r.id}>
                {renderReview({ item: r })}
              </View>
            ))}
            {hasMore && (
              <TouchableOpacity style={[styles.loadMoreBtn, { borderColor: colors.border }]} onPress={() => setPage((p) => p + 1)}>
                <Text style={[styles.loadMoreText, { color: colors.text }]}>Load more</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Reply modal */}
      <Modal visible={!!replyModal} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setReplyModal(null)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reply to review</Text>
            <TextInput
              style={[styles.replyInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Write your reply..."
              placeholderTextColor={colors.textSecondary}
              multiline
              value={replyText}
              onChangeText={setReplyText}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setReplyModal(null)}>
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: tierColor }]} onPress={handleReply} disabled={!replyText.trim()}>
                <Text style={styles.modalBtnTextPrimary}>Reply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { fontSize: 16, padding: 24 },
  backBtn: { padding: 12, margin: 16, alignSelf: 'flex-start', borderRadius: 10 },
  backBtnText: { fontSize: 15, fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBack: { padding: 8 },
  headerCenter: { flex: 1, minWidth: 0, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  headerRight: { width: 40 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  summaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  orbScorePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  orbScoreValue: { fontSize: 24, fontWeight: '800' },
  orbScoreMax: { fontSize: 14, fontWeight: '700' },
  summaryMeta: {},
  orbScoreLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  orbScoreTier: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  avgBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avgValue: { fontSize: 18, fontWeight: '800' },
  avgCount: { fontSize: 13 },

  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '700' },

  resultCount: { fontSize: 13, marginTop: 12, marginBottom: 8 },

  distributionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  distributionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  distributionStars: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 32 },
  distributionStarsText: { fontSize: 12, fontWeight: '700', width: 12 },
  distributionBarBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', marginHorizontal: 10 },
  distributionBarFill: { height: '100%', borderRadius: 4 },
  distributionCount: { fontSize: 12, fontWeight: '700', width: 24, textAlign: 'right' },

  reviewCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  reviewCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  reviewCardHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  reviewAuthor: { fontSize: 15, fontWeight: '800' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  verifiedBadgeText: { fontSize: 10, fontWeight: '700' },
  reviewCardMeta: { alignItems: 'flex-end' },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: 11, marginTop: 4 },
  reviewBody: { fontSize: 14, lineHeight: 22 },
  replyBlock: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  replyLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  replyText: { fontSize: 13, lineHeight: 20 },
  reviewActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  loadMoreBtn: { marginTop: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  loadMoreText: { fontSize: 13, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 16, borderWidth: 1, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  replyInput: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
  modalBtnTextPrimary: { color: '#fff', fontSize: 15, fontWeight: '700' },

  empty: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 4 },
});

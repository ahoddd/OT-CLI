/**
 * Partner — My Posts. List drafts and published posts.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useMyPartner } from '../../../hooks/useMyPartner';
import { getOrbPostsForPartner } from '../../../services/orbPosts';
import { getPostTypeLabel } from '../../../constants/OrbFeed';
import type { OrbPost } from '../../../constants/OrbFeed';
import { PARTNER_TIER_COLORS } from '../../../constants/PartnerTiers';
import { safeHaptics } from '../../../utils/safeHaptics';
import { useI18n } from '../../../context/I18nContext';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 24 * 60 * 60 * 1000) return 'Today';
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PartnerMyPostsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { myPartnerId } = useMyPartner();
  const [posts, setPosts] = useState<OrbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!myPartnerId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    try {
      const list = await getOrbPostsForPartner(myPartnerId);
      setPosts(list);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [myPartnerId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const tierColor = PARTNER_TIER_COLORS.silver;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: tierColor + '50' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Posts</Text>
        <TouchableOpacity onPress={() => { safeHaptics.selectionAsync(); router.push('/partner/posts/create'); }} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={tierColor} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator size="small" color={tierColor} />
          <Text style={[styles.loadText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
          showsVerticalScrollIndicator={false}
        >
          {posts.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="newspaper-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No posts yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Create a post to reach customers in the Commerce Feed.</Text>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: tierColor }]} onPress={() => router.push('/partner/posts/create')}>
                <Text style={styles.createBtnText}>Create post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            posts.map((post) => {
              const isDraft = post.trust.moderationStatus === 'DRAFT';
              return (
                <TouchableOpacity
                  key={post.id}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: '/feed/[id]', params: { id: post.id } } as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.badge, { backgroundColor: isDraft ? colors.textSecondary + '30' : tierColor + '25' }]}>
                      <Text style={[styles.badgeText, { color: isDraft ? colors.textSecondary : tierColor }]}>{isDraft ? 'Draft' : getPostTypeLabel(post.type)}</Text>
                    </View>
                    <Text style={[styles.cardDate, { color: colors.textSecondary }]}>{formatDate(post.createdAt)}</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{post.title}</Text>
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]} numberOfLines={2}>{post.body}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  addBtn: { padding: 4 },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadText: { marginTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', padding: 32, borderRadius: 16, borderWidth: 1 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 14, marginTop: 6, textAlign: 'center' },
  createBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 11 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardBody: { fontSize: 13, lineHeight: 18 },
});

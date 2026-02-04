/**
 * OrbTap Knowledge — Fun facts + motivational quotes.
 * Like, Dislike, Share, Save. New item on app open. Premium design, max engagement.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useKnowledge } from '../context/KnowledgeContext';
import { COLORS } from '../constants/Colors';
import { ORBTAP_KNOWLEDGE_SHARE_SUFFIX } from '../constants/AppLinks';
import type { KnowledgeItem } from '../constants/KnowledgeBase';
import * as Haptics from 'expo-haptics';

export default function KnowledgeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [tab, setTab] = useState<'discover' | 'saved'>('discover');
  const {
    currentItem,
    loading,
    refresh,
    ensureFreshOnAppOpen,
    like,
    dislike,
    vote,
    share,
    save,
    unsave,
    savedItems,
    isSaved,
    next,
  } = useKnowledge();

  useFocusEffect(
    useCallback(() => {
      ensureFreshOnAppOpen();
    }, [ensureFreshOnAppOpen])
  );

  const handleShare = useCallback(async (item: KnowledgeItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const authorLine = item.author ? ` — ${item.author}` : '';
    const message = item.type === 'quote'
      ? `"${item.text}"${authorLine}${ORBTAP_KNOWLEDGE_SHARE_SUFFIX}`
      : `Did you know? ${item.text}${ORBTAP_KNOWLEDGE_SHARE_SUFFIX}`;
    try {
      await Share.share({ message, title: item.type === 'quote' ? 'Quote' : 'Fun fact' });
    } catch {}
  }, []);

  const handleSave = useCallback((item: KnowledgeItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSaved(item.id)) unsave(item.id);
    else save(item);
  }, [save, unsave, isSaved]);

  const handleNext = useCallback(async () => {
    Haptics.selectionAsync();
    await next();
  }, [next]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Knowledge</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, tab === 'discover' && styles.tabActive]}
          onPress={() => setTab('discover')}
        >
          <Ionicons name="bulb" size={18} color={tab === 'discover' ? COLORS.gold[0] : colors.textSecondary} />
          <Text style={[styles.tabText, { color: tab === 'discover' ? colors.text : colors.textSecondary }]}>
            Discover
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'saved' && styles.tabActive]}
          onPress={() => setTab('saved')}
        >
          <Ionicons name="bookmark" size={18} color={tab === 'saved' ? COLORS.gold[0] : colors.textSecondary} />
          <Text style={[styles.tabText, { color: tab === 'saved' ? colors.text : colors.textSecondary }]}>
            Saved
          </Text>
          {savedItems.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{savedItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {tab === 'discover' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading && !currentItem ? (
            <View style={[styles.card, styles.skeleton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.skeletonText, { color: colors.textSecondary }]}>Loading…</Text>
            </View>
          ) : currentItem ? (
            <KnowledgeCard
              item={currentItem}
              colors={colors}
              vote={vote}
              onLike={like}
              onDislike={dislike}
              onShare={() => handleShare(currentItem)}
              onSave={() => handleSave(currentItem)}
              isSaved={isSaved(currentItem.id)}
              onNext={handleNext}
            />
          ) : (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nothing right now. Pull to refresh.</Text>
              <TouchableOpacity style={[styles.refreshBtn, { borderColor: colors.border }]} onPress={refresh}>
                <Text style={[styles.refreshBtnText, { color: colors.text }]}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 48 }} />
        </ScrollView>
      )}

      {tab === 'saved' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.savedContent}
          showsVerticalScrollIndicator={false}
        >
          {savedItems.length === 0 ? (
            <View style={[styles.emptySaved, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="bookmark-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptySavedTitle, { color: colors.text }]}>No saved items yet</Text>
              <Text style={[styles.emptySavedSub, { color: colors.textSecondary }]}>
                Tap the bookmark on any fact or quote to save it here.
              </Text>
            </View>
          ) : (
            savedItems.map((item) => (
              <SavedItemCard
                key={item.id}
                item={item}
                colors={colors}
                onShare={() => handleShare(item)}
                onUnsave={() => unsave(item.id)}
              />
            ))
          )}
          <View style={{ height: 48 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function KnowledgeCard({
  item,
  colors,
  vote,
  onLike,
  onDislike,
  onShare,
  onSave,
  isSaved,
  onNext,
}: {
  item: KnowledgeItem;
  colors: { text: string; textSecondary: string; border: string; surface: string };
  vote: 'like' | 'dislike' | null;
  onLike: () => void;
  onDislike: () => void;
  onShare: () => void;
  onSave: () => void;
  isSaved: boolean;
  onNext: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isQuote = item.type === 'quote';

  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <LinearGradient
          colors={isQuote ? [COLORS.gold[0] + '12', COLORS.gold[1] + '06'] : [COLORS.neonBlue[0] + '10', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.cardHeader}>
          <View style={[styles.pill, { backgroundColor: isQuote ? COLORS.gold[0] + '22' : COLORS.neonBlue[0] + '22' }]}>
            <Ionicons name={isQuote ? 'chatbox-ellipses' : 'bulb'} size={14} color={isQuote ? COLORS.gold[0] : COLORS.neonBlue[0]} />
            <Text style={[styles.pillText, { color: isQuote ? COLORS.gold[0] : COLORS.neonBlue[0] }]}>
              {isQuote ? 'QUOTE' : 'FUN FACT'}
            </Text>
          </View>
        </View>

        <Text style={[styles.bodyText, { color: colors.text }]}>
          {isQuote ? `"${item.text}"` : item.text}
        </Text>
        {item.author && (
          <Text style={[styles.author, { color: colors.textSecondary }]}>— {item.author}</Text>
        )}
        {item.funFact && (
          <View style={[styles.funFactWrap, { backgroundColor: colors.border + '40' }]}>
            <Ionicons name="sparkles" size={14} color={COLORS.gold[0]} />
            <Text style={[styles.funFactText, { color: colors.textSecondary }]}>{item.funFact}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <View style={styles.voteRow}>
            <TouchableOpacity onPress={onLike} style={styles.actionBtn}>
              <Ionicons
                name={vote === 'like' ? 'thumbs-up' : 'thumbs-up-outline'}
                size={22}
                color={vote === 'like' ? COLORS.success : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDislike} style={styles.actionBtn}>
              <Ionicons
                name={vote === 'dislike' ? 'thumbs-down' : 'thumbs-down-outline'}
                size={22}
                color={vote === 'dislike' ? COLORS.danger : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.shareSaveRow}>
            <TouchableOpacity onPress={onShare} style={styles.actionBtn}>
              <Ionicons name="share-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} style={styles.actionBtn}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isSaved ? COLORS.gold[0] : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { borderColor: colors.border }]}
          onPress={onNext}
        >
          <Text style={[styles.nextBtnText, { color: colors.text }]}>Next</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function SavedItemCard({
  item,
  colors,
  onShare,
  onUnsave,
}: {
  item: KnowledgeItem;
  colors: { text: string; textSecondary: string; border: string; surface: string };
  onShare: () => void;
  onUnsave: () => void;
}) {
  const isQuote = item.type === 'quote';
  return (
    <View style={[styles.savedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.savedCardHeader}>
        <View style={[styles.pill, styles.pillSmall, { backgroundColor: isQuote ? COLORS.gold[0] + '18' : COLORS.neonBlue[0] + '18' }]}>
          <Text style={[styles.pillTextSmall, { color: isQuote ? COLORS.gold[0] : COLORS.neonBlue[0] }]}>
            {isQuote ? 'Quote' : 'Fact'}
          </Text>
        </View>
        <View style={styles.savedCardActions}>
          <TouchableOpacity onPress={onShare} style={styles.smallActionBtn}>
            <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onUnsave} style={styles.smallActionBtn}>
            <Ionicons name="bookmark" size={18} color={COLORS.gold[0]} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.savedBodyText, { color: colors.text }]} numberOfLines={4}>
        {isQuote ? `"${item.text}"` : item.text}
      </Text>
      {item.author && (
        <Text style={[styles.savedAuthor, { color: colors.textSecondary }]}>— {item.author}</Text>
      )}
    </View>
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
  headerRight: { width: 36 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.gold[0] },
  tabText: { fontSize: 15, fontWeight: '600' },
  badge: {
    backgroundColor: COLORS.gold[0],
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#000' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  savedContent: { padding: 20 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  skeleton: { minHeight: 200, justifyContent: 'center', alignItems: 'center' },
  skeletonText: { fontSize: 15 },
  emptyText: { fontSize: 15, textAlign: 'center', marginBottom: 16 },
  refreshBtn: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1 },
  refreshBtnText: { fontSize: 15, fontWeight: '600' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  pillSmall: { paddingHorizontal: 8, paddingVertical: 4 },
  pillTextSmall: { fontSize: 10, fontWeight: '700' },
  cardHeader: { marginBottom: 16 },
  bodyText: { fontSize: 18, fontWeight: '600', lineHeight: 26, marginBottom: 12 },
  author: { fontSize: 15, fontStyle: 'italic', marginBottom: 12 },
  funFactWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  funFactText: { fontSize: 13, lineHeight: 19, flex: 1 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  voteRow: { flexDirection: 'row', gap: 8 },
  shareSaveRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8 },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700' },
  emptySaved: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
  },
  emptySavedTitle: { fontSize: 17, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySavedSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  savedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  savedCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  savedCardActions: { flexDirection: 'row', gap: 4 },
  smallActionBtn: { padding: 6 },
  savedBodyText: { fontSize: 15, lineHeight: 22 },
  savedAuthor: { fontSize: 13, fontStyle: 'italic', marginTop: 6 },
});

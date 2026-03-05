/**
 * Daily Intel card — uses Knowledge context. New fact/quote on app open; Like, Dislike, Share, Save.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Colors';
import { ORBTAP_KNOWLEDGE_SHARE_SUFFIX } from '../constants/AppLinks';
import { useTheme } from '../hooks/useTheme';
import { useKnowledge } from '../context/KnowledgeContext';
import { safeHaptics, Haptics } from '../utils/safeHaptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export function DailyFactCard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const themeGold = colors.gold ?? COLORS.gold[0];
  const {
    currentItem,
    loading,
    ensureFreshOnAppOpen,
    like,
    dislike,
    vote,
    share,
    save,
    unsave,
    isSaved,
    next,
  } = useKnowledge();
  const flip = useSharedValue(0);

  React.useEffect(() => {
    ensureFreshOnAppOpen();
  }, [ensureFreshOnAppOpen]);

  const advanceToNext = useCallback(async () => {
    safeHaptics.selectionAsync();
    flip.value = withSpring(1, { damping: 12 }, () => { flip.value = 0; });
    await next();
  }, [next, flip]);

  const handleShare = useCallback(async () => {
    if (!currentItem) return;
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const authorLine = currentItem.author ? ` — ${currentItem.author}` : '';
    const message = currentItem.type === 'quote'
      ? `"${currentItem.text}"${authorLine}${ORBTAP_KNOWLEDGE_SHARE_SUFFIX}`
      : `Did you know? ${currentItem.text}${ORBTAP_KNOWLEDGE_SHARE_SUFFIX}`;
    try {
      await Share.share({ message, title: currentItem.type === 'quote' ? 'Quote' : 'Fun fact' });
    } catch {}
  }, [currentItem]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (flip.value * 0.02) }],
  }));

  if (loading && !currentItem) {
    return (
      <View style={[styles.skeleton, { borderColor: colors.border }]}>
        <Text style={[styles.skeletonText, { color: colors.textSecondary }]}>Loading intel…</Text>
      </View>
    );
  }

  if (!currentItem) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.card, { borderColor: colors.border }]}
        onPress={() => router.push('/knowledge' as any)}
      >
        <Text style={[styles.factText, { color: colors.text }]}>Tap for more facts & quotes</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  const isQuote = currentItem.type === 'quote';

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#0d0d0d'] : ['#fafafa', '#f0f0f5']}
        style={[styles.card, { borderColor: colors.border }]}
      >
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: isQuote ? themeGold + '22' : COLORS.neonBlue[0] + '22' }]}>
            <Ionicons name={isQuote ? 'chatbox-ellipses' : 'bulb'} size={12} color={isQuote ? themeGold : COLORS.neonBlue[0]} />
            <Text style={[styles.badgeText, { color: isQuote ? themeGold : COLORS.neonBlue[0] }]}>
              {isQuote ? 'QUOTE' : 'DAILY INTEL'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/knowledge' as any)} hitSlop={8}>
            <Text style={[styles.seeAllText, { color: colors.textSecondary }]}>See all</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} hitSlop={8}>
            <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.factText, { color: colors.text }]}>
          {isQuote ? `"${currentItem.text}"` : currentItem.text}
        </Text>
        {currentItem.author && (
          <Text style={[styles.author, { color: colors.textSecondary }]}>— {currentItem.author}</Text>
        )}

        <View style={styles.footer}>
          <View style={styles.voteRow}>
            <TouchableOpacity onPress={like} style={styles.voteBtn}>
              <Ionicons name={vote === 'like' ? 'thumbs-up' : 'thumbs-up-outline'} size={18} color={vote === 'like' ? COLORS.success : colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={dislike} style={styles.voteBtn}>
              <Ionicons name={vote === 'dislike' ? 'thumbs-down' : 'thumbs-down-outline'} size={18} color={vote === 'dislike' ? COLORS.danger : colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => (isSaved(currentItem.id) ? unsave(currentItem.id) : save(currentItem))}
              style={styles.voteBtn}
            >
              <Ionicons name={isSaved(currentItem.id) ? 'bookmark' : 'bookmark-outline'} size={18} color={isSaved(currentItem.id) ? themeGold : colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.nextBtn, { borderColor: colors.border }]} onPress={advanceToNext}>
            <Text style={[styles.nextText, { color: colors.text }]}>NEXT</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  skeleton: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    minHeight: 100,
    justifyContent: 'center',
  },
  skeletonText: { fontSize: 14 },
  card: { borderRadius: 16, padding: 14, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  badgeText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.8 },
  seeAllText: { fontSize: 11, fontWeight: '600', flex: 1 },
  factText: { fontSize: 15, fontWeight: '600', lineHeight: 22, marginBottom: 8, fontStyle: 'italic' },
  author: { fontSize: 12, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voteRow: { flexDirection: 'row', gap: 12 },
  voteBtn: { padding: 4 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  nextText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});

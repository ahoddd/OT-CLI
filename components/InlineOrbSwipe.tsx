/**
 * InlineOrbSwipe — lightweight OrbSwipe embedded inside the Discovery Hub.
 * Reuses OrbSwipeCardStack + useOrbSwipeDeck; no Fuse Engine or Meal Mode.
 * Swipe left = skip, right = save to tray, up = open detail.
 * "Plan Full Night →" CTA funnels power users to /orbswipe.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { safeHaptics } from '../utils/safeHaptics';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import { COLORS } from '../constants/Colors';
import { OrbSwipeCardStack } from './OrbSwipeCardStack';
import { OrbSwipeCardDetailSheet } from './OrbSwipeCardDetailSheet';
import type { OrbSwipeCard } from '../constants/OrbSwipeDeck';
import { useOrbSwipeDeck } from '../hooks/useOrbSwipeDeck';
import { useOrbSwipePreferences } from '../hooks/useOrbSwipePreferences';
import { useOrbSwipeTray } from '../context/OrbSwipeTrayContext';
import { useDrops } from '../hooks/useDrops';
import { useMissions } from '../context/MissionsContext';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import type { PartnerTier } from '../constants/PartnerTiers';

const MAX_TRAY = 8;

interface TrayItem {
  card: OrbSwipeCard;
}

function TrayCard({ card, onRemove }: { card: OrbSwipeCard; onRemove: () => void }) {
  const { colors } = useTheme();
  const tierColor = PARTNER_TIER_COLORS[card.tier as PartnerTier] ?? '#94a3b8';
  return (
    <View
      style={[
        styles.trayCard,
        {
          backgroundColor: colors.surface,
          borderColor: tierColor + '44',
        },
      ]}
    >
      <View style={[styles.trayTierBar, { backgroundColor: tierColor }]} />
      <View style={styles.trayCardBody}>
        <Text style={[styles.trayCardName, { color: colors.text }]} numberOfLines={1}>
          {card.partnerName}
        </Text>
        <Text style={[styles.trayCardSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {card.valueSummary}
        </Text>
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={14} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function SwipeHintRow() {
  const { colors } = useTheme();
  return (
    <View style={styles.hintRow}>
      <View style={styles.hintItem}>
        <Ionicons name="arrow-back" size={16} color={COLORS.danger} />
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>Skip</Text>
      </View>
      <View style={styles.hintItem}>
        <Ionicons name="arrow-up" size={16} color={COLORS.neonBlue[0]} />
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>Details</Text>
      </View>
      <View style={styles.hintItem}>
        <Ionicons name="arrow-forward" size={16} color={COLORS.success} />
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>Save</Text>
      </View>
    </View>
  );
}

export function InlineOrbSwipe() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { drops } = useDrops();
  const { todayMissions } = useMissions();
  const { prefs } = useOrbSwipePreferences();
  const { trayCards: contextTrayCards, addToTray: contextAddToTray, removeFromTray: contextRemoveFromTray, trayCount } = useOrbSwipeTray();
  const { cards } = useOrbSwipeDeck(drops, todayMissions, prefs, { sponsoredEnabled: false });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailCard, setDetailCard] = useState<OrbSwipeCard | null>(null);

  const trayCards = contextTrayCards.map((card) => ({ card }));

  const currentCard = cards[currentIndex] ?? null;
  const total = cards.length;
  const remaining = Math.max(0, total - currentIndex);

  const advance = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, total));
  }, [total]);

  const handleSwipeRight = useCallback(() => {
    if (!currentCard) return;
    safeHaptics.impactAsync();
    if (trayCount < MAX_TRAY) {
      contextAddToTray(currentCard);
    }
    advance();
  }, [currentCard, trayCount, contextAddToTray, advance]);

  const handleSwipeLeft = useCallback(() => {
    safeHaptics.selectionAsync();
    advance();
  }, [advance]);

  const handleSwipeUp = useCallback(() => {
    if (!currentCard) return;
    setDetailCard(currentCard);
  }, [currentCard]);

  const handleAddToTray = useCallback((card: OrbSwipeCard) => {
    if (trayCount < MAX_TRAY) {
      contextAddToTray(card);
    }
    setDetailCard(null);
    advance();
  }, [trayCount, contextAddToTray, advance]);

  const handleSave = useCallback((card: OrbSwipeCard) => {
    // Same as add-to-tray for inline mode
    handleAddToTray(card);
  }, [handleAddToTray]);

  const handleRemoveFromTray = useCallback((cardId: string) => {
    safeHaptics.selectionAsync();
    contextRemoveFromTray(cardId);
  }, [contextRemoveFromTray]);

  const handlePlanFullNight = useCallback(() => {
    safeHaptics.impactAsync();
    router.push('/orbswipe');
  }, [router]);

  // Empty deck state
  if (remaining === 0 || total === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>✨</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            You've seen everything nearby
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Open the full OrbSwipe for a personalized deck of drops, missions, and partners.
          </Text>
          <TouchableOpacity style={styles.fullSwipeBtn} onPress={handlePlanFullNight}>
            <Text style={styles.fullSwipeBtnText}>Open Full OrbSwipe  →</Text>
          </TouchableOpacity>
          {trayCount > 0 && (
            <TouchableOpacity
              onPress={() => router.push('/orbswipe-saved')}
              style={[styles.trayCountBtn, { borderColor: COLORS.neonBlue[0] + '60' }]}
            >
              <Ionicons name="list" size={16} color={COLORS.neonBlue[0]} />
              <Text style={[styles.trayCountText, { color: COLORS.neonBlue[0] }]}>
                {trayCount} saved
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Session counter + filters row */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.savedChip, { borderColor: COLORS.neonBlue[0] + '50' }]}
          onPress={() => {
            safeHaptics.selectionAsync();
            router.push('/orbswipe-saved');
          }}
          accessibilityLabel={trayCount > 0 ? `${trayCount} saved cards` : 'Saved'}
          accessibilityRole="button"
        >
          <Ionicons
            name="list"
            size={14}
            color={COLORS.neonBlue[0]}
          />
          <Text style={[styles.savedChipText, { color: COLORS.neonBlue[0] }]}>
            {trayCount > 0 ? `${trayCount} saved` : 'Saved'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.counter, { color: colors.textSecondary }]}>
          {Math.min(currentIndex + 1, total)} / {total}
        </Text>

        <TouchableOpacity style={[styles.fullNightBtn, { backgroundColor: COLORS.neonBlue[0] }]} onPress={handlePlanFullNight} activeOpacity={0.85}>
          <Ionicons name="flash" size={14} color="#fff" />
          <Text style={styles.fullNightBtnText}>Plan Full Night →</Text>
        </TouchableOpacity>
      </View>

      {/* Tray strip — visible when there are saved cards */}
      {trayCount > 0 && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={[
            styles.tray,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trayContent}>
            {trayCards.map((item) => (
              <TrayCard
                key={item.card.id}
                card={item.card}
                onRemove={() => handleRemoveFromTray(item.card.id)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Card stack — takes remaining height */}
      <View style={styles.deck}>
        <OrbSwipeCardStack
          cards={cards}
          currentIndex={currentIndex}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
          onSwipeUp={handleSwipeUp}
          onAdvance={advance}
          onTap={() => setDetailCard(currentCard)}
        />
      </View>

      {/* Hint row */}
      <SwipeHintRow />

      {/* Detail sheet */}
      <OrbSwipeCardDetailSheet
        card={detailCard}
        visible={detailCard !== null}
        onClose={() => setDetailCard(null)}
        onAddToTray={handleAddToTray}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.sm,
  },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  savedChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  counter: {
    fontSize: 13,
    fontWeight: '600',
  },
  fullNightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACE.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  fullNightBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  tray: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  trayContent: {
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.sm,
    gap: SPACE.sm,
    flexDirection: 'row',
  },
  trayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    overflow: 'hidden',
    width: 140,
    height: 52,
  },
  trayTierBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  trayCardBody: {
    flex: 1,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs,
  },
  trayCardName: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
  trayCardSub: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 13,
  },
  deck: {
    flex: 1,
    justifyContent: 'center',
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACE.xxl,
    paddingBottom: SPACE.base,
    paddingTop: SPACE.sm,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Empty state — minHeight avoids layout shift when deck empties
  emptyContainer: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    padding: SPACE.xxl,
    gap: SPACE.md,
    maxWidth: 320,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACE.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fullSwipeBtn: {
    backgroundColor: COLORS.neonBlue[0],
    paddingHorizontal: SPACE.xxl,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    marginTop: SPACE.sm,
  },
  fullSwipeBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  trayCountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  trayCountText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default InlineOrbSwipe;

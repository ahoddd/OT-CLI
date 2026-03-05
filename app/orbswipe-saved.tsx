/**
 * OrbSwipe Saved — list of partner cards saved from the Discovery Hub swipe tab.
 * Reached when the user taps the "Saved" pill in the swipe view on the map page.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useOrbSwipeTray } from '../context/OrbSwipeTrayContext';
import { PARTNER_TIER_COLORS, PARTNER_TIER_BADGE_LABELS } from '../constants/PartnerTiers';
import type { OrbSwipeCard } from '../constants/OrbSwipeDeck';
import type { PartnerTier } from '../constants/PartnerTiers';
import { safeHaptics } from '../utils/safeHaptics';
import { SPACE, RADIUS } from '../constants/DesignTokens';
import { COLORS } from '../constants/Colors';

function SavedCardRow({
  card,
  onPress,
  onRemove,
  tierColor,
}: {
  card: OrbSwipeCard;
  onPress: () => void;
  onRemove: () => void;
  tierColor: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: tierColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`${card.partnerName}, ${card.valueSummary}`}
      accessibilityRole="button"
    >
      <View style={[styles.tierBar, { backgroundColor: tierColor }]} />
      <View style={styles.cardBody}>
        <Text style={[styles.partnerName, { color: colors.text }]} numberOfLines={1}>
          {card.partnerName}
        </Text>
        <Text style={[styles.valueSummary, { color: colors.textSecondary }]} numberOfLines={1}>
          {card.valueSummary}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + '24' }]}>
            <Text style={[styles.tierBadgeText, { color: tierColor }]} numberOfLines={1}>
              {PARTNER_TIER_BADGE_LABELS[card.tier as PartnerTier] ?? card.tier}
            </Text>
          </View>
          {card.distanceLabel ? (
            <Text style={[styles.distance, { color: colors.textSecondary }]} numberOfLines={1}>
              {card.distanceLabel}
            </Text>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          safeHaptics.selectionAsync();
          onRemove();
        }}
        style={styles.removeBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Remove from saved"
        accessibilityRole="button"
      >
        <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function OrbSwipeSavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { trayCards, removeFromTray, clearTray } = useOrbSwipeTray();

  const handleCardPress = (card: OrbSwipeCard) => {
    safeHaptics.selectionAsync();
    if (card.type === 'DROP_CARD' && 'dropId' in card) {
      router.push(`/drop/${card.dropId}`);
    } else if (card.type === 'MISSION_CARD') {
      router.push('/missions');
    } else {
      router.push(`/partner/${card.partnerId}`);
    }
  };

  if (trayCards.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => { safeHaptics.selectionAsync(); router.back(); }}
            style={styles.backBtn}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Saved</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No saved cards yet
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Swipe right on cards in the Discovery swipe tab to save them here.
          </Text>
          <TouchableOpacity
            style={[styles.backToMapBtn, { borderColor: colors.border }]}
            onPress={() => { safeHaptics.selectionAsync(); router.back(); }}
          >
            <Text style={[styles.backToMapBtnText, { color: colors.text }]}>Back to Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => { safeHaptics.selectionAsync(); router.back(); }}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Saved ({trayCards.length})</Text>
        <TouchableOpacity
          onPress={() => {
            safeHaptics.selectionAsync();
            clearTray();
            router.back();
          }}
          style={styles.clearBtn}
          accessibilityLabel="Clear all saved"
          accessibilityRole="button"
        >
          <Text style={[styles.clearBtnText, { color: colors.primary }]}>Clear</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={trayCards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const tierColor = PARTNER_TIER_COLORS[item.tier as PartnerTier] ?? '#94a3b8';
          return (
            <SavedCardRow
              card={item}
              tierColor={tierColor}
              onPress={() => handleCardPress(item)}
              onRemove={() => removeFromTray(item.id)}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: SPACE.xs,
    marginLeft: -SPACE.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerRight: {
    minWidth: 48,
  },
  clearBtn: {
    padding: SPACE.xs,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACE.base,
    paddingBottom: SPACE.xxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: SPACE.sm,
    overflow: 'hidden',
    minHeight: 72,
  },
  tierBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    gap: 2,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  valueSummary: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    maxWidth: 100,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  distance: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeBtn: {
    padding: SPACE.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: SPACE.md,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACE.sm,
    lineHeight: 20,
  },
  backToMapBtn: {
    marginTop: SPACE.xl,
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  backToMapBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

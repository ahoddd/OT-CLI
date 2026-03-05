/**
 * PartnerGridView — sectionized 2-column partner discovery grid.
 * Sections: 🔥 Hot Right Now · ⭐ Featured · 📍 Nearby · 💰 Best Deals · All Partners
 * Pull-to-refresh, filter-aware, empty state.
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { safeHaptics } from '../utils/safeHaptics';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import { COLORS } from '../constants/Colors';
import { PARTNER_TIER_RANK } from '../constants/PartnerTiers';
import type { Partner, Perk } from '../constants/MockData';
import type { Drop } from '../constants/Drops';
import type { PartnerTier } from '../constants/PartnerTiers';
import { PartnerGridCard } from './PartnerGridCard';
import { usePartners } from '../context/PartnersContext';
import { useBookmarks } from '../context/BookmarkContext';
import { useUserLocation } from '../context/UserLocationContext';
import { distanceToPartner, formatDistanceMi } from '../utils/location';
import { useFeaturedPartners } from '../hooks/useFeaturedPartners';

interface PartnerGridViewProps {
  partners: Partner[];
  drops: Drop[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

interface Section {
  id: string;
  title: string;
  emoji: string;
  partners: Partner[];
}

function SectionHeader({ title, emoji, count }: { title: string; emoji: string; count: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEmoji}>{emoji}</Text>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionCount, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionCountText, { color: colors.textSecondary }]}>{count}</Text>
      </View>
    </View>
  );
}

function GridRow({
  items,
  getTopPerk,
  getDistance,
  isBookmarked,
  onBookmark,
}: {
  items: [Partner, Partner | null];
  getTopPerk: (id: string) => Perk | undefined;
  getDistance: (p: Partner) => string | undefined;
  isBookmarked: (id: string) => boolean;
  onBookmark: (id: string) => void;
}) {
  const [left, right] = items;
  return (
    <View style={styles.gridRow}>
      <PartnerGridCard
        partner={left}
        topPerk={getTopPerk(left.id)}
        distanceLabel={getDistance(left)}
        isBookmarked={isBookmarked(left.id)}
        onBookmark={() => onBookmark(left.id)}
      />
      {right ? (
        <PartnerGridCard
          partner={right}
          topPerk={getTopPerk(right.id)}
          distanceLabel={getDistance(right)}
          isBookmarked={isBookmarked(right.id)}
          onBookmark={() => onBookmark(right.id)}
        />
      ) : (
        <View style={styles.emptyCell} />
      )}
    </View>
  );
}

function pairUp(arr: Partner[]): [Partner, Partner | null][] {
  const pairs: [Partner, Partner | null][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    pairs.push([arr[i], arr[i + 1] ?? null]);
  }
  return pairs;
}

function PartnerSection({
  section,
  delay,
  getTopPerk,
  getDistance,
  isBookmarked,
  onBookmark,
}: {
  section: Section;
  delay: number;
  getTopPerk: (id: string) => Perk | undefined;
  getDistance: (p: Partner) => string | undefined;
  isBookmarked: (id: string) => boolean;
  onBookmark: (id: string) => void;
}) {
  const pairs = pairUp(section.partners);
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <SectionHeader title={section.title} emoji={section.emoji} count={section.partners.length} />
      {pairs.map((pair, i) => (
        <GridRow
          key={pair[0].id}
          items={pair}
          getTopPerk={getTopPerk}
          getDistance={getDistance}
          isBookmarked={isBookmarked}
          onBookmark={onBookmark}
        />
      ))}
    </Animated.View>
  );
}

export function PartnerGridView({
  partners,
  drops,
  onRefresh,
  refreshing = false,
}: PartnerGridViewProps) {
  const { colors } = useTheme();
  const { getActivePerksForPartner } = usePartners();
  const { isPartnerBookmarked, togglePartner } = useBookmarks();
  const { userLocation } = useUserLocation();
  const { slides: featuredSlides } = useFeaturedPartners();
  const router = useRouter();

  const getTopPerk = useCallback(
    (partnerId: string): Perk | undefined => {
      const perks = getActivePerksForPartner(partnerId);
      return perks.sort((a, b) => b.cost - a.cost)[0];
    },
    [getActivePerksForPartner]
  );

  const getDistance = useCallback(
    (partner: Partner): string | undefined => {
      if (!userLocation) return undefined;
      const mi = distanceToPartner(userLocation.latitude, userLocation.longitude, partner);
      return mi !== null ? formatDistanceMi(mi) : undefined;
    },
    [userLocation]
  );

  const getDistanceMi = useCallback(
    (partner: Partner): number => {
      if (!userLocation) return 99999;
      return distanceToPartner(userLocation.latitude, userLocation.longitude, partner) ?? 99999;
    },
    [userLocation]
  );

  // Build sections
  const sections: Section[] = useMemo(() => {
    const dropPartnerIds = new Set(drops.map((d) => d.partnerId));
    const featuredIds = new Set(featuredSlides.map((s) => s.partner.id));

    const hotPartners = partners.filter((p) => dropPartnerIds.has(p.id));
    const featuredPartners = featuredSlides
      .map((s) => s.partner)
      .filter((p) => partners.some((x) => x.id === p.id));
    const usedIds = new Set([...hotPartners.map((p) => p.id), ...featuredPartners.map((p) => p.id)]);

    const nearbyPartners = [...partners]
      .filter((p) => !usedIds.has(p.id))
      .sort((a, b) => getDistanceMi(a) - getDistanceMi(b))
      .slice(0, 8);
    nearbyPartners.forEach((p) => usedIds.add(p.id));

    const dealsPartners = [...partners]
      .filter((p) => !usedIds.has(p.id))
      .filter((p) => {
        const perks = getActivePerksForPartner(p.id);
        return perks.some((pk) => pk.cost >= 50);
      })
      .slice(0, 6);
    dealsPartners.forEach((p) => usedIds.add(p.id));

    const remaining = partners
      .filter((p) => !usedIds.has(p.id))
      .sort(
        (a, b) =>
          (PARTNER_TIER_RANK[b.tier as PartnerTier] ?? 0) -
          (PARTNER_TIER_RANK[a.tier as PartnerTier] ?? 0)
      );

    const result: Section[] = [];
    if (hotPartners.length > 0)
      result.push({ id: 'hot', title: 'Hot Right Now', emoji: '🔥', partners: hotPartners });
    if (featuredPartners.length > 0)
      result.push({ id: 'featured', title: 'Featured', emoji: '⭐', partners: featuredPartners });
    if (nearbyPartners.length > 0)
      result.push({ id: 'nearby', title: 'Nearby', emoji: '📍', partners: nearbyPartners });
    if (dealsPartners.length > 0)
      result.push({ id: 'deals', title: 'Best Deals', emoji: '💰', partners: dealsPartners });
    if (remaining.length > 0)
      result.push({ id: 'all', title: 'All Partners', emoji: '🗂', partners: remaining });

    return result;
  }, [partners, drops, featuredSlides, getActivePerksForPartner, getDistanceMi]);

  if (partners.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No partners found</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
          Try removing filters or search nearby
        </Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => {
            safeHaptics.impactAsync();
            router.push('/partner-apply');
          }}
        >
          <Text style={styles.emptyBtnText}>Bring a partner here</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.neonBlue[0]}
          />
        ) : undefined
      }
    >
      {sections.map((section, i) => (
        <PartnerSection
          key={section.id}
          section={section}
          delay={i * 60}
          getTopPerk={getTopPerk}
          getDistance={getDistance}
          isBookmarked={isPartnerBookmarked}
          onBookmark={(id) => {
            safeHaptics.selectionAsync();
            togglePartner(id);
          }}
        />
      ))}
      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACE.base,
    paddingTop: SPACE.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.sm,
    marginTop: SPACE.base,
  },
  sectionEmoji: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
  },
  sectionCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    marginBottom: SPACE.sm,
  },
  emptyCell: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.xxl,
    gap: SPACE.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: SPACE.sm,
    backgroundColor: COLORS.neonBlue[0],
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  bottomPad: {
    height: SPACE.xxxl,
  },
});

export default PartnerGridView;

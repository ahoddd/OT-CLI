/**
 * PartnerGridCard — rich 2-column discovery card for the Grid view.
 * Shows hero image, tier badge, verified mark, partner info, top perk, OT earn pill, bookmark.
 * Tap → routes to /partner/[id].
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { OptimizedImage } from './OptimizedImage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { safeHaptics } from '../utils/safeHaptics';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import { COLORS } from '../constants/Colors';
import { PARTNER_TIER_COLORS, PARTNER_TIER_BADGE_LABELS } from '../constants/PartnerTiers';
import type { Partner, Perk } from '../constants/MockData';
import type { PartnerTier } from '../constants/PartnerTiers';

const CARD_GAP = SPACE.sm;
const SIDE_PADDING = SPACE.base;

interface PartnerGridCardProps {
  partner: Partner;
  topPerk?: Perk;
  distanceLabel?: string;
  isBookmarked?: boolean;
  onBookmark?: () => void;
}

export function PartnerGridCard({
  partner,
  topPerk,
  distanceLabel,
  isBookmarked = false,
  onBookmark,
}: PartnerGridCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const cardWidth = (screenWidth - SIDE_PADDING * 2 - CARD_GAP) / 2;
  const heroHeight = cardWidth * 0.65; // roughly 16:10

  const tier = partner.tier as PartnerTier;
  const tierColor = PARTNER_TIER_COLORS[tier] ?? '#94a3b8';
  const tierLabel = PARTNER_TIER_BADGE_LABELS[tier] ?? tier;

  const handlePress = useCallback(() => {
    safeHaptics.impactAsync();
    router.push(`/partner/${partner.id}` as any);
  }, [partner.id]);

  const handleBookmark = useCallback(
    (e: any) => {
      e.stopPropagation?.();
      safeHaptics.selectionAsync();
      onBookmark?.();
    },
    [onBookmark]
  );

  const hasHero = Boolean(partner.featuredImageUrl);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: cardWidth,
          backgroundColor: colors.surface,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${partner.name}, ${tier} tier partner`}
    >
      {/* Tier accent bar */}
      <View style={[styles.tierBar, { backgroundColor: tierColor }]} />

      {/* Hero image */}
      <View style={[styles.heroWrap, { height: heroHeight }]}>
        {hasHero ? (
          <OptimizedImage
            source={{ uri: partner.featuredImageUrl! }}
            style={styles.heroImg}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={
              tier === 'platinum'
                ? ['#1e1b4b', '#312e81']
                : tier === 'gold'
                ? ['#1c1400', '#2d1e00']
                : ['#0f172a', '#1e293b']
            }
            style={styles.heroImg}
          >
            <Ionicons
              name="storefront-outline"
              size={28}
              color={tierColor}
              style={{ opacity: 0.7 }}
            />
          </LinearGradient>
        )}

        {/* Dark gradient scrim for readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.35)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Tier badge — top left */}
        <View
          style={[
            styles.tierBadge,
            { backgroundColor: tierColor + 'ee' },
          ]}
        >
          <Text style={styles.tierBadgeText}>{tierLabel}</Text>
        </View>

        {/* Verified badge — top right */}
        {partner.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
          </View>
        )}
      </View>

      {/* Content — reserve right padding when bookmark is shown so OT pill doesn't overlap */}
      <View style={[styles.body, onBookmark !== undefined && styles.bodyWithBookmark]}>
        {/* Name */}
        <Text
          style={[styles.name, { color: colors.text }]}
          numberOfLines={1}
        >
          {partner.name}
        </Text>

        {/* Category + distance */}
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {partner.category}
            {distanceLabel ? ` · ${distanceLabel}` : ''}
          </Text>
        </View>

        {/* Top perk + OT earn pill */}
        {topPerk && (
          <View style={styles.perkRow}>
            <Text
              style={[styles.perkTitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {topPerk.title}
            </Text>
            <View style={styles.earnPill}>
              <Text style={styles.earnText}>+{topPerk.cost} OT</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bookmark button */}
      {onBookmark !== undefined && (
        <TouchableOpacity
          style={styles.bookmarkBtn}
          onPress={handleBookmark}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark partner'}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={isBookmarked ? COLORS.gold[0] : colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  tierBar: {
    height: 3,
    width: '100%',
  },
  heroWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImg: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadge: {
    position: 'absolute',
    top: SPACE.xs,
    left: SPACE.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.4,
  },
  verifiedBadge: {
    position: 'absolute',
    top: SPACE.xs,
    right: SPACE.xs,
  },
  body: {
    paddingHorizontal: SPACE.sm,
    paddingTop: SPACE.xs,
    paddingBottom: SPACE.sm,
    gap: 2,
  },
  bodyWithBookmark: {
    paddingRight: 28,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  meta: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    marginTop: 2,
  },
  perkTitle: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  earnPill: {
    backgroundColor: COLORS.gold[1],
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    flexShrink: 0,
  },
  earnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  bookmarkBtn: {
    position: 'absolute',
    bottom: SPACE.sm,
    right: SPACE.sm,
  },
});

export default PartnerGridCard;

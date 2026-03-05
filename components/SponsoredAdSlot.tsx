/**
 * Sponsored Ad Slot — strategic placement that always shows: carousel when ads exist, premium placeholder otherwise.
 * So sponsors and users always see the spot; when admin adds ads they appear here.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useSponsoredAds } from '../hooks/useSponsoredAds';
import { SponsoredAdCarousel } from './SponsoredAdCarousel';
import { COLORS } from '../constants/Colors';
import type { SponsoredAdPlacement } from '../constants/sponsoredAds';

const PLACEHOLDER_TAG = 'Partner with OrbTap';
const PLACEHOLDER_SUB = 'Premium visibility for brands — high-intent users, prime spots.';

interface SponsoredAdSlotProps {
  /** Which placement to fetch (same carousel can be used in multiple spots). */
  placement?: SponsoredAdPlacement;
  /** Optional section title above the slot (e.g. "Sponsored") */
  sectionTitle?: string;
  /** If true, only render when there are ads (no placeholder). Default false = always show. */
  hideWhenEmpty?: boolean;
}

export function SponsoredAdSlot({
  placement = 'orb_carousel',
  sectionTitle = 'SPONSORED',
  hideWhenEmpty = false,
}: SponsoredAdSlotProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { ads, config, loading } = useSponsoredAds(placement);

  if (loading && hideWhenEmpty) return null;
  if (loading) {
    return (
      <View style={[styles.wrap, styles.placeholderCard, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
        <View style={styles.placeholderInner}>
          <Text style={[styles.placeholderTag, { color: colors.textSecondary }]}>{PLACEHOLDER_TAG}</Text>
          <Text style={[styles.placeholderSub, { color: colors.textSecondary }]}>{PLACEHOLDER_SUB}</Text>
        </View>
      </View>
    );
  }

  if (ads.length > 0) {
    return (
      <View style={styles.wrap}>
        {sectionTitle ? (
          <View style={styles.sectionHead}>
            <View style={[styles.sectionAccent, { backgroundColor: COLORS.neonBlue[0] }]} />
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{sectionTitle}</Text>
          </View>
        ) : null}
        <SponsoredAdCarousel ads={ads} transitionSeconds={config?.carouselTransitionSeconds} />
      </View>
    );
  }

  if (hideWhenEmpty) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionAccent, { backgroundColor: COLORS.neonBlue[0] }]} />
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{sectionTitle}</Text>
      </View>
      <TouchableOpacity
        style={[styles.placeholderCard, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}
        onPress={() => router.push('/partner-apply' as any)}
        activeOpacity={0.9}
      >
        <View style={styles.placeholderInner}>
          <Text style={[styles.placeholderTag, { color: colors.textSecondary }]}>{PLACEHOLDER_TAG}</Text>
          <Text style={[styles.placeholderSub, { color: colors.textSecondary }]}>{PLACEHOLDER_SUB}</Text>
          <Text style={[styles.placeholderCta, { color: COLORS.neonBlue[0] }]}>Get this spot →</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  sectionAccent: { width: 4, height: 16, borderRadius: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  placeholderCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  placeholderInner: { alignItems: 'center', maxWidth: 280 },
  placeholderTag: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  placeholderSub: { fontSize: 12, textAlign: 'center', marginBottom: 8 },
  placeholderCta: { fontSize: 13, fontWeight: '700' },
});

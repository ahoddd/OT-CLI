/**
 * Partner Growth Suggestions panel — deterministic recommendations based on OrbSwipe analytics.
 * Pro: full panel. Premium: tip of the week. Free: none.
 * Actions: create_card -> posts/create or orbswipe; schedule -> pulse; duplicate -> coming soon.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useFlags } from '../components/FlagContext';
import { RADIUS, SPACE } from '../constants/DesignTokens';
import { PARTNER_TIER_COLORS } from '../constants/PartnerTiers';
import { useGrowthSuggestions, type GrowthSuggestion } from '../hooks/useGrowthSuggestions';
import type { OrbSwipeEvent } from '../services/orbswipeAnalytics';
import {
  GROWTH_SUGGESTIONS_TITLE,
  GROWTH_SUGGESTIONS_SUB,
  GROWTH_TIP_OF_WEEK_TITLE,
} from '../constants/ViralCopy';
import { safeHaptics } from '../utils/safeHaptics';

interface PartnerGrowthSuggestionsProps {
  partnerId: string;
  events: OrbSwipeEvent[];
  tier: 'full' | 'tip' | 'none';
}

const ACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  create_card: 'add-circle',
  schedule: 'time',
  duplicate: 'copy',
};

export function PartnerGrowthSuggestions({ partnerId, events, tier }: PartnerGrowthSuggestionsProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { flags } = useFlags();
  const allSuggestions = useGrowthSuggestions(partnerId, events, tier);
  const suggestions = allSuggestions.filter((s) => s.actionType !== 'duplicate');

  const handleAction = useCallback((s: GrowthSuggestion) => {
    safeHaptics.selectionAsync();
    if (s.actionType === 'create_card') {
      if (flags.isOrbFeedEnabled && flags.isOrbFeedPartnerComposerEnabled) {
        router.push('/partner/posts/create' as any);
      } else {
        router.push('/partner/orbswipe' as any);
      }
      return;
    }
    if (s.actionType === 'schedule') {
      router.push('/pulse' as any);
      return;
    }
    if (s.actionType === 'duplicate') {
      Alert.alert('Coming soon', 'Duplicate your best-performing card will be available in a future update.');
    }
  }, [router, flags.isOrbFeedEnabled, flags.isOrbFeedPartnerComposerEnabled]);

  if (suggestions.length === 0) return null;

  const isTip = tier === 'tip';
  const title = isTip ? GROWTH_TIP_OF_WEEK_TITLE : GROWTH_SUGGESTIONS_TITLE;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Ionicons name="trending-up" size={18} color={PARTNER_TIER_COLORS.platinum} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {!isTip && (
            <Text style={[styles.sub, { color: colors.textSecondary }]}>{GROWTH_SUGGESTIONS_SUB}</Text>
          )}
        </View>
      </View>

      {suggestions.map((s) => (
        <View key={s.id} style={[styles.suggestionRow, { borderColor: colors.border }]}>
          <View style={styles.suggestionContent}>
            <Text style={[styles.suggestionTitle, { color: colors.text }]}>{s.title}</Text>
            <Text style={[styles.suggestionDetail, { color: colors.textSecondary }]} numberOfLines={3}>
              {s.detail}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleAction(s)}
            activeOpacity={0.85}
          >
            <Ionicons name={ACTION_ICONS[s.actionType] ?? 'flash'} size={16} color="#000" />
            <Text style={styles.actionLabel} numberOfLines={1}>{s.actionLabel}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACE.base,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.base,
    paddingTop: SPACE.base,
    paddingBottom: SPACE.sm,
  },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2 },
  suggestionRow: {
    paddingHorizontal: SPACE.base,
    paddingVertical: SPACE.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  suggestionContent: { marginBottom: SPACE.sm },
  suggestionTitle: { fontSize: 14, fontWeight: '700' },
  suggestionDetail: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADIUS.sm,
  },
  actionLabel: { color: '#000', fontSize: 12, fontWeight: '700' },
});

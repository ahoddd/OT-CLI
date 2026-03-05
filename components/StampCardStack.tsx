/**
 * Stamp Cards™ — Dark frosted glass stacked cards; tier tint; OrbTap logo top-right.
 * Matches carousel card visual system.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { OrbTapLogoMark } from './OrbTapLogoMark';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SPACE, RADIUS } from '../constants/DesignTokens';
import { ProgressRing } from './ui/ProgressRing';
import { isOrbTapUniverseStamp } from '../constants/DemoStampCard';
import type { StampCardWithProgram } from '../hooks/useStampCards';
import type { PartnerTier } from '../constants/PartnerTiers';

const CARD_HEIGHT = 120;
const CARD_GAP = 12;

const STAMP_TIER_COLORS: Record<PartnerTier, string> = {
  silver: '#94a3b8',
  gold: '#d4af37',
  platinum: '#a78bfa',
};
const DEFAULT_TIER_COLOR = STAMP_TIER_COLORS.platinum;
const DARK_GLASS_BASE = 'rgba(15,23,42,0.78)';
const DARK_GLASS_WEB = 'rgba(15,23,42,0.92)';
const TEXT_ON_DARK = '#f1f5f9';
const TEXT_ON_DARK_SECONDARY = '#94a3b8';
const LOGO_TOP_RIGHT_SIZE = 44;

interface StampCardStackProps {
  cards: StampCardWithProgram[];
  onCardPress: (card: StampCardWithProgram) => void;
  maxHeight?: number;
  /** When true, render with map() in a View instead of FlatList to avoid nesting inside ScrollView. */
  nestedInScrollView?: boolean;
  /** Optional map of partnerId -> tier for tier-colored cards. */
  partnerTierMap?: Record<string, PartnerTier>;
}

const CardItem = React.memo(function CardItem({
  item,
  cardHeight,
  onPress,
  primaryColor,
  showLogo,
}: {
  item: StampCardWithProgram;
  cardHeight: number;
  onPress: () => void;
  primaryColor: string;
  showLogo: boolean;
}) {
  const { colors } = useTheme();
  const program = item.program;
  const state = item.state;
  const stampsRequired = program?.stampsRequired ?? 10;
  const progress = Math.min(1, state.stampCount / stampsRequired);
  const nextEligible = state.lastStampAt && program?.cooldownHours
    ? state.lastStampAt + program.cooldownHours * 60 * 60 * 1000
    : 0;
  const canStamp = !nextEligible || Date.now() >= nextEligible;
  const tierTint = primaryColor + '18';

  return (
    <View style={styles.cardWrap}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[styles.card, { borderColor: primaryColor + '50', overflow: 'hidden' }]}
      >
        {Platform.OS !== 'web' ? (
          <>
            <BlurView intensity={78} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: DARK_GLASS_BASE }]} pointerEvents="none" />
            <LinearGradient colors={[tierTint, primaryColor + '0a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: DARK_GLASS_WEB }]} pointerEvents="none" />
        )}
        <View style={[styles.cardAccent, { backgroundColor: primaryColor }]} />
        {showLogo && (
          <View style={[styles.logoTopRight]} pointerEvents="none">
            <View style={[styles.logoWrap, { backgroundColor: primaryColor + '25', borderColor: primaryColor + '50' }]}>
              <OrbTapLogoMark variant="small" width={40} height={34} />
            </View>
          </View>
        )}
        <View style={[styles.cardContent, showLogo && { paddingRight: LOGO_TOP_RIGHT_SIZE + SPACE.xs }]}>
          <Text style={[styles.cardName, { color: TEXT_ON_DARK }]} numberOfLines={1}>
            {program?.name ?? 'Stamp Card'}
          </Text>
          <View style={styles.progressRow}>
            <ProgressRing progress={progress} size={32} strokeWidth={3} color={primaryColor} backgroundColor="rgba(148,163,184,0.3)" />
            <View style={[styles.progressBg, { backgroundColor: 'rgba(148,163,184,0.25)' }]}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: primaryColor }]} />
            </View>
            <Text style={[styles.progressText, { color: TEXT_ON_DARK_SECONDARY }]}>
              {state.stampCount}/{stampsRequired}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: TEXT_ON_DARK_SECONDARY }]} numberOfLines={1}>
              {canStamp ? 'Ready to stamp' : `Next stamp in ${Math.ceil((nextEligible - Date.now()) / (60 * 60 * 1000))}h`}
            </Text>
            {program?.reward?.label ? (
              <Text style={[styles.rewardPreview, { color: primaryColor }]} numberOfLines={1}>{program.reward.label}</Text>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={TEXT_ON_DARK_SECONDARY} style={styles.chevron} />
      </TouchableOpacity>
    </View>
  );
});

export function StampCardStack({ cards, onCardPress, maxHeight, nestedInScrollView, partnerTierMap }: StampCardStackProps) {
  const { colors } = useTheme();
  const cardHeight = CARD_HEIGHT;
  const listHeight = Math.min(
    maxHeight ?? 400,
    cards.length * (cardHeight + CARD_GAP) + SPACE.xl
  );

  const getPrimaryColor = (item: StampCardWithProgram) => {
    const tier = item.program?.partnerId && partnerTierMap?.[item.program.partnerId]
      ? partnerTierMap[item.program.partnerId]
      : ('platinum' as PartnerTier);
    return STAMP_TIER_COLORS[tier] ?? DEFAULT_TIER_COLOR;
  };

  if (cards.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: colors.border }]}>
        <Ionicons name="pricetag-outline" size={40} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No stamp cards yet</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Scan a partner QR to start</Text>
      </View>
    );
  }

  if (nestedInScrollView) {
    return (
      <View style={[styles.list, styles.listAsView, { minHeight: listHeight }]}>
        <View style={styles.listContent}>
          {cards.map((item) => (
            <CardItem
              key={item.state.id}
              item={item}
              cardHeight={cardHeight}
              onPress={() => onCardPress(item)}
              primaryColor={getPrimaryColor(item)}
              showLogo={item.program ? isOrbTapUniverseStamp(item.program.partnerId, item.program.id) : false}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={cards}
      keyExtractor={(item) => item.state.id}
      style={[styles.list, { height: listHeight }]}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      snapToInterval={cardHeight + CARD_GAP}
      snapToAlignment="start"
      decelerationRate="fast"
      renderItem={({ item }) => (
        <CardItem
          item={item}
          cardHeight={cardHeight}
          onPress={() => onCardPress(item)}
          primaryColor={getPrimaryColor(item)}
          showLogo={item.program ? isOrbTapUniverseStamp(item.program.partnerId, item.program.id) : false}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { marginHorizontal: -SPACE.base },
  listAsView: { height: undefined },
  listContent: { paddingHorizontal: SPACE.base, paddingBottom: SPACE.xl },
  cardWrap: { marginBottom: CARD_GAP },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    minHeight: CARD_HEIGHT,
  },
  cardAccent: { width: 4, alignSelf: 'stretch' },
  logoTopRight: { position: 'absolute', top: 10, right: 10, zIndex: 2 },
  logoWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  cardContent: { flex: 1, padding: SPACE.base },
  chevron: { marginRight: SPACE.sm },
  cardName: { fontSize: 15, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACE.sm, gap: SPACE.sm },
  progressBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '700' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  meta: { fontSize: 12 },
  rewardPreview: { fontSize: 12, fontWeight: '600' },
  empty: {
    padding: SPACE.xxl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: SPACE.sm },
  emptySub: { fontSize: 13, marginTop: 4 },
});
